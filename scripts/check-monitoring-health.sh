#!/bin/bash

# ==============================================
# CRYB PLATFORM - MONITORING HEALTH CHECK
# ==============================================
# Quick health check for monitoring services
# ==============================================

echo "🔍 CRYB Platform Monitoring Health Check"
echo "========================================"
echo ""

# Check Prometheus
echo -n "Prometheus (9090): "
if curl -s http://localhost:9090/-/healthy >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not ready"
fi

# Check Grafana
echo -n "Grafana (3011): "
if curl -s http://localhost:3011/api/health >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not ready"
fi

# Check AlertManager
echo -n "AlertManager (9093): "
if curl -s http://localhost:9093/-/healthy >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not ready"
fi

# Check Loki
echo -n "Loki (3100): "
if curl -s http://localhost:3100/ready >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not ready"
fi

# Check Node Exporter
echo -n "Node Exporter (9100): "
if curl -s http://localhost:9100/metrics >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not ready"
fi

# Check cAdvisor
echo -n "cAdvisor (8080): "
if curl -s http://localhost:8080/healthz >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Not ready"
fi

echo ""
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep cryb | head -10

echo ""
echo "🔗 Access URLs:"
echo "  • Grafana:      http://localhost:3011 (admin/CrybSecure2024!)"
echo "  • Prometheus:   http://localhost:9090"
echo "  • AlertManager: http://localhost:9093"
echo "  • Loki:         http://localhost:3100"