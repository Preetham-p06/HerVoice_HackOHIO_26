FROM python:3.13-slim
WORKDIR /app
COPY backend/api/requirements.lock /app/requirements.lock
RUN pip install --no-cache-dir -r requirements.lock
COPY backend /app/backend
COPY backend/fixtures /app/backend/fixtures
RUN useradd --create-home app && mkdir -p /app/.data && chown -R app:app /app
USER app
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
