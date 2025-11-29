#!/bin/bash

# CRYB Platform Monitoring Status
# Quick status check for monitoring system

METRICS_DIR="/home/ubuntu/cryb-platform/data/monitoring"
LOG_DIR="/home/ubuntu/cryb-platform/logs/monitoring"
DATE_STAMP=$(date '+%Y%m%d')

echo "CRYB Platform Monitoring Status"
echo "==============================="
echo "Date: $(date)"
echo ""

# Check if metrics collection is working
echo "Metrics Collection:"
if [ -f "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl" ]; then
    lines=$(wc -l < "$METRICS_DIR/system-metrics-$DATE_STAMP.jsonl")
    echo "  System metrics: $lines entries today"
else
    echo "  System metrics: No data today"
fi

if [ -f "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl" ]; then
    lines=$(wc -l < "$METRICS_DIR/service-metrics-$DATE_STAMP.jsonl")
    echo "  Service metrics: $lines entries today"
else
    echo "  Service metrics: No data today"
fi

# Check health checks
echo ""
echo "Health Checks:"
if [ -f "$LOG_DIR/health-checks.log" ]; then
    last_health=$(tail -n 1 "$LOG_DIR/health-checks.log")
    echo "  Last check: $last_health"
else
    echo "  No health check logs found"
fi

# Check cron jobs
echo ""
echo "Cron Jobs:"
crontab -l 2>/dev/null | grep -E "(health-check|collect-metrics)" | while read -r job; do
    echo "  $job"
done

echo ""
echo "Disk Usage:"
echo "  Logs: $(du -sh $LOG_DIR 2>/dev/null | cut -f1 || echo "Unknown")"
echo "  Metrics: $(du -sh $METRICS_DIR 2>/dev/null | cut -f1 || echo "Unknown")"
