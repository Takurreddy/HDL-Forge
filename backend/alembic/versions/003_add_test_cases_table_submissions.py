"""add test_cases_table submissions submission_test_results

Revision ID: 003
Revises: 002
Create Date: 2026-09-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    test_visibility_enum = sa.Enum("PUBLIC", "HIDDEN", name="testvisibility")
    submission_status_enum = sa.Enum(
        "QUEUED", "RUNNING", "PASSED", "PARTIAL", "FAILED",
        "COMPILATION_ERROR", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED",
        "MEMORY_LIMIT_EXCEEDED", "OUTPUT_LIMIT_EXCEEDED",
        "INVALID_SUBMISSION", "JUDGE_ERROR", "SYSTEM_ERROR",
        name="submissionstatus",
    )
    # test_visibility_enum.create(op.get_bind(), checkfirst=True)
    # submission_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "test_cases",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("problem_id", sa.Integer(), sa.ForeignKey("problems.id"), index=True),
        sa.Column("name", sa.String(length=200)),
        sa.Column("description", sa.Text(), server_default=""),
        sa.Column("testbench", sa.Text()),
        sa.Column("visibility", test_visibility_enum),
        sa.Column("weight", sa.Float(), server_default="1.0"),
        sa.Column("execution_order", sa.Integer(), server_default="0"),
        sa.Column("enabled", sa.Boolean(), server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "submissions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("problem_id", sa.Integer(), sa.ForeignKey("problems.id"), index=True),
        sa.Column("user_id", sa.String(length=36), nullable=True, index=True),
        sa.Column("code", sa.Text()),
        sa.Column("language", sa.Enum("VERILOG", "SYSTEMVERILOG", name="language")),
        sa.Column("status", submission_status_enum),
        sa.Column("score", sa.Float(), server_default="0"),
        sa.Column("tests_passed", sa.Integer(), server_default="0"),
        sa.Column("tests_total", sa.Integer(), server_default="0"),
        sa.Column("execution_time", sa.Float(), server_default="0"),
        sa.Column("compilation_message", sa.Text(), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "submission_test_results",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("submission_id", sa.Integer(), sa.ForeignKey("submissions.id"), index=True),
        sa.Column("test_case_id", sa.Integer(), sa.ForeignKey("test_cases.id")),
        sa.Column("test_name", sa.String(length=200)),
        sa.Column("status", sa.String(length=50)),
        sa.Column("score", sa.Float(), server_default="0"),
        sa.Column("message", sa.Text(), server_default=""),
        sa.Column("expected", sa.Text(), server_default=""),
        sa.Column("actual", sa.Text(), server_default=""),
    )

    op.add_column(
        "problems",
        sa.Column("time_limit", sa.Integer(), server_default="5"),
    )
    op.add_column(
        "problems",
        sa.Column("memory_limit", sa.Integer(), server_default="256"),
    )


def downgrade() -> None:
    op.drop_table("submission_test_results")
    op.drop_table("submissions")
    op.drop_table("test_cases")
    op.drop_column("problems", "memory_limit")
    op.drop_column("problems", "time_limit")
    sa.Enum(name="submissionstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="testvisibility").drop(op.get_bind(), checkfirst=True)
