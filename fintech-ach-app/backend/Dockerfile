FROM python:3.12.1-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for initialization scripts
RUN mkdir -p init-scripts

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["python", "main.py"] 