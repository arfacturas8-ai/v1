#!/usr/bin/env node

/**
 * Comprehensive Load Test Execution Script
 * 
 * This script orchestrates all load tests and generates comprehensive reports
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const PerformanceMonitor = require('./performance-monitor');

class LoadTestOrchestrator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './load-test-results',
      concurrency: options.concurrency || false,
      performanceMonitoring: options.performanceMonitoring !== false,
      generateReport: options.generateReport !== false,
      cleanup: options.cleanup !== false,
      ...options
    };
    
    this.testSuites = [
      {
        name: 'Production Load Test',
        file: 'production-load-test.yml',
        description: 'Comprehensive production simulation covering all features',
        priority: 1,
        estimatedDuration: '25 minutes'
      },
      {
        name: 'Authentication Load Test',
        file: 'auth-endpoints-load-test.yml',
        description: 'Authentication system stress testing',
        priority: 2,
        estimatedDuration: '15 minutes'
      },
      {
        name: 'Discord Features Load Test',
        file: 'discord-features-load-test.yml',
        description: 'Discord-like features testing (servers, channels, messaging)',
        priority: 3,
        estimatedDuration: '20 minutes'
      },
      {
        name: 'Reddit Features Load Test',
        file: 'reddit-features-load-test.yml',
        description: 'Reddit-like features testing (communities, posts, voting)',
        priority: 4,
        estimatedDuration: '18 minutes'
      },
      {
        name: 'WebSocket Real-time Load Test',
        file: 'websocket-realtime-load-test.yml',
        description: 'Real-time messaging and WebSocket connections',
        priority: 5,
        estimatedDuration: '12 minutes'
      }
    ];
    
    this.results = {
      startTime: null,
      endTime: null,
      duration: null,
      testResults: [],
      performanceData: null,
      summary: {},
      recommendations: []
    };
    
    this.performanceMonitor = null;
  }

  /**
   * Run all load tests
   */
  async runAll() {
    console.log('🚀 Starting Comprehensive Load Test Suite');
    console.log('=' .repeat(60));
    
    this.results.startTime = Date.now();
    
    try {
      // Setup
      await this.setup();
      
      // Start performance monitoring
      if (this.options.performanceMonitoring) {
        await this.startPerformanceMonitoring();
      }
      
      // Run tests
      if (this.options.concurrency) {
        await this.runTestsConcurrently();
      } else {
        await this.runTestsSequentially();
      }
      
      // Stop performance monitoring
      if (this.performanceMonitor) {
        await this.stopPerformanceMonitoring();
      }
      
      // Generate reports
      if (this.options.generateReport) {
        await this.generateComprehensiveReport();
      }
      
      // Cleanup
      if (this.options.cleanup) {
        await this.cleanup();
      }
      
    } catch (error) {
      console.error('❌ Load test execution failed:', error);
      process.exit(1);
    } finally {
      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      console.log('✅ Load test suite completed');
      console.log(`Total duration: ${Math.round(this.results.duration / 1000)} seconds`);
    }
  }

  /**
   * Run specific test suite
   */
  async runTest(testName) {
    const testSuite = this.testSuites.find(t => 
      t.name.toLowerCase().includes(testName.toLowerCase()) || 
      t.file.includes(testName)
    );
    
    if (!testSuite) {
      console.error(`❌ Test suite '${testName}' not found`);
      return;
    }
    
    console.log(`🚀 Running single test: ${testSuite.name}`);
    
    this.results.startTime = Date.now();
    
    try {
      await this.setup();
      
      if (this.options.performanceMonitoring) {
        await this.startPerformanceMonitoring();
      }
      
      const result = await this.executeLoadTest(testSuite);
      this.results.testResults.push(result);
      
      if (this.performanceMonitor) {
        await this.stopPerformanceMonitoring();
      }
      
      if (this.options.generateReport) {
        await this.generateComprehensiveReport();
      }
      
    } catch (error) {
      console.error(`❌ Test '${testSuite.name}' failed:`, error);
    } finally {
      this.results.endTime = Date.now();
      this.results.duration = this.results.endTime - this.results.startTime;
      
      console.log(`✅ Test '${testSuite.name}' completed in ${Math.round(this.results.duration / 1000)} seconds`);
    }
  }

  /**
   * List available test suites
   */
  listTests() {
    console.log('Available Load Test Suites:');
    console.log('=' .repeat(40));
    
    this.testSuites.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}`);
      console.log(`   File: ${test.file}`);
      console.log(`   Description: ${test.description}`);
      console.log(`   Estimated Duration: ${test.estimatedDuration}`);
      console.log('');
    });
  }

  /**
   * Setup test environment
   */
  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Create output directory
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
    
    // Verify Artillery is available
    try {
      await execAsync('which artillery');
      console.log('✅ Artillery found');
    } catch (error) {
      console.log('📦 Installing Artillery...');
      try {
        await execAsync('npm install -g artillery@latest');
        console.log('✅ Artillery installed');
      } catch (installError) {
        throw new Error('Failed to install Artillery: ' + installError.message);
      }
    }
    
    // Verify API is running
    const apiHealthy = await this.checkAPIHealth();
    if (!apiHealthy) {
      console.warn('⚠️ API health check failed - tests may fail');
    } else {
      console.log('✅ API is healthy');
    }
    
    console.log('✅ Setup completed');
  }

  /**
   * Check API health
   */
  async checkAPIHealth() {
    try {
      const response = await fetch('http://localhost:3002/api/v1/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start performance monitoring
   */
  async startPerformanceMonitoring() {
    console.log('📊 Starting performance monitoring...');
    
    this.performanceMonitor = new PerformanceMonitor({
      interval: 5000,
      outputDir: this.options.outputDir,
      thresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        responseTime: 2000,
        errorRate: 5
      }
    });
    
    await this.performanceMonitor.start();
    console.log('✅ Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  async stopPerformanceMonitoring() {
    if (this.performanceMonitor) {
      console.log('📊 Stopping performance monitoring...');
      this.results.performanceData = await this.performanceMonitor.stop();
      console.log('✅ Performance monitoring stopped');
    }
  }

  /**
   * Run tests sequentially
   */
  async runTestsSequentially() {
    console.log('🔄 Running tests sequentially...');
    
    for (const testSuite of this.testSuites) {
      console.log(`\n🎯 Starting: ${testSuite.name}`);
      console.log(`   ${testSuite.description}`);
      console.log(`   Estimated duration: ${testSuite.estimatedDuration}`);
      
      const result = await this.executeLoadTest(testSuite);
      this.results.testResults.push(result);
      
      if (result.success) {
        console.log(`✅ ${testSuite.name} completed successfully`);
      } else {
        console.log(`❌ ${testSuite.name} failed or had issues`);
      }
      
      // Brief pause between tests
      await this.sleep(5000);
    }
  }

  /**
   * Run tests concurrently (use with caution)
   */
  async runTestsConcurrently() {
    console.log('⚡ Running tests concurrently...');
    console.warn('⚠️ Concurrent execution may overwhelm the system');
    
    const testPromises = this.testSuites.map(testSuite => 
      this.executeLoadTest(testSuite)
    );
    
    const results = await Promise.allSettled(testPromises);
    
    results.forEach((result, index) => {
      const testSuite = this.testSuites[index];
      if (result.status === 'fulfilled') {
        this.results.testResults.push(result.value);
        console.log(`✅ ${testSuite.name} completed`);
      } else {
        console.log(`❌ ${testSuite.name} failed:`, result.reason);
      }
    });
  }

  /**
   * Execute individual load test
   */
  async executeLoadTest(testSuite) {
    const startTime = Date.now();
    const testFilePath = path.join(__dirname, testSuite.file);
    const outputFile = path.join(this.options.outputDir, `${testSuite.file.replace('.yml', '')}-results.json`);
    
    try {
      // Check if test file exists
      if (!fs.existsSync(testFilePath)) {
        throw new Error(`Test file not found: ${testFilePath}`);
      }
      
      // Run Artillery test
      const command = `artillery run "${testFilePath}" --output "${outputFile}"`;
      console.log(`   Command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: __dirname,
        timeout: 30 * 60 * 1000, // 30 minutes timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Parse Artillery results
      let artilleryResults = null;
      if (fs.existsSync(outputFile)) {
        try {
          artilleryResults = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        } catch (parseError) {
          console.warn('⚠️ Failed to parse Artillery results:', parseError.message);
        }
      }
      
      // Analyze results
      const analysis = this.analyzeTestResults(artilleryResults);
      
      const result = {
        testSuite: testSuite.name,
        file: testSuite.file,
        startTime,
        endTime,
        duration,
        success: analysis.success,
        summary: analysis.summary,
        metrics: analysis.metrics,
        issues: analysis.issues,
        artilleryOutput: {
          stdout: stdout.substring(0, 5000), // Limit output size
          stderr: stderr.substring(0, 2000)
        },
        rawResults: artilleryResults
      };
      
      console.log(`   Duration: ${Math.round(duration / 1000)} seconds`);
      console.log(`   Requests: ${analysis.summary.requestCount || 'N/A'}`);
      console.log(`   Success Rate: ${analysis.summary.successRate || 'N/A'}%`);
      console.log(`   Avg Response Time: ${analysis.summary.avgResponseTime || 'N/A'}ms`);
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        testSuite: testSuite.name,
        file: testSuite.file,
        startTime,
        endTime,
        duration,
        success: false,
        error: error.message,
        issues: [`Test execution failed: ${error.message}`]
      };
    }
  }

  /**
   * Analyze test results
   */
  analyzeTestResults(artilleryResults) {
    if (!artilleryResults) {
      return {
        success: false,
        summary: {},
        metrics: {},
        issues: ['No Artillery results available']
      };
    }
    
    const aggregate = artilleryResults.aggregate || {};
    const intermediate = artilleryResults.intermediate || [];
    
    // Calculate summary metrics
    const requestCount = aggregate.requestsCompleted || 0;
    const errorCount = Object.values(aggregate.errors || {}).reduce((a, b) => a + b, 0);
    const successRate = requestCount > 0 ? ((requestCount - errorCount) / requestCount) * 100 : 0;
    
    const responseTime = aggregate.latency || {};
    const avgResponseTime = responseTime.mean || 0;
    const p95ResponseTime = responseTime.p95 || 0;
    const p99ResponseTime = responseTime.p99 || 0;
    
    // Identify issues
    const issues = [];
    
    if (successRate < 95) {
      issues.push(`Low success rate: ${successRate.toFixed(1)}%`);
    }
    
    if (avgResponseTime > 2000) {
      issues.push(`High average response time: ${avgResponseTime}ms`);
    }
    
    if (p95ResponseTime > 5000) {
      issues.push(`High 95th percentile response time: ${p95ResponseTime}ms`);
    }
    
    if (errorCount > 0) {
      issues.push(`${errorCount} requests resulted in errors`);
    }
    
    // Determine overall success
    const success = issues.length === 0 || (successRate > 90 && avgResponseTime < 5000);
    
    return {
      success,
      summary: {
        requestCount,
        errorCount,
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        p95ResponseTime: Math.round(p95ResponseTime),
        p99ResponseTime: Math.round(p99ResponseTime)
      },
      metrics: {
        latency: responseTime,
        codes: aggregate.codes || {},
        errors: aggregate.errors || {},
        scenariosCompleted: aggregate.scenariosCompleted || 0,
        scenariosCreated: aggregate.scenariosCreated || 0
      },
      issues
    };
  }

  /**
   * Generate comprehensive report
   */
  async generateComprehensiveReport() {
    console.log('📝 Generating comprehensive report...');
    
    const reportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: this.results.duration,
        testsRun: this.results.testResults.length,
        version: '1.0.0'
      },
      summary: this.generateExecutionSummary(),
      testResults: this.results.testResults,
      performanceData: this.results.performanceData,
      analysis: this.generateOverallAnalysis(),
      recommendations: this.generateRecommendations(),
      conclusions: this.generateConclusions()
    };
    
    // Write JSON report
    const jsonReportPath = path.join(this.options.outputDir, `comprehensive-load-test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Write HTML report
    const htmlReportPath = path.join(this.options.outputDir, `load-test-report-${Date.now()}.html`);
    const htmlContent = this.generateHTMLReport(reportData);
    fs.writeFileSync(htmlReportPath, htmlContent);
    
    // Write executive summary
    const summaryPath = path.join(this.options.outputDir, `executive-summary-${Date.now()}.txt`);
    const summaryContent = this.generateExecutiveSummary(reportData);
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log('📊 Reports generated:');
    console.log(`   JSON Report: ${jsonReportPath}`);
    console.log(`   HTML Report: ${htmlReportPath}`);
    console.log(`   Executive Summary: ${summaryPath}`);
    
    // Display key findings
    this.displayKeyFindings(reportData);
  }

  /**
   * Generate execution summary
   */
  generateExecutionSummary() {
    const successfulTests = this.results.testResults.filter(r => r.success).length;
    const failedTests = this.results.testResults.length - successfulTests;
    
    const totalRequests = this.results.testResults.reduce((sum, r) => 
      sum + (r.summary?.requestCount || 0), 0
    );
    
    const totalErrors = this.results.testResults.reduce((sum, r) => 
      sum + (r.summary?.errorCount || 0), 0
    );
    
    const overallSuccessRate = totalRequests > 0 ? 
      ((totalRequests - totalErrors) / totalRequests) * 100 : 0;
    
    const avgResponseTime = this.calculateWeightedAverage(
      this.results.testResults.map(r => ({
        value: r.summary?.avgResponseTime || 0,
        weight: r.summary?.requestCount || 1
      }))
    );
    
    return {
      testsRun: this.results.testResults.length,
      successfulTests,
      failedTests,
      overallSuccessRate: Math.round(overallSuccessRate * 100) / 100,
      totalRequests,
      totalErrors,
      avgResponseTime: Math.round(avgResponseTime),
      duration: Math.round(this.results.duration / 1000) // seconds
    };
  }

  /**
   * Generate overall analysis
   */
  generateOverallAnalysis() {
    const analysis = {
      systemStability: 'good',
      performanceLevel: 'good',
      scalabilityRating: 'good',
      keyFindings: [],
      concernAreas: []
    };
    
    const summary = this.generateExecutionSummary();
    
    // System stability analysis
    if (summary.failedTests > 1 || summary.overallSuccessRate < 95) {
      analysis.systemStability = 'poor';
      analysis.concernAreas.push('System reliability under load');
    } else if (summary.overallSuccessRate < 98) {
      analysis.systemStability = 'fair';
    }
    
    // Performance analysis
    if (summary.avgResponseTime > 2000) {
      analysis.performanceLevel = 'poor';
      analysis.concernAreas.push('High response times');
    } else if (summary.avgResponseTime > 1000) {
      analysis.performanceLevel = 'fair';
    }
    
    // Key findings
    if (summary.totalRequests > 10000) {
      analysis.keyFindings.push(`Successfully processed ${summary.totalRequests.toLocaleString()} requests`);
    }
    
    if (summary.overallSuccessRate > 99) {
      analysis.keyFindings.push('Excellent request success rate');
    }
    
    if (this.results.performanceData && this.results.performanceData.analysis) {
      if (this.results.performanceData.analysis.bottlenecks.length > 0) {
        analysis.concernAreas.push('Performance bottlenecks detected');
      }
    }
    
    return analysis;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.generateExecutionSummary();
    
    // Performance recommendations
    if (summary.avgResponseTime > 1000) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        recommendation: 'Optimize API response times through caching, database indexing, or query optimization'
      });
    }
    
    if (summary.overallSuccessRate < 98) {
      recommendations.push({
        category: 'Reliability',
        priority: 'High',
        recommendation: 'Investigate and fix causes of request failures to improve system reliability'
      });
    }
    
    // Scalability recommendations
    if (summary.totalRequests > 50000) {
      recommendations.push({
        category: 'Scalability',
        priority: 'Medium',
        recommendation: 'Consider implementing horizontal scaling or load balancing for production traffic'
      });
    }
    
    // Infrastructure recommendations
    if (this.results.performanceData && this.results.performanceData.recommendations) {
      this.results.performanceData.recommendations.forEach(rec => {
        recommendations.push({
          category: `Infrastructure - ${rec.category}`,
          priority: rec.priority,
          recommendation: rec.recommendation
        });
      });
    }
    
    // Monitoring recommendations
    recommendations.push({
      category: 'Monitoring',
      priority: 'Medium',
      recommendation: 'Implement production monitoring for response times, error rates, and resource usage'
    });
    
    return recommendations;
  }

  /**
   * Generate conclusions
   */
  generateConclusions() {
    const summary = this.generateExecutionSummary();
    const analysis = this.generateOverallAnalysis();
    
    let overallAssessment;
    let readiness;
    
    if (summary.overallSuccessRate > 98 && summary.avgResponseTime < 1000 && summary.failedTests === 0) {
      overallAssessment = 'Excellent';
      readiness = 'Ready for production with current load patterns';
    } else if (summary.overallSuccessRate > 95 && summary.avgResponseTime < 2000 && summary.failedTests <= 1) {
      overallAssessment = 'Good';
      readiness = 'Ready for production with minor optimizations recommended';
    } else if (summary.overallSuccessRate > 90 && summary.avgResponseTime < 5000) {
      overallAssessment = 'Fair';
      readiness = 'Requires optimization before production deployment';
    } else {
      overallAssessment = 'Poor';
      readiness = 'Not ready for production - significant issues need resolution';
    }
    
    return {
      overallAssessment,
      readiness,
      keyStrengths: analysis.keyFindings,
      majorConcerns: analysis.concernAreas,
      nextSteps: [
        'Review detailed test results and performance metrics',
        'Address high-priority recommendations',
        'Implement monitoring in production environment',
        'Schedule regular load testing as part of CI/CD pipeline'
      ]
    };
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(reportData) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Load Test Results - ${reportData.metadata.timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 0.9em; color: #666; margin-top: 5px; }
        .test-results { margin: 30px 0; }
        .test-item { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 6px; }
        .test-success { border-left: 4px solid #28a745; }
        .test-failure { border-left: 4px solid #dc3545; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .recommendation-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .priority-high { border-left: 4px solid #dc3545; }
        .priority-medium { border-left: 4px solid #ffc107; }
        .priority-low { border-left: 4px solid #28a745; }
        .conclusions { background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Load Test Results Report</h1>
            <p>Generated: ${reportData.metadata.timestamp}</p>
            <p>Duration: ${Math.round(reportData.metadata.duration / 1000)} seconds</p>
        </div>
        
        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value">${reportData.summary.testsRun}</div>
                <div class="metric-label">Tests Run</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.summary.overallSuccessRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.summary.totalRequests.toLocaleString()}</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${reportData.summary.avgResponseTime}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
        </div>
        
        <div class="test-results">
            <h2>Individual Test Results</h2>
            ${reportData.testResults.map(test => `
                <div class="test-item ${test.success ? 'test-success' : 'test-failure'}">
                    <h3>${test.testSuite}</h3>
                    <p><strong>Status:</strong> ${test.success ? '✅ Success' : '❌ Failed'}</p>
                    <p><strong>Duration:</strong> ${Math.round(test.duration / 1000)} seconds</p>
                    ${test.summary ? `
                        <p><strong>Requests:</strong> ${test.summary.requestCount || 'N/A'}</p>
                        <p><strong>Success Rate:</strong> ${test.summary.successRate || 'N/A'}%</p>
                        <p><strong>Avg Response Time:</strong> ${test.summary.avgResponseTime || 'N/A'}ms</p>
                    ` : ''}
                    ${test.issues && test.issues.length > 0 ? `
                        <div><strong>Issues:</strong>
                        <ul>${test.issues.map(issue => `<li>${issue}</li>`).join('')}</ul></div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="recommendations">
            <h2>Recommendations</h2>
            ${reportData.recommendations.map(rec => `
                <div class="recommendation-item priority-${rec.priority.toLowerCase()}">
                    <strong>[${rec.priority}] ${rec.category}:</strong> ${rec.recommendation}
                </div>
            `).join('')}
        </div>
        
        <div class="conclusions">
            <h2>Conclusions</h2>
            <p><strong>Overall Assessment:</strong> ${reportData.conclusions.overallAssessment}</p>
            <p><strong>Production Readiness:</strong> ${reportData.conclusions.readiness}</p>
            
            ${reportData.conclusions.keyStrengths.length > 0 ? `
                <h3>Key Strengths:</h3>
                <ul>${reportData.conclusions.keyStrengths.map(s => `<li>${s}</li>`).join('')}</ul>
            ` : ''}
            
            ${reportData.conclusions.majorConcerns.length > 0 ? `
                <h3>Major Concerns:</h3>
                <ul>${reportData.conclusions.majorConcerns.map(c => `<li>${c}</li>`).join('')}</ul>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(reportData) {
    const lines = [];
    
    lines.push('EXECUTIVE SUMMARY - LOAD TEST RESULTS');
    lines.push('=' .repeat(50));
    lines.push('');
    
    lines.push(`Report Date: ${reportData.metadata.timestamp}`);
    lines.push(`Test Duration: ${Math.round(reportData.metadata.duration / 1000)} seconds`);
    lines.push('');
    
    lines.push('KEY METRICS:');
    lines.push(`• Tests Executed: ${reportData.summary.testsRun}`);
    lines.push(`• Overall Success Rate: ${reportData.summary.overallSuccessRate}%`);
    lines.push(`• Total Requests Processed: ${reportData.summary.totalRequests.toLocaleString()}`);
    lines.push(`• Average Response Time: ${reportData.summary.avgResponseTime}ms`);
    lines.push('');
    
    lines.push('ASSESSMENT:');
    lines.push(`• Overall Performance: ${reportData.conclusions.overallAssessment}`);
    lines.push(`• Production Readiness: ${reportData.conclusions.readiness}`);
    lines.push('');
    
    if (reportData.conclusions.keyStrengths.length > 0) {
      lines.push('STRENGTHS:');
      reportData.conclusions.keyStrengths.forEach(strength => {
        lines.push(`• ${strength}`);
      });
      lines.push('');
    }
    
    if (reportData.conclusions.majorConcerns.length > 0) {
      lines.push('CONCERNS:');
      reportData.conclusions.majorConcerns.forEach(concern => {
        lines.push(`• ${concern}`);
      });
      lines.push('');
    }
    
    lines.push('HIGH PRIORITY RECOMMENDATIONS:');
    const highPriorityRecs = reportData.recommendations.filter(r => r.priority.toLowerCase() === 'high');
    if (highPriorityRecs.length > 0) {
      highPriorityRecs.forEach(rec => {
        lines.push(`• ${rec.category}: ${rec.recommendation}`);
      });
    } else {
      lines.push('• No high priority issues identified');
    }
    lines.push('');
    
    lines.push('NEXT STEPS:');
    reportData.conclusions.nextSteps.forEach(step => {
      lines.push(`• ${step}`);
    });
    
    return lines.join('\n');
  }

  /**
   * Display key findings to console
   */
  displayKeyFindings(reportData) {
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 KEY FINDINGS');
    console.log('=' .repeat(60));
    
    console.log(`Overall Assessment: ${reportData.conclusions.overallAssessment}`);
    console.log(`Success Rate: ${reportData.summary.overallSuccessRate}%`);
    console.log(`Average Response Time: ${reportData.summary.avgResponseTime}ms`);
    console.log(`Total Requests: ${reportData.summary.totalRequests.toLocaleString()}`);
    
    if (reportData.conclusions.majorConcerns.length > 0) {
      console.log('\n⚠️ Major Concerns:');
      reportData.conclusions.majorConcerns.forEach(concern => {
        console.log(`   • ${concern}`);
      });
    }
    
    const highPriorityRecs = reportData.recommendations.filter(r => r.priority.toLowerCase() === 'high');
    if (highPriorityRecs.length > 0) {
      console.log('\n🔥 High Priority Recommendations:');
      highPriorityRecs.forEach(rec => {
        console.log(`   • ${rec.category}: ${rec.recommendation}`);
      });
    }
    
    console.log(`\n📊 Production Readiness: ${reportData.conclusions.readiness}`);
    console.log('=' .repeat(60));
  }

  /**
   * Calculate weighted average
   */
  calculateWeightedAverage(valueWeightPairs) {
    const totalWeight = valueWeightPairs.reduce((sum, pair) => sum + pair.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = valueWeightPairs.reduce((sum, pair) => sum + (pair.value * pair.weight), 0);
    return weightedSum / totalWeight;
  }

  /**
   * Cleanup temporary files
   */
  async cleanup() {
    console.log('🧹 Cleaning up temporary files...');
    // Cleanup logic here if needed
    console.log('✅ Cleanup completed');
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const orchestrator = new LoadTestOrchestrator({
    outputDir: './load-test-results',
    performanceMonitoring: true,
    generateReport: true,
    cleanup: false
  });
  
  switch (command) {
    case 'list':
      orchestrator.listTests();
      break;
      
    case 'run':
      if (args[1]) {
        orchestrator.runTest(args[1]);
      } else {
        orchestrator.runAll();
      }
      break;
      
    case 'all':
      orchestrator.runAll();
      break;
      
    case 'concurrent':
      orchestrator.options.concurrency = true;
      orchestrator.runAll();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node run-load-tests.js list                    # List available tests');
      console.log('  node run-load-tests.js run [test-name]         # Run specific test');
      console.log('  node run-load-tests.js all                     # Run all tests sequentially');
      console.log('  node run-load-tests.js concurrent              # Run all tests concurrently');
      break;
  }
}

module.exports = LoadTestOrchestrator;