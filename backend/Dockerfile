FROM python:3.11-slim

# Install system dependencies, including Icarus Verilog and Verilator
RUN apt-get update && apt-get install -y --no-install-recommends \
    iverilog \
    verilator \
    gcc \
    g++ \
    make \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app

# Expose default port
EXPOSE 8000

# Environment variables
ENV PYTHONUNBUFFERED=1

<<<<<<< HEAD
# Start FastAPI server dynamically binding to Render's $PORT or 8000
=======
# Start the FastAPI server
>>>>>>> friend/Bvs_SubBranch
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
