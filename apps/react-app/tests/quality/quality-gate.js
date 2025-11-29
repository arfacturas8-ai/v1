/**
 * Quality Gate Script
 * Analyzes test results and determines if quality standards are met
 */

import fs from 'fs';
import path from 'path';

class QualityGate {
  constructor() {
    this.thresholds = {
      codeQuality: {
        minScore: 85,
        maxBugs: 0,
        maxVulnerabilities: 0,
        maxCodeSmells: 5,
        maxDuplication: 3,
        maxCyclomaticComplexity: 10
      },
      testCoverage: {
        minLines: 80,
        minBranches: 75,
        minFunctions: 80,
        minStatements: 80
      },
      performance: {
        maxResponseTime: 2000,
        minLighthouseScore: 85,
        maxLoadTime: 3000,
        maxMemoryUsage: 100 // MB
      },
      security: {
        maxCriticalVulns: 0,
        maxHighVulns: 0,
        maxMediumVulns: 2,
        maxLowVulns: 5
      },
      accessibility: {
        minScore: 90,
        maxViolations: 0,
        wcagLevel: 'AA'
      },
      e2e: {
        minPassRate: 95,
        maxFlakiness: 5 // percentage
      }
    };

    this.results = {
      timestamp: new Date().toISOString(),
      codeQuality: { passed: false, score: 0, issues: [] },
      testCoverage: { passed: false, percentage: 0, details: {} },
      performance: { passed: false, score: 0, metrics: {} },
      security: { passed: false, issues: 0, vulnerabilities: [] },
      accessibility: { passed: false, score: 0, violations: [] },
      e2e: { passed: false, passRate: 0, totalTests: 0, failedTests: 0 },
      overall: { passed: false, score: 0 }
    };
  }

  async analyzeQualityGate() {
    console.log('🛡️ Starting Quality Gate Analysis...\n');

    try {
      await this.analyzeCodeQuality();
      await this.analyzeTestCoverage();
      await this.analyzePerformance();
      await this.analyzeSecurity();
      await this.analyzeAccessibility();
      await this.analyzeE2ETests();

      this.calculateOverallScore();
      this.generateReport();
      this.createQualityGateDecision();

      return this.results;
    } catch (error) {
      console.error('❌ Quality Gate Analysis failed:', error);
      process.exit(1);
    }
  }

