"""Submission domain entity."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from app_new.domain.value_objects.submissions import (
    SubmissionId,
    SourceCode,
    Language,
    SubmissionStatus,
    TestResult,
    CompilationMessage,
    ExecutionTime,
    Score,
    TestsPassed,
    TestsTotal,
)
from app_new.shared.kernel.base_entity import BaseEntity


@dataclass
class Submission(BaseEntity[UUID]):
    """Submission domain entity."""
    problem_id: UUID
    user_id: Optional[UUID]
    code: SourceCode
    language: Language
    status: SubmissionStatus = SubmissionStatus.PENDING
    score: Score = field(default_factory=lambda: Score(0))
    tests_passed: TestsPassed = field(default_factory=lambda: TestsPassed(0))
    tests_total: TestsTotal = field(default_factory=lambda: TestsTotal(0))
    execution_time: ExecutionTime = field(default_factory=lambda: ExecutionTime(0.0))
    compilation_message: Optional[CompilationMessage] = None
    test_results: list[TestResult] = field(default_factory=list)
    waveform_id: Optional[str] = None
    xp_earned: int = 0

    @classmethod
    def create(
        cls,
        problem_id: UUID,
        code: str,
        language: Language,
        user_id: Optional[UUID] = None,
    ) -> "Submission":
        """Create a new submission."""
        return cls(
            id=uuid4(),
            problem_id=problem_id,
            user_id=user_id,
            code=SourceCode(code),
            language=language,
        )

    def mark_running(self) -> None:
        """Mark submission as running."""
        self.status = SubmissionStatus.RUNNING
        self.update_timestamp()

    def complete(
        self,
        status: SubmissionStatus,
        score: int,
        tests_passed: int,
        tests_total: int,
        execution_time: float,
        test_results: list[TestResult],
        compilation_message: Optional[str] = None,
    ) -> None:
        """Complete the submission with results."""
        self.status = status
        self.score = Score(score)
        self.tests_passed = TestsPassed(tests_passed)
        self.tests_total = TestsTotal(tests_total)
        self.execution_time = ExecutionTime(execution_time)
        self.test_results = test_results
        if compilation_message:
            self.compilation_message = CompilationMessage(compilation_message)
        self.update_timestamp()

    def set_waveform(self, waveform_id: str) -> None:
        """Set waveform ID."""
        self.waveform_id = waveform_id
        self.update_timestamp()

    def set_xp_earned(self, xp: int) -> None:
        """Set XP earned from this submission."""
        self.xp_earned = xp
        self.update_timestamp()

    def is_terminal(self) -> bool:
        """Check if submission is in a terminal state."""
        return self.status in {
            SubmissionStatus.PASSED,
            SubmissionStatus.FAILED,
            SubmissionStatus.PARTIAL,
            SubmissionStatus.COMPILATION_ERROR,
            SubmissionStatus.RUNTIME_ERROR,
            SubmissionStatus.TIME_LIMIT_EXCEEDED,
            SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
            SubmissionStatus.OUTPUT_LIMIT_EXCEEDED,
            SubmissionStatus.SYSTEM_ERROR,
            SubmissionStatus.JUDGE_ERROR,
        }

    def is_successful(self) -> bool:
        """Check if submission was successful."""
        return self.status == SubmissionStatus.PASSED