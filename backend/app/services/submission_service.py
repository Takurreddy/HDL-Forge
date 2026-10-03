import logging

from sqlalchemy.orm import Session

from app.execution.runner import ExecutionRunner
from app.schemas.submission import SubmissionRequest, SubmissionResponse
from app.services.judge_service import JudgeService

logger = logging.getLogger(__name__)

judge = JudgeService(runner=ExecutionRunner())


def run_submission(
    db: Session, request: SubmissionRequest, user_id: str | None = None
) -> SubmissionResponse:
    return judge.judge_run(db, request, user_id=user_id)


def submit_solution(
    db: Session, request: SubmissionRequest, user_id: str | None = None
) -> SubmissionResponse:
    return judge.judge_submit(db, request, user_id=user_id)
