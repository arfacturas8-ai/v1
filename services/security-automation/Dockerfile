FROM node:18-alpine

RUN apk add --no-cache curl jq python3 py3-pip iptables

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 3200

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3200/health || exit 1

CMD ["node", "src/index.js"]