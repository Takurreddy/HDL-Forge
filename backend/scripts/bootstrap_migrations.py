from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect
from sqlalchemy.exc import ProgrammingError

from app.db.database import engine


cfg = Config("alembic.ini")


def ensure_partial_production_schema() -> None:
    """
    Repair a pre-provisioned production database that has an Alembic baseline
    but is missing application tables.

    The old bootstrapper stamped such databases at 009 after a DuplicateTable
    error. That made Alembic believe the schema was complete even when tables
    such as public.problems were absent.
    """
    from app.db.models import Problem

    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())

        if "problems" not in tables:
            Problem.__table__.create(connection, checkfirst=True)


try:
    command.upgrade(cfg, "head")
except ProgrammingError as exc:
    message = str(exc)
    if "DuplicateTable" in message or "already exists" in message:
        # Some production databases were provisioned with the application
        # schema before Alembic history existed. Preserve that schema baseline,
        # then explicitly repair any missing core application tables.
        command.stamp(cfg, "009")
    else:
        raise

# A baseline stamp is only valid when the corresponding schema is actually
# present. Repair partial provisioned databases before the application starts.
ensure_partial_production_schema()
