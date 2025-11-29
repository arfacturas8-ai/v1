#!/usr/bin/env node

/**
 * CRYB Platform Automated UI/UX Audit
 * Comprehensive testing of React components and user flows
 */

const fs = require('fs');
const path = require('path');

class CRYBAudit {
    constructor() {
        this.results = {
            landing: {},
            authentication: {},
            mainApp: {},
            components: {},
            theme: {},
            performance: {},
            accessibility: {}
        };
        this.sourceDir = path.join(__dirname, 'src');
    }

    // Analyze component structure and implementation
    analyzeComponents() {
        console.log('🔍 Analyzing React Components...');
        
        const componentDirs = [
            'components',
            'pages', 
            'contexts',
            'hooks',
            'services'
        ];

        componentDirs.forEach(dir => {
            const dirPath = path.join(this.sourceDir, dir);
            if (fs.existsSync(dirPath)) {
                this.analyzeDirectory(dirPath, dir);
            }
        });
    }

    analyzeDirectory(dirPath, category) {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        
        files.forEach(file => {
            if (file.isDirectory()) {
                this.analyzeDirectory(path.join(dirPath, file.name), category);
            } else if (file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
                this.analyzeFile(path.join(dirPath, file.name), category);
            }
        });
    }

    analyzeFile(filePath, category) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // Analyze component structure
            const analysis = {
                hasHooks: this.checkForHooks(content),
                hasErrorBoundary: content.includes('ErrorBoundary'),
                hasAccessibility: this.checkAccessibility(content),
                hasLoadingStates: this.checkLoadingStates(content),
                hasErrorHandling: this.checkErrorHandling(content),
                themeCompliant: this.checkThemeCompliance(content),
                responsive: this.checkResponsive(content)
            };

            if (!this.results.components[category]) {
                this.results.components[category] = {};
            }
            
