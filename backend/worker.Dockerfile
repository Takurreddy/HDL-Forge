FROM python:3.11-slim

<<<<<<< HEAD
RUN apt-get update && apt-get install -y --no-install-recommends docker-cli \
=======
RUN apt-get update && apt-get install -y --no-install-recommends iverilog \
>>>>>>> e70e200aebeb6d63640b8c70100d6206027970c9
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

<<<<<<< HEAD
ENV PYTHONUNBUFFERED=1 ENVIRONMENT=production HDL_USE_DOCKER=true
=======
ENV PYTHONUNBUFFERED=1 ENVIRONMENT=production HDL_USE_DOCKER=false
>>>>>>> e70e200aebeb6d63640b8c70100d6206027970c9
EXPOSE 8001
CMD ["uvicorn", "app.worker:app", "--host", "0.0.0.0", "--port", "8001"]
