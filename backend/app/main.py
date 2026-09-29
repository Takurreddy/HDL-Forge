from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, dashboard, problems, submissions, waveforms, leaderboard, achievements, learning, ai, admin
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logger = logging.getLogger(__name__)

    # 1. Automatically create tables if not present (crucial for fresh DB on Render/Supabase)
    try:
        from app.db.database import engine
        from app.db.models import Base
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        logger.warning("Base.metadata.create_all error: %s", e)

    # 2. Seed base problems if empty
    try:
        from app.seed import seed_problems
        seed_problems()
    except Exception as e:
        logger.warning("seed_problems error: %s", e)

    # 3. Seed expanded problems (21 problems + tags)
    try:
        from app.seed_expand import seed_new_problems
        seed_new_problems()
    except Exception as e:
        logger.warning("seed_expand error: %s", e)

    # 4. Seed full 50-problem catalog (10 per category)
    try:
        from app.seed_full_catalog import seed_full_catalog
        seed_full_catalog()
    except Exception as e:
        logger.warning("seed_full_catalog error: %s", e)

    # 5. Seed learning content if present
    try:
        from app.seed_learning import seed_learning_content
        seed_learning_content()
    except Exception as e:
        logger.warning("seed_learning error: %s", e)

    # 6. Ensure default admin profiles exist
    try:
        from app.db.database import SessionLocal
        from app.db.models import Profile
        from app.services.auth_service import DEFAULT_ADMIN_ID
        with SessionLocal() as db:
            adm = db.query(Profile).filter(Profile.username == "admin").first()
            if not adm:
                adm = Profile(
                    id=DEFAULT_ADMIN_ID,
                    username="admin",
                    display_name="System Administrator",
                    is_admin=True,
                )
                db.add(adm)
            else:
                adm.is_admin = True

            bvs = db.query(Profile).filter(Profile.username == "bvs").first()
            if not bvs:
                bvs = Profile(
                    id="00000000-0000-0000-0000-000000000003",
                    username="bvs",
                    display_name="BVS Rujan",
                    is_admin=True,
                )
                db.add(bvs)
            else:
                bvs.is_admin = True
            db.commit()
    except Exception as e:
        logger.warning("Admin profile seed error: %s", e)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX if hasattr(settings, "CORS_ORIGIN_REGEX") else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems.router, prefix=settings.API_V1_PREFIX)
app.include_router(submissions.router, prefix=settings.API_V1_PREFIX)
app.include_router(waveforms.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(leaderboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(achievements.router, prefix=settings.API_V1_PREFIX)
app.include_router(learning.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
