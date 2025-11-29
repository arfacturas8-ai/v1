# CRYB Platform - Comprehensive Monitoring Guide

## Overview

This guide provides a complete overview of the world-class monitoring and observability system implemented for the CRYB Platform. Our monitoring stack follows SRE best practices and provides comprehensive insights into system health, performance, and user experience.

##  Monitoring Philosophy

Our monitoring approach is built on the **Four Golden Signals**:
- **Latency**: How fast we serve requests
- **Traffic**: How much demand is on our system
- **Errors**: The rate of requests that fail
- **Saturation**: How "full" our service is

##  Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CRYB Monitoring Stack                     │
├─────────────────────────────────────────────────────────────┤
│  Applications & Services                                    │
│  ├── API Server (Fastify + Prometheus metrics)             │
│  ├── Web App (Next.js + Performance monitoring)            │
│  ├── Mobile App (React Native + Error tracking)            │
│  └── Admin Panel (React + Business metrics)                │
├─────────────────────────────────────────────────────────────┤
│  Data Collection Layer                                      │
│  ├── Prometheus (Metrics collection)                       │
│  ├── Loki (Log aggregation)                               │
│  ├── Jaeger (Distributed tracing)                         │
│  └── Sentry (Error tracking)                              │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  ├── Prometheus TSDB (Time series data)                   │
│  ├── Loki Storage (Log data)                              │
│  └── Jaeger Storage (Trace data)                          │
├─────────────────────────────────────────────────────────────┤
│  Visualization & Alerting                                  │
│  ├── Grafana (Dashboards & Visualizations)                │
│  ├── Alertmanager (Alert routing)                         │
│  └── Uptime Kuma (Service monitoring)                     │
├─────────────────────────────────────────────────────────────┤
│  External Integrations                                     │
│  ├── Slack (Alert notifications)                          │
│  ├── PagerDuty (Incident management)                      │
│  └── Email (Alert notifications)                          │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Components Deep Dive

### 1. Prometheus (Metrics Collection)

**Purpose**: Collects and stores time-series metrics data
**Port**: 9090
**Configuration**: `/home/ubuntu/cryb-platform/config/prometheus/prometheus.yml`

**Key Features**:
- 15-second scrape intervals for real-time monitoring
- 30-day data retention
- Custom metrics from all CRYB services
- Multi-target service discovery

**Metrics Categories**:
- **HTTP Metrics**: Request rate, latency, error rate
- **Business Metrics**: User registrations, messages, voice calls
- **System Metrics**: CPU, memory, disk, network
- **Database Metrics**: Query performance, connections, locks

### 2. Grafana (Visualization)

**Purpose**: Creates dashboards and visualizations
**Port**: 3005
**Configuration**: `/home/ubuntu/cryb-platform/config/grafana/`

**Available Dashboards**:

####  SRE Dashboard (`cryb-api-sre`)
- SLI/SLO tracking with error budget monitoring
- Multi-burn rate alerting visualization
- Request rate and latency trends
- Real-time connectivity metrics

#### 👥 User Experience Dashboard (`cryb-user-experience`)
- Real-time business metrics
- User engagement trends
- Response time distribution
- Voice/video call quality
- Authentication success rates

#### 🏗️ Infrastructure Overview (`cryb-infrastructure-overview`)
- System resource utilization
- Container performance metrics
- Database and cache performance
- Network throughput

####  Capacity Planning (`cryb-capacity-planning`)
- Predictive resource analysis
- Storage forecasting
- User growth trends
- Scaling recommendations

####  Monitoring Health (`cryb-monitoring-health`)
- Monitoring stack health
- Prometheus performance
- Alert statistics
- Scrape target status

### 3. Loki (Log Aggregation)

**Purpose**: Collects, indexes, and queries log data
**Port**: 3100
**Configuration**: `/home/ubuntu/cryb-platform/config/loki/loki-config.yaml`

**Log Sources**:
- Application logs from all services
- Container logs via Docker logging driver
- System logs via Promtail
- Nginx access and error logs

### 4. Alertmanager (Alert Management)

**Purpose**: Handles alert routing and notifications
**Port**: 9093
**Configuration**: `/home/ubuntu/cryb-platform/config/alertmanager/alertmanager.yml`

**Alert Categories**:
- **Critical**: Service outages, SLO violations
- **Warning**: Resource usage, performance issues
- **Business**: KPI alerts, revenue impact
- **Security**: Authentication failures, suspicious activity

