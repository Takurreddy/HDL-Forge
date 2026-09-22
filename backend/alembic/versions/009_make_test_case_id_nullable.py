"""make submission_test_results.test_case_id nullable

Revision ID: 009
Revises: 008
Create Date: 2026-09-22

Reason: the custom-testbench judge path builds an in-memory placeholder
TestCase (id=0) that is never a real DB row agreeable; persisting test_case_id=0
(and later serializing the placeholder's .id as 0 / None) violated the FK to
test_cases. Making the column nullable lets us persist NULL for those ad-hoc
"Custom Testbench" executions.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "submission_test_results",
        "test_case_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "submission_test_results",
        "test_case_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
