FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port (Render uses PORT env var)
EXPOSE 8000

# Use PORT env var from Render, default to 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
