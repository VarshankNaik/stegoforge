FROM python:3.11-slim

WORKDIR /app

# Install docker CLI so backend can exec into tools container
RUN apt-get update && apt-get install -y \
    docker.io \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]