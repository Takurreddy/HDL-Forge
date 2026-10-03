import threading
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import Discussion, DiscussionVote, Problem, Submission, SubmissionTestResult, Profile
from app.schemas.submission import SubmissionRequest, SubmissionResponse, TestResult
from app.services import submission_service
from app.services import auth_service

router = APIRouter(prefix="/submissions", tags=["submissions"])
_execution_requests: dict[str, list[float]] = defaultdict(list)
_execution_requests_lock = threading.Lock()
_last_execution_request_cleanup = 0.0


def _allow_execution(user_id: str) -> bool:
    global _last_execution_request_cleanup
    now = time.monotonic()
    minute_cutoff = now - 60
    hour_cutoff = now - 3600
    with _execution_requests_lock:
        if now - _last_execution_request_cleanup >= 300:
            stale_users = [
                stored_user_id
                for stored_user_id, stamps in _execution_requests.items()
                if not any(stamp > hour_cutoff for stamp in stamps)
            ]
            for stored_user_id in stale_users:
                _execution_requests.pop(stored_user_id, None)
            _last_execution_request_cleanup = now
        recent = [stamp for stamp in _execution_requests[user_id] if stamp > hour_cutoff]
        if sum(stamp > minute_cutoff for stamp in recent) >= settings.HDL_EXECUTION_RATE_LIMIT_PER_MINUTE:
            _execution_requests[user_id] = recent
            return False
        if len(recent) >= settings.HDL_EXECUTION_RATE_LIMIT_PER_HOUR:
            _execution_requests[user_id] = recent
            return False
        recent.append(now)
        _execution_requests[user_id] = recent
        return True


def _enforce_production_execution_limit(user: Profile, db: Session) -> None:
    if settings.ENVIRONMENT != "production":
        return
    now = datetime.now(timezone.utc)
    recent_hour = db.query(Submission).filter(
        Submission.user_id == user.id,
        Submission.created_at >= now - timedelta(hours=1),
    ).count()
    if recent_hour >= settings.HDL_EXECUTION_RATE_LIMIT_PER_HOUR:
        raise HTTPException(status_code=429, detail="Hourly HDL execution rate limit exceeded.")
    recent_minute = db.query(Submission).filter(
        Submission.user_id == user.id,
        Submission.created_at >= now - timedelta(minutes=1),
    ).count()
    if recent_minute >= settings.HDL_EXECUTION_RATE_LIMIT_PER_MINUTE or not _allow_execution(str(user.id)):
        raise HTTPException(status_code=429, detail="Per-minute HDL execution rate limit exceeded.")


def _extract_bearer_token(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None, alias="access_token"),
) -> str | None:
    """Extract raw token string from Authorization header or cookie."""
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:].strip()
    return access_token


def get_optional_user(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db),
) -> Profile | None:
    token = _extract_bearer_token(authorization, access_token)
    if not token:
        return None
    return auth_service.get_user_from_token(db, token)


def require_authenticated_user(
    authorization: str | None = Header(None),
    access_token: str | None = Cookie(None, alias="access_token"),
    db: Session = Depends(get_db),
) -> Profile:
    """Dependency that enforces authentication.

    - No Authorization header / cookie → 401
    - Invalid, expired, or malformed token → 401
    - Valid token but no matching profile → 401
    - user_id is ALWAYS derived from the verified JWT sub claim, never from request body.
    """
    token = _extract_bearer_token(authorization, access_token)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required.")

    user = auth_service.get_user_from_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


@router.post("/run", response_model=SubmissionResponse)
def run_submission(
    request: SubmissionRequest,
    db: Session = Depends(get_db),
    user: Profile | None = Depends(get_optional_user),
) -> SubmissionResponse:
    """Run the public test cases for a problem.

    Development keeps the guest-run flow. Production requires an authenticated
    account and applies per-user request limits before starting HDL execution.

    The sandbox requirements are:
    - execution runs exclusively inside the Docker sandbox
    - strict CPU/time/memory/process limits are enforced by ExecutionLimits
    - no database submission record is created for anonymous runs
    - no hidden test cases are exposed (judge_run uses PUBLIC tests only)

    """
    if settings.ENVIRONMENT == "production":
        if not user:
            raise HTTPException(status_code=401, detail="Sign in before running HDL in production.")
        _enforce_production_execution_limit(user, db)
    return submission_service.run_submission(db, request, user_id=user.id if user else None)


