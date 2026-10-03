from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import auth, dashboard, problems, submissions, waveforms, leaderboard, achievements, learning, ai, admin
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    logger = logging.getLogger(__name__)

    if settings.ENVIRONMENT == "production":
        settings.validate_production()
        from alembic.config import Config
        from alembic.script import ScriptDirectory
        from sqlalchemy import inspect
        from app.db.database import engine

        alembic_config = Config("alembic.ini")
        scripts = ScriptDirectory.from_config(alembic_config)
        with engine.connect() as connection:
            if "alembic_version" not in inspect(connection).get_table_names():
                raise RuntimeError("Database has no Alembic version table; run alembic upgrade head before startup.")
            applied = set(connection.execute(text("SELECT version_num FROM alembic_version")).scalars())
            if not applied or not set(scripts.get_heads()).issubset(applied):
                raise RuntimeError("Database migrations are not at Alembic head; run alembic upgrade head before startup.")
    else:
        # Local development keeps the existing convenient schema and content setup.
        from app.db.database import engine
        from app.db.models import Base
        Base.metadata.create_all(bind=engine)
        for module_name, function_name in (
            ("app.seed", "seed_problems"),
            ("app.seed_expand", "seed_new_problems"),
            ("app.seed_full_catalog", "seed_full_catalog"),
            ("app.seed_learning", "seed_learning_content"),
        ):
            try:
                module = __import__(module_name, fromlist=[function_name])
                getattr(module, function_name)()
            except Exception as exc:
                logger.warning("Development seed failed (%s): %s", function_name, exc)
        try:
            from app.db.database import SessionLocal
            from app.db.models import Profile
            from app.services.auth_service import DEFAULT_ADMIN_ID
            with SessionLocal() as db:
                adm = db.query(Profile).filter(Profile.username == "admin").first()
                if not adm:
                    db.add(Profile(id=DEFAULT_ADMIN_ID, username="admin", display_name="System Administrator", is_admin=True))
                else:
                    adm.is_admin = True
                bvs = db.query(Profile).filter(Profile.username == "bvs").first()
                if not bvs:
                    db.add(Profile(id="00000000-0000-0000-0000-000000000003", username="bvs", display_name="BVS Rujan", is_admin=True))
                else:
                    bvs.is_admin = True
                db.commit()
        except Exception as exc:
            logger.warning("Development admin profile seed failed: %s", exc)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/docs" if settings.DEBUG and settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.DEBUG and settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.DEBUG and settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX or None,
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


@app.get("/api/ready")
def readiness_check():
    from app.db.database import engine
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable.")
    if settings.ENVIRONMENT == "production":
        import httpx

        try:
            with httpx.Client(trust_env=False, timeout=3.0) as client:
                worker_response = client.get(
                    f"{settings.HDL_WORKER_URL.rstrip('/')}/ready",
                    headers={"Authorization": f"Bearer {settings.HDL_WORKER_TOKEN}"},
                )
            worker_response.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="Execution worker unavailable.") from None
    return {"status": "ready"}
