"""Application DTOs for problems."""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app_new.domain.value_objects.problems import Difficulty, ProblemCategory


@dataclass
class ProblemCreateDTO:
    """DTO for creating a problem."""
    slug: str
    title: str
    description: str
    difficulty: Difficulty
    category: ProblemCategory
    testbench: str
    time_limit: int = 5
    memory_limit: int = 256
    points: int = 100
    tags: list[str] = None
    test_cases: list[dict] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []
        if self.test_cases is None:
            self.test_cases = []


@dataclass
class ProblemUpdateDTO:
    """DTO for updating a problem."""
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    category: Optional[ProblemCategory] = None
    testbench: Optional[str] = None
    time_limit: Optional[int] = None
    memory_limit: Optional[int] = None
    points: Optional[int] = None
    tags: Optional[list[str]] = None
    is_published: Optional[bool] = None


@dataclass
class ProblemDTO:
    """DTO for problem representation."""
    id: UUID
    slug: str
    title: str
    description: str
    difficulty: Difficulty
    category: ProblemCategory
    time_limit: int
    memory_limit: int
    points: int
    tags: list[str]
    is_published: bool
    created_at: str
    updated_at: str
    test_cases_count: int = 0
    public_test_cases_count: int = 0


@dataclass
class ProblemListDTO:
    """DTO for problem list response."""
    problems: list[ProblemDTO]
    total: int
    page: int
    page_size: int
    total_pages: int