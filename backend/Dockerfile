FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
COPY data/ ./backend/data/
CMD ["python", "backend.py"]