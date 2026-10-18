FROM python:3.13-slim
WORKDIR /app
COPY services/api/requirements.lock /app/requirements.lock
RUN pip install --no-cache-dir -r requirements.lock
COPY services /app/services
COPY fixtures /app/fixtures
RUN useradd --create-home app && mkdir -p /app/.data && chown -R app:app /app
USER app
CMD ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
