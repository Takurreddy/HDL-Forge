from fastapi.testclient import TestClient

from app.core.config import settings
from app.schemas.submission import SubmissionResponse
from app import worker


def test_worker_rejects_unauthorized_jobs(monkeypatch):
    monkeypatch.setattr(settings, "HDL_WORKER_TOKEN", "a" * 40)
    client = TestClient(worker.app)
    response = client.post(
        "/execute",
        json={
            "problem_slug": "and-gate",
            "code": "module solution; endmodule",
            "testbench_code": "module testbench; endmodule",
        },
    )
    assert response.status_code == 401


def test_worker_runs_authenticated_job(monkeypatch):
    monkeypatch.setattr(settings, "HDL_WORKER_TOKEN", "b" * 40)

    class FakeRunner:
        def __init__(self, use_docker):
            assert use_docker is True

        def execute(self, _job):
            return SubmissionResponse(status="PASSED", message="1/1 tests passed.")

    monkeypatch.setattr(worker, "ExecutionRunner", FakeRunner)
    client = TestClient(worker.app)
    response = client.post(
        "/execute",
        headers={"Authorization": f"Bearer {'b' * 40}"},
        json={
            "problem_slug": "and-gate",
            "code": "module solution; endmodule",
            "testbench_code": "module testbench; endmodule",
        },
    )
    assert response.status_code == 200
    assert response.json()["status"] == "PASSED"