  async analyzeCodeQuality() {
    console.log('📊 Analyzing Code Quality...');

    // Check SonarQube results
    const sonarReportPath = 'artifacts/sonar-report.json';
    if (fs.existsSync(sonarReportPath)) {
      const sonarData = JSON.parse(fs.readFileSync(sonarReportPath, 'utf8'));
      
      this.results.codeQuality = {
        passed: this.evaluateCodeQuality(sonarData),
        score: this.calculateCodeQualityScore(sonarData),
        issues: sonarData.issues || [],
        metrics: {
          bugs: sonarData.bugs || 0,
          vulnerabilities: sonarData.vulnerabilities || 0,
          codeSmells: sonarData.codeSmells || 0,
          duplication: sonarData.duplication || 0,
          complexity: sonarData.complexity || 0
        }
      };
    } else {
      console.log('⚠️ SonarQube report not found, checking ESLint results...');
      
      // Fallback to ESLint results
      const eslintResults = this.analyzeESLintResults();
      this.results.codeQuality = eslintResults;
    }

    console.log(`Code Quality Score: ${this.results.codeQuality.score}/100`);
    console.log(`Status: ${this.results.codeQuality.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  }

  evaluateCodeQuality(sonarData) {
    return (
      sonarData.bugs <= this.thresholds.codeQuality.maxBugs &&
      sonarData.vulnerabilities <= this.thresholds.codeQuality.maxVulnerabilities &&
      sonarData.codeSmells <= this.thresholds.codeQuality.maxCodeSmells &&
      sonarData.duplication <= this.thresholds.codeQuality.maxDuplication &&
      sonarData.complexity <= this.thresholds.codeQuality.maxCyclomaticComplexity
    );
  }

  calculateCodeQualityScore(sonarData) {
    let score = 100;
    score -= sonarData.bugs * 20;
    score -= sonarData.vulnerabilities * 15;
    score -= sonarData.codeSmells * 2;
    score -= sonarData.duplication * 5;
    score -= Math.max(0, sonarData.complexity - this.thresholds.codeQuality.maxCyclomaticComplexity) * 3;
    return Math.max(0, score);
  }

  analyzeESLintResults() {
    const eslintFiles = [
      'artifacts/eslint-results.json',
      'test-results/eslint-report.json'
    ];

    for (const file of eslintFiles) {
      if (fs.existsSync(file)) {
        const eslintData = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        const errorCount = eslintData.reduce((sum, file) => sum + file.errorCount, 0);
        const warningCount = eslintData.reduce((sum, file) => sum + file.warningCount, 0);
        
        const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 2));
        
        return {
          passed: errorCount === 0,
          score,
          issues: eslintData.filter(file => file.errorCount > 0 || file.warningCount > 0),
          metrics: { errors: errorCount, warnings: warningCount }
        };
      }
    }

    return { passed: false, score: 0, issues: ['No code quality results found'], metrics: {} };
  }

  async analyzeTestCoverage() {
    console.log('🧪 Analyzing Test Coverage...');

    const coverageFiles = [
      'coverage/coverage-summary.json',
      'artifacts/coverage-summary.json',
      'test-results/coverage-summary.json'
    ];

    for (const file of coverageFiles) {
      if (fs.existsSync(file)) {
        const coverageData = JSON.parse(fs.readFileSync(file, 'utf8'));
        const totals = coverageData.total;

        this.results.testCoverage = {
          passed: this.evaluateTestCoverage(totals),
          percentage: totals.lines.pct,
          details: {
            lines: totals.lines.pct,
            branches: totals.branches.pct,
            functions: totals.functions.pct,
            statements: totals.statements.pct
          }
        };

        console.log(`Coverage: ${totals.lines.pct}% lines, ${totals.branches.pct}% branches`);
        console.log(`Status: ${this.results.testCoverage.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
        return;
      }
    }

    console.log('⚠️ No coverage report found\n');
    this.results.testCoverage = { passed: false, percentage: 0, details: {} };
  }

  evaluateTestCoverage(totals) {
    return (
      totals.lines.pct >= this.thresholds.testCoverage.minLines &&
      totals.branches.pct >= this.thresholds.testCoverage.minBranches &&
      totals.functions.pct >= this.thresholds.testCoverage.minFunctions &&
      totals.statements.pct >= this.thresholds.testCoverage.minStatements
    );
  }

