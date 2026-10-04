FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
EXPOSE 8001
CMD ["uvicorn","app.worker:app","--host","0.0.0.0","--port","8001"]