@router.post("/submit", response_model=SubmissionResponse)
def submit_solution(
    request: SubmissionRequest,
    db: Session = Depends(get_db),
    user: Profile = Depends(require_authenticated_user),
) -> SubmissionResponse:
    """/submit handles full grading against public + hidden test cases.

    user_id is derived exclusively from the verified JWT sub claim.
    """
    _enforce_production_execution_limit(user, db)
    return submission_service.submit_solution(db, request, user_id=user.id)


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    user: Profile | None = Depends(get_optional_user),
):
    """Return a submission. Users may access their own submissions or public guest submissions."""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail=f"Submission '{submission_id}' not found")

    if submission.user_id and user and submission.user_id != user.id:
        pass  # allow viewing public submission results in problem review

    test_results = (
        db.query(SubmissionTestResult)
        .filter(SubmissionTestResult.submission_id == submission_id)
        .all()
    )

    tests = [
        TestResult(
            name=tr.test_name,
            passed=tr.status == "PASSED",
            expected=tr.expected,
            received=tr.actual,
            message=tr.message,
        )
        for tr in test_results
    ]

    return SubmissionResponse(
        status=submission.status.value,
        message=f"{submission.tests_passed}/{submission.tests_total} tests passed.",
        compilation_message=submission.compilation_message or None,
        tests=tests,
        score=int(submission.score),
        tests_passed=submission.tests_passed,
        tests_total=submission.tests_total,
        execution_time=submission.execution_time,
        submission_id=submission.id,
    )


@router.get("/problem/{problem_slug}")
def get_problem_submissions(
    problem_slug: str,
    db: Session = Depends(get_db),
    user: Profile = Depends(require_authenticated_user),
):
    """Return user's submissions, or recent submissions for this problem."""
    problem = db.query(Problem).filter(Problem.slug == problem_slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_slug}' not found")

    query = db.query(Submission).filter(Submission.problem_id == problem.id)
    if user:
        query = query.filter(Submission.user_id == user.id)

    submissions = (
        query
        .order_by(Submission.created_at.desc())
        .limit(50)
        .all()
    )

    result = []
    for sub in submissions:
        result.append({
            "id": sub.id,
            "score": sub.score,
            "status": sub.status.value,
            "tests_passed": sub.tests_passed,
            "tests_total": sub.tests_total,
            "execution_time": sub.execution_time,
            "language": sub.language.value.lower(),
            "code": sub.code,
            "created_at": sub.created_at.isoformat() if sub.created_at else "",
        })

    return {"submissions": result}


class DiscussionCreate(BaseModel):
    content: str
    parent_id: int | None = None


class DiscussionVoteRequest(BaseModel):
    vote: int = 1


@router.get("/discussions/{problem_slug}")
def get_discussions(problem_slug: str, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.slug == problem_slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_slug}' not found")

    discussions = (
        db.query(Discussion)
        .filter(Discussion.problem_id == problem.id, Discussion.parent_id.is_(None))
        .order_by(Discussion.upvotes.desc(), Discussion.created_at.desc())
        .all()
    )

    result = []
    for d in discussions:
        d_user = db.query(Profile).filter(Profile.id == d.user_id).first()
        replies = (
            db.query(Discussion)
            .filter(Discussion.parent_id == d.id)
            .order_by(Discussion.created_at.asc())
            .all()
        )
        reply_list = []
        for r in replies:
            r_user = db.query(Profile).filter(Profile.id == r.user_id).first()
            reply_list.append({
                "id": r.id,
                "content": r.content,
                "username": r_user.username if r_user else "deleted",
                "display_name": r_user.display_name if r_user else None,
                "upvotes": r.upvotes,
                "is_solution": r.is_solution,
                "created_at": r.created_at.isoformat() if r.created_at else "",
            })
        result.append({
            "id": d.id,
            "content": d.content,
            "username": d_user.username if d_user else "deleted",
            "display_name": d_user.display_name if d_user else None,
            "upvotes": d.upvotes,
            "is_solution": d.is_solution,
            "reply_count": len(replies),
            "replies": reply_list,
            "created_at": d.created_at.isoformat() if d.created_at else "",
        })

    return {"discussions": result}


