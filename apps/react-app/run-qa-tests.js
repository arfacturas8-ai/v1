#!/usr/bin/env node

import { execSync } from 'child_process'
import chalk from 'chalk'

console.log(chalk.blue.bold('🔍 CRYB Platform - Comprehensive QA Testing Suite\n'))

const runCommand = (command, description) => {
  console.log(chalk.yellow(`⏳ ${description}...`))
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(chalk.green(`✅ ${description} completed\n`))
  } catch (error) {
    console.log(chalk.red(`❌ ${description} failed`))
    console.log(chalk.red(error.message))
    console.log('')
  }
}

const testSuites = [
  {
    command: 'npm run test:e2e',
    description: 'End-to-End Tests'
  },
  {
    command: 'npm run test',
    description: 'Unit Tests'
  },
  {
    command: 'npm run audit:accessibility',
    description: 'Accessibility Audit'
  },
  {
    command: 'npm run performance:test',
    description: 'Performance Testing'
  },
  {
    command: 'node tests/utils/test-report-generator.js',
    description: 'Generating Test Reports'
  }
]

console.log(chalk.cyan('Running comprehensive QA test suite...\n'))

testSuites.forEach(({ command, description }) => {
  runCommand(command, description)
})

console.log(chalk.blue.bold('🎉 QA Testing Suite Complete!'))
console.log(chalk.white('📊 Check the generated reports in /tests/reports/'))
console.log(chalk.white('📄 HTML Report: tests/reports/qa-report.html'))
console.log(chalk.white('📄 JSON Report: tests/reports/qa-report.json'))
console.log(chalk.white('📄 Markdown Report: tests/reports/qa-report.md'))