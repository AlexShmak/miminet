# Stage 1: build front-end bundles with Vite
FROM node:22-slim AS web-build

WORKDIR /front
COPY ./web/ /front/web/

WORKDIR /front/web
RUN npm install --no-audit --no-fund --prefer-offline
RUN npm run build

# Stage 2: python app
FROM python:3.11

# Use the host's fast loopback proxy (reachable when the build uses
# `network: host`). The Docker daemon's default proxy is via docker0
# which is ~10x slower in this environment.
ENV HTTP_PROXY=http://127.0.0.1:1081 \
    HTTPS_PROXY=http://127.0.0.1:1081 \
    http_proxy=http://127.0.0.1:1081 \
    https_proxy=http://127.0.0.1:1081 \
    NO_PROXY=localhost,127.0.0.1 \
    no_proxy=localhost,127.0.0.1

WORKDIR /app

# Install dependencies from the uv-generated lockfile.
# pyproject.toml + uv.lock are the source of truth; requirements.lock is
# regenerated from them via `uv export --frozen --no-dev --format requirements.txt`.
COPY requirements.lock /app/requirements.lock
RUN pip install --no-cache-dir --timeout 60 --retries 10 --prefer-binary \
    -r /app/requirements.lock

# Unset proxy for the runtime — the container at runtime is on a normal
# Docker bridge and 127.0.0.1 is the container itself.
ENV HTTP_PROXY= \
    HTTPS_PROXY= \
    http_proxy= \
    https_proxy=

RUN mkdir -p /app/.postgresql && \
    wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" -O /app/.postgresql/root.crt && \
    chmod 0600 /app/.postgresql/root.crt

ADD ./src /app

# Copy built bundles from the node stage
COPY --from=web-build /front/src/static/dist/ /app/static/dist/

ADD run_app.sh /app/run_app.sh
RUN chmod +x /app/run_app.sh

CMD ["/app/run_app.sh"]
