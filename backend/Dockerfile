FROM python:3.11-slim

# Install HDL toolchain used by direct execution on Render.
RUN apt-get update && apt-get install -y --no-install-recommends \
    iverilog \
    verilator \
    gcc \
    g++ \
    make \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV PYTHONUNBUFFERED=1

# Render supplies PORT at runtime.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
