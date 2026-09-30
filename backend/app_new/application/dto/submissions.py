"""Application DTOs for submissions."""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app_new.domain.value_objects.submissions import Language, SubmissionStatus, TestResult


@dataclass
class SubmissionCreateDTO:
    """DTO for creating a submission."""
    problem_slug: str
    code: str
    language: Language = Language.SYSTEMVERILOG
    testbench_code: Optional[str] = None


@dataclass
class SubmissionRunDTO:
    """DTO for running a submission (public tests only)."""
    problem_slug: str
    code: str
    language: Language = Language.SYSTEMVERILOG
    testbench_code: Optional[str] = None


@dataclass
class SubmissionSubmitDTO:
    """DTO for submitting a submission (all tests)."""
    problem_slug: str
    code: str
    language: Language = Language.SYSTEMVERILOG


@dataclass
class TestResultDTO:
    """DTO for test result."""
    name: str
    passed: bool
    expected: str = ""
    received: str = ""
    message: str = ""


@dataclass
class SubmissionResponseDTO:
    """DTO for submission response."""
    status: SubmissionStatus
    message: str
    compilation_message: Optional[str] = None
    tests: list[TestResultDTO] = None
    score: int = 0
    tests_passed: int = 0
    tests_total: int = 0
    execution_time: float = 0.0
    submission_id: Optional[int] = None
    waveform_id: Optional[str] = None
    xp_earned: int = 0
    xp_total: int = 0
    level: int = 1
    progress_status: Optional[str] = None
    achievements_unlocked: list[dict] = None
    submitted_by: Optional[str] = None
    submitted_by_display: Optional[str] = None

    def __post_init__(self):
        if self.tests is None:
            self.tests = []
        if self.achievements_unlocked is None:
            self.achievements_unlocked = []


@dataclass
class SubmissionDTO:
    """DTO for submission representation."""
    id: UUID
    problem_id: UUID
    problem_slug: str
    user_id: Optional[UUID]
    code: str
    language: Language
    status: SubmissionStatus
    score: int
    tests_passed: int
    tests_total: int
    execution_time: float
    compilation_message: Optional[str]
    test_results: list[TestResultDTO]
    waveform_id: Optional[str]
    xp_earned: int
    created_at: str