FROM python:3.11-slim

RUN groupadd --gid 10001 hdlforge \
    && useradd --uid 10001 --gid 10001 --create-home hdlforge

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

ENV PYTHONUNBUFFERED=1 ENVIRONMENT=production
USER 10001:10001
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
