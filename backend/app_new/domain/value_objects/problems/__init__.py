"""Problem domain value objects."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional
from uuid import UUID

from app_new.shared.kernel.value_object import ValueObject


class Difficulty(str, Enum):
    """Problem difficulty levels."""
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class ProblemCategory(str, Enum):
    """Problem categories."""
    COMBINATIONAL = "COMBINATIONAL"
    ARITHMETIC = "ARITHMETIC"
    SEQUENTIAL = "SEQUENTIAL"
    FSM = "FSM"
    PIPELINING = "PIPELINING"
    MEMORY = "MEMORY"
    COMMUNICATION = "COMMUNICATION"
    PROCESSOR = "PROCESSOR"


class TestVisibility(str, Enum):
    """Test case visibility."""
    PUBLIC = "PUBLIC"
    HIDDEN = "HIDDEN"


@dataclass(frozen=True)
class ProblemSlug(ValueObject):
    """Problem slug value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Problem slug cannot be empty")
        if len(self.value) > 100:
            raise ValueError("Problem slug too long")


@dataclass(frozen=True)
class ProblemTitle(ValueObject):
    """Problem title value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Problem title cannot be empty")
        if len(self.value) > 200:
            raise ValueError("Problem title too long")


@dataclass(frozen=True)
class ProblemDescription(ValueObject):
    """Problem description value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Problem description cannot be empty")


@dataclass(frozen=True)
class TestBenchCode(ValueObject):
    """Testbench code value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Testbench code cannot be empty")


@dataclass(frozen=True)
class TestCaseWeight(ValueObject):
    """Test case weight value object."""
    value: float

    def __post_init__(self) -> None:
        if self.value < 0 or self.value > 1:
            raise ValueError("Test case weight must be between 0 and 1")


@dataclass(frozen=True)
class ExecutionLimits(ValueObject):
    """Execution limits value object."""
    timeout_seconds: int
    memory_mb: int
    max_source_size: int = 50000
    max_output_size: int = 100000
    max_waveform_size: int = 1000000

    def __post_init__(self) -> None:
        if self.timeout_seconds <= 0:
            raise ValueError("Timeout must be positive")
        if self.memory_mb <= 0:
            raise ValueError("Memory limit must be positive")
        if self.max_source_size <= 0:
            raise ValueError("Max source size must be positive")
        if self.max_output_size <= 0:
            raise ValueError("Max output size must be positive")