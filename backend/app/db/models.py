import enum
import uuid

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Difficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class Language(str, enum.Enum):
    VERILOG = "VERILOG"
    SYSTEMVERILOG = "SYSTEMVERILOG"


class TestVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    HIDDEN = "HIDDEN"


class SubmissionStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    PASSED = "PASSED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    COMPILATION_ERROR = "COMPILATION_ERROR"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED"
    INVALID_SUBMISSION = "INVALID_SUBMISSION"
    JUDGE_ERROR = "JUDGE_ERROR"
    SYSTEM_ERROR = "SYSTEM_ERROR"


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty))
    category: Mapped[str] = mapped_column(String(100))
    language: Mapped[Language] = mapped_column(Enum(Language))
    input_description: Mapped[str] = mapped_column(Text, default="")
    output_description: Mapped[str] = mapped_column(Text, default="")
    constraints: Mapped[str] = mapped_column(Text, default="")
    starter_code: Mapped[str] = mapped_column(Text, default="")
    test_cases: Mapped[str] = mapped_column(Text, default="")
    time_complexity: Mapped[str] = mapped_column(String(50), default="")
    space_complexity: Mapped[str] = mapped_column(String(50), default="")
    reference_solution: Mapped[str] = mapped_column(Text, default="")
    company_tags: Mapped[str] = mapped_column(String(200), default="")
    time_limit: Mapped[int] = mapped_column(Integer, default=5)
    memory_limit: Mapped[int] = mapped_column(Integer, default=256)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    test_cases_list: Mapped[list["TestCase"]] = relationship(
        back_populates="problem", cascade="all, delete-orphan", order_by="TestCase.execution_order"
    )
    submissions: Mapped[list["Submission"]] = relationship(
        back_populates="problem", cascade="all, delete-orphan"
    )
    concept_tags: Mapped[list["ProblemConcept"]] = relationship(
        back_populates="problem", cascade="all, delete-orphan"
    )


class TestCase(Base):
    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    testbench: Mapped[str] = mapped_column(Text)
    visibility: Mapped[TestVisibility] = mapped_column(Enum(TestVisibility))
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    execution_order: Mapped[int] = mapped_column(Integer, default=0)
    enabled: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    problem: Mapped["Problem"] = relationship(back_populates="test_cases_list")


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("profiles.id"), nullable=True, index=True)
    code: Mapped[str] = mapped_column(Text)
    language: Mapped[Language] = mapped_column(Enum(Language))
    status: Mapped[SubmissionStatus] = mapped_column(Enum(SubmissionStatus))
    score: Mapped[float] = mapped_column(Float, default=0.0)
    tests_passed: Mapped[int] = mapped_column(Integer, default=0)
    tests_total: Mapped[int] = mapped_column(Integer, default=0)
    execution_time: Mapped[float] = mapped_column(Float, default=0.0)
    compilation_message: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    problem: Mapped["Problem"] = relationship(back_populates="submissions")
    user: Mapped["Profile | None"] = relationship()
    test_results: Mapped[list["SubmissionTestResult"]] = relationship(
        back_populates="submission", cascade="all, delete-orphan"
    )
    waveform: Mapped["Waveform | None"] = relationship(
        back_populates="submission", uselist=False, cascade="all, delete-orphan"
    )


class SubmissionTestResult(Base):
    __tablename__ = "submission_test_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"), index=True)
    test_case_id: Mapped[int | None] = mapped_column(ForeignKey("test_cases.id"), nullable=True)
    test_name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(50))
    score: Mapped[float] = mapped_column(Float, default=0.0)
    message: Mapped[str] = mapped_column(Text, default="")
    expected: Mapped[str] = mapped_column(Text, default="")
    actual: Mapped[str] = mapped_column(Text, default="")

    submission: Mapped["Submission"] = relationship(back_populates="test_results")


class Waveform(Base):
    __tablename__ = "waveforms"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id"), index=True)
    waveform_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    format: Mapped[str] = mapped_column(String(10), default="vcd")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    duration: Mapped[int] = mapped_column(Integer, default=0)
    timescale: Mapped[str] = mapped_column(String(20), default="1ns")
    signal_count: Mapped[int] = mapped_column(Integer, default=0)
    file_path: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    submission: Mapped["Submission"] = relationship(back_populates="waveform")


class ProgressStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    ATTEMPTED = "ATTEMPTED"
    SOLVED = "SOLVED"


