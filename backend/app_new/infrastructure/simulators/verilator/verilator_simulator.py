"""Verilator simulator implementation (Strategy)."""
import logging
import subprocess
from pathlib import Path

from app_new.infrastructure.simulators.base.simulator import (
    Simulator,
    SimulationResult,
    SimulationStatus,
)

logger = logging.getLogger(__name__)


class VerilatorSimulator(Simulator):
    """Verilator-based HDL simulator."""

    name = "verilator"

    def __init__(self, timeout: int = 5):
        self.timeout = timeout

    def compile(
        self,
        submission_path: Path,
        testbench_path: Path,
        trace_enabled: bool = False,
    ) -> SimulationResult:
        cmd = [
            "verilator",
            "--cc",
            "--exe",
            "--build",
            "-Wno-fatal",
            "--top-module",
            "testbench",
            str(submission_path),
            str(testbench_path),
            "-o",
            "simulation",
        ]
        if trace_enabled:
            cmd.append("--trace")

        try:
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=str(submission_path.parent),
            )
        except FileNotFoundError:
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message="Verilator not found. Install Verilator or switch simulator.",
            )
        except subprocess.TimeoutExpired:
            return SimulationResult(
                status=SimulationStatus.TIME_LIMIT_EXCEEDED,
                message="Compilation timed out.",
            )

        output = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode != 0:
            return SimulationResult(
                status=SimulationStatus.COMPILATION_ERROR,
                compilation_output=output,
                message="Compilation failed.",
            )

        return SimulationResult(
            status=SimulationStatus.COMPILATION_OK,
            compilation_output=output,
        )

    def simulate(self, binary_path: Path) -> SimulationResult:
        try:
            proc = subprocess.run(
                [str(binary_path)],
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=str(binary_path.parent),
            )
        except subprocess.TimeoutExpired:
            return SimulationResult(
                status=SimulationStatus.TIME_LIMIT_EXCEEDED,
                message="Simulation timed out.",
            )
        except OSError as exc:
            return SimulationResult(
                status=SimulationStatus.SYSTEM_ERROR,
                message=f"Failed to run simulation: {exc}",
            )

        output = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode != 0:
            return SimulationResult(
                status=SimulationStatus.RUNTIME_ERROR,
                simulation_output=output,
                message="Runtime error during simulation.",
            )

        return SimulationResult(
            status=SimulationStatus.PASSED,
            simulation_output=output,
        )

    def binary_path(self, workspace: Path) -> Path:
        return workspace / "obj_dir" / "Vtestbench"