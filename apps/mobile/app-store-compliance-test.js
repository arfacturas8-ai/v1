const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AppStoreComplianceTester {
  constructor() {
    this.results = [];
    this.projectRoot = __dirname;
    this.iosPath = path.join(this.projectRoot, 'ios');
    this.androidPath = path.join(this.projectRoot, 'android');
  }

  async runAllTests() {
    console.log('📱 Starting CRYB Mobile App Store Compliance Tests');
    console.log('=' .repeat(60));

    try {
      // iOS App Store Guidelines
      await this.testIOSCompliance();
      
      // Google Play Store Guidelines
      await this.testAndroidCompliance();
      
      // Cross-platform compliance
      await this.testCrossPlatformCompliance();
      
      // Privacy and Data Protection
      await this.testPrivacyCompliance();
      
      // Content Guidelines
      await this.testContentGuidelines();
      
      // Performance and Quality
      await this.testPerformanceCompliance();
      
      // Accessibility Guidelines
      await this.testAccessibilityCompliance();
      
      // Generate report
      this.generateComplianceReport();
      
      console.log('\n🎉 App Store compliance testing completed!');
      console.log('Results saved to: app-store-compliance-report.json');
      
    } catch (error) {
      console.error('Compliance testing failed:', error.message);
      process.exit(1);
    }
  }

  async testIOSCompliance() {
    console.log('\n🍎 Testing iOS App Store Guidelines');

    // Test 1: App Metadata Compliance
    const appConfig = this.readAppConfig();
    
    if (!appConfig.expo || !appConfig.expo.name) {
      this.addResult('IOS_APP_NAME', 'FAIL', 'App name not properly configured');
    } else if (appConfig.expo.name.length > 30) {
      this.addResult('IOS_APP_NAME', 'FAIL', 'App name too long (>30 chars)');
    } else {
      this.addResult('IOS_APP_NAME', 'PASS', `App name: ${appConfig.expo.name}`);
    }

    // Test 2: Bundle Identifier
    if (appConfig.expo.ios && appConfig.expo.ios.bundleIdentifier) {
      const bundleId = appConfig.expo.ios.bundleIdentifier;
      if (bundleId.match(/^[a-zA-Z0-9.-]+$/)) {
        this.addResult('IOS_BUNDLE_ID', 'PASS', `Bundle ID: ${bundleId}`);
      } else {
        this.addResult('IOS_BUNDLE_ID', 'FAIL', 'Invalid bundle identifier format');
      }
    } else {
      this.addResult('IOS_BUNDLE_ID', 'FAIL', 'Bundle identifier not configured');
    }

    // Test 3: App Icons
    const iconPath = path.join(this.projectRoot, 'assets', 'icon.png');
    if (fs.existsSync(iconPath)) {
      const iconStats = fs.statSync(iconPath);
      if (iconStats.size > 0) {
        this.addResult('IOS_APP_ICON', 'PASS', 'App icon exists');
      } else {
        this.addResult('IOS_APP_ICON', 'FAIL', 'App icon file is empty');
      }
    } else {
      this.addResult('IOS_APP_ICON', 'FAIL', 'App icon missing');
    }

    // Test 4: Privacy Permissions
    const infoPlistRequiredKeys = [
      'NSCameraUsageDescription',
      'NSMicrophoneUsageDescription',
      'NSPhotoLibraryUsageDescription'
    ];

    if (appConfig.expo.ios && appConfig.expo.ios.infoPlist) {
      infoPlistRequiredKeys.forEach(key => {
        if (appConfig.expo.ios.infoPlist[key]) {
          this.addResult('IOS_PRIVACY_PERMISSION', 'PASS', `${key} description provided`);
        } else {
          this.addResult('IOS_PRIVACY_PERMISSION', 'FAIL', `Missing ${key} description`);
        }
      });
    } else {
      this.addResult('IOS_PRIVACY_PERMISSIONS', 'FAIL', 'infoPlist not configured');
    }

    // Test 5: Splash Screen
    const splashPath = path.join(this.projectRoot, 'assets', 'splash.png');
    if (fs.existsSync(splashPath)) {
      this.addResult('IOS_SPLASH_SCREEN', 'PASS', 'Splash screen exists');
    } else {
      this.addResult('IOS_SPLASH_SCREEN', 'FAIL', 'Splash screen missing');
    }

    // Test 6: App Category
    if (appConfig.expo.ios && appConfig.expo.ios.category) {
      this.addResult('IOS_APP_CATEGORY', 'PASS', `Category: ${appConfig.expo.ios.category}`);
    } else {
      this.addResult('IOS_APP_CATEGORY', 'WARN', 'App category not specified');
    }

    // Test 7: Version and Build Number
    if (appConfig.expo.version) {
      this.addResult('IOS_VERSION', 'PASS', `Version: ${appConfig.expo.version}`);
    } else {
      this.addResult('IOS_VERSION', 'FAIL', 'App version not specified');
    }

    // Test 8: Orientation Support
    if (appConfig.expo.orientation) {
      this.addResult('IOS_ORIENTATION', 'PASS', `Orientation: ${appConfig.expo.orientation}`);
    } else {
      this.addResult('IOS_ORIENTATION', 'WARN', 'Orientation not specified');
    }

    // Test 9: iOS Deployment Target
    if (fs.existsSync(this.iosPath)) {
      try {
        const podfilePath = path.join(this.iosPath, 'Podfile');
        if (fs.existsSync(podfilePath)) {
          const podfileContent = fs.readFileSync(podfilePath, 'utf8');
          const platformMatch = podfileContent.match(/platform :ios, ['"]([\d.]+)['"]/);
          if (platformMatch) {
            const version = parseFloat(platformMatch[1]);
            if (version >= 12.0) {
              this.addResult('IOS_DEPLOYMENT_TARGET', 'PASS', `iOS ${version}+ supported`);
            } else {
              this.addResult('IOS_DEPLOYMENT_TARGET', 'WARN', `iOS ${version} may be too old`);
            }
          }
        }
      } catch (error) {
        this.addResult('IOS_DEPLOYMENT_TARGET', 'ERROR', 'Could not check deployment target');
      }
    }

    // Test 10: BitCode Support (deprecated but may still be checked)
    try {
      const easConfig = this.readEASConfig();
      if (easConfig.build && easConfig.build.production && easConfig.build.production.ios) {
        this.addResult('IOS_BUILD_CONFIG', 'PASS', 'iOS build configuration exists');
      }
    } catch (error) {
      this.addResult('IOS_BUILD_CONFIG', 'WARN', 'EAS build configuration not found');
    }
  }

  async testAndroidCompliance() {
    console.log('\n🤖 Testing Google Play Store Guidelines');

    const appConfig = this.readAppConfig();

    // Test 1: Package Name
    if (appConfig.expo.android && appConfig.expo.android.package) {
      const packageName = appConfig.expo.android.package;
      if (packageName.match(/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/)) {
        this.addResult('ANDROID_PACKAGE_NAME', 'PASS', `Package: ${packageName}`);
      } else {
        this.addResult('ANDROID_PACKAGE_NAME', 'FAIL', 'Invalid package name format');
      }
    } else {
      this.addResult('ANDROID_PACKAGE_NAME', 'FAIL', 'Package name not configured');
    }

    // Test 2: App Permissions
    if (appConfig.expo.android && appConfig.expo.android.permissions) {
      const permissions = appConfig.expo.android.permissions;
      const requiredPermissions = ['CAMERA', 'RECORD_AUDIO', 'READ_EXTERNAL_STORAGE'];
      
      requiredPermissions.forEach(permission => {
        if (permissions.includes(permission)) {
          this.addResult('ANDROID_PERMISSIONS', 'PASS', `${permission} permission declared`);
        } else {
          this.addResult('ANDROID_PERMISSIONS', 'WARN', `${permission} permission not declared`);
        }
      });

      // Check for sensitive permissions
      const sensitivePermissions = [
        'ACCESS_FINE_LOCATION',
        'READ_CONTACTS',
        'READ_SMS',
        'CALL_PHONE'
      ];

      sensitivePermissions.forEach(permission => {
        if (permissions.includes(permission)) {
          this.addResult('ANDROID_SENSITIVE_PERMISSIONS', 'WARN', `Sensitive permission: ${permission}`);
        }
      });
    }

    // Test 3: Target SDK Version
    const buildGradlePath = path.join(this.androidPath, 'app', 'build.gradle');
    if (fs.existsSync(buildGradlePath)) {
      try {
        const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
        const targetSdkMatch = buildGradleContent.match(/targetSdkVersion\s+(\d+)/);
        if (targetSdkMatch) {
          const targetSdk = parseInt(targetSdkMatch[1]);
          if (targetSdk >= 31) {
            this.addResult('ANDROID_TARGET_SDK', 'PASS', `Target SDK: ${targetSdk}`);
          } else {
            this.addResult('ANDROID_TARGET_SDK', 'FAIL', `Target SDK too old: ${targetSdk}`);
          }
        }

        const compileSdkMatch = buildGradleContent.match(/compileSdkVersion\s+(\d+)/);
        if (compileSdkMatch) {
          const compileSdk = parseInt(compileSdkMatch[1]);
          if (compileSdk >= 31) {
            this.addResult('ANDROID_COMPILE_SDK', 'PASS', `Compile SDK: ${compileSdk}`);
          } else {
            this.addResult('ANDROID_COMPILE_SDK', 'WARN', `Compile SDK: ${compileSdk}`);
          }
        }
      } catch (error) {
        this.addResult('ANDROID_SDK_VERSION', 'ERROR', 'Could not read build.gradle');
      }
    }

    // Test 4: App Signing
    try {
      const easConfig = this.readEASConfig();
      if (easConfig.build && easConfig.build.production && easConfig.build.production.android) {
        this.addResult('ANDROID_BUILD_CONFIG', 'PASS', 'Android build configuration exists');
      }
    } catch (error) {
      this.addResult('ANDROID_BUILD_CONFIG', 'WARN', 'EAS build configuration not found');
    }

    // Test 5: App Bundle vs APK
    const gradleProperties = path.join(this.androidPath, 'gradle.properties');
    if (fs.existsSync(gradleProperties)) {
      const content = fs.readFileSync(gradleProperties, 'utf8');
      if (content.includes('android.bundle.enableUncompressedNativeLibs=false')) {
        this.addResult('ANDROID_APP_BUNDLE', 'PASS', 'App Bundle optimization enabled');
      }
    }

    // Test 6: Adaptive Icon
    if (appConfig.expo.android && appConfig.expo.android.adaptiveIcon) {
      this.addResult('ANDROID_ADAPTIVE_ICON', 'PASS', 'Adaptive icon configured');
    } else {
      this.addResult('ANDROID_ADAPTIVE_ICON', 'FAIL', 'Adaptive icon not configured');
    }

    // Test 7: Network Security Config
    const networkSecurityConfigPath = path.join(
      this.androidPath, 
      'app', 
      'src', 
      'main', 
      'res', 
      'xml', 
      'network_security_config.xml'
    );
    
    if (fs.existsSync(networkSecurityConfigPath)) {
      this.addResult('ANDROID_NETWORK_SECURITY', 'PASS', 'Network security config exists');
    } else {
      this.addResult('ANDROID_NETWORK_SECURITY', 'WARN', 'Network security config not found');
    }

    // Test 8: ProGuard/R8 Configuration
    const proguardPath = path.join(this.androidPath, 'app', 'proguard-rules.pro');
    if (fs.existsSync(proguardPath)) {
      this.addResult('ANDROID_PROGUARD', 'PASS', 'ProGuard rules file exists');
    } else {
      this.addResult('ANDROID_PROGUARD', 'WARN', 'ProGuard rules not configured');
    }
  }

  async testCrossPlatformCompliance() {
    console.log('\n🌐 Testing Cross-Platform Compliance');

    // Test 1: Age Rating
    const appConfig = this.readAppConfig();
    
    // Check for age-appropriate content indicators
    this.addResult('AGE_RATING', 'MANUAL', 'Age rating must be manually verified based on content');

    // Test 2: Internationalization
    const localesPath = path.join(this.projectRoot, 'src', 'locales');
    if (fs.existsSync(localesPath)) {
      const locales = fs.readdirSync(localesPath);
      this.addResult('INTERNATIONALIZATION', 'PASS', `${locales.length} locales supported`);
    } else {
      this.addResult('INTERNATIONALIZATION', 'WARN', 'No localization files found');
    }

    // Test 3: Third-party Dependencies Security
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = {...packageJson.dependencies, ...packageJson.devDependencies};
        
        // Check for known problematic packages
        const problematicPackages = [
          'request', // deprecated
          'node-uuid', // deprecated
          'crypto', // potentially insecure usage
        ];

        let problematicFound = false;
        problematicPackages.forEach(pkg => {
          if (deps[pkg]) {
            this.addResult('DEPENDENCY_SECURITY', 'WARN', `Potentially problematic dependency: ${pkg}`);
            problematicFound = true;
          }
        });

        if (!problematicFound) {
          this.addResult('DEPENDENCY_SECURITY', 'PASS', 'No known problematic dependencies found');
        }

        // Check dependency count
        const depCount = Object.keys(deps).length;
        if (depCount > 200) {
          this.addResult('DEPENDENCY_COUNT', 'WARN', `High dependency count: ${depCount}`);
        } else {
          this.addResult('DEPENDENCY_COUNT', 'PASS', `Reasonable dependency count: ${depCount}`);
        }

      } catch (error) {
        this.addResult('DEPENDENCY_CHECK', 'ERROR', 'Could not analyze dependencies');
      }
    }

    // Test 4: App Size
    try {
      // This would need to be run after building
      this.addResult('APP_SIZE', 'MANUAL', 'App size must be checked after building');
    } catch (error) {
      this.addResult('APP_SIZE', 'ERROR', 'Could not check app size');
    }

    // Test 5: Offline Functionality
    const offlineComponents = [
      'src/services/OfflineDataService.ts',
      'src/contexts/NetworkContext.tsx'
    ];

    let offlineSupport = true;
    offlineComponents.forEach(component => {
      const componentPath = path.join(this.projectRoot, component);
      if (!fs.existsSync(componentPath)) {
        offlineSupport = false;
      }
    });

    if (offlineSupport) {
      this.addResult('OFFLINE_SUPPORT', 'PASS', 'Offline functionality implemented');
    } else {
      this.addResult('OFFLINE_SUPPORT', 'WARN', 'Limited offline functionality');
    }
  }

  async testPrivacyCompliance() {
    console.log('\n🔐 Testing Privacy Compliance');

    // Test 1: Privacy Policy
    const privacyPolicyPath = path.join(this.projectRoot, 'app-store-submission', 'metadata', 'privacy-policy.txt');
    if (fs.existsSync(privacyPolicyPath)) {
      const content = fs.readFileSync(privacyPolicyPath, 'utf8');
      if (content.length > 100) {
        this.addResult('PRIVACY_POLICY', 'PASS', 'Privacy policy exists and has content');
      } else {
        this.addResult('PRIVACY_POLICY', 'FAIL', 'Privacy policy too short or empty');
      }
    } else {
      this.addResult('PRIVACY_POLICY', 'FAIL', 'Privacy policy not found');
    }

    // Test 2: Data Collection Disclosure
    const requiredDisclosures = [
      'data collection',
      'personal information',
      'third parties',
      'cookies',
      'analytics',
      'user rights',
      'data retention',
      'security measures'
    ];

    if (fs.existsSync(privacyPolicyPath)) {
      const content = fs.readFileSync(privacyPolicyPath, 'utf8').toLowerCase();
      requiredDisclosures.forEach(disclosure => {
        if (content.includes(disclosure)) {
          this.addResult('PRIVACY_DISCLOSURE', 'PASS', `${disclosure} mentioned in privacy policy`);
        } else {
          this.addResult('PRIVACY_DISCLOSURE', 'WARN', `${disclosure} not found in privacy policy`);
        }
      });
    }

    // Test 3: GDPR Compliance Indicators
    const gdprComponents = [
      'src/components/privacy/ConsentManager.tsx',
      'src/services/DataRetentionService.ts',
      'src/utils/DataProcessor.ts'
    ];

    let gdprCompliance = 0;
    gdprComponents.forEach(component => {
      const componentPath = path.join(this.projectRoot, component);
      if (fs.existsSync(componentPath)) {
        gdprCompliance++;
      }
    });

    if (gdprCompliance >= 2) {
      this.addResult('GDPR_COMPLIANCE', 'PASS', 'GDPR compliance components found');
    } else {
      this.addResult('GDPR_COMPLIANCE', 'WARN', 'Limited GDPR compliance implementation');
    }

    // Test 4: Children's Privacy (COPPA)
    this.addResult('COPPA_COMPLIANCE', 'MANUAL', 'COPPA compliance must be manually verified based on target audience');

    // Test 5: Biometric Data Handling
    const biometricFiles = [
      'src/services/BiometricService.ts',
      'src/utils/BiometricDataHandler.ts'
    ];

    let biometricHandling = false;
    biometricFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        biometricHandling = true;
      }
    });

    if (biometricHandling) {
      this.addResult('BIOMETRIC_PRIVACY', 'WARN', 'Biometric data handling detected - ensure proper privacy disclosures');
    } else {
      this.addResult('BIOMETRIC_PRIVACY', 'PASS', 'No biometric data handling detected');
    }
  }

  async testContentGuidelines() {
    console.log('\n📝 Testing Content Guidelines');

    // Test 1: Inappropriate Content Detection
    const contentFiles = [
      'assets/images',
      'src/content',
      'src/data'
    ];

    // This would normally use AI/ML services to scan for inappropriate content
    this.addResult('CONTENT_MODERATION', 'MANUAL', 'Content must be manually reviewed for appropriateness');

    // Test 2: Copyright Compliance
    const copyrightFiles = [
      'assets/sounds',
      'assets/music',
      'assets/videos'
    ];

    this.addResult('COPYRIGHT_COMPLIANCE', 'MANUAL', 'All media assets must have proper licensing');

    // Test 3: Trademark Issues
    const appConfig = this.readAppConfig();
    const appName = appConfig.expo?.name || '';
    
    // Basic trademark check (would need external API for full check)
    const commonTrademarks = [
      'apple', 'google', 'microsoft', 'facebook', 'amazon',
      'twitter', 'instagram', 'snapchat', 'tiktok', 'youtube'
    ];

    let trademarkIssue = false;
    commonTrademarks.forEach(trademark => {
      if (appName.toLowerCase().includes(trademark)) {
        this.addResult('TRADEMARK_CHECK', 'FAIL', `Potential trademark issue with: ${trademark}`);
        trademarkIssue = true;
      }
    });

    if (!trademarkIssue) {
      this.addResult('TRADEMARK_CHECK', 'PASS', 'No obvious trademark issues in app name');
    }

    // Test 4: Violence and Mature Content
    this.addResult('MATURE_CONTENT', 'MANUAL', 'App content must be reviewed for violence and mature themes');

    // Test 5: Gambling and Contests
    this.addResult('GAMBLING_CONTENT', 'MANUAL', 'Check for gambling mechanics or contest features');
  }

  async testPerformanceCompliance() {
    console.log('\n⚡ Testing Performance Compliance');

    // Test 1: Launch Time
    this.addResult('APP_LAUNCH_TIME', 'MANUAL', 'App launch time must be tested on actual devices');

    // Test 2: Memory Usage
    this.addResult('MEMORY_USAGE', 'MANUAL', 'Memory usage must be profiled on actual devices');

    // Test 3: Battery Usage
    this.addResult('BATTERY_USAGE', 'MANUAL', 'Battery usage must be tested during normal usage');

    // Test 4: Network Usage
    const networkOptimizations = [
      'src/services/CacheService.ts',
      'src/utils/NetworkOptimizer.ts',
      'src/services/OfflineService.ts'
    ];

    let networkOptimized = 0;
    networkOptimizations.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        networkOptimized++;
      }
    });

    if (networkOptimized >= 2) {
      this.addResult('NETWORK_OPTIMIZATION', 'PASS', 'Network optimization features implemented');
    } else {
      this.addResult('NETWORK_OPTIMIZATION', 'WARN', 'Limited network optimization');
    }

    // Test 5: Crash Reporting
    const crashReportingFiles = [
      'src/services/CrashReportingService.ts',
      'src/utils/ErrorHandler.ts'
    ];

    let crashReporting = false;
    crashReportingFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        crashReporting = true;
      }
    });

    if (crashReporting) {
      this.addResult('CRASH_REPORTING', 'PASS', 'Crash reporting implemented');
    } else {
      this.addResult('CRASH_REPORTING', 'WARN', 'No crash reporting detected');
    }

    // Test 6: Code Quality
    const eslintConfigPath = path.join(this.projectRoot, '.eslintrc.js');
    if (fs.existsSync(eslintConfigPath)) {
      this.addResult('CODE_QUALITY', 'PASS', 'ESLint configuration found');
    } else {
      this.addResult('CODE_QUALITY', 'WARN', 'No ESLint configuration found');
    }
  }

  async testAccessibilityCompliance() {
    console.log('\n♿ Testing Accessibility Compliance');

    // Test 1: Screen Reader Support
    const accessibilityComponents = [
      'src/components/ui/AccessibleText.tsx',
      'src/components/ui/AccessibleButton.tsx',
      'src/utils/accessibility.ts'
    ];

    let accessibilitySupport = 0;
    accessibilityComponents.forEach(component => {
      const componentPath = path.join(this.projectRoot, component);
      if (fs.existsSync(componentPath)) {
        accessibilitySupport++;
      }
    });

    if (accessibilitySupport >= 2) {
      this.addResult('ACCESSIBILITY_SUPPORT', 'PASS', 'Accessibility components implemented');
    } else {
      this.addResult('ACCESSIBILITY_SUPPORT', 'WARN', 'Limited accessibility support');
    }

    // Test 2: Color Contrast
    this.addResult('COLOR_CONTRAST', 'MANUAL', 'Color contrast must be manually tested for WCAG compliance');

    // Test 3: Font Scaling
    this.addResult('FONT_SCALING', 'MANUAL', 'Dynamic font scaling must be tested with system settings');

    // Test 4: Voice Control
    this.addResult('VOICE_CONTROL', 'MANUAL', 'Voice control compatibility must be tested on actual devices');

    // Test 5: Keyboard Navigation
    this.addResult('KEYBOARD_NAVIGATION', 'MANUAL', 'Keyboard navigation must be tested on platforms that support it');
  }

  readAppConfig() {
    try {
      const appJsonPath = path.join(this.projectRoot, 'app.json');
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      
      if (fs.existsSync(appJsonPath)) {
        return JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      } else if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.expo || {};
      }
      return {};
    } catch (error) {
      console.error('Error reading app configuration:', error.message);
      return {};
    }
  }

  readEASConfig() {
    const easJsonPath = path.join(this.projectRoot, 'eas.json');
    if (fs.existsSync(easJsonPath)) {
      return JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    }
    throw new Error('eas.json not found');
  }

  addResult(testName, status, message) {
    this.results.push({
      timestamp: new Date().toISOString(),
      test: testName,
      status: status,
      message: message,
      category: this.getCurrentCategory()
    });

    const statusIcon = {
      'PASS': '✅',
      'FAIL': '❌',
      'WARN': '⚠️',
      'ERROR': '🔧',
      'MANUAL': '👁️'
    }[status] || '❓';

    console.log(`${statusIcon} ${testName}: ${message}`);
  }

  getCurrentCategory() {
    const stack = new Error().stack;
    if (stack.includes('testIOSCompliance')) return 'iOS';
    if (stack.includes('testAndroidCompliance')) return 'Android';
    if (stack.includes('testCrossPlatformCompliance')) return 'Cross-Platform';
    if (stack.includes('testPrivacyCompliance')) return 'Privacy';
    if (stack.includes('testContentGuidelines')) return 'Content';
    if (stack.includes('testPerformanceCompliance')) return 'Performance';
    if (stack.includes('testAccessibilityCompliance')) return 'Accessibility';
    return 'General';
  }

  generateComplianceReport() {
    const categorizedResults = {};
    
    this.results.forEach(result => {
      if (!categorizedResults[result.category]) {
        categorizedResults[result.category] = [];
      }
      categorizedResults[result.category].push(result);
    });

    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      warnings: this.results.filter(r => r.status === 'WARN').length,
      errors: this.results.filter(r => r.status === 'ERROR').length,
      manual: this.results.filter(r => r.status === 'MANUAL').length
    };

    const complianceScore = Math.round(
      ((summary.passed) / (summary.total - summary.manual - summary.errors)) * 100
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary: summary,
      compliance_score: complianceScore,
      categories: categorizedResults,
      recommendations: this.generateRecommendations(),
      next_steps: this.generateNextSteps()
    };

    // Save report
    fs.writeFileSync('app-store-compliance-report.json', JSON.stringify(report, null, 2));

    console.log('\n📊 App Store Compliance Summary:');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`🔧 Errors: ${summary.errors}`);
    console.log(`👁️  Manual Review Required: ${summary.manual}`);
    console.log(`🏆 Compliance Score: ${complianceScore}%`);

    if (summary.failed > 0) {
      console.log('\n🚨 Critical Issues That Must Be Fixed:');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }

    if (summary.warnings > 0) {
      console.log('\n⚠️  Warnings That Should Be Addressed:');
      this.results.filter(r => r.status === 'WARN').slice(0, 5).forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    
    if (failedTests.some(t => t.test.includes('PRIVACY'))) {
      recommendations.push('Review and update privacy policy to meet current guidelines');
    }
    
    if (failedTests.some(t => t.test.includes('PERMISSION'))) {
      recommendations.push('Ensure all required permissions are properly declared and justified');
    }
    
    if (failedTests.some(t => t.test.includes('ICON'))) {
      recommendations.push('Create proper app icons in all required sizes and formats');
    }
    
    if (failedTests.some(t => t.test.includes('SDK'))) {
      recommendations.push('Update target SDK versions to meet current store requirements');
    }

    const manualTests = this.results.filter(r => r.status === 'MANUAL');
    if (manualTests.length > 10) {
      recommendations.push('Complete manual testing on physical devices before submission');
    }

    return recommendations;
  }

  generateNextSteps() {
    const nextSteps = [];
    
    nextSteps.push('Fix all failed compliance tests');
    nextSteps.push('Address warning items to improve app quality');
    nextSteps.push('Complete all manual testing requirements');
    nextSteps.push('Prepare app store metadata and screenshots');
    nextSteps.push('Test app on multiple device configurations');
    nextSteps.push('Review and update privacy policy if needed');
    nextSteps.push('Perform final security and performance testing');
    nextSteps.push('Submit for app store review');
    
    return nextSteps;
  }
}

// Run the compliance tests
if (require.main === module) {
  const tester = new AppStoreComplianceTester();
  tester.runAllTests().catch(error => {
    console.error('App Store compliance testing failed:', error);
    process.exit(1);
  });
}

module.exports = AppStoreComplianceTester;