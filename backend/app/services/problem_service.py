from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.models import Difficulty, Problem, TestCase, TestVisibility
from app.schemas.problem import ProblemCreate, ProblemUpdate, PublicTestCase, PublicTestbench


def get_problems(
    db: Session,
    difficulty: Difficulty | None = None,
    category: str | None = None,
    search: str | None = None,
) -> list[dict]:
    query = db.query(Problem)

    if difficulty is not None:
        query = query.filter(Problem.difficulty == difficulty)

    if category is not None:
        query = query.filter(Problem.category == category)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Problem.title.ilike(search_term),
                Problem.description.ilike(search_term),
            )
        )

    problems = query.order_by(Problem.id).all()
    return [_problem_to_dict(p) for p in problems]


def get_problem_by_slug(db: Session, slug: str) -> dict | None:
    problem = db.query(Problem).filter(Problem.slug == slug).first()
    if not problem:
        return None
    return _problem_to_dict(problem)


def _problem_to_dict(problem: Problem) -> dict:
    public_test_cases = []
    public_testbenches = []
    if hasattr(problem, "test_cases_list") and problem.test_cases_list:
        for tc in problem.test_cases_list:
            if tc.enabled and tc.visibility == TestVisibility.PUBLIC:
                public_test_cases.append(PublicTestCase(
                    name=tc.name,
                    description=tc.description,
                    input="",
                    expected="",
                ))
                public_testbenches.append(PublicTestbench(
                    name=tc.name,
                    testbench=tc.testbench,
                    language=problem.language.value.lower() if problem.language else "systemverilog",
                ))

    return {
        "id": problem.id,
        "slug": problem.slug,
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "category": problem.category,
        "language": problem.language,
        "input_description": problem.input_description or "",
        "output_description": problem.output_description or "",
        "constraints": problem.constraints or "",
        "starter_code": problem.starter_code or "",
        "time_complexity": getattr(problem, "time_complexity", "") or "",
        "space_complexity": getattr(problem, "space_complexity", "") or "",
        "reference_solution": getattr(problem, "reference_solution", "") or "",
        "company_tags": getattr(problem, "company_tags", "") or "",
        "created_at": problem.created_at,
        "updated_at": problem.updated_at,
        "public_test_cases": public_test_cases,
        "public_testbenches": public_testbenches,
    }


def create_problem(db: Session, problem_in: ProblemCreate) -> Problem:
    db_problem = Problem(**problem_in.model_dump())
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    return db_problem


def update_problem(
    db: Session, db_problem: Problem, problem_in: ProblemUpdate
) -> Problem:
    update_data = problem_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_problem, field, value)
    db.commit()
    db.refresh(db_problem)
    return db_problem
