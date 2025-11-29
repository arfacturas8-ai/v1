/**
 * K6 Load Test for CRYB Platform - Production Test
 * Progressive load test: 1K → 10K → 50K → 100K users
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const pageLoadTime = new Trend('page_load_time');
const apiResponseTime = new Trend('api_response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '2m', target: 100 },
    // Ramp to 1K
    { duration: '5m', target: 1000 },
    // Sustain 1K
    { duration: '5m', target: 1000 },
    // Ramp to 10K
    { duration: '10m', target: 10000 },
    // Sustain 10K
    { duration: '10m', target: 10000 },
    // Ramp to 50K
    { duration: '15m', target: 50000 },
    // Sustain 50K
    { duration: '10m', target: 50000 },
    // Ramp to 100K
    { duration: '20m', target: 100000 },
    // Sustain 100K
    { duration: '15m', target: 100000 },
    // Cool down
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],  // 95% under 2s, 99% under 5s
    'http_req_failed': ['rate<0.01'],  // Less than 1% error rate
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://platform.cryb.ai';
const API_URL = __ENV.API_URL || 'https://api.cryb.ai';

export default function () {
  requestCount.add(1);

  // Randomize user behavior
  const scenarios = [
    browseLanding,
    browseAPI,
    staticAssets,
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  // Random sleep between 1-5 seconds (simulate real user behavior)
  sleep(Math.random() * 4 + 1);
}

function browseLanding() {
  group('Landing Page', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/`);
    const duration = Date.now() - start;

    pageLoadTime.add(duration);

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 3s': (r) => r.timings.duration < 3000,
    });

    errorRate.add(!success);
  });
}

function browseAPI() {
  group('API Status', () => {
    const start = Date.now();
    // Try common API endpoints
    const res = http.get(`${API_URL}/api/v1/status`, {
      timeout: '10s',
    });
    const duration = Date.now() - start;

    apiResponseTime.add(duration);

    // Accept 200 OK or 404 Not Found (route may not exist)
    const success = check(res, {
      'status is 2xx or 404': (r) => r.status >= 200 && r.status < 300 || r.status === 404,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!success);
  });
}

function staticAssets() {
  group('Static Assets', () => {
    const assets = [
      '/favicon.svg',
      '/manifest.json',
      '/robots.txt',
    ];

    const asset = assets[Math.floor(Math.random() * assets.length)];
    const res = http.get(`${BASE_URL}${asset}`);

    const success = check(res, {
      'status is 200 or 304': (r) => r.status === 200 || r.status === 304,
    });

    errorRate.add(!success);
  });
}

export function handleSummary(data) {
  const summary = generateTextSummary(data);
  console.log(summary);

  return {
    '/home/ubuntu/load-test-results.json': JSON.stringify(data),
    'stdout': summary,
  };
}

function generateTextSummary(data) {
  let summary = '\n' + '='.repeat(60) + '\n';
  summary += 'CRYB PLATFORM LOAD TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `Failed Requests: ${data.metrics.http_req_failed.values.passes} (${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%)\n`;
  summary += `Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

  summary += 'Response Times:\n';
  summary += `  P50: ${data.metrics.http_req_duration.values['p(50)']}ms\n`;
  summary += `  P95: ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  summary += `  P99: ${data.metrics.http_req_duration.values['p(99)']}ms\n`;
  summary += `  Max: ${data.metrics.http_req_duration.values.max}ms\n\n`;

  summary += 'Virtual Users:\n';
  summary += `  Max: ${data.metrics.vus_max.values.value}\n`;
  summary += `  Peak: ${data.metrics.vus.values.value}\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
