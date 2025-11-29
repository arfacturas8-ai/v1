#!/usr/bin/env node

/**
 * Comprehensive Test Coverage Reporter
 * Aggregates coverage from all apps and generates unified reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CoverageReporter {
  constructor() {
    this.rootDir = process.cwd();
    this.appsDir = path.join(this.rootDir, 'apps');
    this.coverageDir = path.join(this.rootDir, 'coverage');
    this.apps = ['api', 'web', 'mobile', 'admin'];
    
    // Coverage thresholds
    this.thresholds = {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      },
      critical: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90
      }
    };

    // Critical files that need higher coverage
    this.criticalPaths = [
      'src/services/auth.ts',
      'src/middleware/auth.ts',
      'src/routes/auth.ts',
      'src/socket/index.ts',
      'components/auth/',
      'src/services/security.ts',
      'middleware/security-headers.ts'
    ];
  }

  async generateCoverageReports() {
    console.log('🔍 Generating comprehensive coverage reports...\n');

    // Ensure coverage directory exists
    this.ensureDirectoryExists(this.coverageDir);

    // Generate coverage for each app
    const coverageResults = {};
    
    for (const app of this.apps) {
      console.log(`📊 Generating coverage for ${app}...`);
      const appCoverage = await this.generateAppCoverage(app);
      coverageResults[app] = appCoverage;
    }

    // Generate unified reports
    const unifiedCoverage = await this.generateUnifiedCoverage(coverageResults);
    
    // Generate detailed reports
    await this.generateDetailedReports(coverageResults, unifiedCoverage);
    
    // Check thresholds
    const thresholdResults = this.checkThresholds(unifiedCoverage);
    
    // Generate final report
    await this.generateFinalReport(coverageResults, unifiedCoverage, thresholdResults);

    return {
      success: thresholdResults.passed,
      coverage: unifiedCoverage,
      apps: coverageResults,
      thresholds: thresholdResults
    };
  }

  async generateAppCoverage(appName) {
    const appDir = path.join(this.appsDir, appName);
    
    if (!fs.existsSync(appDir)) {
      console.log(`⚠️  App ${appName} directory not found, skipping...`);
      return null;
    }

    const coverageFile = path.join(appDir, 'coverage', 'coverage-summary.json');
    
    try {
      // Run tests with coverage for this app
      console.log(`  Running tests for ${appName}...`);
      execSync(`cd ${appDir} && npm run test:coverage`, { 
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });

      // Read coverage results
      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        console.log(`  ✅ Coverage generated for ${appName}`);
        return {
          app: appName,
          coverage: coverage.total,
          detailed: coverage,
          timestamp: new Date().toISOString(),
          success: true
        };
      } else {
        console.log(`  ⚠️  No coverage file found for ${appName}`);
        return {
          app: appName,
          coverage: null,
          error: 'No coverage file generated',
          timestamp: new Date().toISOString(),
          success: false
        };
      }
    } catch (error) {
      console.log(`  ❌ Error generating coverage for ${appName}: ${error.message}`);
      return {
        app: appName,
        coverage: null,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };
    }
  }

  generateUnifiedCoverage(appResults) {
    console.log('\n🔄 Calculating unified coverage metrics...');
    
    const totalStats = {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 }
    };

    const validApps = Object.values(appResults).filter(result => 
      result && result.success && result.coverage
    );

    if (validApps.length === 0) {
      console.log('⚠️  No valid coverage data found for any app');
      return totalStats;
    }

    // Aggregate metrics
    for (const appResult of validApps) {
      const { coverage } = appResult;
      
      Object.keys(totalStats).forEach(metric => {
        if (coverage[metric]) {
          totalStats[metric].total += coverage[metric].total || 0;
          totalStats[metric].covered += coverage[metric].covered || 0;
          totalStats[metric].skipped += coverage[metric].skipped || 0;
        }
      });
    }

    // Calculate percentages
    Object.keys(totalStats).forEach(metric => {
      const stat = totalStats[metric];
      if (stat.total > 0) {
        stat.pct = parseFloat(((stat.covered / stat.total) * 100).toFixed(2));
      }
    });

    console.log('✅ Unified coverage calculated');
    return totalStats;
  }

  checkThresholds(coverage) {
    console.log('\n🎯 Checking coverage thresholds...');
    
    const results = {
      passed: true,
      failures: [],
      warnings: [],
      details: {}
    };

    Object.keys(this.thresholds.global).forEach(metric => {
      const threshold = this.thresholds.global[metric];
      const actual = coverage[metric]?.pct || 0;
      
      results.details[metric] = {
        threshold,
        actual,
        passed: actual >= threshold,
        difference: actual - threshold
      };

      if (actual < threshold) {
        results.passed = false;
        results.failures.push({
          metric,
          threshold,
          actual,
          shortfall: threshold - actual
        });
        console.log(`  ❌ ${metric}: ${actual}% (required: ${threshold}%)`);
      } else {
        console.log(`  ✅ ${metric}: ${actual}% (required: ${threshold}%)`);
      }
    });

    if (results.passed) {
      console.log('🎉 All coverage thresholds passed!');
    } else {
      console.log(`💥 ${results.failures.length} coverage thresholds failed`);
    }

    return results;
  }

  async generateDetailedReports(appResults, unifiedCoverage) {
    console.log('\n📋 Generating detailed reports...');

    // HTML Report
    const htmlReport = this.generateHTMLReport(appResults, unifiedCoverage);
    fs.writeFileSync(
      path.join(this.coverageDir, 'coverage-report.html'),
      htmlReport
    );

    // JSON Report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      unified: unifiedCoverage,
      apps: appResults,
      thresholds: this.thresholds
    };
    fs.writeFileSync(
      path.join(this.coverageDir, 'coverage-report.json'),
      JSON.stringify(jsonReport, null, 2)
    );

    // Markdown Report
    const markdownReport = this.generateMarkdownReport(appResults, unifiedCoverage);
    fs.writeFileSync(
      path.join(this.coverageDir, 'coverage-report.md'),
      markdownReport
    );

    console.log('✅ Detailed reports generated');
  }

  generateHTMLReport(appResults, unifiedCoverage) {
    const timestamp = new Date().toISOString();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRYB Platform - Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .passed { color: #059669; }
        .failed { color: #dc2626; }
        .warning { color: #d97706; }
        .app-section { margin: 20px 0; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .progress-bar { width: 100%; height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 CRYB Platform - Test Coverage Report</h1>
        <p>Generated: ${timestamp}</p>
    </div>

    <div class="summary">
        ${Object.keys(unifiedCoverage).map(metric => `
        <div class="metric-card">
            <h3>${metric.charAt(0).toUpperCase() + metric.slice(1)}</h3>
            <div class="metric-value ${unifiedCoverage[metric].pct >= this.thresholds.global[metric] ? 'passed' : 'failed'}">
                ${unifiedCoverage[metric].pct}%
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${unifiedCoverage[metric].pct}%; background: ${unifiedCoverage[metric].pct >= this.thresholds.global[metric] ? '#059669' : '#dc2626'};"></div>
            </div>
            <small>${unifiedCoverage[metric].covered}/${unifiedCoverage[metric].total}</small>
        </div>
        `).join('')}
    </div>

    <h2>📱 App-by-App Coverage</h2>
    ${Object.values(appResults).filter(app => app && app.success).map(app => `
    <div class="app-section">
        <h3>🎯 ${app.app.toUpperCase()}</h3>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Coverage</th>
                    <th>Covered/Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(app.coverage).map(metric => `
                <tr>
                    <td>${metric.charAt(0).toUpperCase() + metric.slice(1)}</td>
                    <td>${app.coverage[metric].pct}%</td>
                    <td>${app.coverage[metric].covered}/${app.coverage[metric].total}</td>
                    <td class="${app.coverage[metric].pct >= this.thresholds.global[metric] ? 'passed' : 'failed'}">
                        ${app.coverage[metric].pct >= this.thresholds.global[metric] ? '✅ Pass' : '❌ Fail'}
                    </td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    `).join('')}

    <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h3>🎯 Coverage Thresholds</h3>
        <ul>
            ${Object.keys(this.thresholds.global).map(metric => 
                `<li>${metric}: ${this.thresholds.global[metric]}%</li>`
            ).join('')}
        </ul>
    </div>
</body>
</html>
    `;
  }

  generateMarkdownReport(appResults, unifiedCoverage) {
    const timestamp = new Date().toISOString();
    
    return `# 🧪 CRYB Platform - Test Coverage Report

**Generated:** ${timestamp}

## 📊 Overall Coverage Summary

| Metric | Coverage | Covered/Total | Status |
|--------|----------|---------------|--------|
${Object.keys(unifiedCoverage).map(metric => {
  const coverage = unifiedCoverage[metric];
  const status = coverage.pct >= this.thresholds.global[metric] ? '✅ Pass' : '❌ Fail';
  return `| ${metric.charAt(0).toUpperCase() + metric.slice(1)} | ${coverage.pct}% | ${coverage.covered}/${coverage.total} | ${status} |`;
}).join('\n')}

## 📱 App Coverage Details

${Object.values(appResults).filter(app => app && app.success).map(app => `
### 🎯 ${app.app.toUpperCase()}

| Metric | Coverage | Covered/Total | Status |
|--------|----------|---------------|--------|
${Object.keys(app.coverage).map(metric => {
  const coverage = app.coverage[metric];
  const status = coverage.pct >= this.thresholds.global[metric] ? '✅ Pass' : '❌ Fail';
  return `| ${metric.charAt(0).toUpperCase() + metric.slice(1)} | ${coverage.pct}% | ${coverage.covered}/${coverage.total} | ${status} |`;
}).join('\n')}
`).join('')}

## 🎯 Coverage Thresholds

${Object.keys(this.thresholds.global).map(metric => 
  `- **${metric}:** ${this.thresholds.global[metric]}%`
).join('\n')}

## 📋 Recommendations

${this.generateRecommendations(appResults, unifiedCoverage)}
`;
  }

  generateRecommendations(appResults, unifiedCoverage) {
    const recommendations = [];

    // Check overall coverage
    Object.keys(unifiedCoverage).forEach(metric => {
      const coverage = unifiedCoverage[metric];
      if (coverage.pct < this.thresholds.global[metric]) {
        recommendations.push(`- **${metric}:** Increase coverage from ${coverage.pct}% to ${this.thresholds.global[metric]}% (${(this.thresholds.global[metric] - coverage.pct).toFixed(1)}% improvement needed)`);
      }
    });

    // Check app-specific issues
    Object.values(appResults).forEach(app => {
      if (app && app.success) {
        Object.keys(app.coverage).forEach(metric => {
          const coverage = app.coverage[metric];
          if (coverage.pct < this.thresholds.global[metric]) {
            recommendations.push(`- **${app.app} ${metric}:** Focus on improving ${metric} coverage in the ${app.app} app`);
          }
        });
      }
    });

    // Critical path recommendations
    recommendations.push('- **Critical Paths:** Ensure authentication, security, and socket communication have >90% coverage');
    recommendations.push('- **Integration Tests:** Add more integration tests for cross-component interactions');
    recommendations.push('- **E2E Coverage:** Verify E2E tests cover all critical user workflows');

    return recommendations.length > 0 ? recommendations.join('\n') : '🎉 All coverage targets met! Consider increasing thresholds for even better quality.';
  }

  async generateFinalReport(appResults, unifiedCoverage, thresholdResults) {
    const finalReport = {
      success: thresholdResults.passed,
      timestamp: new Date().toISOString(),
      summary: {
        totalApps: this.apps.length,
        successfulApps: Object.values(appResults).filter(app => app && app.success).length,
        failedApps: Object.values(appResults).filter(app => app && !app.success).length,
        overallCoverage: unifiedCoverage,
        thresholdsPassed: thresholdResults.passed,
        failures: thresholdResults.failures
      },
      details: {
        apps: appResults,
        thresholds: thresholdResults,
        recommendations: this.generateRecommendations(appResults, unifiedCoverage)
      }
    };

    fs.writeFileSync(
      path.join(this.coverageDir, 'final-coverage-report.json'),
      JSON.stringify(finalReport, null, 2)
    );

    console.log('\n📊 Coverage Report Summary:');
    console.log(`   Apps Tested: ${finalReport.summary.successfulApps}/${finalReport.summary.totalApps}`);
    console.log(`   Overall Lines: ${unifiedCoverage.lines.pct}%`);
    console.log(`   Overall Functions: ${unifiedCoverage.functions.pct}%`);
    console.log(`   Overall Branches: ${unifiedCoverage.branches.pct}%`);
    console.log(`   Overall Statements: ${unifiedCoverage.statements.pct}%`);
    console.log(`   Thresholds: ${thresholdResults.passed ? '✅ PASSED' : '❌ FAILED'}`);

    if (!thresholdResults.passed) {
      console.log('\n💥 Coverage Failures:');
      thresholdResults.failures.forEach(failure => {
        console.log(`   ${failure.metric}: ${failure.actual}% (need ${failure.threshold}%)`);
      });
    }

    return finalReport;
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// CLI execution
if (require.main === module) {
  const reporter = new CoverageReporter();
  
  reporter.generateCoverageReports()
    .then(result => {
      console.log('\n🎉 Coverage reporting completed!');
      console.log(`📁 Reports saved to: ${reporter.coverageDir}`);
      
      if (!result.success) {
        console.log('\n💥 Coverage thresholds not met - see reports for details');
        process.exit(1);
      }
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Coverage reporting failed:', error);
      process.exit(1);
    });
}

module.exports = CoverageReporter;