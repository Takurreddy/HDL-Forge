from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from app.db.database import engine

cfg = Config("alembic.ini")

with engine.connect() as connection:
    has_version = connection.execute(
        text("SELECT to_regclass('public.alembic_version') IS NOT NULL")
    ).scalar()
    has_profiles = connection.execute(
        text("SELECT to_regclass('public.profiles') IS NOT NULL")
    ).scalar()

if not has_version and has_profiles:
    # Production was provisioned with the existing application schema.
    # Record the schema baseline instead of replaying CREATE TABLE migrations.
    command.stamp(cfg, "009")
else:
    command.upgrade(cfg, "head")