### 5. Jaeger (Distributed Tracing)

**Purpose**: Tracks requests across microservices
**Port**: 16686
**Features**:
- Request tracing with correlation IDs
- Performance bottleneck identification
- Service dependency mapping

### 6. Sentry (Error Tracking)

**Purpose**: Advanced error tracking and performance monitoring
**Integration**: `/home/ubuntu/cryb-platform/apps/api/src/services/sentry-integration.ts`

**Capabilities**:
- Real-time error capture and grouping
- Performance monitoring
- Release tracking
- User context and breadcrumbs

##  Key Metrics & SLIs

### Service Level Indicators (SLIs)

#### API Availability SLI
```promql
1 - (rate(http_requests_total{job="cryb-api",code=~"5.."}[5m]) / rate(http_requests_total{job="cryb-api"}[5m]))
```
**Target**: > 99.9%

#### API Latency SLI
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="cryb-api"}[5m]))
```
**Target**: < 500ms (95th percentile)

#### Message Delivery SLI
```promql
(rate(cryb_messages_total[10m]) - rate(cryb_messages_failed_total[10m])) / rate(cryb_messages_total[10m])
```
**Target**: > 99.5%

### Business Metrics

#### User Growth
```promql
rate(cryb_user_registrations_total[1h]) * 3600 * 24
```

#### Active Users
```promql
socketio_connected_clients
```

#### Voice Call Quality
```promql
1 - (rate(cryb_voice_calls_poor_quality_total[30m]) / rate(cryb_voice_calls_total[30m]))
```

## 🚨 Alerting Strategy

### Multi-Window Multi-Burn-Rate Alerts

Our alerting follows Google's SRE practices with multi-window multi-burn-rate alerts:

#### Fast Burn (2m/30m windows)
- **Threshold**: 2% error rate
- **Alert Time**: 2 minutes
- **Action**: Immediate response required

#### Slow Burn (30m/6h windows)
- **Threshold**: 0.1% error rate
- **Alert Time**: 15 minutes
- **Action**: Investigation required

### Alert Routing

```yaml
Critical Alerts → PagerDuty + Email + Slack (#critical-alerts)
Warning Alerts → Slack (#monitoring)
Business KPIs → Email + Slack (#business-analytics)
Security Alerts → Email + Slack (#security-alerts)
```

##  Troubleshooting Guide

### Common Issues

#### 1. High API Latency
**Symptoms**: P95 latency > 500ms
**Investigation Steps**:
1. Check database query performance
2. Examine cache hit rates
3. Review application logs for errors
4. Check system resource usage

**Dashboard**: API SRE Dashboard → Latency Trends

#### 2. Database Connection Pool Exhaustion
**Symptoms**: Connection pool > 80% utilization
**Investigation Steps**:
1. Identify long-running queries
2. Check for connection leaks
3. Review application connection patterns
4. Consider scaling database

**Dashboard**: Infrastructure Overview → Database Metrics

#### 3. Memory Usage Spike
**Symptoms**: Memory usage > 85%
**Investigation Steps**:
1. Check for memory leaks in applications
2. Review garbage collection metrics
3. Examine container memory limits
4. Consider horizontal scaling

**Dashboard**: Capacity Planning → Memory Trends

### Alert Runbooks

Each alert includes links to specific runbooks:
- **API Latency**: `https://wiki.cryb.ai/runbooks/api-latency-slo`
- **Service Down**: `https://wiki.cryb.ai/runbooks/service-down`
- **High Memory**: `https://wiki.cryb.ai/runbooks/high-memory-usage`

##  Getting Started

### 1. Access Dashboards

```bash
# Grafana
http://localhost:3005
Username: admin
Password: admin123

# Prometheus
http://localhost:9090

# Alertmanager
http://localhost:9093

# Jaeger
http://localhost:16686
```

### 2. Start Monitoring Stack

```bash
cd /home/ubuntu/cryb-platform
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Verify Services

```bash
# Check all monitoring services
./scripts/health-check-monitoring.sh

# View service status
docker-compose -f docker-compose.monitoring.yml ps
```

##  Configuration Files

### Key Configuration Locations

```
/home/ubuntu/cryb-platform/
├── config/
│   ├── prometheus/
│   │   ├── prometheus.yml          # Main Prometheus config
│   │   └── alerts.yml             # Alert rules
│   ├── grafana/
│   │   ├── provisioning/          # Dashboard provisioning
│   │   └── dashboards/            # Dashboard definitions
│   ├── alertmanager/
│   │   ├── alertmanager.yml       # Alert routing config
│   │   └── templates/             # Alert templates
│   └── loki/
│       └── loki-config.yaml       # Loki configuration
└── docker-compose.monitoring.yml   # Monitoring stack
```

##  Customization

### Adding Custom Metrics

1. **In API Service**:
```typescript
// Add to enhanced-monitoring.ts
const customMetric = new Counter({
  name: 'cryb_custom_metric_total',
  help: 'Description of custom metric',
  labelNames: ['label1', 'label2']
});

customMetric.inc({ label1: 'value1', label2: 'value2' });
```

2. **Create Dashboard Panel**:
```json
{
  "targets": [
    {
      "expr": "rate(cryb_custom_metric_total[5m])",
      "legendFormat": "Custom Metric Rate"
    }
  ]
}
```

### Adding New Alerts

1. **Add to alerts.yml**:
```yaml
- alert: CustomAlert
  expr: custom_metric > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert fired"
    description: "Custom metric is above threshold"
```

2. **Add to alertmanager.yml**:
```yaml
- match:
    alertname: CustomAlert
  receiver: 'custom-alerts'
```

## 🎓 Best Practices

### 1. Metric Naming
- Use consistent prefixes: `cryb_`
- Include units in names: `_seconds`, `_bytes`, `_total`
- Use descriptive labels: `{method="GET", endpoint="/api/users"}`

### 2. Alert Design
- Alert on symptoms, not causes
- Use multi-window multi-burn-rate for SLOs
- Include runbook links in alerts
- Test alerts regularly

### 3. Dashboard Design
- Follow the RED method (Rate, Errors, Duration)
- Use consistent time ranges
- Include business context
- Make dashboards mobile-friendly

### 4. Retention Policies
- **Metrics**: 30 days (adjustable in prometheus.yml)
- **Logs**: 7 days (adjustable in loki-config.yaml)
- **Traces**: 24 hours (adjustable in jaeger config)

##  Performance Tuning

### Prometheus Optimization
```yaml
# prometheus.yml
global:
  scrape_interval: 15s     # Balance between freshness and load
  evaluation_interval: 15s # Match scrape interval

storage:
  tsdb:
    retention.time: 30d    # Adjust based on storage capacity
```

### Grafana Optimization
- Use query caching for expensive queries
- Limit concurrent queries
- Use appropriate refresh intervals
- Archive old dashboards

## 🆘 Emergency Procedures

### 1. Monitoring Stack Down
```bash
# Check Docker services
docker-compose -f docker-compose.monitoring.yml ps

# Restart monitoring stack
docker-compose -f docker-compose.monitoring.yml restart

# Check logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### 2. Disk Space Emergency
```bash
# Clean old Prometheus data
docker exec cryb-prometheus rm -rf /prometheus/data/01234567890abcdef

# Clean Docker logs
docker system prune -f

# Check space usage
df -h
```

### 3. High Cardinality Issues
```bash
# Check metric cardinality
curl http://localhost:9090/api/v1/label/__name__/values | jq '.data | length'

# Identify high cardinality metrics
curl http://localhost:9090/api/v1/query?query=topk\(10,count\+by\+\(__name__\)\(\{__name__=~\".%2B\"\}\)\)
```

## 📞 Support & Contacts

### Team Responsibilities
- **SRE Team**: Overall monitoring health, SLO management
- **Platform Engineering**: Metrics implementation, dashboard creation
- **DevOps**: Infrastructure monitoring, capacity planning
- **Security Team**: Security monitoring, incident response

### Escalation Paths
1. **P0 (Critical)**: PagerDuty → On-call engineer
2. **P1 (High)**: Slack #critical-alerts → Team lead
3. **P2 (Medium)**: Slack #monitoring → Relevant team
4. **P3 (Low)**: Email → Team notifications

---

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Google SRE Book](https://sre.google/books/)
- [The Four Golden Signals](https://sre.google/sre-book/monitoring-distributed-systems/)

**Last Updated**: September 2024  
**Version**: 1.0  
**Maintained By**: CRYB Platform Engineering Team