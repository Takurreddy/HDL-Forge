from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Difficulty
from app.schemas.problem import ProblemListResponse, ProblemResponse
from app.services import problem_service

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=ProblemListResponse)
def list_problems(
    difficulty: Difficulty | None = Query(None),
    category: str | None = Query(None, max_length=100),
    search: str | None = Query(None, max_length=200),
    db: Session = Depends(get_db),
):
    problems = problem_service.get_problems(
        db, difficulty=difficulty, category=category, search=search
    )
    return ProblemListResponse(problems=problems, total=len(problems))


@router.get("/daily")
def get_daily_problem(db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    problems = problem_service.get_problems(db)
    if not problems:
        raise HTTPException(status_code=404, detail="No problems available")
    day_of_year = datetime.now(timezone.utc).timetuple().tm_yday
    selected = problems[day_of_year % len(problems)]
    return {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "problem": selected,
        "bonus_xp": 50,
        "streak_count": 4,
    }


@router.get("/{slug}", response_model=ProblemResponse)
def get_problem(slug: str, db: Session = Depends(get_db)):
    problem = problem_service.get_problem_by_slug(db, slug)
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{slug}' not found")
    return problem
