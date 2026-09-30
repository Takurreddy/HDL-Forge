"""Docker sandbox — runs HDL execution inside a container (SRP: only container concerns)."""
import logging
import shutil
import subprocess
from pathlib import Path

from app_new.infrastructure.sandbox.workspace import Workspace

logger = logging.getLogger(__name__)

DEFAULT_IMAGE = "hdlforge-sandbox:latest"


class DockerSandbox:
    """Executes a workspace inside a Docker container with resource limits."""

    def __init__(self, image: str = DEFAULT_IMAGE):
        self.image = image

    @staticmethod
    def is_available() -> bool:
        if not shutil.which("docker"):
            return False
        try:
            result = subprocess.run(
                ["docker", "info"], capture_output=True, timeout=2
            )
            return result.returncode == 0
        except Exception:
            return False

    def execute(
        self,
        workspace: Workspace,
        timeout_seconds: int = 5,
        memory_mb: int = 256,
        cpu_seconds: int = 5,
        process_limit: int = 64,
    ) -> subprocess.CompletedProcess | None:
        """Run the workspace entrypoint inside a container. Returns the completed process."""
        assert workspace.path is not None
        cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", f"{memory_mb}m",
            "--memory-swap", f"{memory_mb}m",
            "--cpus", "1.0",
            "--pids-limit", str(process_limit),
            "--read-only",
            "--tmpfs", "/tmp:size=64m",
            "-v", f"{workspace.path}:/workspace",
            "-w", "/workspace",
            self.image,
            "bash", "-c",
            "timeout --signal=KILL %ds bash /opt/run.sh 2>&1 || true" % timeout_seconds,
        ]

        try:
            return subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout_seconds + 10,
            )
        except subprocess.TimeoutExpired:
            logger.warning("Docker sandbox timed out for job %s", workspace.job_id)
            return None
        except FileNotFoundError:
            logger.warning("Docker binary not found")
            return None