class Profile(Base):
    __tablename__ = "profiles"

    # Columns that exist in the real Supabase public.profiles table.
    # Do NOT add email or password_hash here — those are managed by
    # Supabase Auth (auth.users) and do not exist in public.profiles.
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    xp: Mapped[int] = mapped_column(Integer, default=0, index=True)
    level: Mapped[int] = mapped_column(Integer, default=1, index=True)
    solved_count: Mapped[int] = mapped_column(Integer, default=0)
    total_submissions: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_login_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false", nullable=False)

    progress: Mapped[list["UserProblemProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    lesson_progress: Mapped[list["LessonProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    concept_progress: Mapped[list["UserConceptProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserProblemProgress(Base):
    __tablename__ = "user_problem_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "problem_id", name="uq_user_problem"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    status: Mapped[ProgressStatus] = mapped_column(
        Enum(ProgressStatus), default=ProgressStatus.NOT_STARTED
    )
    best_score: Mapped[float] = mapped_column(Float, default=0.0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    solved_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_attempt_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["Profile"] = relationship(back_populates="progress")
    problem: Mapped["Problem"] = relationship()


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(10), default="🏆")
    xp_reward: Mapped[int] = mapped_column(Integer, default=0)
    condition_type: Mapped[str] = mapped_column(String(50))
    condition_value: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"), index=True)
    unlocked_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["Profile"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship()


class LessonProgressStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), default="")

    problems: Mapped[list["ProblemConcept"]] = relationship(
        back_populates="concept", cascade="all, delete-orphan"
    )


class ProblemConcept(Base):
    __tablename__ = "problem_concepts"
    __table_args__ = (
        UniqueConstraint("problem_id", "concept_id", name="uq_problem_concept"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    concept_id: Mapped[int] = mapped_column(ForeignKey("concepts.id"), index=True)

    problem: Mapped["Problem"] = relationship()
    concept: Mapped["Concept"] = relationship(back_populates="problems")


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty))
    estimated_hours: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    modules: Mapped[list["LearningModule"]] = relationship(
        back_populates="learning_path", cascade="all, delete-orphan",
        order_by="LearningModule.order_index"
    )


class LearningModule(Base):
    __tablename__ = "learning_modules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    learning_path_id: Mapped[int] = mapped_column(ForeignKey("learning_paths.id"), index=True)
    slug: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    learning_path: Mapped["LearningPath"] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="module", cascade="all, delete-orphan",
        order_by="Lesson.order_index"
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("learning_modules.id"), index=True)
    slug: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=15)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), default=Difficulty.EASY)
    published: Mapped[bool] = mapped_column(default=True)

    module: Mapped["LearningModule"] = relationship(back_populates="lessons")
    prerequisites: Mapped[list["LessonPrerequisite"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan",
        foreign_keys="LessonPrerequisite.lesson_id"
    )
    dependent_prerequisites: Mapped[list["LessonPrerequisite"]] = relationship(
        back_populates="prerequisite_lesson", cascade="all, delete-orphan",
        foreign_keys="LessonPrerequisite.prerequisite_lesson_id"
    )
    progress: Mapped[list["LessonProgress"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    quizzes: Mapped[list["Quiz"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )


class LessonPrerequisite(Base):
    __tablename__ = "lesson_prerequisites"
    __table_args__ = (
        UniqueConstraint("lesson_id", "prerequisite_lesson_id", name="uq_lesson_prerequisite"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    prerequisite_lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)

    lesson: Mapped["Lesson"] = relationship(
        back_populates="prerequisites", foreign_keys=[lesson_id]
    )
    prerequisite_lesson: Mapped["Lesson"] = relationship(
        back_populates="dependent_prerequisites", foreign_keys=[prerequisite_lesson_id]
    )


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    status: Mapped[LessonProgressStatus] = mapped_column(
        Enum(LessonProgressStatus), default=LessonProgressStatus.NOT_STARTED
    )
    started_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_accessed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["Profile"] = relationship()
    lesson: Mapped["Lesson"] = relationship(back_populates="progress")


class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), default="")

    lesson: Mapped["Lesson"] = relationship(back_populates="quizzes")
    questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan",
        order_by="QuizQuestion.order_index"
    )
    attempts: Mapped[list["QuizAttempt"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan"
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), index=True)
    question: Mapped[str] = mapped_column(Text)
    question_type: Mapped[str] = mapped_column(String(50), default="multiple_choice")
    options: Mapped[str] = mapped_column(Text, default="")
    correct_answer: Mapped[str] = mapped_column(String(200))
    explanation: Mapped[str] = mapped_column(Text, default="")
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey("quizzes.id"), index=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    passed: Mapped[bool] = mapped_column(default=False)
    answers: Mapped[str] = mapped_column(Text, default="")
    attempted_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["Profile"] = relationship()
    quiz: Mapped["Quiz"] = relationship(back_populates="attempts")


class UserConceptProgress(Base):
    __tablename__ = "user_concept_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "concept_id", name="uq_user_concept"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    concept_id: Mapped[int] = mapped_column(ForeignKey("concepts.id"), index=True)
    solved_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    mastery_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_practiced_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["Profile"] = relationship()
    concept: Mapped["Concept"] = relationship()


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    problem_id: Mapped[int | None] = mapped_column(ForeignKey("problems.id"), nullable=True, index=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id"), nullable=True, index=True)
    task_type: Mapped[str] = mapped_column(String(50), default="")
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    messages: Mapped[list["AIMessage"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan",
        order_by="AIMessage.created_at"
    )


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("ai_conversations.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")


class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    message_id: Mapped[int | None] = mapped_column(ForeignKey("ai_messages.id"), nullable=True)
    rating: Mapped[str] = mapped_column(String(20))
    comment: Mapped[str] = mapped_column(Text, default="")
    task_type: Mapped[str] = mapped_column(String(50), default="")
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("discussions.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    is_solution: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["Profile"] = relationship()
    replies: Mapped[list["Discussion"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan",
        foreign_keys="Discussion.parent_id"
    )
    parent: Mapped["Discussion | None"] = relationship(
        back_populates="replies", remote_side="Discussion.id", foreign_keys=[parent_id]
    )
    votes: Mapped[list["DiscussionVote"]] = relationship(
        back_populates="discussion", cascade="all, delete-orphan"
    )


class DiscussionVote(Base):
    __tablename__ = "discussion_votes"
    __table_args__ = (
        UniqueConstraint("discussion_id", "user_id", name="uq_discussion_vote"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    discussion_id: Mapped[int] = mapped_column(ForeignKey("discussions.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("profiles.id"), index=True)
    vote: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[str] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    discussion: Mapped["Discussion"] = relationship(back_populates="votes")
    user: Mapped["Profile"] = relationship()