  async analyzePerformance() {
    console.log('⚡ Analyzing Performance...');

    // Check Lighthouse results
    const lighthouseFile = 'test-results/lighthouse-report.json';
    if (fs.existsSync(lighthouseFile)) {
      const lighthouseData = JSON.parse(fs.readFileSync(lighthouseFile, 'utf8'));
      const performanceScore = lighthouseData.categories.performance.score * 100;

      this.results.performance = {
        passed: performanceScore >= this.thresholds.performance.minLighthouseScore,
        score: performanceScore,
        metrics: {
          lighthouse: performanceScore,
          firstContentfulPaint: lighthouseData.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: lighthouseData.audits['largest-contentful-paint'].numericValue,
          speedIndex: lighthouseData.audits['speed-index'].numericValue,
          cumulativeLayoutShift: lighthouseData.audits['cumulative-layout-shift'].numericValue
        }
      };
    }

    // Check load testing results
    const loadTestFile = 'test-results/load-test-results.json';
    if (fs.existsSync(loadTestFile)) {
      const loadTestData = JSON.parse(fs.readFileSync(loadTestFile, 'utf8'));
      
      if (!this.results.performance.metrics) {
        this.results.performance.metrics = {};
      }
      
      this.results.performance.metrics.loadTest = {
        averageResponseTime: loadTestData.aggregate.latency.mean,
        p95ResponseTime: loadTestData.aggregate.latency.p95,
        errorRate: loadTestData.aggregate.counters['errors.ratio'] || 0
      };

      // Update pass status based on load test
      const loadTestPassed = loadTestData.aggregate.latency.p95 <= this.thresholds.performance.maxResponseTime;
      this.results.performance.passed = this.results.performance.passed && loadTestPassed;
    }

    console.log(`Performance Score: ${this.results.performance.score}/100`);
    console.log(`Status: ${this.results.performance.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  }

  async analyzeSecurity() {
    console.log('🔒 Analyzing Security...');

    const securityFiles = [
      'test-results/security-report.json',
      'artifacts/security-results.json',
      'report_json.json' // OWASP ZAP output
    ];

    for (const file of securityFiles) {
      if (fs.existsSync(file)) {
        const securityData = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        let vulnerabilities = [];
        let totalIssues = 0;

        if (securityData.vulnerabilities) {
          // Custom security scanner format
          vulnerabilities = securityData.vulnerabilities;
          totalIssues = vulnerabilities.length;
        } else if (securityData.site) {
          // OWASP ZAP format
          vulnerabilities = securityData.site[0].alerts || [];
          totalIssues = vulnerabilities.length;
        }

        const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical' || v.riskdesc === 'High').length;
        const highVulns = vulnerabilities.filter(v => v.severity === 'high' || v.riskdesc === 'Medium').length;
        const mediumVulns = vulnerabilities.filter(v => v.severity === 'medium' || v.riskdesc === 'Low').length;

        this.results.security = {
          passed: this.evaluateSecurityResults(criticalVulns, highVulns, mediumVulns),
          issues: totalIssues,
          vulnerabilities: {
            critical: criticalVulns,
            high: highVulns,
            medium: mediumVulns,
            low: vulnerabilities.length - criticalVulns - highVulns - mediumVulns
          }
        };

        console.log(`Security Issues: ${totalIssues} (${criticalVulns} critical, ${highVulns} high)`);
        console.log(`Status: ${this.results.security.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
        return;
      }
    }

    console.log('⚠️ No security report found\n');
    this.results.security = { passed: true, issues: 0, vulnerabilities: {} };
  }

  evaluateSecurityResults(critical, high, medium) {
    return (
      critical <= this.thresholds.security.maxCriticalVulns &&
      high <= this.thresholds.security.maxHighVulns &&
      medium <= this.thresholds.security.maxMediumVulns
    );
  }

