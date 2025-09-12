# Comprehensive Load Testing Guide

## Overview

This guide provides complete instructions for performing comprehensive load testing on the Cryb platform. The testing suite includes production simulation, feature-specific testing, performance monitoring, and bottleneck detection.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test Suite Overview](#test-suite-overview)
- [Quick Start](#quick-start)
- [Individual Test Suites](#individual-test-suites)
- [Performance Monitoring](#performance-monitoring)
- [Results Interpretation](#results-interpretation)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### System Requirements

- **Node.js**: v16+ 
- **Artillery**: Latest version (installed automatically)
- **Memory**: Minimum 4GB RAM (8GB+ recommended)
- **CPU**: Multi-core processor recommended
- **Disk**: At least 2GB free space for results and logs

### Environment Setup

1. **Verify API is running**:
   ```bash
   curl http://localhost:3002/api/v1/health
   ```

2. **Check system resources**:
   ```bash
   free -h  # Check available memory
   top      # Monitor CPU usage
   ```

3. **Install dependencies**:
   ```bash
   cd /home/ubuntu/cryb-platform/apps/api
   npm install
   ```

## Test Suite Overview

### Available Test Suites

| Test Suite | Duration | Focus Area | Requests | Concurrent Users |
|------------|----------|------------|----------|------------------|
| **Production Load Test** | 25 min | Full platform simulation | 50,000+ | 500+ |
| **Authentication Load Test** | 15 min | Auth system stress testing | 20,000+ | 300+ |
| **Discord Features Test** | 20 min | Server/channel operations | 30,000+ | 400+ |
| **Reddit Features Test** | 18 min | Community/posting features | 25,000+ | 350+ |
| **WebSocket Real-time Test** | 12 min | Real-time messaging | 15,000+ | 1000+ |

### Test Phases

Each test suite includes multiple phases:

1. **Warm-up**: Gradual load increase
2. **Normal Load**: Sustained typical traffic
3. **Peak Load**: High traffic simulation
4. **Stress Test**: System breaking point
5. **Recovery**: Load reduction and stability

## Quick Start

### Run All Tests (Recommended)

```bash
cd /home/ubuntu/cryb-platform/apps/api/tests/load
node run-load-tests.js all
```

### Run Single Test

```bash
# List available tests
node run-load-tests.js list

# Run specific test
node run-load-tests.js run "production"
node run-load-tests.js run "auth"
node run-load-tests.js run "discord"
```

### Run with Performance Monitoring

Performance monitoring is enabled by default and includes:
- CPU and memory usage tracking
- Database performance metrics
- Real-time bottleneck detection
- Network utilization monitoring

## Individual Test Suites

### 1. Production Load Test

**File**: `production-load-test.yml`

**Purpose**: Comprehensive simulation of production traffic patterns covering all platform features.

**Key Scenarios**:
- User authentication (25%)
- Discord features (30%) 
- Reddit features (25%)
- File uploads (10%)
- WebSocket messaging (10%)

**Usage**:
```bash
artillery run production-load-test.yml --output results/production-results.json
```

**Expected Outcomes**:
- 95%+ success rate
- Average response time < 2 seconds
- 99th percentile < 5 seconds
- No memory leaks or crashes

### 2. Authentication Load Test

**File**: `auth-endpoints-load-test.yml`

**Purpose**: Stress test authentication system including registration, login, OAuth, and security features.

**Key Scenarios**:
- User registration (25%)
- Login flows (40%)
- OAuth authentication (15%)
- Token management (10%)
- Security testing (10%)

**Usage**:
```bash
artillery run auth-endpoints-load-test.yml --output results/auth-results.json
```

**Expected Outcomes**:
- Registration: < 5 seconds response time
- Login: < 3 seconds response time
- Rate limiting triggers properly
- No authentication bypasses

### 3. Discord Features Load Test

**File**: `discord-features-load-test.yml`

**Purpose**: Test Discord-like functionality under load.

**Key Scenarios**:
- Server management (20%)
- Channel messaging (40%)
- Voice operations (15%)
- Member management (15%)
- Real-time events (10%)

**Usage**:
```bash
artillery run discord-features-load-test.yml --output results/discord-results.json
```

**Expected Outcomes**:
- Message delivery < 1 second
- Server creation < 3 seconds
- Voice connections < 500ms
- Real-time event propagation < 200ms

### 4. Reddit Features Load Test

**File**: `reddit-features-load-test.yml`

**Purpose**: Test Reddit-like community features.

**Key Scenarios**:
- Community management (15%)
- Post operations (35%)
- Commenting system (30%)
- Voting system (10%)
- Social features (5%)
- Moderation (5%)

**Usage**:
```bash
artillery run reddit-features-load-test.yml --output results/reddit-results.json
```

**Expected Outcomes**:
- Post creation < 2 seconds
- Comment creation < 1 second
- Voting operations < 300ms
- Community creation < 3 seconds

### 5. WebSocket Real-time Load Test

**File**: `websocket-realtime-load-test.yml`

**Purpose**: Test real-time messaging and WebSocket connections.

**Key Scenarios**:
- Real-time messaging (40%)
- Voice signaling (20%)
- Presence management (15%)
- Notifications (10%)
- Live events (10%)
- Connection resilience (5%)

**Usage**:
```bash
artillery run websocket-realtime-load-test.yml --output results/websocket-results.json
```

**Expected Outcomes**:
- Connection establishment < 1 second
- Message delivery < 500ms
- 5,000+ concurrent connections
- < 2% connection drop rate

## Performance Monitoring

### Automatic Monitoring

Performance monitoring runs automatically with load tests and tracks:

- **System Metrics**: CPU, memory, disk usage
- **Application Metrics**: Response times, error rates
- **Database Metrics**: Query times, connection pool usage
- **Network Metrics**: Bandwidth utilization, connection counts

### Manual Monitoring

Run standalone performance monitoring:

```bash
node performance-monitor.js
```

### Real-time Bottleneck Detection

The system automatically detects:
- High CPU usage (>80%)
- Memory pressure (>85%)
- Slow database queries (>1s)
- High response times (>2s)
- Memory leaks
- Connection pool exhaustion

## Results Interpretation

### Success Criteria

| Metric | Excellent | Good | Needs Improvement |
|--------|-----------|------|-------------------|
| Success Rate | >99% | >95% | <95% |
| Average Response Time | <500ms | <1s | >1s |
| 95th Percentile | <1s | <2s | >2s |
| Error Rate | <0.1% | <1% | >1% |
| Memory Usage | <70% | <85% | >85% |

### Report Files

After each test run, the following reports are generated:

1. **JSON Report**: Detailed metrics and raw data
2. **HTML Report**: Visual dashboard with charts
3. **Executive Summary**: High-level findings
4. **Performance Data**: System monitoring results

### Key Metrics to Monitor

**Response Times**:
- Mean, median, 95th, 99th percentile
- Trend analysis over time
- Per-endpoint breakdown

**Throughput**:
- Requests per second
- Messages per second
- Concurrent connections

**Error Analysis**:
- Error types and frequencies
- Failed request patterns
- Timeout analysis

**Resource Utilization**:
- CPU and memory usage
- Database connection pool
- Network bandwidth

## Troubleshooting

### Common Issues

**1. High Error Rates**

*Symptoms*: >5% error rate, many 500 errors
*Causes*: Database overload, memory exhaustion, code bugs
*Solutions*:
- Check database connection pool size
- Monitor memory usage for leaks
- Review application logs for errors

**2. Slow Response Times**

*Symptoms*: Average response time >2s
*Causes*: Database bottlenecks, CPU constraints, network issues
*Solutions*:
- Analyze slow database queries
- Check CPU usage patterns
- Review network latency

**3. Connection Failures**

*Symptoms*: WebSocket connection drops, TCP errors
*Causes*: Network instability, server overload, firewall issues
*Solutions*:
- Check network configuration
- Monitor server resource usage
- Review connection timeout settings

**4. Memory Issues**

*Symptoms*: Increasing memory usage, OOM errors
*Causes*: Memory leaks, large data processing, insufficient resources
*Solutions*:
- Analyze heap dumps
- Review memory allocation patterns
- Increase server memory

### Debug Mode

Run tests with additional debugging:

```bash
DEBUG=* artillery run production-load-test.yml
```

### Verbose Logging

Enable detailed logging:

```bash
artillery run production-load-test.yml --verbose
```

## Best Practices

### Before Testing

1. **Baseline Measurement**: Run tests on a quiet system first
2. **Resource Monitoring**: Ensure adequate system resources
3. **Backup Data**: Backup any important data
4. **Notification**: Inform team about testing activities

### During Testing

1. **Monitor Resources**: Watch CPU, memory, and disk usage
2. **Check Logs**: Monitor application logs for errors
3. **Network Stability**: Ensure stable network connection
4. **Documentation**: Record any observed issues

### After Testing

1. **Result Analysis**: Review all generated reports
2. **Issue Documentation**: Document any problems found
3. **Recommendation Implementation**: Address high-priority issues
4. **Trend Tracking**: Compare with previous test results

### Regular Testing

- **Weekly**: Light load testing for early detection
- **Monthly**: Full load testing suite
- **Before Releases**: Comprehensive testing
- **After Changes**: Regression testing

## Advanced Configuration

### Custom Test Configuration

Create custom test files by modifying existing YAML files:

```yaml
config:
  target: 'http://localhost:3002'
  phases:
    - duration: 300    # 5 minutes
      arrivalRate: 50  # 50 users per second
      name: "Custom load phase"
```

### Environment Variables

Configure tests with environment variables:

```bash
export TARGET_HOST=localhost
export TARGET_PORT=3002
export TEST_DURATION=600
export MAX_USERS=1000
```

### Distributed Testing

For very high load testing, distribute across multiple machines:

```bash
# Machine 1
artillery run production-load-test.yml --count 3

# Machine 2  
artillery run auth-endpoints-load-test.yml --count 2
```

### Custom Metrics

Add custom metrics to test files:

```yaml
metrics:
  - name: "custom_operation_time"
    summary: "Custom operation response times"
```

### Integration with CI/CD

Example GitHub Actions workflow:

```yaml
- name: Run Load Tests
  run: |
    cd apps/api/tests/load
    node run-load-tests.js all
    
- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: load-test-results
    path: load-test-results/
```

## Performance Thresholds

### Production Readiness Criteria

The system is considered production-ready when it meets these criteria:

**Functional Requirements**:
- 99% success rate under normal load
- 95% success rate under peak load
- No critical functionality failures

**Performance Requirements**:
- Mean response time < 1 second
- 95th percentile < 2 seconds
- 99th percentile < 5 seconds

**Scalability Requirements**:
- Handle 1,000+ concurrent users
- Process 10,000+ requests per minute
- Support 5,000+ WebSocket connections

**Reliability Requirements**:
- < 0.1% error rate under normal load
- < 1% error rate under peak load
- Graceful degradation under stress

## Monitoring and Alerting

### Key Metrics to Alert On

**Critical Alerts**:
- Error rate > 5%
- Average response time > 5 seconds
- Memory usage > 90%
- CPU usage > 90%

**Warning Alerts**:
- Error rate > 1%
- Average response time > 2 seconds
- Memory usage > 80%
- CPU usage > 80%

### Dashboard Metrics

Essential metrics for monitoring dashboard:

1. **Request Metrics**:
   - Requests per second
   - Response time percentiles
   - Error rate by endpoint

2. **System Metrics**:
   - CPU utilization
   - Memory usage
   - Disk I/O

3. **Application Metrics**:
   - Database query time
   - Cache hit rate
   - Queue depth

4. **User Experience**:
   - Page load times
   - Feature availability
   - User session duration

## Contact and Support

For issues or questions about load testing:

1. **Check Logs**: Review generated reports and logs
2. **Documentation**: Refer to this guide and test comments
3. **System Health**: Verify all services are running properly
4. **Resource Check**: Ensure adequate system resources

## Appendix

### File Structure

```
tests/load/
├── production-load-test.yml           # Main production simulation
├── auth-endpoints-load-test.yml       # Authentication testing
├── discord-features-load-test.yml     # Discord features
├── reddit-features-load-test.yml      # Reddit features
├── websocket-realtime-load-test.yml   # WebSocket testing
├── production-load-helpers.js         # Production test helpers
├── auth-load-helpers.js               # Auth test helpers
├── discord-load-helpers.js            # Discord test helpers
├── reddit-load-helpers.js             # Reddit test helpers
├── websocket-load-helpers.js          # WebSocket test helpers
├── performance-monitor.js             # Performance monitoring
├── run-load-tests.js                  # Test orchestration
└── LOAD_TESTING_GUIDE.md             # This guide
```

### Sample Commands

```bash
# List all available tests
node run-load-tests.js list

# Run all tests sequentially
node run-load-tests.js all

# Run specific test
node run-load-tests.js run production

# Run tests concurrently (careful!)
node run-load-tests.js concurrent

# Run with custom output directory
OUTPUT_DIR=./custom-results node run-load-tests.js all

# Performance monitoring only
node performance-monitor.js
```

This comprehensive load testing suite ensures your platform can handle production traffic while maintaining excellent performance and reliability.