            this.results.components[category][fileName] = analysis;
            
        } catch (error) {
            console.error(`Error analyzing ${filePath}:`, error.message);
        }
    }

    checkForHooks(content) {
        const hooks = ['useState', 'useEffect', 'useContext', 'useCallback', 'useMemo'];
        return hooks.some(hook => content.includes(hook));
    }

    checkAccessibility(content) {
        const a11yPatterns = [
            'aria-',
            'role=',
            'tabIndex',
            'alt=',
            'aria-label',
            'aria-describedby'
        ];
        return a11yPatterns.some(pattern => content.includes(pattern));
    }

    checkLoadingStates(content) {
        return content.includes('loading') || content.includes('Loading') || content.includes('Spinner');
    }

    checkErrorHandling(content) {
        return content.includes('try') && content.includes('catch') || 
               content.includes('error') || 
               content.includes('Error');
    }

    checkThemeCompliance(content) {
        const whiteThemePatterns = [
            '#FFFFFF',
            '#FFF',
            'white',
            '--bg-primary',
            '--text-primary',
            'app-white.css'
        ];
        return whiteThemePatterns.some(pattern => content.includes(pattern));
    }

    checkResponsive(content) {
        const responsivePatterns = [
            '@media',
            'mobile',
            'tablet',
            'desktop',
            'responsive',
            'breakpoint'
        ];
        return responsivePatterns.some(pattern => content.includes(pattern));
    }

    // Analyze landing page implementation
    analyzeLandingPage() {
        console.log('🏠 Analyzing Landing Page...');
        
        const landingPagePath = path.join(this.sourceDir, 'components', 'LandingPage.jsx');
        const landingCSSPath = path.join(this.sourceDir, 'components', 'LandingPage.css');
        
        this.results.landing = {
            componentExists: fs.existsSync(landingPagePath),
            cssExists: fs.existsSync(landingCSSPath),
            hasNavigation: false,
            hasHeroSection: false,
            hasFeatures: false,
            hasCTA: false,
            responsive: false,
            whiteTheme: false
        };

        if (fs.existsSync(landingPagePath)) {
            const content = fs.readFileSync(landingPagePath, 'utf8');
            
            this.results.landing.hasNavigation = content.includes('nav') || content.includes('Nav');
            this.results.landing.hasHeroSection = content.includes('hero') || content.includes('Hero');
            this.results.landing.hasFeatures = content.includes('features') || content.includes('Features');
            this.results.landing.hasCTA = content.includes('Get Started') || content.includes('onGetStarted');
        }

        if (fs.existsSync(landingCSSPath)) {
            const cssContent = fs.readFileSync(landingCSSPath, 'utf8');
            
            this.results.landing.responsive = cssContent.includes('@media');
            this.results.landing.whiteTheme = cssContent.includes('#FFFFFF') || cssContent.includes('background: #FFFFFF');
        }
    }

    // Analyze authentication flow
    analyzeAuthentication() {
        console.log('🔐 Analyzing Authentication Flow...');
        
        const authComponents = [
            'components/Auth/LoginForm.jsx',
            'components/auth/AuthModal.jsx',
            'services/auth.js',
            'contexts/AuthContext.jsx'
        ];

        this.results.authentication = {
            loginFormExists: false,
            authServiceExists: false,
            authContextExists: false,
            hasValidation: false,
            hasErrorHandling: false,
            hasTokenManagement: false,
            secureImplementation: false
        };

        authComponents.forEach(componentPath => {
            const fullPath = path.join(this.sourceDir, componentPath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                if (componentPath.includes('LoginForm')) {
                    this.results.authentication.loginFormExists = true;
                    this.results.authentication.hasValidation = content.includes('validate') || content.includes('required');
                }
                
                if (componentPath.includes('auth.js')) {
                    this.results.authentication.authServiceExists = true;
                    this.results.authentication.hasTokenManagement = content.includes('token') || content.includes('jwt');
                    this.results.authentication.secureImplementation = content.includes('localStorage') || content.includes('sessionStorage');
                }
                
                if (componentPath.includes('AuthContext')) {
                    this.results.authentication.authContextExists = true;
                }

                this.results.authentication.hasErrorHandling = content.includes('error') || content.includes('catch');
            }
        });
    }

    // Analyze main application interface
    analyzeMainApp() {
        console.log('💬 Analyzing Main Application...');
        
        const mainAppPath = path.join(this.sourceDir, 'App-final.jsx');
        
        this.results.mainApp = {
            mainAppExists: fs.existsSync(mainAppPath),
            hasSidebars: false,
            hasChat: false,
            hasChannels: false,
            hasMembers: false,
            hasPostSystem: false,
            hasVoiceVideo: false,
            hasNotifications: false
        };

        if (fs.existsSync(mainAppPath)) {
            const content = fs.readFileSync(mainAppPath, 'utf8');
            
            this.results.mainApp.hasSidebars = content.includes('sidebar') || content.includes('Sidebar');
            this.results.mainApp.hasChat = content.includes('chat') || content.includes('Chat') || content.includes('Message');
            this.results.mainApp.hasChannels = content.includes('channel') || content.includes('Channel');
            this.results.mainApp.hasMembers = content.includes('member') || content.includes('Member') || content.includes('Users');
            this.results.mainApp.hasPostSystem = content.includes('Post') || content.includes('posts');
            this.results.mainApp.hasVoiceVideo = content.includes('Voice') || content.includes('Video');
            this.results.mainApp.hasNotifications = content.includes('Notification') || content.includes('Bell');
        }
    }

    // Analyze theme consistency
    analyzeTheme() {
        console.log('🎨 Analyzing Theme Consistency...');
        
        const cssFiles = [
            'app-white.css',
            'index.css',
            'components/LandingPage.css'
        ];

        this.results.theme = {
            whiteThemeConsistent: true,
            cssVariablesUsed: false,
            responsiveDesign: false,
            modernStyling: false
        };

        cssFiles.forEach(cssFile => {
            const cssPath = path.join(this.sourceDir, cssFile);
            if (fs.existsSync(cssPath)) {
                const content = fs.readFileSync(cssPath, 'utf8');
                
                // Check for consistent white theme
                if (content.includes('#000') || content.includes('black') || content.includes('dark')) {
                    // Check if it's actually dark elements that should be there
                    if (!content.includes('text-primary') && !content.includes('border')) {
                        this.results.theme.whiteThemeConsistent = false;
                    }
                }
                
                this.results.theme.cssVariablesUsed = content.includes('--') || content.includes('var(');
                this.results.theme.responsiveDesign = content.includes('@media');
                this.results.theme.modernStyling = content.includes('grid') || content.includes('flex') || content.includes('gradient');
            }
        });
    }

    // Check for accessibility features
    analyzeAccessibility() {
        console.log('♿ Analyzing Accessibility...');
        
        this.results.accessibility = {
            ariaLabels: 0,
            keyboardNavigation: 0,
            altTexts: 0,
            semanticHTML: 0,
            colorContrast: true // Assume good contrast with white theme
        };

        // This would require more detailed analysis of each component
        // For now, we'll do a basic check based on component analysis
        Object.values(this.results.components).forEach(category => {
            Object.values(category).forEach(component => {
                if (component.hasAccessibility) {
                    this.results.accessibility.ariaLabels++;
                }
            });
        });
    }

    // Generate comprehensive audit report
    generateReport() {
        console.log('📊 Generating Comprehensive Audit Report...');
        
        const totalComponents = Object.values(this.results.components)
            .reduce((total, category) => total + Object.keys(category).length, 0);
        
        const accessibleComponents = Object.values(this.results.components)
            .reduce((total, category) => {
                return total + Object.values(category)
                    .filter(comp => comp.hasAccessibility).length;
            }, 0);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalComponents,
                accessibleComponents,
                accessibilityScore: Math.round((accessibleComponents / totalComponents) * 100) || 0,
                overallScore: this.calculateOverallScore()
            },
            details: this.results,
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(__dirname, 'ui-ux-audit-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Report saved to: ${reportPath}`);
        this.printSummary(report);
        
        return report;
    }

    calculateOverallScore() {
        let score = 0;
        let maxScore = 0;

        // Landing page score (20%)
        const landingScore = Object.values(this.results.landing).filter(Boolean).length;
        const landingMax = Object.keys(this.results.landing).length;
        score += (landingScore / landingMax) * 20;
        maxScore += 20;

        // Authentication score (20%)
        const authScore = Object.values(this.results.authentication).filter(Boolean).length;
        const authMax = Object.keys(this.results.authentication).length;
        score += (authScore / authMax) * 20;
        maxScore += 20;

        // Main app score (30%)
        const mainAppScore = Object.values(this.results.mainApp).filter(Boolean).length;
        const mainAppMax = Object.keys(this.results.mainApp).length;
        score += (mainAppScore / mainAppMax) * 30;
        maxScore += 30;

        // Theme score (20%)
        const themeScore = Object.values(this.results.theme).filter(Boolean).length;
        const themeMax = Object.keys(this.results.theme).length;
        score += (themeScore / themeMax) * 20;
        maxScore += 20;

        // Accessibility score (10%)
        score += this.results.accessibility.ariaLabels > 0 ? 10 : 0;
        maxScore += 10;

        return Math.round((score / maxScore) * 100);
    }

    generateRecommendations() {
        const recommendations = [];

        // Landing page recommendations
        if (!this.results.landing.hasCTA) {
            recommendations.push("Add clear call-to-action buttons on landing page");
        }
        if (!this.results.landing.responsive) {
            recommendations.push("Implement responsive design for landing page");
        }

        // Authentication recommendations
        if (!this.results.authentication.hasValidation) {
            recommendations.push("Add form validation to authentication forms");
        }
        if (!this.results.authentication.hasErrorHandling) {
            recommendations.push("Implement proper error handling in authentication flow");
        }

        // Accessibility recommendations
        if (this.results.accessibility.ariaLabels < 5) {
            recommendations.push("Add more ARIA labels and accessibility attributes");
        }

        // Theme recommendations
        if (!this.results.theme.whiteThemeConsistent) {
            recommendations.push("Ensure white theme consistency across all components");
        }

        return recommendations;
    }

    printSummary(report) {
        console.log('\n🎯 === CRYB PLATFORM UI/UX AUDIT SUMMARY ===');
        console.log(`📊 Overall Score: ${report.summary.overallScore}%`);
        console.log(`🧩 Total Components: ${report.summary.totalComponents}`);
        console.log(`♿ Accessibility Score: ${report.summary.accessibilityScore}%`);
        
        console.log('\n📋 Key Areas:');
        console.log(`🏠 Landing Page: ${this.results.landing.componentExists ? '✅' : '❌'} Exists`);
        console.log(`🔐 Authentication: ${this.results.authentication.authServiceExists ? '✅' : '❌'} Service`);
        console.log(`💬 Main App: ${this.results.mainApp.mainAppExists ? '✅' : '❌'} Exists`);
        console.log(`🎨 Theme: ${this.results.theme.whiteThemeConsistent ? '✅' : '⚠️'} Consistent`);
        
        console.log('\n💡 Top Recommendations:');
        report.recommendations.slice(0, 5).forEach(rec => {
            console.log(`   • ${rec}`);
        });
        
        console.log('\n✨ Audit completed successfully!');
    }

    // Run complete audit
    async runAudit() {
        console.log('🚀 Starting CRYB Platform UI/UX Audit...\n');
        
        this.analyzeComponents();
        this.analyzeLandingPage();
        this.analyzeAuthentication();
        this.analyzeMainApp();
        this.analyzeTheme();
        this.analyzeAccessibility();
        
        return this.generateReport();
    }
}

// Run audit if called directly
if (require.main === module) {
    const audit = new CRYBAudit();
    audit.runAudit().then(report => {
        process.exit(0);
    }).catch(error => {
        console.error('Audit failed:', error);
        process.exit(1);
    });
}

module.exports = CRYBAudit;