  async analyzeAccessibility() {
    console.log('♿ Analyzing Accessibility...');

    const accessibilityFiles = [
      'test-results/accessibility-audit.json',
      'artifacts/accessibility-results.json'
    ];

    for (const file of accessibilityFiles) {
      if (fs.existsSync(file)) {
        const accessibilityData = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        let totalViolations = 0;
        let score = 100;

        if (accessibilityData.summary) {
          totalViolations = accessibilityData.summary.totalViolations;
          score = accessibilityData.overallScore || 100 - (totalViolations * 5);
        } else if (accessibilityData.violations) {
          totalViolations = accessibilityData.violations.length;
          score = Math.max(0, 100 - (totalViolations * 5));
        }

        this.results.accessibility = {
          passed: totalViolations <= this.thresholds.accessibility.maxViolations && 
                  score >= this.thresholds.accessibility.minScore,
          score,
          violations: totalViolations
        };

        console.log(`Accessibility Score: ${score}/100`);
        console.log(`Violations: ${totalViolations}`);
        console.log(`Status: ${this.results.accessibility.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
        return;
      }
    }

    console.log('⚠️ No accessibility report found\n');
    this.results.accessibility = { passed: true, score: 100, violations: 0 };
  }

  async analyzeE2ETests() {
    console.log('🎭 Analyzing E2E Tests...');

    const e2eFiles = [
      'test-results/playwright-results.json',
      'artifacts/e2e-results.json'
    ];

    for (const file of e2eFiles) {
      if (fs.existsSync(file)) {
        const e2eData = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        const totalTests = e2eData.stats?.total || 0;
        const passedTests = e2eData.stats?.passed || 0;
        const failedTests = e2eData.stats?.failed || 0;
        const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        this.results.e2e = {
          passed: passRate >= this.thresholds.e2e.minPassRate,
          passRate,
          totalTests,
          failedTests
        };

        console.log(`E2E Tests: ${passedTests}/${totalTests} passed (${passRate.toFixed(1)}%)`);
        console.log(`Status: ${this.results.e2e.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
        return;
      }
    }

    console.log('⚠️ No E2E test results found\n');
    this.results.e2e = { passed: true, passRate: 100, totalTests: 0, failedTests: 0 };
  }

  calculateOverallScore() {
    const weights = {
      codeQuality: 0.2,
      testCoverage: 0.15,
      performance: 0.2,
      security: 0.25,
      accessibility: 0.1,
      e2e: 0.1
    };

    let weightedScore = 0;
    weightedScore += this.results.codeQuality.score * weights.codeQuality;
    weightedScore += this.results.testCoverage.percentage * weights.testCoverage;
    weightedScore += this.results.performance.score * weights.performance;
    weightedScore += (this.results.security.passed ? 100 : 0) * weights.security;
    weightedScore += this.results.accessibility.score * weights.accessibility;
    weightedScore += this.results.e2e.passRate * weights.e2e;

    this.results.overall.score = Math.round(weightedScore);
    this.results.overall.passed = this.isQualityGatePassing();
  }

  isQualityGatePassing() {
    // All critical gates must pass
    const criticalGates = [
      this.results.codeQuality.passed,
      this.results.testCoverage.passed,
      this.results.security.passed
    ];

    // At least 80% of all gates must pass
    const allGates = [
      ...criticalGates,
      this.results.performance.passed,
      this.results.accessibility.passed,
      this.results.e2e.passed
    ];

    const passedGates = allGates.filter(gate => gate).length;
    const passRate = passedGates / allGates.length;

    return criticalGates.every(gate => gate) && passRate >= 0.8;
  }

  generateReport() {
    console.log('📋 Generating Quality Gate Report...\n');

    const report = {
      ...this.results,
      thresholds: this.thresholds,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const reportDir = 'test-results';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportDir, 'quality-gate-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report
    this.generateHTMLReport(report);

    // Generate summary for PR comments
    const summary = {
      codeQuality: {
        passed: this.results.codeQuality.passed,
        score: this.results.codeQuality.score
      },
      coverage: {
        passed: this.results.testCoverage.passed,
        percentage: this.results.testCoverage.percentage
      },
      security: {
        passed: this.results.security.passed,
        issues: this.results.security.issues
      },
      performance: {
        passed: this.results.performance.passed,
        score: this.results.performance.score
      },
      accessibility: {
        passed: this.results.accessibility.passed,
        score: this.results.accessibility.score
      },
      overall: {
        passed: this.results.overall.passed,
        score: this.results.overall.score
      },
      reportUrl: `test-results/quality-gate-report.html`
    };

    fs.writeFileSync(
      path.join(reportDir, 'quality-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('📊 Quality Gate Summary:');
    console.log(`Overall Score: ${this.results.overall.score}/100`);
    console.log(`Status: ${this.results.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Report saved to: ${reportDir}/quality-gate-report.html\n`);
  }

  generateRecommendations() {
    const recommendations = [];

    if (!this.results.codeQuality.passed) {
      recommendations.push('Fix code quality issues identified by static analysis');
    }

    if (!this.results.testCoverage.passed) {
      recommendations.push(`Increase test coverage to at least ${this.thresholds.testCoverage.minLines}%`);
    }

    if (!this.results.performance.passed) {
      recommendations.push('Optimize application performance and loading times');
    }

    if (!this.results.security.passed) {
      recommendations.push('Address security vulnerabilities before deployment');
    }

    if (!this.results.accessibility.passed) {
      recommendations.push('Fix accessibility violations to meet WCAG standards');
    }

    if (!this.results.e2e.passed) {
      recommendations.push('Investigate and fix failing end-to-end tests');
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Gate Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .status { font-size: 1.5em; font-weight: bold; margin: 10px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: white; }
        .metric-title { font-weight: bold; margin-bottom: 10px; }
        .score { font-size: 2em; text-align: center; margin: 10px 0; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendations ul { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Quality Gate Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <div class="status ${report.overall.passed ? 'passed' : 'failed'}">
            Overall Status: ${report.overall.passed ? '✅ PASSED' : '❌ FAILED'}
        </div>
        <div class="score ${report.overall.passed ? 'passed' : 'failed'}">${report.overall.score}/100</div>
    </div>

    <div class="metrics">
        <div class="metric-card">
            <div class="metric-title">Code Quality</div>
            <div class="score ${report.codeQuality.passed ? 'passed' : 'failed'}">${report.codeQuality.score}/100</div>
            <p>Status: ${report.codeQuality.passed ? '✅ Passed' : '❌ Failed'}</p>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Test Coverage</div>
            <div class="score ${report.testCoverage.passed ? 'passed' : 'failed'}">${report.testCoverage.percentage}%</div>
            <p>Status: ${report.testCoverage.passed ? '✅ Passed' : '❌ Failed'}</p>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Performance</div>
            <div class="score ${report.performance.passed ? 'passed' : 'failed'}">${report.performance.score}/100</div>
            <p>Status: ${report.performance.passed ? '✅ Passed' : '❌ Failed'}</p>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Security</div>
            <div class="score ${report.security.passed ? 'passed' : 'failed'}">${report.security.issues} issues</div>
            <p>Status: ${report.security.passed ? '✅ Passed' : '❌ Failed'}</p>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Accessibility</div>
            <div class="score ${report.accessibility.passed ? 'passed' : 'failed'}">${report.accessibility.score}/100</div>
            <p>Status: ${report.accessibility.passed ? '✅ Passed' : '❌ Failed'}</p>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">E2E Tests</div>
            <div class="score ${report.e2e.passed ? 'passed' : 'failed'}">${report.e2e.passRate.toFixed(1)}%</div>
            <p>Status: ${report.e2e.passed ? '✅ Passed' : '❌ Failed'}</p>
        </div>
    </div>

    ${report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h3>📝 Recommendations</h3>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <h3>📊 Detailed Metrics</h3>
    <table>
        <tr><th>Category</th><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
        <tr><td>Code Quality</td><td>Score</td><td>${report.codeQuality.score}</td><td>≥${report.thresholds.codeQuality.minScore}</td><td>${report.codeQuality.passed ? '✅' : '❌'}</td></tr>
        <tr><td>Test Coverage</td><td>Lines</td><td>${report.testCoverage.percentage}%</td><td>≥${report.thresholds.testCoverage.minLines}%</td><td>${report.testCoverage.passed ? '✅' : '❌'}</td></tr>
        <tr><td>Performance</td><td>Score</td><td>${report.performance.score}</td><td>≥${report.thresholds.performance.minLighthouseScore}</td><td>${report.performance.passed ? '✅' : '❌'}</td></tr>
        <tr><td>Security</td><td>Critical Issues</td><td>${report.security.vulnerabilities?.critical || 0}</td><td>≤${report.thresholds.security.maxCriticalVulns}</td><td>${report.security.passed ? '✅' : '❌'}</td></tr>
        <tr><td>Accessibility</td><td>Score</td><td>${report.accessibility.score}</td><td>≥${report.thresholds.accessibility.minScore}</td><td>${report.accessibility.passed ? '✅' : '❌'}</td></tr>
        <tr><td>E2E Tests</td><td>Pass Rate</td><td>${report.e2e.passRate.toFixed(1)}%</td><td>≥${report.thresholds.e2e.minPassRate}%</td><td>${report.e2e.passed ? '✅' : '❌'}</td></tr>
    </table>
</body>
</html>`;

    fs.writeFileSync('test-results/quality-gate-report.html', html);
  }

  createQualityGateDecision() {
    if (this.results.overall.passed) {
      console.log('✅ Quality Gate PASSED - Deployment approved');
      fs.writeFileSync('test-results/quality-gate-passed.flag', '');
    } else {
      console.log('❌ Quality Gate FAILED - Blocking deployment');
      fs.writeFileSync('test-results/quality-gate-failed.flag', '');
      
      // Set exit code for CI/CD
      if (process.env.CI) {
        process.exitCode = 1;
      }
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const qualityGate = new QualityGate();
  qualityGate.analyzeQualityGate().catch(console.error);
}

export default QualityGate;