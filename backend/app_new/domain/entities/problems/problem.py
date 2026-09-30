"""Problem domain entity."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from app_new.domain.value_objects.problems import (
    Difficulty,
    ProblemCategory,
    ProblemSlug,
    ProblemTitle,
    ProblemDescription,
    TestBenchCode,
    ExecutionLimits,
)
from app_new.domain.value_objects.problems.test_case import TestCase
from app_new.shared.kernel.base_entity import BaseEntity


@dataclass
class Problem(BaseEntity[UUID]):
    """Problem domain entity."""
    slug: ProblemSlug
    title: ProblemTitle
    description: ProblemDescription
    difficulty: Difficulty
    category: ProblemCategory
    testbench: TestBenchCode
    time_limit: int = 5
    memory_limit: int = 256
    points: int = 100
    tags: list[str] = field(default_factory=list)
    is_published: bool = False
    created_by: Optional[UUID] = None
    test_cases: list[TestCase] = field(default_factory=list)

    @classmethod
    def create(
        cls,
        slug: str,
        title: str,
        description: str,
        difficulty: Difficulty,
        category: ProblemCategory,
        testbench: str,
        time_limit: int = 5,
        memory_limit: int = 256,
        points: int = 100,
        tags: list[str] | None = None,
        created_by: Optional[UUID] = None,
    ) -> "Problem":
        """Create a new problem."""
        return cls(
            id=uuid4(),
            slug=ProblemSlug(slug),
            title=ProblemTitle(title),
            description=ProblemDescription(description),
            difficulty=difficulty,
            category=category,
            testbench=TestBenchCode(testbench),
            time_limit=time_limit,
            memory_limit=memory_limit,
            points=points,
            tags=tags or [],
            created_by=created_by,
        )

    def add_test_case(self, test_case: TestCase) -> None:
        """Add a test case to the problem."""
        self.test_cases.append(test_case)
        self.update_timestamp()

    def remove_test_case(self, test_case_id: UUID) -> bool:
        """Remove a test case from the problem."""
        for i, tc in enumerate(self.test_cases):
            if tc.id.value == test_case_id:
                self.test_cases.pop(i)
                self.update_timestamp()
                return True
        return False

    def get_public_test_cases(self) -> list[TestCase]:
        """Get all public test cases."""
        from app_new.domain.value_objects.problems import TestVisibility
        return [tc for tc in self.test_cases if tc.visibility == TestVisibility.PUBLIC and tc.enabled.value]

    def get_all_enabled_test_cases(self) -> list[TestCase]:
        """Get all enabled test cases."""
        return [tc for tc in self.test_cases if tc.enabled.value]

    def get_execution_limits(self) -> ExecutionLimits:
        """Get execution limits for this problem."""
        return ExecutionLimits(
            timeout_seconds=self.time_limit,
            memory_mb=self.memory_limit,
        )

    def publish(self) -> None:
        """Publish the problem."""
        self.is_published = True
        self.update_timestamp()

    def unpublish(self) -> None:
        """Unpublish the problem."""
        self.is_published = False
        self.update_timestamp()