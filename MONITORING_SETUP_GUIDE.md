# CRYB Platform - Comprehensive Monitoring Setup Guide

## Overview

This guide provides comprehensive monitoring for the CRYB platform with production-grade observability, alerting, and performance tracking.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Prometheus    │    │     Grafana     │
│                 │───▶│                 │───▶│                 │
│  - API Server   │    │  - Metrics      │    │  - Dashboards   │
│  - Web App      │    │  - Alerts       │    │  - Visualization│
│  - Services     │    │  - Rules        │    │  - Analytics    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Loki       │    │  Alertmanager   │    │     Sentry      │
│                 │    │                 │    │                 │
│  - Log Storage  │    │  - Routing      │    │  - Error Track  │
│  - Aggregation  │    │  - Notifications│    │  - Performance  │
│  - Querying     │    │  - Escalation   │    │  - User Context │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. Prometheus (Port 9090)
- **Purpose**: Metrics collection and alerting
- **Features**:
  - HTTP request/response metrics
  - Business KPI tracking
  - Database performance monitoring
  - Real-time messaging metrics
  - Voice/video quality tracking
  - Custom application metrics

### 2. Grafana (Port 3000)
- **Purpose**: Visualization and dashboards
- **Dashboards**:
  - API Performance Dashboard
  - Business KPIs & Analytics
  - SLO Dashboard
  - Infrastructure Overview
  - Logs Dashboard

### 3. Loki (Port 3100)
- **Purpose**: Log aggregation and querying
- **Features**:
  - Centralized log collection
  - Application logs
  - System logs
  - Security logs
  - Error correlation

### 4. Alertmanager (Port 9093)
- **Purpose**: Alert routing and notifications
- **Features**:
  - Multi-channel notifications (Slack, Email, PagerDuty)
  - Alert grouping and deduplication
  - Escalation policies
  - Inhibition rules

### 5. Sentry Integration
- **Purpose**: Error tracking and performance monitoring
- **Features**:
  - Real-time error tracking
  - Performance transaction monitoring
  - User context correlation
  - Release tracking
  - Custom error boundaries

## Quick Start

### 1. Start Monitoring Stack

```bash
# Start the complete monitoring infrastructure
docker-compose -f docker-compose.monitoring.yml up -d

# Verify all services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Validate Setup

```bash
# Run comprehensive validation
./scripts/validate-monitoring-stack.sh
```

### 3. Access Dashboards

- **Grafana**: http://localhost:3005 (admin:admin123)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Loki**: http://localhost:3100

## Configuration

### Environment Variables

Create a `.env.monitoring` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production

# Alert Notification URLs
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
PAGERDUTY_SERVICE_KEY=your-pagerduty-service-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=alerts@cryb.ai
SMTP_PASSWORD=your-app-password

# External URLs
EXTERNAL_GRAFANA_URL=https://monitoring.cryb.ai
EXTERNAL_API_URL=https://api.cryb.ai
```

### API Integration

Add monitoring to your API application:

```typescript
import { monitoringIntegrationPlugin } from './services/monitoring-integration';

// Register monitoring plugin
await app.register(monitoringIntegrationPlugin, {
  config: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
    }
  }
});
```

## Metrics Guide

