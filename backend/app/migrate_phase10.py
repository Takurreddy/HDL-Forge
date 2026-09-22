"""Phase 10 migration: add user_id to submissions, time/space complexity to problems, discussions, solutions."""

import logging

from sqlalchemy import text
from app.db.database import SessionLocal

logger = logging.getLogger(__name__)


def run_migration():
    db = SessionLocal()
    try:
        # 1. Add user_id to submissions (nullable for existing data)
        try:
            db.execute(text("ALTER TABLE submissions ADD COLUMN user_id VARCHAR(36) REFERENCES profiles(id)"))
            db.commit()
            logger.info("Added user_id to submissions")
        except Exception:
            db.rollback()
            logger.info("user_id column already exists on submissions")

        # 2. Add time_complexity and space_complexity to problems
        try:
            db.execute(text("ALTER TABLE problems ADD COLUMN time_complexity VARCHAR(50) DEFAULT ''"))
            db.commit()
            logger.info("Added time_complexity to problems")
        except Exception:
            db.rollback()
            logger.info("time_complexity column already exists on problems")

        try:
            db.execute(text("ALTER TABLE problems ADD COLUMN space_complexity VARCHAR(50) DEFAULT ''"))
            db.commit()
            logger.info("Added space_complexity to problems")
        except Exception:
            db.rollback()
            logger.info("space_complexity column already exists on problems")

        # 3. Add reference_solution to problems
        try:
            db.execute(text("ALTER TABLE problems ADD COLUMN reference_solution TEXT DEFAULT ''"))
            db.commit()
            logger.info("Added reference_solution to problems")
        except Exception:
            db.rollback()
            logger.info("reference_solution column already exists on problems")

        # 4. Create discussions table
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS discussions (
                    id SERIAL PRIMARY KEY,
                    problem_id INTEGER NOT NULL REFERENCES problems(id),
                    user_id VARCHAR(36) NOT NULL REFERENCES profiles(id),
                    parent_id INTEGER REFERENCES discussions(id),
                    content TEXT NOT NULL,
                    upvotes INTEGER DEFAULT 0,
                    is_solution BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            db.commit()
            logger.info("Created discussions table")
        except Exception:
            db.rollback()
            logger.info("discussions table already exists")

        # 5. Create discussion_votes table
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS discussion_votes (
                    id SERIAL PRIMARY KEY,
                    discussion_id INTEGER NOT NULL REFERENCES discussions(id),
                    user_id VARCHAR(36) NOT NULL REFERENCES profiles(id),
                    vote INTEGER NOT NULL DEFAULT 1,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(discussion_id, user_id)
                )
            """))
            db.commit()
            logger.info("Created discussion_votes table")
        except Exception:
            db.rollback()
            logger.info("discussion_votes table already exists")

        logger.info("Phase 10 migration complete")
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_migration()
