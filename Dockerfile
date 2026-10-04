FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends iverilog && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
ENV PYTHONUNBUFFERED=1 ENVIRONMENT=production HDL_USE_DOCKER=false
EXPOSE 8001
CMD ["uvicorn","app.worker:app","--host","0.0.0.0","--port","8001"]
