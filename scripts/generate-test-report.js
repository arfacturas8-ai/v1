const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestReportGenerator {
  constructor() {
    this.reportData = {
      timestamp: new Date().toISOString(),
      platform: 'CRYB Platform',
      version: this.getVersion(),
      environment: process.env.NODE_ENV || 'development',
      testSuites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      coverage: {},
      performance: {},
      security: {},
      compliance: {}
    };
  }

  async generateComprehensiveReport() {
    console.log('📊 Generating Comprehensive Test Report for CRYB Platform');
    console.log('=' .repeat(60));

    try {
      // Collect test results from all sources
      await this.collectUnitTestResults();
      await this.collectE2ETestResults();
      await this.collectAPITestResults();
      await this.collectMobileTestResults();
      await this.collectPerformanceResults();
      await this.collectSecurityResults();
      await this.collectComplianceResults();
      await this.collectCoverageResults();

      // Generate summary
      this.generateSummary();

      // Generate detailed report
      await this.generateHTMLReport();
      await this.generateJSONReport();
      await this.generateJUnitReport();
      await this.generateMarkdownReport();

      // Generate badges
      this.generateBadges();

      console.log('\n🎉 Test report generation completed!');
      console.log('📁 Reports available in: test-results/');
      console.log('🌐 HTML Report: test-results/comprehensive-report.html');
      console.log('📄 JSON Report: test-results/comprehensive-report.json');
      console.log('📋 Markdown Report: test-results/comprehensive-report.md');

    } catch (error) {
      console.error('Report generation failed:', error.message);
      process.exit(1);
    }
  }

  async collectUnitTestResults() {
    console.log('📋 Collecting unit test results...');

    const testPaths = [
      'apps/api/__tests__',
      'apps/web/__tests__',
      'apps/mobile/__tests__'
    ];

    for (const testPath of testPaths) {
      try {
        const fullPath = path.join(process.cwd(), testPath);
        if (fs.existsSync(fullPath)) {
          // Look for Jest test results
          const jestResults = this.findJestResults(fullPath);
          if (jestResults) {
            this.reportData.testSuites.unit = this.reportData.testSuites.unit || {};
            this.reportData.testSuites.unit[testPath] = jestResults;
          }
        }
      } catch (error) {
        console.warn(`Could not collect unit tests from ${testPath}:`, error.message);
      }
    }
  }

  async collectE2ETestResults() {
    console.log('🎭 Collecting E2E test results...');

    const playwrightResultsPath = path.join(process.cwd(), 'apps/web/test-results');
    if (fs.existsSync(playwrightResultsPath)) {
      try {
        const files = fs.readdirSync(playwrightResultsPath);
        const jsonResults = files.find(f => f.endsWith('e2e-results.json'));
        
        if (jsonResults) {
          const resultsPath = path.join(playwrightResultsPath, jsonResults);
          const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          this.reportData.testSuites.e2e = {
            playwright: this.convertPlaywrightResults(results)
          };
        }
      } catch (error) {
        console.warn('Could not collect E2E test results:', error.message);
      }
    }
  }

  async collectAPITestResults() {
    console.log('🔌 Collecting API test results...');

    const apiTestPath = path.join(process.cwd(), 'apps/api');
    try {
      // Look for API test coverage and results
      const coveragePath = path.join(apiTestPath, 'coverage/coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        this.reportData.testSuites.api = {
          coverage: coverage,
          status: 'completed'
        };
      }
    } catch (error) {
      console.warn('Could not collect API test results:', error.message);
    }
  }

  async collectMobileTestResults() {
    console.log('📱 Collecting mobile test results...');

    const mobileTestPath = path.join(process.cwd(), 'apps/mobile');
    try {
      // Look for React Native test results
      const jestResults = this.findJestResults(mobileTestPath);
      if (jestResults) {
        this.reportData.testSuites.mobile = {
          jest: jestResults,
          platform: 'React Native'
        };
      }

      // Look for Detox results
      const detoxResultsPath = path.join(mobileTestPath, 'e2e/artifacts');
      if (fs.existsSync(detoxResultsPath)) {
        this.reportData.testSuites.mobile = this.reportData.testSuites.mobile || {};
        this.reportData.testSuites.mobile.detox = {
          artifactsPath: detoxResultsPath,
          status: 'completed'
        };
      }
    } catch (error) {
      console.warn('Could not collect mobile test results:', error.message);
    }
  }

  async collectPerformanceResults() {
    console.log('⚡ Collecting performance test results...');

    try {
      // Look for Artillery results
      const performanceResultsPath = path.join(process.cwd(), 'test-results');
      if (fs.existsSync(performanceResultsPath)) {
        const files = fs.readdirSync(performanceResultsPath);
        const loadTestResults = files.filter(f => f.includes('load-test') && f.endsWith('.json'));
        
        if (loadTestResults.length > 0) {
          const latestResult = loadTestResults.sort().pop();
          const resultPath = path.join(performanceResultsPath, latestResult);
          
          if (fs.existsSync(resultPath)) {
            const results = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
            this.reportData.performance = this.convertArtilleryResults(results);
          }
        }
      }
    } catch (error) {
      console.warn('Could not collect performance results:', error.message);
    }
  }

  async collectSecurityResults() {
    console.log('🔒 Collecting security test results...');

    try {
      const securityReportPath = path.join(process.cwd(), 'security-test-report.json');
      if (fs.existsSync(securityReportPath)) {
        const securityResults = JSON.parse(fs.readFileSync(securityReportPath, 'utf8'));
        this.reportData.security = {
          timestamp: securityResults.timestamp,
          score: securityResults.security_score,
          summary: securityResults.summary,
          criticalIssues: securityResults.results.filter(r => r.status === 'FAIL'),
          warnings: securityResults.results.filter(r => r.status === 'WARN')
        };
      }
    } catch (error) {
      console.warn('Could not collect security results:', error.message);
    }
  }

  async collectComplianceResults() {
    console.log('📋 Collecting compliance test results...');

    try {
      const complianceReportPath = path.join(process.cwd(), 'apps/mobile/app-store-compliance-report.json');
      if (fs.existsSync(complianceReportPath)) {
        const complianceResults = JSON.parse(fs.readFileSync(complianceReportPath, 'utf8'));
        this.reportData.compliance = {
          timestamp: complianceResults.timestamp,
          score: complianceResults.compliance_score,
          summary: complianceResults.summary,
          recommendations: complianceResults.recommendations,
          nextSteps: complianceResults.next_steps
        };
      }
    } catch (error) {
      console.warn('Could not collect compliance results:', error.message);
    }
  }

  async collectCoverageResults() {
    console.log('📊 Collecting code coverage results...');

    const coveragePaths = [
      'apps/api/coverage/coverage-summary.json',
      'apps/web/coverage/coverage-summary.json',
      'apps/mobile/coverage/coverage-summary.json'
    ];

    this.reportData.coverage = {};

    for (const coveragePath of coveragePaths) {
      try {
        const fullPath = path.join(process.cwd(), coveragePath);
        if (fs.existsSync(fullPath)) {
          const coverage = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const component = coveragePath.split('/')[1]; // api, web, mobile
          this.reportData.coverage[component] = coverage.total;
        }
      } catch (error) {
        console.warn(`Could not collect coverage from ${coveragePath}:`, error.message);
      }
    }
  }

  findJestResults(testPath) {
    try {
      // Look for jest-results.json or similar
      const possiblePaths = [
        path.join(testPath, 'jest-results.json'),
        path.join(testPath, 'test-results.json'),
        path.join(testPath, '../test-results.json')
      ];

      for (const resultPath of possiblePaths) {
        if (fs.existsSync(resultPath)) {
          return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
        }
      }

      // If no results file, try to get package.json test info
      const packageJsonPath = path.join(testPath, '../package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return {
          name: packageJson.name,
          scripts: packageJson.scripts,
          status: 'configured'
        };
      }

      return null;
    } catch (error) {
      console.warn(`Error finding Jest results in ${testPath}:`, error.message);
      return null;
    }
  }

  convertPlaywrightResults(results) {
    return {
      suites: results.suites?.length || 0,
      tests: results.tests?.length || 0,
      passed: results.tests?.filter(t => t.outcome === 'expected').length || 0,
      failed: results.tests?.filter(t => t.outcome === 'unexpected').length || 0,
      duration: results.stats?.duration || 0,
      browsers: results.config?.projects?.map(p => p.name) || []
    };
  }

  convertArtilleryResults(results) {
    if (!results.aggregate) return { status: 'no_data' };

    return {
      summary: {
        scenarios: results.aggregate.scenariosCreated,
        requests: results.aggregate.requestsCompleted,
        errors: results.aggregate.errors,
        duration: results.aggregate.phases?.reduce((acc, phase) => acc + phase.duration, 0) || 0
      },
      response_times: {
        min: results.aggregate.latency?.min,
        max: results.aggregate.latency?.max,
        median: results.aggregate.latency?.median,
        p95: results.aggregate.latency?.p95,
        p99: results.aggregate.latency?.p99
      },
      rps: results.aggregate.rps?.mean
    };
  }

  generateSummary() {
    console.log('📈 Generating test summary...');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalDuration = 0;

    // Sum up all test results
    Object.values(this.reportData.testSuites).forEach(suite => {
      if (typeof suite === 'object') {
        Object.values(suite).forEach(subsuite => {
          if (subsuite.tests) totalTests += subsuite.tests;
          if (subsuite.passed) passedTests += subsuite.passed;
          if (subsuite.failed) failedTests += subsuite.failed;
          if (subsuite.duration) totalDuration += subsuite.duration;
        });
      }
    });

    // Add security and compliance results
    if (this.reportData.security.summary) {
      totalTests += this.reportData.security.summary.total;
      passedTests += this.reportData.security.summary.passed;
      failedTests += this.reportData.security.summary.failed;
    }

    if (this.reportData.compliance.summary) {
      totalTests += this.reportData.compliance.summary.total;
      passedTests += this.reportData.compliance.summary.passed;
      failedTests += this.reportData.compliance.summary.failed;
    }

    this.reportData.summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: totalTests - passedTests - failedTests,
      duration: totalDuration,
      success_rate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    };
  }

  async generateHTMLReport() {
    console.log('🌐 Generating HTML report...');

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRYB Platform - Comprehensive Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 2.5em; font-weight: bold; color: #6366f1; margin-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #6366f1; }
        .metric h3 { margin: 0 0 10px 0; color: #374151; }
        .metric .value { font-size: 2em; font-weight: bold; color: #1f2937; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .test-suite { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status-pass { color: #059669; }
        .status-fail { color: #dc2626; }
        .status-warn { color: #d97706; }
        .coverage-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #dc2626 0%, #d97706 50%, #059669 80%); }
        .timestamp { color: #6b7280; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; color: #374151; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: 500; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-warning { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CRYB Platform</div>
            <h1>Comprehensive Test Report</h1>
            <p class="timestamp">Generated on ${new Date(this.reportData.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${this.reportData.summary.total}</div>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <div class="value ${this.reportData.summary.success_rate >= 90 ? 'status-pass' : this.reportData.summary.success_rate >= 70 ? 'status-warn' : 'status-fail'}">${this.reportData.summary.success_rate}%</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value status-pass">${this.reportData.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value status-fail">${this.reportData.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Duration</h3>
                <div class="value">${Math.round(this.reportData.summary.duration / 1000)}s</div>
            </div>
            <div class="metric">
                <h3>Security Score</h3>
                <div class="value ${this.reportData.security.score >= 90 ? 'status-pass' : this.reportData.security.score >= 70 ? 'status-warn' : 'status-fail'}">${this.reportData.security.score || 'N/A'}%</div>
            </div>
        </div>

        ${this.generateCoverageSection()}
        ${this.generateTestSuitesSection()}
        ${this.generatePerformanceSection()}
        ${this.generateSecuritySection()}
        ${this.generateComplianceSection()}
    </div>
</body>
</html>`;

    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(path.join(reportDir, 'comprehensive-report.html'), htmlTemplate);
  }

  generateCoverageSection() {
    if (!Object.keys(this.reportData.coverage).length) return '';

    let coverageHtml = '<div class="section"><h2>📊 Code Coverage</h2>';
    
    Object.entries(this.reportData.coverage).forEach(([component, coverage]) => {
      const percentage = coverage.lines?.pct || 0;
      coverageHtml += `
        <div class="test-suite">
            <h3>${component.toUpperCase()}</h3>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 15px;">
                <div>
                    <strong>Lines:</strong> ${percentage}%
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div><strong>Functions:</strong> ${coverage.functions?.pct || 0}%</div>
                <div><strong>Branches:</strong> ${coverage.branches?.pct || 0}%</div>
                <div><strong>Statements:</strong> ${coverage.statements?.pct || 0}%</div>
            </div>
        </div>`;
    });

    return coverageHtml + '</div>';
  }

  generateTestSuitesSection() {
    let suitesHtml = '<div class="section"><h2>🧪 Test Suites</h2>';
    
    Object.entries(this.reportData.testSuites).forEach(([suiteType, suites]) => {
      suitesHtml += `<h3>${suiteType.toUpperCase()} Tests</h3>`;
      
      if (typeof suites === 'object') {
        Object.entries(suites).forEach(([name, results]) => {
          const status = results.failed > 0 ? 'danger' : 'success';
          suitesHtml += `
            <div class="test-suite">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>${name}</h4>
                    <span class="badge badge-${status}">${results.status || (results.failed > 0 ? 'FAILED' : 'PASSED')}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 10px;">
                    <div><strong>Tests:</strong> ${results.tests || 0}</div>
                    <div><strong>Passed:</strong> <span class="status-pass">${results.passed || 0}</span></div>
                    <div><strong>Failed:</strong> <span class="status-fail">${results.failed || 0}</span></div>
                    <div><strong>Duration:</strong> ${Math.round((results.duration || 0) / 1000)}s</div>
                </div>
            </div>`;
        });
      }
    });

    return suitesHtml + '</div>';
  }

  generatePerformanceSection() {
    if (!this.reportData.performance.summary) return '';

    const perf = this.reportData.performance;
    return `
      <div class="section">
          <h2>⚡ Performance Results</h2>
          <div class="test-suite">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                  <div><strong>Total Requests:</strong> ${perf.summary.requests}</div>
                  <div><strong>Errors:</strong> <span class="status-fail">${perf.summary.errors}</span></div>
                  <div><strong>RPS:</strong> ${Math.round(perf.rps || 0)}</div>
              </div>
              <h4>Response Times</h4>
              <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px;">
                  <div><strong>Min:</strong> ${perf.response_times.min}ms</div>
                  <div><strong>Median:</strong> ${perf.response_times.median}ms</div>
                  <div><strong>P95:</strong> ${perf.response_times.p95}ms</div>
                  <div><strong>P99:</strong> ${perf.response_times.p99}ms</div>
                  <div><strong>Max:</strong> ${perf.response_times.max}ms</div>
              </div>
          </div>
      </div>`;
  }

  generateSecuritySection() {
    if (!this.reportData.security.summary) return '';

    const security = this.reportData.security;
    return `
      <div class="section">
          <h2>🔒 Security Results</h2>
          <div class="test-suite">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
                  <div><strong>Score:</strong> <span class="${security.score >= 90 ? 'status-pass' : security.score >= 70 ? 'status-warn' : 'status-fail'}">${security.score}%</span></div>
                  <div><strong>Passed:</strong> <span class="status-pass">${security.summary.passed}</span></div>
                  <div><strong>Failed:</strong> <span class="status-fail">${security.summary.failed}</span></div>
                  <div><strong>Warnings:</strong> <span class="status-warn">${security.summary.warnings}</span></div>
              </div>
              ${security.criticalIssues.length > 0 ? `
                <h4>Critical Issues</h4>
                <ul>
                  ${security.criticalIssues.slice(0, 5).map(issue => `<li><strong>${issue.test}:</strong> ${issue.message}</li>`).join('')}
                </ul>
              ` : '<p><span class="status-pass">✅ No critical security issues found</span></p>'}
          </div>
      </div>`;
  }

  generateComplianceSection() {
    if (!this.reportData.compliance.summary) return '';

    const compliance = this.reportData.compliance;
    return `
      <div class="section">
          <h2>📋 App Store Compliance</h2>
          <div class="test-suite">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
                  <div><strong>Score:</strong> <span class="${compliance.score >= 90 ? 'status-pass' : compliance.score >= 70 ? 'status-warn' : 'status-fail'}">${compliance.score}%</span></div>
                  <div><strong>Passed:</strong> <span class="status-pass">${compliance.summary.passed}</span></div>
                  <div><strong>Failed:</strong> <span class="status-fail">${compliance.summary.failed}</span></div>
                  <div><strong>Manual Review:</strong> <span class="status-warn">${compliance.summary.manual}</span></div>
              </div>
              ${compliance.recommendations.length > 0 ? `
                <h4>Recommendations</h4>
                <ul>
                  ${compliance.recommendations.slice(0, 5).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
              ` : ''}
          </div>
      </div>`;
  }

  async generateJSONReport() {
    console.log('📄 Generating JSON report...');

    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportDir, 'comprehensive-report.json'),
      JSON.stringify(this.reportData, null, 2)
    );
  }

  async generateJUnitReport() {
    console.log('📋 Generating JUnit XML report...');

    // Convert results to JUnit XML format for CI/CD integration
    let junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${this.reportData.summary.total}" failures="${this.reportData.summary.failed}" errors="0" time="${this.reportData.summary.duration / 1000}">`;

    Object.entries(this.reportData.testSuites).forEach(([suiteType, suites]) => {
      if (typeof suites === 'object') {
        Object.entries(suites).forEach(([name, results]) => {
          junitXml += `
    <testsuite name="${suiteType}-${name}" tests="${results.tests || 0}" failures="${results.failed || 0}" errors="0" time="${(results.duration || 0) / 1000}">`;
          
          // Add individual test cases if available
          if (results.testCases) {
            results.testCases.forEach(testCase => {
              junitXml += `
        <testcase name="${testCase.name}" time="${testCase.duration / 1000}">`;
              if (testCase.status === 'failed') {
                junitXml += `<failure message="${testCase.error}">${testCase.stackTrace}</failure>`;
              }
              junitXml += `</testcase>`;
            });
          }
          
          junitXml += `
    </testsuite>`;
        });
      }
    });

    junitXml += `
</testsuites>`;

    const reportDir = path.join(process.cwd(), 'test-results');
    fs.writeFileSync(path.join(reportDir, 'junit-report.xml'), junitXml);
  }

  async generateMarkdownReport() {
    console.log('📝 Generating Markdown report...');

    const markdown = `# CRYB Platform - Comprehensive Test Report

Generated on ${new Date(this.reportData.timestamp).toLocaleString()}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${this.reportData.summary.total} |
| Success Rate | ${this.reportData.summary.success_rate}% |
| Passed | ✅ ${this.reportData.summary.passed} |
| Failed | ❌ ${this.reportData.summary.failed} |
| Duration | ${Math.round(this.reportData.summary.duration / 1000)}s |
| Security Score | ${this.reportData.security.score || 'N/A'}% |

## 🧪 Test Suites

${Object.entries(this.reportData.testSuites).map(([suiteType, suites]) => `
### ${suiteType.toUpperCase()} Tests

${typeof suites === 'object' ? Object.entries(suites).map(([name, results]) => `
- **${name}**: ${results.failed > 0 ? '❌' : '✅'} ${results.tests || 0} tests, ${results.passed || 0} passed, ${results.failed || 0} failed
`).join('') : ''}
`).join('')}

## 📊 Code Coverage

${Object.entries(this.reportData.coverage).map(([component, coverage]) => `
- **${component.toUpperCase()}**: ${coverage.lines?.pct || 0}% lines, ${coverage.functions?.pct || 0}% functions
`).join('')}

## ⚡ Performance

${this.reportData.performance.summary ? `
- **Requests**: ${this.reportData.performance.summary.requests}
- **Errors**: ${this.reportData.performance.summary.errors}
- **RPS**: ${Math.round(this.reportData.performance.rps || 0)}
- **P95 Response Time**: ${this.reportData.performance.response_times.p95}ms
- **P99 Response Time**: ${this.reportData.performance.response_times.p99}ms
` : 'No performance data available'}

## 🔒 Security

${this.reportData.security.summary ? `
- **Security Score**: ${this.reportData.security.score}%
- **Tests Passed**: ${this.reportData.security.summary.passed}
- **Critical Issues**: ${this.reportData.security.summary.failed}
- **Warnings**: ${this.reportData.security.summary.warnings}

${this.reportData.security.criticalIssues.length > 0 ? `
### Critical Security Issues
${this.reportData.security.criticalIssues.slice(0, 5).map(issue => `- **${issue.test}**: ${issue.message}`).join('\n')}
` : '✅ No critical security issues found'}
` : 'No security data available'}

## 📋 App Store Compliance

${this.reportData.compliance.summary ? `
- **Compliance Score**: ${this.reportData.compliance.score}%
- **Tests Passed**: ${this.reportData.compliance.summary.passed}
- **Tests Failed**: ${this.reportData.compliance.summary.failed}
- **Manual Review Required**: ${this.reportData.compliance.summary.manual}

${this.reportData.compliance.recommendations.length > 0 ? `
### Recommendations
${this.reportData.compliance.recommendations.slice(0, 5).map(rec => `- ${rec}`).join('\n')}
` : ''}
` : 'No compliance data available'}

---

**Platform**: ${this.reportData.platform}  
**Version**: ${this.reportData.version}  
**Environment**: ${this.reportData.environment}
`;

    const reportDir = path.join(process.cwd(), 'test-results');
    fs.writeFileSync(path.join(reportDir, 'comprehensive-report.md'), markdown);
  }

  generateBadges() {
    console.log('🏷️  Generating status badges...');

    const badges = {
      tests: {
        subject: 'tests',
        status: `${this.reportData.summary.passed}/${this.reportData.summary.total} passing`,
        color: this.reportData.summary.success_rate >= 90 ? 'brightgreen' : this.reportData.summary.success_rate >= 70 ? 'yellow' : 'red'
      },
      coverage: {
        subject: 'coverage',
        status: this.getAverageCoverage() + '%',
        color: this.getAverageCoverage() >= 80 ? 'brightgreen' : this.getAverageCoverage() >= 60 ? 'yellow' : 'red'
      },
      security: {
        subject: 'security',
        status: (this.reportData.security.score || 0) + '%',
        color: (this.reportData.security.score || 0) >= 90 ? 'brightgreen' : (this.reportData.security.score || 0) >= 70 ? 'yellow' : 'red'
      }
    };

    const reportDir = path.join(process.cwd(), 'test-results');
    fs.writeFileSync(path.join(reportDir, 'badges.json'), JSON.stringify(badges, null, 2));
  }

  getAverageCoverage() {
    const coverageValues = Object.values(this.reportData.coverage);
    if (coverageValues.length === 0) return 0;
    
    const totalCoverage = coverageValues.reduce((sum, coverage) => sum + (coverage.lines?.pct || 0), 0);
    return Math.round(totalCoverage / coverageValues.length);
  }

  getVersion() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '1.0.0';
      }
      return '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }
}

// Run the report generator
if (require.main === module) {
  const generator = new TestReportGenerator();
  generator.generateComprehensiveReport().catch(error => {
    console.error('Report generation failed:', error);
    process.exit(1);
  });
}

module.exports = TestReportGenerator;