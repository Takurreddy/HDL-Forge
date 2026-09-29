"""add achievements and user_achievements

The xp/level/solved_count/total_submissions columns move with the profiles
table created in 005 (matching the ORM), so this revision only creates the
achievements tables and seeds the achievement definitions.

Revision ID: 006
Revises: 005
Create Date: 2026-09-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "achievements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(10), nullable=False, server_default="🏆"),
        sa.Column("xp_reward", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("condition_type", sa.String(50), nullable=False),
        sa.Column("condition_value", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "user_achievements",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("profiles.id"), index=True, nullable=False),
        sa.Column("achievement_id", sa.Integer(), sa.ForeignKey("achievements.id"), index=True, nullable=False),
        sa.Column("unlocked_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    op.execute("""
        INSERT INTO achievements (slug, name, description, icon, xp_reward, condition_type, condition_value) VALUES
        ('first-step', 'First Step', 'Solve your first HDL problem.', '🎯', 10, 'problems_solved', 1),
        ('getting-started', 'Getting Started', 'Solve 5 problems.', '🚀', 25, 'problems_solved', 5),
        ('rtl-apprentice', 'RTL Apprentice', 'Solve 10 problems.', '⚙️', 50, 'problems_solved', 10),
        ('rtl-engineer', 'RTL Engineer', 'Solve 25 problems.', '🔧', 100, 'problems_solved', 25),
        ('hardware-specialist', 'Hardware Specialist', 'Solve 50 problems.', '🏗️', 200, 'problems_solved', 50),
        ('combinational-master', 'Combinational Master', 'Solve 10 combinational-logic problems.', '⚡', 100, 'category_solved', 10),
        ('sequential-master', 'Sequential Master', 'Solve 10 sequential-logic problems.', '🔄', 100, 'category_solved', 10),
        ('fsm-master', 'FSM Master', 'Solve 5 FSM problems.', '🎭', 100, 'category_solved', 5),
        ('perfect-score', 'Perfect Score', 'Solve a problem with 100%.', '💯', 25, 'perfect_score', 1),
        ('streak-3', '3-Day Streak', 'Maintain a 3-day submission streak.', '🔥', 15, 'streak', 3),
        ('streak-7', '7-Day Streak', 'Maintain a 7-day submission streak.', '🔥', 30, 'streak', 7),
        ('streak-30', '30-Day Streak', 'Maintain a 30-day submission streak.', '🔥', 100, 'streak', 30)
    """)


def downgrade() -> None:
    op.drop_table("user_achievements")
    op.drop_table("achievements")