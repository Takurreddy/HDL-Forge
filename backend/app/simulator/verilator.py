import logging
import subprocess
from pathlib import Path

from app.execution.limits import ExecutionLimits
from app.simulator.base import HDLSimulator, SimulationResult, SimulationStatus
from app.simulator.result_parser import ResultParser

logger = logging.getLogger(__name__)


class VerilatorSimulator(HDLSimulator):
    """Verilator-based SystemVerilog simulator."""

    def __init__(
        self,
        workspace: object | None = None,
        limits: ExecutionLimits | None = None,
    ) -> None:
        self.limits = limits or ExecutionLimits.from_env()
        self.parser = ResultParser()
        self.workspace = workspace

    def compile(
        self,
        submission_path: Path,
        testbench_path: Path,
        trace_enabled: bool = False,
    ) -> SimulationResult:
        obj_dir = submission_path.parent / "obj_dir"
        obj_dir.mkdir(exist_ok=True)

        cmd = [
            "verilator",
            "--cc",
            "--exe",
            "--build",
            "--main",
            "--top-module",
            "testbench",
            "-Wall",
            "-Wno-DECLFILENAME",
            "-Wno-STMTDLY",
            "-Wno-UNOPTFLAT",
            "-Wno-UNUSED",
            "-Wno-fatal",
            "-o",
            "Vtestbench",
            "-Mdir",
            str(obj_dir),
            str(testbench_path),
            str(submission_path),
        ]

        if trace_enabled:
            cmd.extend(["--trace"])

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.limits.timeout_seconds,
                cwd=str(submission_path.parent),
            )
        except FileNotFoundError:
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message="Verilator is not installed or not found in PATH.",
                compilation_output="",
            )
        except subprocess.TimeoutExpired:
            return SimulationResult(
                status=SimulationStatus.TIME_LIMIT_EXCEEDED,
                message="Compilation timed out.",
                compilation_output="",
            )

        if proc.returncode != 0:
            sanitized = self._sanitize_output(proc.stdout + "\n" + proc.stderr)
            return SimulationResult(
                status=SimulationStatus.COMPILATION_ERROR,
                message="Compilation failed.",
                compilation_output=sanitized,
            )

        return SimulationResult(
            status=SimulationStatus.COMPILATION_OK,
            compilation_output="Compilation successful.",
        )

    def simulate(self, binary_path: Path) -> SimulationResult:
        if not binary_path.exists():
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message="Compiled binary not found.",
            )

        try:
            proc = subprocess.run(
                [str(binary_path)],
                capture_output=True,
                text=True,
                timeout=self.limits.timeout_seconds,
                cwd=str(binary_path.parent),
            )
        except subprocess.TimeoutExpired:
            return SimulationResult(
                status=SimulationStatus.TIME_LIMIT_EXCEEDED,
                message="Simulation timed out.",
            )

        if proc.returncode != 0 and not proc.stdout.strip():
            sanitized = self._sanitize_output(proc.stderr)
            return SimulationResult(
                status=SimulationStatus.RUNTIME_ERROR,
                message="Simulation runtime error.",
                simulation_output=sanitized,
            )

        return self.parser.parse(proc.stdout, proc.stderr)

    def _sanitize_output(self, output: str) -> str:
        lines = output.split("\n")
        sanitized = []
        for line in lines:
            if "/tmp/" in line or "hdlforge" in line.lower():
                continue
            sanitized.append(line)
        return "\n".join(sanitized).strip()
