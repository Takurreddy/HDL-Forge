"""SQLAlchemy ORM models mapping to domain entities."""
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app_new.infrastructure.database.connection import Base
from app_new.domain.value_objects.problems import (
    Difficulty,
    ProblemCategory,
    TestVisibility,
)
from app_new.domain.value_objects.users import UserRole
from app_new.domain.value_objects.submissions import Language, SubmissionStatus


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid_str() -> str:
    return str(uuid4())


class ProblemORM(Base):
    """ORM model for Problem."""
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[Difficulty] = mapped_column(SAEnum(Difficulty), nullable=False)
    category: Mapped[ProblemCategory] = mapped_column(SAEnum(ProblemCategory), nullable=False)
    testbench: Mapped[str] = mapped_column(Text, nullable=False, default="")
    time_limit: Mapped[int] = mapped_column(Integer, default=5)
    memory_limit: Mapped[int] = mapped_column(Integer, default=256)
    points: Mapped[int] = mapped_column(Integer, default=100)
    tags: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    test_cases: Mapped[list["TestCaseORM"]] = relationship(
        back_populates="problem", cascade="all, delete-orphan", lazy="selectin"
    )


class TestCaseORM(Base):
    """ORM model for TestCase."""
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    testbench: Mapped[str] = mapped_column(Text, nullable=False)
    visibility: Mapped[TestVisibility] = mapped_column(
        SAEnum(TestVisibility), default=TestVisibility.PUBLIC
    )
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    execution_order: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    problem: Mapped["ProblemORM"] = relationship(back_populates="test_cases")


class UserORM(Base):
    """ORM model for User."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.USER)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    xp: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    solved_count: Mapped[int] = mapped_column(Integer, default=0)
    total_submissions: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class SubmissionORM(Base):
    """ORM model for Submission."""
    __tablename__ = "submissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[Language] = mapped_column(SAEnum(Language), default=Language.SYSTEMVERILOG)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(SubmissionStatus), default=SubmissionStatus.PENDING
    )
    score: Mapped[int] = mapped_column(Integer, default=0)
    tests_passed: Mapped[int] = mapped_column(Integer, default=0)
    tests_total: Mapped[int] = mapped_column(Integer, default=0)
    execution_time: Mapped[float] = mapped_column(Float, default=0.0)
    compilation_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    waveform_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    test_results: Mapped[list["SubmissionTestResultORM"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan", lazy="selectin"
    )


class SubmissionTestResultORM(Base):
    """ORM model for per-test results on a submission."""
    __tablename__ = "submission_test_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    submission_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    test_case_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    test_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    message: Mapped[str] = mapped_column(Text, default="")
    expected: Mapped[str] = mapped_column(Text, default="")
    actual: Mapped[str] = mapped_column(Text, default="")

    submission: Mapped["SubmissionORM"] = relationship(back_populates="test_results")


class UserProblemProgressORM(Base):
    """ORM model for per-user problem progress."""
    __tablename__ = "user_problem_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    problem_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="NOT_STARTED")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    best_score: Mapped[float] = mapped_column(Float, default=0.0)
    solved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_attempt_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class AchievementORM(Base):
    """ORM model for Achievement."""
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    icon: Mapped[str] = mapped_column(String(50), default="")
    xp_reward: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class UserAchievementORM(Base):
    """ORM model for user-achievement join."""
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class WaveformORM(Base):
    """ORM model for saved waveform (VCD)."""
    __tablename__ = "waveforms"

    waveform_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    submission_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("submissions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    vcd_path: Mapped[str] = mapped_column(String(500), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)