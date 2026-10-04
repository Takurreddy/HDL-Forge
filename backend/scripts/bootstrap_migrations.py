from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import command
from alembic.config import Config
from sqlalchemy.exc import ProgrammingError
from app.db.database import engine

cfg = Config("alembic.ini")

try:
    command.upgrade(cfg, "head")
except ProgrammingError as exc:
    message = str(exc)
    if 'DuplicateTable' in message or 'already exists' in message:
        # The production database was provisioned with the application schema
        # already present but without Alembic history. Record that baseline
        # instead of replaying CREATE TABLE migrations.
        command.stamp(cfg, "009")
    else:
        raise
