"""Private HDL execution worker API.

This service accepts jobs only from the application API and runs each job in a
separate, resource-limited sandbox container. Keep this service on a private
network and never mount the Docker socket into the public API service.
"""

import hmac
import logging
import subprocess
import threading

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.execution.limits import ExecutionLimits
from app.execution.runner import ExecutionJob, ExecutionRunner
from app.schemas.submission import SubmissionResponse

logger = logging.getLogger(__name__)
_job_slots = threading.BoundedSemaphore(max(1, settings.HDL_WORKER_MAX_CONCURRENT_JOBS))


class WorkerExecutionRequest(BaseModel):
    problem_slug: str = Field(min_length=1, max_length=100)
    code: str = Field(max_length=50_000)
    testbench_code: str = Field(max_length=50_000)
    module_name: str = Field(default="solution", min_length=1, max_length=100)
    waveform_enabled: bool = False


app = FastAPI(title="HDLForge Private Execution Worker", docs_url=None, redoc_url=None)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ready")
def readiness_check(authorization: str | None = Header(default=None)):
    if not settings.HDL_WORKER_TOKEN:
        raise HTTPException(status_code=503, detail="Worker token is not configured.")
    expected = f"Bearer {settings.HDL_WORKER_TOKEN}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized worker request.")
    if not ExecutionRunner._is_docker_daemon_running():
        raise HTTPException(status_code=503, detail="Docker is unavailable.")
    image = subprocess.run(
        ["docker", "image", "inspect", settings.HDL_SANDBOX_IMAGE],
        capture_output=True,
        timeout=5,
    )
    if image.returncode != 0:
        raise HTTPException(status_code=503, detail="Sandbox image is unavailable.")
    return {"status": "ready"}


@app.post("/execute", response_model=SubmissionResponse)
def execute_job(
    job: WorkerExecutionRequest,
    authorization: str | None = Header(default=None),
):
    expected = f"Bearer {settings.HDL_WORKER_TOKEN}"
    if not settings.HDL_WORKER_TOKEN or not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized worker request.")
    if len(job.code) > settings.HDL_MAX_SOURCE_SIZE or len(job.testbench_code) > settings.HDL_MAX_SOURCE_SIZE:
        raise HTTPException(status_code=413, detail="HDL source exceeds the configured size limit.")
    if not _job_slots.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="Execution worker is busy.")

    try:
        runner = ExecutionRunner(use_docker=True)
        response = runner.execute(
            ExecutionJob(
                problem_slug=job.problem_slug,
                code=job.code,
                testbench_code=job.testbench_code,
                module_name=job.module_name,
                limits=ExecutionLimits.from_env(),
                waveform_enabled=job.waveform_enabled,
            )
        )
        if response.status == "SYSTEM_ERROR":
            logger.warning("Sandbox reported a system error for problem %s", job.problem_slug)
        return response
    except Exception:
        logger.exception("Unhandled execution worker failure for problem %s", job.problem_slug)
        raise HTTPException(status_code=500, detail="Execution worker failed.") from None
    finally:
        _job_slots.release()
