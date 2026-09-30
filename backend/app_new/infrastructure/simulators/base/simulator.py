"""Simulator abstraction — strategy pattern for Verilator/Icarus."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path


class SimulationStatus(str, Enum):
    """Normalized status every simulator returns."""
    COMPILATION_OK = "COMPILATION_OK"
    COMPILATION_ERROR = "COMPILATION_ERROR"
    PASSED = "PASSED"
    FAILED = "FAILED"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED"
    SYSTEM_ERROR = "SYSTEM_ERROR"


@dataclass
class ParsedTest:
    """A single parsed test result from testbench output."""
    name: str
    passed: bool
    expected: str = ""
    received: str = ""
    message: str = ""


@dataclass
class SimulationResult:
    """Normalized result returned by every simulator (LSP-friendly)."""
    status: SimulationStatus
    score: int = 0
    message: str = ""
    compilation_output: str = ""
    simulation_output: str = ""
    tests: list[ParsedTest] = field(default_factory=list)
    vcd_data: bytes | None = None


class Simulator(ABC):
    """Strategy interface for HDL simulators (Open/Closed: add new simulators without touching callers)."""

    name: str = "base"

    @abstractmethod
    def compile(
        self,
        submission_path: Path,
        testbench_path: Path,
        trace_enabled: bool = False,
    ) -> SimulationResult:
        """Compile submission + testbench."""
        ...

    @abstractmethod
    def simulate(self, binary_path: Path) -> SimulationResult:
        """Run the compiled binary."""
        ...

    @abstractmethod
    def binary_path(self, workspace: Path) -> Path:
        """Return the expected path of the compiled binary for this workspace."""
        ...