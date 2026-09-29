from datetime import datetime, timezone
from typing import Any, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    Difficulty,
    Language,
    Problem,
    Profile,
    Submission,
    SubmissionStatus,
    TestCase,
    TestVisibility,
)
from app.api.routes.auth import check_is_admin, get_current_user, require_admin
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStatsResponse(BaseModel):
    total_users: int
    total_problems: int
    total_submissions: int
    passed_submissions: int
    pass_rate: float
    categories: dict[str, int]
    system_health: dict[str, Any]


class AdminProblemItem(BaseModel):
    id: int
    slug: str
    title: str
    difficulty: str
    category: str
    language: str
    time_limit: int
    memory_limit: int
    company_tags: str
    test_cases_count: int
    submissions_count: int
    created_at: datetime
    updated_at: datetime


class ProblemCreateRequest(BaseModel):
    slug: str = Field(..., min_length=2, max_length=100)
    title: str = Field(..., min_length=2, max_length=200)
    description: str
    difficulty: Difficulty
    category: str
    language: Language = Language.SYSTEMVERILOG
    input_description: str = ""
    output_description: str = ""
    constraints: str = ""
    starter_code: str = ""
    testbench: str = ""
    company_tags: str = ""
    time_limit: int = 5
    memory_limit: int = 256


class ProblemUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[Difficulty] = None
    category: Optional[str] = None
    language: Optional[Language] = None
    input_description: Optional[str] = None
    output_description: Optional[str] = None
    constraints: Optional[str] = None
    starter_code: Optional[str] = None
    company_tags: Optional[str] = None
    time_limit: Optional[int] = None
    memory_limit: Optional[int] = None


class AdminSubmissionItem(BaseModel):
    id: int
    problem_slug: str
    problem_title: str
    user_id: Optional[str]
    username: Optional[str]
    status: str
    score: float
    tests_passed: int
    tests_total: int
    execution_time: float
    language: str
    created_at: datetime


class AdminUserItem(BaseModel):
    id: str
    username: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    xp: int
    level: int
    solved_count: int
    total_submissions: int
    is_admin: bool
    created_at: datetime
    last_login_at: Optional[datetime]


