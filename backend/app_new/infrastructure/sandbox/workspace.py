"""Execution workspace — manages temp directories for HDL runs (SRP: only workspace lifecycle)."""
import shutil
import tempfile
import uuid
from pathlib import Path

SUBMISSION_FILENAME = "submission.sv"
TESTBENCH_FILENAME = "testbench.sv"
VCD_FILENAME = "simulation.vcd"


class Workspace:
    """Context-managed temporary workspace for one execution."""

    def __init__(self, base_dir: str | None = None):
        self._base_dir = base_dir or str(Path(tempfile.gettempdir()) / "hdlforge")
        self.job_id = uuid.uuid4().hex[:12]
        self.path: Path | None = None
        self._created = False

    def __enter__(self) -> "Workspace":
        root = Path(self._base_dir)
        root.mkdir(parents=True, exist_ok=True)
        self.path = root / self.job_id
        self.path.mkdir(parents=True, exist_ok=True)
        self._created = True
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.cleanup()

    @property
    def submission_path(self) -> Path:
        assert self.path is not None
        return self.path / SUBMISSION_FILENAME

    @property
    def testbench_path(self) -> Path:
        assert self.path is not None
        return self.path / TESTBENCH_FILENAME

    @property
    def vcd_path(self) -> Path:
        assert self.path is not None
        return self.path / VCD_FILENAME

    def write_submission(self, code: str) -> None:
        self.submission_path.write_text(code, encoding="utf-8")

    def write_testbench(self, code: str) -> None:
        self.testbench_path.write_text(code, encoding="utf-8")

    def has_vcd(self) -> bool:
        return self.path is not None and self.vcd_path.exists()

    def read_vcd(self) -> bytes:
        return self.vcd_path.read_bytes() if self.has_vcd() else b""

    def vcd_size(self) -> int:
        return self.vcd_path.stat().st_size if self.has_vcd() else 0

    def cleanup(self) -> None:
        if self._created and self.path and self.path.exists():
            shutil.rmtree(self.path, ignore_errors=True)
        self._created = False