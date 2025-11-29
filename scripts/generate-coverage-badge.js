#!/usr/bin/env node

/**
 * Coverage Badge Generator
 * Generates SVG badges for test coverage metrics
 */

const fs = require('fs');
const path = require('path');

class CoverageBadgeGenerator {
  constructor() {
    this.rootDir = process.cwd();
    this.badgeDir = path.join(this.rootDir, 'coverage', 'badges');
    this.colors = {
      excellent: '#4c1',   // 90-100%
      good: '#97ca00',     // 80-89%
      ok: '#a4a61d',       // 70-79%
      low: '#dfb317',      // 60-69%
      poor: '#fe7d37',     // 50-59%
      critical: '#e05d44'  // <50%
    };
  }

  generateBadges() {
    console.log('🏷️  Generating coverage badges...\n');

    // Ensure badge directory exists
    this.ensureDirectoryExists(this.badgeDir);

    const reportPath = path.join(this.rootDir, 'coverage', 'final-coverage-report.json');
    
    if (!fs.existsSync(reportPath)) {
      console.error('❌ Coverage report not found');
      return false;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const { overallCoverage } = report.summary;

    // Generate individual metric badges
    Object.keys(overallCoverage).forEach(metric => {
      const coverage = overallCoverage[metric];
      const badge = this.createBadge(
        metric.charAt(0).toUpperCase() + metric.slice(1),
        `${coverage.pct}%`,
        this.getColorForPercentage(coverage.pct)
      );
      
      const filename = `coverage-${metric}.svg`;
      fs.writeFileSync(path.join(this.badgeDir, filename), badge);
      console.log(`   ✅ Generated ${filename}`);
    });

    // Generate overall coverage badge
    const overallPct = Math.round(
      (overallCoverage.lines.pct + 
       overallCoverage.functions.pct + 
       overallCoverage.branches.pct + 
       overallCoverage.statements.pct) / 4
    );

    const overallBadge = this.createBadge(
      'Coverage',
      `${overallPct}%`,
      this.getColorForPercentage(overallPct)
    );
    
    fs.writeFileSync(path.join(this.badgeDir, 'coverage-overall.svg'), overallBadge);
    console.log('   ✅ Generated coverage-overall.svg');

    // Generate app-specific badges
    if (report.details && report.details.apps) {
      Object.values(report.details.apps).forEach(app => {
        if (app && app.success && app.coverage) {
          this.generateAppBadge(app);
        }
      });
    }

    // Generate test status badge
    const testStatusBadge = this.createBadge(
      'Tests',
      report.success ? 'Passing' : 'Failing',
      report.success ? this.colors.excellent : this.colors.critical
    );
    
    fs.writeFileSync(path.join(this.badgeDir, 'test-status.svg'), testStatusBadge);
    console.log('   ✅ Generated test-status.svg');

    // Generate README with badge usage
    this.generateBadgeReadme();

    console.log('\n🎉 Coverage badges generated successfully!');
    console.log(`📁 Badges saved to: ${this.badgeDir}`);
    
    return true;
  }

  generateAppBadge(app) {
    const appName = app.app;
    const avgCoverage = Math.round(
      (app.coverage.lines.pct + 
       app.coverage.functions.pct + 
       app.coverage.branches.pct + 
       app.coverage.statements.pct) / 4
    );

    const badge = this.createBadge(
      `${appName.toUpperCase()} Coverage`,
      `${avgCoverage}%`,
      this.getColorForPercentage(avgCoverage)
    );
    
    const filename = `coverage-${appName}.svg`;
    fs.writeFileSync(path.join(this.badgeDir, filename), badge);
    console.log(`   ✅ Generated ${filename}`);
  }

  createBadge(label, value, color) {
    // Calculate text widths (approximate)
    const labelWidth = this.calculateTextWidth(label);
    const valueWidth = this.calculateTextWidth(value);
    const totalWidth = labelWidth + valueWidth + 20; // padding

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h${labelWidth + 10}v20H0z"/>
    <path fill="${color}" d="M${labelWidth + 10} 0h${valueWidth + 10}v20H${labelWidth + 10}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${(labelWidth + 10) / 2 * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${labelWidth * 10}">${label}</text>
    <text x="${(labelWidth + 10) / 2 * 10}" y="140" transform="scale(.1)" textLength="${labelWidth * 10}">${label}</text>
    <text x="${(labelWidth + valueWidth + 20) / 2 * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${valueWidth * 10}">${value}</text>
    <text x="${(labelWidth + valueWidth + 20) / 2 * 10}" y="140" transform="scale(.1)" textLength="${valueWidth * 10}">${value}</text>
  </g>
</svg>`;
  }

  calculateTextWidth(text) {
    // Approximate text width calculation
    return text.length * 7 + 10;
  }

  getColorForPercentage(percentage) {
    if (percentage >= 90) return this.colors.excellent;
    if (percentage >= 80) return this.colors.good;
    if (percentage >= 70) return this.colors.ok;
    if (percentage >= 60) return this.colors.low;
    if (percentage >= 50) return this.colors.poor;
    return this.colors.critical;
  }

  generateBadgeReadme() {
    const readmeContent = `# Coverage Badges

This directory contains auto-generated coverage badges for the CRYB platform.

## Available Badges

### Overall Coverage
![Overall Coverage](./coverage-overall.svg)

### Metric-Specific Coverage
![Lines Coverage](./coverage-lines.svg)
![Functions Coverage](./coverage-functions.svg)
![Branches Coverage](./coverage-branches.svg)
![Statements Coverage](./coverage-statements.svg)

### App-Specific Coverage
![API Coverage](./coverage-api.svg)
![Web Coverage](./coverage-web.svg)
![Mobile Coverage](./coverage-mobile.svg)
![Admin Coverage](./coverage-admin.svg)

### Test Status
![Test Status](./test-status.svg)

## Usage in README

To use these badges in your README.md, copy the following markdown:

\`\`\`markdown
![Coverage](https://img.shields.io/badge/dynamic/json?color=brightgreen&label=Coverage&query=%24.summary.overallCoverage.lines.pct&suffix=%25&url=https%3A%2F%2Fraw.githubusercontent.com%2Fyour-org%2Fcryb-platform%2Fmain%2Fcoverage%2Ffinal-coverage-report.json)

![Lines](./coverage/badges/coverage-lines.svg)
![Functions](./coverage/badges/coverage-functions.svg)
![Branches](./coverage/badges/coverage-branches.svg)
![Statements](./coverage/badges/coverage-statements.svg)
\`\`\`

## Badge Colors

- 🟢 **Excellent (90-100%)**: #4c1
- 🟡 **Good (80-89%)**: #97ca00
- 🟠 **OK (70-79%)**: #a4a61d
- 🟠 **Low (60-69%)**: #dfb317
- 🔴 **Poor (50-59%)**: #fe7d37
- 🔴 **Critical (<50%)**: #e05d44

## Automated Updates

These badges are automatically updated when:
- Tests run in CI/CD
- Coverage reports are generated
- The \`npm run test:coverage:report\` command is executed

Last updated: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(this.badgeDir, 'README.md'), readmeContent);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// CLI execution
if (require.main === module) {
  const generator = new CoverageBadgeGenerator();
  
  generator.generateBadges()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Badge generation failed:', error);
      process.exit(1);
    });
}

module.exports = CoverageBadgeGenerator;