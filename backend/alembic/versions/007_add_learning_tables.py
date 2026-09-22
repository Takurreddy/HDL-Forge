"""add learning tables: concepts, learning paths, modules, lessons, quizzes

Revision ID: 007
Revises: 006
Create Date: 2026-09-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Concepts
    op.create_table(
        "concepts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("category", sa.String(100), nullable=False, server_default=""),
    )

    # Problem-Concept link
    op.create_table(
        "problem_concepts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("problem_id", sa.Integer(), sa.ForeignKey("problems.id"), nullable=False, index=True),
        sa.Column("concept_id", sa.Integer(), sa.ForeignKey("concepts.id"), nullable=False, index=True),
        sa.UniqueConstraint("problem_id", "concept_id", name="uq_problem_concept"),
    )

    # Learning Paths
    op.create_table(
        "learning_paths",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("difficulty", sa.Enum("EASY", "MEDIUM", "HARD", name="difficulty"), nullable=False),
        sa.Column("estimated_hours", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Learning Modules
    op.create_table(
        "learning_modules",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("learning_path_id", sa.Integer(), sa.ForeignKey("learning_paths.id"), nullable=False, index=True),
        sa.Column("slug", sa.String(100), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    )

    # Lessons
    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("module_id", sa.Integer(), sa.ForeignKey("learning_modules.id"), nullable=False, index=True),
        sa.Column("slug", sa.String(100), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estimated_minutes", sa.Integer(), nullable=False, server_default="15"),
        sa.Column("difficulty", sa.Enum("EASY", "MEDIUM", "HARD", name="difficulty"), nullable=False, server_default="EASY"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default="1"),
    )

    # Lesson Prerequisites
    op.create_table(
        "lesson_prerequisites",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False, index=True),
        sa.Column("prerequisite_lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False, index=True),
        sa.UniqueConstraint("lesson_id", "prerequisite_lesson_id", name="uq_lesson_prerequisite"),
    )

    # Lesson Progress
    lesson_progress_status = sa.Enum("NOT_STARTED", "IN_PROGRESS", "COMPLETED", name="lessonprogressstatus")
    op.create_table(
        "lesson_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("profiles.id"), nullable=False, index=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False, index=True),
        sa.Column("status", lesson_progress_status, nullable=False, server_default="NOT_STARTED"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_accessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),
    )

    # Quizzes
    op.create_table(
        "quizzes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False, server_default=""),
    )

    # Quiz Questions
    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("quiz_id", sa.Integer(), sa.ForeignKey("quizzes.id"), nullable=False, index=True),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(50), nullable=False, server_default="multiple_choice"),
        sa.Column("options", sa.Text(), nullable=False, server_default=""),
        sa.Column("correct_answer", sa.String(200), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False, server_default=""),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
    )

    # Quiz Attempts
    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("profiles.id"), nullable=False, index=True),
        sa.Column("quiz_id", sa.Integer(), sa.ForeignKey("quizzes.id"), nullable=False, index=True),
        sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("passed", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("answers", sa.Text(), nullable=False, server_default=""),
        sa.Column("attempted_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # User Concept Progress
    op.create_table(
        "user_concept_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("profiles.id"), nullable=False, index=True),
        sa.Column("concept_id", sa.Integer(), sa.ForeignKey("concepts.id"), nullable=False, index=True),
        sa.Column("solved_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("mastery_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("last_practiced_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "concept_id", name="uq_user_concept"),
    )


def downgrade() -> None:
    op.drop_table("user_concept_progress")
    op.drop_table("quiz_attempts")
    op.drop_table("quiz_questions")
    op.drop_table("quizzes")
    op.drop_table("lesson_progress")
    op.drop_table("lesson_prerequisites")
    op.drop_table("lessons")
    op.drop_table("learning_modules")
    op.drop_table("learning_paths")
    op.drop_table("problem_concepts")
    op.drop_table("concepts")
    op.execute("DROP TYPE IF EXISTS lessonprogressstatus")
