from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import Difficulty, Language


class ProblemBase(BaseModel):
    slug: str = Field(..., max_length=100)
    title: str = Field(..., max_length=200)
    description: str
    difficulty: Difficulty
    category: str = Field(..., max_length=100)
    language: Language
    input_description: str = ""
    output_description: str = ""
    constraints: str = ""
    starter_code: str = ""
    company_tags: str = ""


class ProblemCreate(ProblemBase):
    time_complexity: str = ""
    space_complexity: str = ""
    reference_solution: str = ""


class ProblemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    difficulty: Difficulty | None = None
    category: str | None = None
    language: Language | None = None
    input_description: str | None = None
    output_description: str | None = None
    constraints: str | None = None
    starter_code: str | None = None
    time_complexity: str | None = None
    space_complexity: str | None = None
    reference_solution: str | None = None


class PublicTestCase(BaseModel):
    name: str
    description: str
    input: str
    expected: str


class PublicTestbench(BaseModel):
    name: str
    testbench: str
    language: str


class ProblemResponse(ProblemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    time_complexity: str = ""
    space_complexity: str = ""
    reference_solution: str = ""
    created_at: datetime
    updated_at: datetime
    public_test_cases: list[PublicTestCase] = []
    public_testbenches: list[PublicTestbench] = []


class ProblemListResponse(BaseModel):
    problems: list[ProblemResponse]
    total: int