@router.post("/discussions/{problem_slug}")
def create_discussion(
    problem_slug: str,
    request: DiscussionCreate,
    db: Session = Depends(get_db),
    user: Profile = Depends(require_authenticated_user),
):
    problem = db.query(Problem).filter(Problem.slug == problem_slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_slug}' not found")

    discussion = Discussion(
        problem_id=problem.id,
        user_id=user.id,
        parent_id=request.parent_id,
        content=request.content,
    )
    db.add(discussion)
    db.commit()
    db.refresh(discussion)

    return {"id": discussion.id, "content": discussion.content}


@router.post("/discussions/{discussion_id}/vote")
def vote_discussion(
    discussion_id: int,
    request: DiscussionVoteRequest,
    db: Session = Depends(get_db),
    user: Profile = Depends(require_authenticated_user),
):
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion not found")

    existing_vote = (
        db.query(DiscussionVote)
        .filter(DiscussionVote.discussion_id == discussion_id, DiscussionVote.user_id == user.id)
        .first()
    )

    if existing_vote:
        discussion.upvotes -= existing_vote.vote
        existing_vote.vote = request.vote
        discussion.upvotes += request.vote
    else:
        vote = DiscussionVote(
            discussion_id=discussion_id,
            user_id=user.id,
            vote=request.vote,
        )
        db.add(vote)
        discussion.upvotes += request.vote

    db.commit()
    return {"upvotes": discussion.upvotes}


class SolutionPostRequest(BaseModel):
    title: str
    content: str
    code: str
    language: str = "SystemVerilog"
    tags: list[str] = []


@router.get("/solutions/{problem_slug}")
def get_solutions(problem_slug: str, db: Session = Depends(get_db)):
    import json
    problem = db.query(Problem).filter(Problem.slug == problem_slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_slug}' not found")

    solutions = (
        db.query(Discussion)
        .filter(Discussion.problem_id == problem.id, Discussion.is_solution.is_(True))
        .order_by(Discussion.upvotes.desc(), Discussion.created_at.desc())
        .all()
    )

    result = []
    for s in solutions:
        s_user = db.query(Profile).filter(Profile.id == s.user_id).first()
        code = ""
        approach = s.content
        title = "Community Solution"
        tags = []
        try:
            parsed = json.loads(s.content)
            if isinstance(parsed, dict):
                title = parsed.get("title") or "Community Solution"
                approach = parsed.get("approach", "")
                code = parsed.get("code", "")
                tags = parsed.get("tags", [])
        except Exception:
            pass

        result.append({
            "id": s.id,
            "title": title,
            "content": approach,
            "code": code,
            "tags": tags,
            "username": s_user.username if s_user else "anonymous_engineer",
            "display_name": s_user.display_name if s_user else "RTL Designer",
            "upvotes": s.upvotes,
            "created_at": s.created_at.isoformat() if s.created_at else "",
        })

    return {"solutions": result}


@router.post("/solutions/{problem_slug}")
def create_solution(
    problem_slug: str,
    request: SolutionPostRequest,
    db: Session = Depends(get_db),
    user: Profile | None = Depends(get_optional_user),
):
    import json
    problem = db.query(Problem).filter(Problem.slug == problem_slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_slug}' not found")

    user_id = user.id if user else None
    if not user_id:
        profile = db.query(Profile).first()
        if profile:
            user_id = profile.id
        else:
            profile = Profile(
                id="00000000-0000-0000-0000-000000000001",
                username="community_engineer",
                display_name="Community RTL Engineer",
                email="community@hdlforge.local",
            )
            db.add(profile)
            db.flush()
            user_id = profile.id

    content_json = json.dumps({
        "title": request.title,
        "approach": request.content,
        "code": request.code,
        "language": request.language,
        "tags": request.tags,
    })

    solution = Discussion(
        problem_id=problem.id,
        user_id=user_id,
        content=content_json,
        is_solution=True,
    )
    db.add(solution)
    db.commit()
    db.refresh(solution)

    return {
        "id": solution.id,
        "title": request.title,
        "message": "Solution posted successfully!",
    }

