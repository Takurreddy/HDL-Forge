"""Add AI assistant tables

Revision ID: 008
Revises: 007
Create Date: 2026-09-11
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_conversations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("problem_id", sa.Integer(), nullable=True),
        sa.Column("lesson_id", sa.Integer(), nullable=True),
        sa.Column("task_type", sa.String(50), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"]),
        sa.ForeignKeyConstraint(["problem_id"], ["problems.id"]),
        sa.ForeignKeyConstraint(["lesson_id"], ["lessons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_conversations_user_id", "ai_conversations", ["user_id"])
    op.create_index("ix_ai_conversations_problem_id", "ai_conversations", ["problem_id"])
    op.create_index("ix_ai_conversations_lesson_id", "ai_conversations", ["lesson_id"])

    op.create_table(
        "ai_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("conversation_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["conversation_id"], ["ai_conversations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_messages_conversation_id", "ai_messages", ["conversation_id"])

    op.create_table(
        "ai_feedback",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("message_id", sa.Integer(), nullable=True),
        sa.Column("rating", sa.String(20), nullable=False),
        sa.Column("comment", sa.Text(), server_default=""),
        sa.Column("task_type", sa.String(50), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["profiles.id"]),
        sa.ForeignKeyConstraint(["message_id"], ["ai_messages.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_feedback_user_id", "ai_feedback", ["user_id"])


def downgrade() -> None:
    op.drop_table("ai_feedback")
    op.drop_table("ai_messages")
    op.drop_table("ai_conversations")
