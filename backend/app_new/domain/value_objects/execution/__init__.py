"""Execution domain value objects."""
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional

from app_new.shared.kernel.value_object import ValueObject


class SimulationStatus(str, Enum):
    """Simulation status."""
    COMPILATION_OK = "COMPILATION_OK"
    COMPILATION_ERROR = "COMPILATION_ERROR"
    PASSED = "PASSED"
    FAILED = "FAILED"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class SimulatorType(str, Enum):
    """Supported simulators."""
    VERILATOR = "VERILATOR"
    ICARUS = "ICARUS"


@dataclass(frozen=True)
class WorkspacePath(ValueObject):
    """Workspace path value object."""
    value: Path

    def __post_init__(self) -> None:
        if isinstance(self.value, str):
            object.__setattr__(self, "value", Path(self.value))


@dataclass(frozen=True)
class ModuleName(ValueObject):
    """Module name value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Module name cannot be empty")


@dataclass(frozen=True)
class WaveformEnabled(ValueObject):
    """Waveform enabled flag value object."""
    value: bool


@dataclass(frozen=True)
class VCDData(ValueObject):
    """VCD waveform data value object."""
    value: bytes

    def __post_init__(self) -> None:
        if not isinstance(self.value, bytes):
            raise ValueError("VCD data must be bytes")


@dataclass(frozen=True)
class ExecutionJobData(ValueObject):
    """Execution job data value object."""
    problem_slug: str
    code: str
    testbench_code: str
    module_name: str
    timeout_seconds: int
    memory_mb: int
    waveform_enabled: bool
    simulator_type: SimulatorType

    def __post_init__(self) -> None:
        if not self.problem_slug:
            raise ValueError("Problem slug cannot be empty")
        if not self.code:
            raise ValueError("Code cannot be empty")
        if not self.testbench_code:
            raise ValueError("Testbench code cannot be empty")
        if not self.module_name:
            raise ValueError("Module name cannot be empty")