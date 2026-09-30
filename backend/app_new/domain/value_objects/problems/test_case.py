"""Test case value objects."""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app_new.domain.value_objects.problems import (
    TestVisibility,
    TestBenchCode,
    TestCaseWeight,
)
from app_new.shared.kernel.value_object import ValueObject


@dataclass(frozen=True)
class TestCaseId(ValueObject):
    """Test case ID value object."""
    value: UUID

    def __post_init__(self) -> None:
        if isinstance(self.value, str):
            object.__setattr__(self, "value", UUID(self.value))


@dataclass(frozen=True)
class TestCaseName(ValueObject):
    """Test case name value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Test case name cannot be empty")
        if len(self.value) > 100:
            raise ValueError("Test case name too long")


@dataclass(frozen=True)
class TestCaseDescription(ValueObject):
    """Test case description value object."""
    value: str

    def __post_init__(self) -> None:
        if len(self.value) > 500:
            raise ValueError("Test case description too long")


@dataclass(frozen=True)
class TestCaseExecutionOrder(ValueObject):
    """Test case execution order value object."""
    value: int

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("Execution order must be non-negative")


@dataclass(frozen=True)
class TestCaseEnabled(ValueObject):
    """Test case enabled flag value object."""
    value: bool


@dataclass(frozen=True)
class TestCase(ValueObject):
    """Test case value object."""
    id: TestCaseId
    name: TestCaseName
    description: TestCaseDescription
    testbench: TestBenchCode
    visibility: TestVisibility
    weight: TestCaseWeight
    execution_order: TestCaseExecutionOrder
    enabled: TestCaseEnabled

    @classmethod
    def create(
        cls,
        name: str,
        testbench: str,
        visibility: TestVisibility = TestVisibility.PUBLIC,
        weight: float = 1.0,
        description: str = "",
        execution_order: int = 0,
        enabled: bool = True,
    ) -> "TestCase":
        """Create a new test case."""
        return cls(
            id=TestCaseId(UUID(int=0)),
            name=TestCaseName(name),
            description=TestCaseDescription(description),
            testbench=TestBenchCode(testbench),
            visibility=visibility,
            weight=TestCaseWeight(weight),
            execution_order=TestCaseExecutionOrder(execution_order),
            enabled=TestCaseEnabled(enabled),
        )