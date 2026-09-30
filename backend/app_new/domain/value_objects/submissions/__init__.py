"""Submission domain value objects."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional
from uuid import UUID

from app_new.shared.kernel.value_object import ValueObject


class Language(str, Enum):
    """Programming languages for HDL."""
    SYSTEMVERILOG = "SYSTEMVERILOG"
    VERILOG = "VERILOG"


class SubmissionStatus(str, Enum):
    """Submission status."""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"
    COMPILATION_ERROR = "COMPILATION_ERROR"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED"
    SYSTEM_ERROR = "SYSTEM_ERROR"
    JUDGE_ERROR = "JUDGE_ERROR"


@dataclass(frozen=True)
class SubmissionId(ValueObject):
    """Submission ID value object."""
    value: UUID

    def __post_init__(self) -> None:
        if isinstance(self.value, str):
            object.__setattr__(self, "value", UUID(self.value))


@dataclass(frozen=True)
class SourceCode(ValueObject):
    """Source code value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Source code cannot be empty")
        if len(self.value) > 100000:
            raise ValueError("Source code too long")


@dataclass(frozen=True)
class TestResult(ValueObject):
    """Test result value object."""
    name: str
    passed: bool
    expected: str = ""
    received: str = ""
    message: str = ""


@dataclass(frozen=True)
class CompilationMessage(ValueObject):
    """Compilation message value object."""
    value: str


@dataclass(frozen=True)
class ExecutionTime(ValueObject):
    """Execution time value object."""
    value: float

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Execution time cannot be negative")


@dataclass(frozen=True)
class Score(ValueObject):
    """Score value object (0-100)."""
    value: int

    def __post_init__(self) -> None:
        if self.value < 0 or self.value > 100:
            raise ValueError("Score must be between 0 and 100")


@dataclass(frozen=True)
class TestsPassed(ValueObject):
    """Tests passed count value object."""
    value: int

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Tests passed cannot be negative")


@dataclass(frozen=True)
class TestsTotal(ValueObject):
    """Total tests count value object."""
    value: int

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Total tests cannot be negative")