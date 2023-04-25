FROM python:3.10-alpine AS builder

# Prepare deps
RUN apk add --no-cache build-base gcc musl-dev python3-dev libffi-dev libxml2-dev libxslt-dev postgresql-dev openssl-dev zeromq-dev rust cargo
RUN pip3 install --upgrade pip

WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir wheel && \
    pip wheel --no-cache-dir --wheel-dir=/wheels -r /app/requirements.txt

RUN pip3 install -r requirements.txt

COPY . .

FROM python:3.10-alpine AS build-image

ARG ENV=production
ENV ENV $ENV

WORKDIR /app

# Intall postgres
RUN apk add --no-cache postgresql-client

# Copy the wheel packages from the first stage
COPY --from=builder /wheels /wheels

# Install the wheel packages
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*

COPY --from=builder /app /app

# Expose ports 8080 and 8081
EXPOSE 8080 8081


CMD ["python3", "webhooks.py"]