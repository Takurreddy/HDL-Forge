import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from app.db.database import engine

cfg = Config("alembic.ini")

with engine.connect() as connection:
    tables = set(inspect(connection).get_table_names())

if "alembic_version" not in tables and "profiles" in tables:
    # The production database was provisioned from the existing application
    # schema rather than from Alembic. Record the schema baseline without
    # replaying CREATE TABLE migrations against existing relations.
    command.stamp(cfg, "009")
else:
    command.upgrade(cfg, "head")