### HTTP Metrics

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{code=~"5.."}[5m]) / rate(http_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Business KPIs

```promql
# Daily Active Users
cryb_daily_active_users

# Message velocity
cryb_message_velocity

# User engagement score
cryb_user_engagement_score

# Voice call quality
rate(cryb_voice_calls_poor_quality_total[5m]) / rate(cryb_voice_calls_total[5m])
```

### SLO Metrics

```promql
# API Availability (99.9% target)
1 - (rate(http_requests_total{code=~"5.."}[30d]) / rate(http_requests_total[30d]))

# API Response Time (95th percentile < 500ms)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Alerting Rules

### Critical Alerts

- **API Service Down**: Service unavailable for > 1 minute
- **High Error Rate**: Error rate > 5% for 2 minutes
- **SLO Violations**: Availability < 99.9% or latency > 500ms
- **Database Issues**: Connection failures or slow queries
- **Security Events**: Failed login attempts or suspicious activity

### Warning Alerts

- **Resource Usage**: CPU > 80%, Memory > 85%, Disk > 90%
- **Performance Degradation**: Response time > 1s
- **Business KPIs**: User churn > 15%, engagement decline
- **Capacity Planning**: Predicted resource exhaustion

### Business Alerts

- **Revenue Impact**: Payment failures, subscription cancellations
- **User Experience**: High error rates, poor call quality
- **Growth Metrics**: Declining user registration, low engagement

## Log Analysis

### Common Queries

```logql
# Error logs in the last hour
{level="error"} |= "" | json

# API request logs with status codes
{service="api"} | json | status >= 400

# Database slow queries
{service="postgresql"} |= "slow query" | json

# Security events
{service="auth"} |= "failed" | json
```

### Log Parsing

Logs are automatically parsed with structured labels:
- `level`: error, warn, info, debug
- `service`: api, web, database, nginx
- `method`: HTTP method for API requests
- `status`: HTTP status code
- `duration`: Request processing time

## Dashboard Guide

### 1. API Performance Dashboard
- Request rate and error rate
- Response time percentiles
- Database query performance
- Socket.IO real-time metrics

### 2. Business KPIs Dashboard
- User engagement metrics
- Community health indicators
- Revenue and conversion tracking
- Voice/video quality metrics

### 3. SLO Dashboard
- Service Level Indicators (SLIs)
- Error budget tracking
- Burn rate analysis
- Compliance status

### 4. Infrastructure Dashboard
- System resource usage
- Container metrics
- Database performance
- Cache hit rates

## Alert Notification Channels

### Slack Integration

Alerts are routed to different Slack channels:
- `#critical-alerts`: Critical service issues
- `#sre-alerts`: SLO violations and burn rates
- `#monitoring`: General warnings and info
- `#security-alerts`: Security events
- `#business-analytics`: Business KPI alerts

### Email Notifications

- **Critical**: devops@cryb.ai, sre-team@cryb.ai
- **Security**: security@cryb.ai
- **Business**: business@cryb.ai
- **Revenue**: revenue-ops@cryb.ai

### PagerDuty Integration

Critical alerts trigger PagerDuty for immediate response:
- Service outages
- SLO violations
- Revenue-impacting issues
- Security incidents

## Troubleshooting

### Common Issues

1. **Metrics Not Appearing**
   - Check Prometheus targets: http://localhost:9090/targets
   - Verify API metrics endpoint: http://localhost:3001/metrics
   - Check network connectivity between services

2. **Dashboards Not Loading**
   - Verify Grafana data source configuration
   - Check Prometheus connectivity from Grafana
   - Ensure correct query syntax

3. **Alerts Not Firing**
   - Verify alert rules syntax: http://localhost:9090/rules
   - Check Alertmanager configuration: http://localhost:9093
   - Verify notification channel settings

4. **Logs Not Appearing**
   - Check Promtail service status
   - Verify log file paths and permissions
   - Check Loki ingestion: http://localhost:3100/ready

### Debug Commands

```bash
# Check service health
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3005/api/health # Grafana
curl http://localhost:3100/ready      # Loki
curl http://localhost:9093/-/healthy  # Alertmanager

# View service logs
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs grafana
docker-compose -f docker-compose.monitoring.yml logs loki
docker-compose -f docker-compose.monitoring.yml logs alertmanager

# Test metric collection
curl http://localhost:3001/metrics | grep cryb_

# Test alert rules
promtool check rules config/prometheus/alerts.yml
```

## Production Considerations

### Security

1. **Change Default Passwords**
   ```bash
   # Update Grafana admin password
   # Update SMTP credentials
   # Rotate service API keys
   ```

2. **Network Security**
   - Use TLS for all external communications
   - Implement proper firewall rules
   - Use VPN for sensitive monitoring data

3. **Access Control**
   - Implement RBAC in Grafana
   - Restrict Prometheus admin API
   - Secure alertmanager webhooks

### Performance

1. **Resource Allocation**
   - Prometheus: 2-4 CPU cores, 8-16GB RAM
   - Grafana: 1-2 CPU cores, 2-4GB RAM
   - Loki: 2-4 CPU cores, 4-8GB RAM

2. **Data Retention**
   - Prometheus: 30 days for detailed metrics
   - Loki: 31 days for logs
   - Long-term storage via remote write

3. **High Availability**
   - Run multiple Prometheus instances
   - Use Grafana clustering
   - Implement Loki clustering for scale

### Maintenance

1. **Regular Tasks**
   - Update monitoring stack components
   - Review and optimize alert rules
   - Clean up old dashboards
   - Validate backup procedures

2. **Capacity Planning**
   - Monitor resource usage trends
   - Plan for metric growth
   - Scale storage as needed

## Support

For monitoring-related issues:

1. Check the validation script results
2. Review service logs
3. Consult this documentation
4. Contact the SRE team with specific error messages

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Sentry Documentation](https://docs.sentry.io/)