# syntax=docker/dockerfile:1.7

# =====================================================================
# Backend image — FastAPI + gpt-image-1
# Build from the project root:   docker build -f backend/Dockerfile .
# =====================================================================

ARG PYTHON_VERSION=3.12-slim

# -------- base --------------------------------------------------------
FROM python:${PYTHON_VERSION} AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# -------- builder: compile wheels ------------------------------------
FROM base AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp/build
COPY backend/requirements.txt .
RUN pip wheel --wheel-dir=/wheels -r requirements.txt

# -------- runtime ----------------------------------------------------
FROM base AS runtime

# Non-root user for safety.
RUN groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --create-home --shell /bin/bash app

# Install pre-built wheels (no network access here).
COPY --from=builder /wheels /tmp/wheels
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-index --find-links=/tmp/wheels -r /tmp/requirements.txt \
    && rm -rf /tmp/wheels /tmp/requirements.txt

# Copy application source.
WORKDIR /code
COPY --chown=app:app backend/app /code/app

# Writable data directory (DB + images). Mount a volume here.
ENV DATA_DIR=/data
RUN mkdir -p /data && chown -R app:app /data /code

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/health', timeout=3).status == 200 else 1)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
