FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

ENV HF_HOME=/app/.cache/ishitama
ENV DEPTH_MODEL_PATH=/app/.cache/ishitama/depth_anything_v2_vits_dynamic.onnx
ENV BACKEND_CORS_ORIGINS=http://localhost:3000

RUN mkdir -p /app/.cache/ishitama \
    && curl -L --fail -o "$DEPTH_MODEL_PATH" \
      https://github.com/fabio-sim/Depth-Anything-ONNX/releases/download/v2.0.0/depth_anything_v2_vits_dynamic.onnx \
    && echo "46c4e8eeda3a27f34701831b6a2ec7753d7b38779b215acb5633424703deed8f  $DEPTH_MODEL_PATH" | sha256sum -c -

COPY app ./app

RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app \
    && chown -R app:app /app

USER 10001

EXPOSE 8000
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