@router.get("/check")
def check_admin_status(
    user: Optional[Profile] = Depends(get_current_user),
):
    """Check if the currently authenticated user has admin access."""
    if not user:
        return {"is_admin": False, "authenticated": False}
    is_admin = check_is_admin(user)
    return {
        "is_admin": is_admin,
        "authenticated": True,
        "user_id": str(user.id),
        "username": user.username,
        "display_name": user.display_name,
    }


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return platform overview telemetry for administrators."""
    total_users = db.query(func.count(Profile.id)).scalar() or 0
    total_problems = db.query(func.count(Problem.id)).scalar() or 0
    total_submissions = db.query(func.count(Submission.id)).scalar() or 0
    passed_submissions = (
        db.query(func.count(Submission.id))
        .filter(Submission.status == SubmissionStatus.PASSED)
        .scalar()
        or 0
    )

    pass_rate = (
        round((passed_submissions / total_submissions) * 100, 1)
        if total_submissions > 0
        else 0.0
    )

    # Category counts
    cat_counts = (
        db.query(Problem.category, func.count(Problem.id))
        .group_by(Problem.category)
        .all()
    )
    categories = {cat: count for cat, count in cat_counts}

    return AdminStatsResponse(
        total_users=total_users,
        total_problems=total_problems,
        total_submissions=total_submissions,
        passed_submissions=passed_submissions,
        pass_rate=pass_rate,
        categories=categories,
        system_health={
            "database": "connected",
            "simulator": settings.SIMULATOR,
            "docker_enabled": settings.HDL_USE_DOCKER,
            "ai_provider": settings.AI_PROVIDER,
            "max_waveform_size": settings.HDL_MAX_WAVEFORM_SIZE,
        },
    )


@router.get("/problems", response_model=List[AdminProblemItem])
def get_admin_problems(
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
):
    """List all problems with administrative metrics."""
    query = db.query(Problem)
    if category:
        query = query.filter(Problem.category == category)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty.upper())

    problems = query.order_by(Problem.id.asc()).all()
    result = []
    for p in problems:
        t_count = len(p.test_cases_list)
        s_count = len(p.submissions)
        result.append(
            AdminProblemItem(
                id=p.id,
                slug=p.slug,
                title=p.title,
                difficulty=p.difficulty.value,
                category=p.category,
                language=p.language.value,
                time_limit=p.time_limit,
                memory_limit=p.memory_limit,
                company_tags=p.company_tags or "",
                test_cases_count=t_count,
                submissions_count=s_count,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
        )
    return result


@router.post("/problems", status_code=status.HTTP_201_CREATED)
def create_problem(
    payload: ProblemCreateRequest,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Create a new problem in the catalog."""
    existing = db.query(Problem).filter(Problem.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Problem with this slug already exists.")

    new_prob = Problem(
        slug=payload.slug,
        title=payload.title,
        description=payload.description,
        difficulty=payload.difficulty,
        category=payload.category,
        language=payload.language,
        input_description=payload.input_description,
        output_description=payload.output_description,
        constraints=payload.constraints,
        starter_code=payload.starter_code,
        company_tags=payload.company_tags,
        time_limit=payload.time_limit,
        memory_limit=payload.memory_limit,
    )
    db.add(new_prob)
    db.flush()

    if payload.testbench:
        tc = TestCase(
            problem_id=new_prob.id,
            name="Public Testbench",
            description="Default verification testbench",
            testbench=payload.testbench,
            visibility=TestVisibility.PUBLIC,
            weight=1.0,
            execution_order=0,
            enabled=True,
        )
        db.add(tc)

    db.commit()
    db.refresh(new_prob)
    return {"message": "Problem created successfully", "slug": new_prob.slug, "id": new_prob.id}


@router.put("/problems/{slug}")
def update_problem(
    slug: str,
    payload: ProblemUpdateRequest,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Update metadata or constraints for an existing problem."""
    prob = db.query(Problem).filter(Problem.slug == slug).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(prob, field, val)

    db.commit()
    return {"message": "Problem updated successfully", "slug": prob.slug}


@router.delete("/problems/{slug}")
def delete_problem(
    slug: str,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Delete a problem and all associated testcases and submissions."""
    prob = db.query(Problem).filter(Problem.slug == slug).first()
    if not prob:
        raise HTTPException(status_code=404, detail="Problem not found.")

    db.delete(prob)
    db.commit()
    return {"message": f"Problem '{slug}' deleted successfully"}


@router.get("/submissions", response_model=List[AdminSubmissionItem])
def get_admin_submissions(
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """Fetch global real-time submissions for moderation and grading audit."""
    subs = (
        db.query(Submission)
        .order_by(desc(Submission.created_at))
        .limit(limit)
        .all()
    )

    result = []
    for s in subs:
        result.append(
            AdminSubmissionItem(
                id=s.id,
                problem_slug=s.problem.slug if s.problem else "unknown",
                problem_title=s.problem.title if s.problem else "Unknown",
                user_id=s.user_id,
                username=s.user.username if s.user else "Anonymous",
                status=s.status.value,
                score=s.score,
                tests_passed=s.tests_passed,
                tests_total=s.tests_total,
                execution_time=s.execution_time,
                language=s.language.value,
                created_at=s.created_at,
            )
        )
    return result


@router.get("/users", response_model=List[AdminUserItem])
def get_admin_users(
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """List all registered profiles."""
    users = db.query(Profile).order_by(desc(Profile.created_at)).limit(limit).all()
    return [
        AdminUserItem(
            id=str(u.id),
            username=u.username,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
            xp=u.xp,
            level=u.level,
            solved_count=u.solved_count,
            total_submissions=u.total_submissions,
            is_admin=check_is_admin(u),
            created_at=u.created_at,
            last_login_at=u.last_login_at,
        )
        for u in users
    ]


@router.post("/users/{user_id}/toggle-admin")
def toggle_user_admin(
    user_id: str,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Grant or revoke admin access for a user."""
    target_user = db.query(Profile).filter(Profile.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    target_user.is_admin = not bool(target_user.is_admin)
    db.commit()
    return {
        "message": f"User '{target_user.username}' admin status updated",
        "is_admin": target_user.is_admin,
    }
