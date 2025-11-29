#!/usr/bin/env node

/**
 * Coverage Validation Script
 * Validates test coverage meets minimum thresholds for CI/CD
 */

const fs = require('fs');
const path = require('path');

class CoverageValidator {
  constructor() {
    this.rootDir = process.cwd();
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
    
    this.criticalPaths = [
      'auth', 'security', 'payment', 'socket', 'crypto'
    ];
  }

  async validateCoverage() {
    console.log('🔍 Validating test coverage...\n');

    const reportPath = path.join(this.rootDir, 'coverage', 'final-coverage-report.json');
    
    if (!fs.existsSync(reportPath)) {
      console.error('❌ Coverage report not found. Run tests with coverage first.');
      console.error(`   Expected: ${reportPath}`);
      return false;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    if (!report.success) {
      console.error('💥 Coverage validation failed based on previous report');
      this.printFailureDetails(report);
      return false;
    }

    // Additional validation
    const validationResults = this.performAdditionalValidation(report);
    
    if (validationResults.success) {
      console.log('🎉 All coverage thresholds passed!');
      this.printSuccessDetails(report);
      return true;
    } else {
      console.error('💥 Coverage validation failed');
      this.printFailureDetails(validationResults);
      return false;
    }
  }

  performAdditionalValidation(report) {
    const results = {
      success: true,
      failures: [],
      warnings: []
    };

    const { overallCoverage } = report.summary;

    // Check global thresholds
    Object.keys(this.thresholds.global).forEach(metric => {
      const threshold = this.thresholds.global[metric];
      const actual = overallCoverage[metric]?.pct || 0;
      
      if (actual < threshold) {
        results.success = false;
        results.failures.push({
          type: 'global',
          metric,
          threshold,
          actual,
          shortfall: threshold - actual
        });
      }
    });

    // Check critical path coverage (if available)
    if (report.details && report.details.apps) {
      Object.values(report.details.apps).forEach(app => {
        if (app && app.success && app.detailed) {
          this.validateCriticalPaths(app, results);
        }
      });
    }

    // Check for apps with failed coverage
    if (report.summary.failedApps > 0) {
      results.warnings.push(`${report.summary.failedApps} apps failed to generate coverage`);
    }

    return results;
  }

  validateCriticalPaths(app, results) {
    // This would need to be enhanced based on actual coverage data structure
    // For now, we'll just check if any critical keywords are in the file paths
    const appName = app.app;
    
    if (app.coverage) {
      Object.keys(this.thresholds.global).forEach(metric => {
        const coverage = app.coverage[metric];
        if (coverage && coverage.pct < this.thresholds.global[metric]) {
          // Check if this is a critical app (API, auth-related)
          if (appName === 'api' || appName === 'admin') {
            const criticalThreshold = this.thresholds.critical[metric];
            if (coverage.pct < criticalThreshold) {
              results.failures.push({
                type: 'critical',
                app: appName,
                metric,
                threshold: criticalThreshold,
                actual: coverage.pct,
                shortfall: criticalThreshold - coverage.pct
              });
            }
          }
        }
      });
    }
  }

  printSuccessDetails(report) {
    const { overallCoverage, totalApps, successfulApps } = report.summary;
    
    console.log('\n📊 Coverage Summary:');
    console.log(`   ✅ Apps tested: ${successfulApps}/${totalApps}`);
    console.log(`   ✅ Lines: ${overallCoverage.lines.pct}% (${overallCoverage.lines.covered}/${overallCoverage.lines.total})`);
    console.log(`   ✅ Functions: ${overallCoverage.functions.pct}% (${overallCoverage.functions.covered}/${overallCoverage.functions.total})`);
    console.log(`   ✅ Branches: ${overallCoverage.branches.pct}% (${overallCoverage.branches.covered}/${overallCoverage.branches.total})`);
    console.log(`   ✅ Statements: ${overallCoverage.statements.pct}% (${overallCoverage.statements.covered}/${overallCoverage.statements.total})`);
    
    console.log('\n🎯 All thresholds met:');
    Object.keys(this.thresholds.global).forEach(metric => {
      const threshold = this.thresholds.global[metric];
      const actual = overallCoverage[metric]?.pct || 0;
      const buffer = (actual - threshold).toFixed(1);
      console.log(`   ${metric}: ${actual}% (${buffer}% above threshold)`);
    });
  }

  printFailureDetails(results) {
    if (results.summary && results.summary.failures) {
      console.log('\n💥 Coverage Failures:');
      results.summary.failures.forEach(failure => {
        console.log(`   ❌ ${failure.metric}: ${failure.actual}% (need ${failure.threshold}%, shortfall: ${failure.shortfall.toFixed(1)}%)`);
      });
    }

    if (results.failures) {
      console.log('\n💥 Validation Failures:');
      results.failures.forEach(failure => {
        if (failure.type === 'global') {
          console.log(`   ❌ Global ${failure.metric}: ${failure.actual}% (need ${failure.threshold}%)`);
        } else if (failure.type === 'critical') {
          console.log(`   ❌ Critical ${failure.app} ${failure.metric}: ${failure.actual}% (need ${failure.threshold}%)`);
        }
      });
    }

    if (results.warnings && results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      results.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }

    console.log('\n🔧 Recommendations:');
    console.log('   1. Add more unit tests for uncovered functions');
    console.log('   2. Add integration tests for component interactions');
    console.log('   3. Focus on critical paths: authentication, security, payments');
    console.log('   4. Add E2E tests for user workflows');
    console.log('   5. Review and test error handling paths');
  }

  generateCIReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      message: 'Coverage validation not run',
      details: {}
    };

    try {
      const success = this.validateCoverage();
      report.status = success ? 'passed' : 'failed';
      report.message = success ? 'All coverage thresholds met' : 'Coverage thresholds not met';
      
      // Add coverage data if available
      const reportPath = path.join(this.rootDir, 'coverage', 'final-coverage-report.json');
      if (fs.existsSync(reportPath)) {
        const coverageReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        report.details = coverageReport.summary;
      }
    } catch (error) {
      report.status = 'error';
      report.message = `Coverage validation error: ${error.message}`;
      report.error = error.message;
    }

    // Write CI report
    const ciReportPath = path.join(this.rootDir, 'coverage', 'ci-coverage-report.json');
    fs.writeFileSync(ciReportPath, JSON.stringify(report, null, 2));
    
    return report;
  }
}

// CLI execution
if (require.main === module) {
  const validator = new CoverageValidator();
  
  const args = process.argv.slice(2);
  const ciMode = args.includes('--ci');
  
  if (ciMode) {
    const report = validator.generateCIReport();
    console.log(`CI Report: ${report.status.toUpperCase()}`);
    console.log(`Message: ${report.message}`);
    process.exit(report.status === 'passed' ? 0 : 1);
  } else {
    validator.validateCoverage()
      .then(success => {
        process.exit(success ? 0 : 1);
      })
      .catch(error => {
        console.error('❌ Validation error:', error);
        process.exit(1);
      });
  }
}

module.exports = CoverageValidator;