"""add profiles and user_problem_progress tables

Profile rows are owned by Supabase Auth (see the ORM comment in
app/db/models.py): the id is the string (uuid) from auth.users and no
email/password_hash columns are stored here. Replaces the previously
generated `users` table so Alembic matches the ORM schema.

Revision ID: 005
Revises: 004
Create Date: 2026-09-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False, index=True),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("xp", sa.Integer(), nullable=False, server_default="0", index=True),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1", index=True),
        sa.Column("solved_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_submissions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_foreign_key(
        "fk_submissions_user_id_profiles",
        "submissions",
        "profiles",
        ["user_id"],
        ["id"],
    )

    progressstatus_enum = sa.Enum("NOT_STARTED", "ATTEMPTED", "SOLVED", name="progressstatus")
    # progressstatus_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "user_problem_progress",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("profiles.id"), index=True, nullable=False),
        sa.Column("problem_id", sa.Integer(), sa.ForeignKey("problems.id"), index=True, nullable=False),
        sa.Column("status", progressstatus_enum, nullable=False, server_default="NOT_STARTED"),
        sa.Column("best_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("solved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint("user_id", "problem_id", name="uq_user_problem"),
    )


def downgrade() -> None:
    op.drop_table("user_problem_progress")
    op.drop_constraint("fk_submissions_user_id_profiles", "submissions", type_="foreignkey")
    op.drop_table("profiles")
    sa.Enum(name="progressstatus").drop(op.get_bind(), checkfirst=True)