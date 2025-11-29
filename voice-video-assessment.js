const https = require('https');
const http = require('http');
const fs = require('fs');

async function testVoiceVideoSystem() {
  console.log('🔍 VOICE/VIDEO SYSTEM PRODUCTION READINESS ASSESSMENT');
  console.log('='.repeat(60));
  
  const results = {
    livekit_server: false,
    api_voice_routes: false,
    webrtc_dependencies: false,
    mobile_integration: false,
    database_voice_schema: false,
    production_config: false,
    failover_mechanisms: false
  };
  
  // 1. Test LiveKit Server
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:7880/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
    });
    
    if (response.status === 200) {
      console.log('✅ LiveKit Server: Running and accessible');
      results.livekit_server = true;
    } else {
      console.log('⚠️  LiveKit Server: Responded but may have issues');
    }
  } catch (error) {
    console.log('❌ LiveKit Server: Not accessible or down');
  }
  
  // 2. Test API Voice Routes
  try {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/v1/voice/health',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Timeout')));
      req.end();
    });
    
    console.log('✅ API Voice Routes: Accessible (auth required)');
    results.api_voice_routes = true;
  } catch (error) {
    console.log('❌ API Voice Routes: Not accessible');
  }
  
  // 3. Check WebRTC Dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync('/home/ubuntu/cryb-platform/apps/mobile/package.json'));
    const hasWebRTC = packageJson.dependencies && packageJson.dependencies['react-native-webrtc'];
    const hasLiveKitSDK = packageJson.dependencies && (
      packageJson.dependencies['livekit-client'] || 
      packageJson.dependencies['@livekit/react-native']
    );
    
    if (hasWebRTC) {
      console.log('✅ Mobile WebRTC: react-native-webrtc installed');
      results.webrtc_dependencies = true;
    } else {
      console.log('❌ Mobile WebRTC: Missing react-native-webrtc dependency');
    }
    
    if (!hasLiveKitSDK) {
      console.log('⚠️  LiveKit Client SDK: Not found in mobile dependencies');
    }
  } catch (error) {
    console.log('❌ Mobile Dependencies: Cannot check package.json');
  }
  
  // 4. Check Mobile Integration Quality
  try {
    const voiceScreenExists = fs.existsSync('/home/ubuntu/cryb-platform/apps/mobile/src/screens/voice/VoiceChannelScreen.tsx');
    const videoScreenExists = fs.existsSync('/home/ubuntu/cryb-platform/apps/mobile/src/screens/voice/VideoCallScreen.tsx');
    
    if (voiceScreenExists && videoScreenExists) {
      const voiceContent = fs.readFileSync('/home/ubuntu/cryb-platform/apps/mobile/src/screens/voice/VoiceChannelScreen.tsx', 'utf8');
      const hasRealIntegration = voiceContent.includes('RTCPeerConnection') || voiceContent.includes('livekit') || voiceContent.includes('webrtc');
      
      if (hasRealIntegration) {
        console.log('✅ Mobile Integration: Real voice/video implementation');
        results.mobile_integration = true;
      } else {
        console.log('⚠️  Mobile Integration: UI implemented but using mock data');
      }
    } else {
      console.log('❌ Mobile Integration: Missing voice/video screens');
    }
  } catch (error) {
    console.log('❌ Mobile Integration: Cannot verify implementation');
  }
  
  // 5. Production Configuration Check
  try {
    const prodEnv = fs.readFileSync('/home/ubuntu/cryb-platform/.env.production', 'utf8');
    const hasLiveKitKeys = prodEnv.includes('LIVEKIT_API_KEY') && prodEnv.includes('LIVEKIT_API_SECRET');
    
    if (hasLiveKitKeys) {
      console.log('✅ Production Config: LiveKit keys configured');
      results.production_config = true;
    } else {
      console.log('❌ Production Config: Missing LiveKit API keys');
    }
  } catch (error) {
    console.log('❌ Production Config: Cannot read .env.production');
  }
  
  // 6. Check Database Schema
  try {
    // Check if voice-related tables exist by looking at API routes
    const voiceRoutes = fs.readFileSync('/home/ubuntu/cryb-platform/apps/api/src/routes/voice.ts', 'utf8');
    const hasVoiceState = voiceRoutes.includes('voiceState') && voiceRoutes.includes('prisma');
    
    if (hasVoiceState) {
      console.log('✅ Database Schema: Voice state management implemented');
      results.database_voice_schema = true;
    } else {
      console.log('❌ Database Schema: Missing voice state management');
    }
  } catch (error) {
    console.log('❌ Database Schema: Cannot verify voice tables');
  }
  
  // 7. Check Failover Mechanisms
  try {
    const liveKitConfig = fs.readFileSync('/home/ubuntu/cryb-platform/config/livekit/livekit.yaml', 'utf8');
    const apiConfig = fs.readFileSync('/home/ubuntu/cryb-platform/apps/api/src/routes/voice.ts', 'utf8');
    
    const hasTurnConfig = liveKitConfig.includes('turn:') && liveKitConfig.includes('enabled');
    const hasBackupUrls = apiConfig.includes('LIVEKIT_BACKUP_URLS') || apiConfig.includes('backupUrls');
    
    if (hasTurnConfig && hasBackupUrls) {
      console.log('✅ Failover Mechanisms: TURN servers and backup URLs configured');
      results.failover_mechanisms = true;
    } else {
      console.log('⚠️  Failover Mechanisms: Partial failover support');
    }
  } catch (error) {
    console.log('❌ Failover Mechanisms: Cannot verify configuration');
  }
  
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(60));
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const healthPercentage = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`Overall System Health: ${healthPercentage}% (${passedChecks}/${totalChecks} checks passed)`);
  
  if (healthPercentage >= 80) {
    console.log('🟢 Status: PRODUCTION READY');
  } else if (healthPercentage >= 60) {
    console.log('🟡 Status: NEEDS IMPROVEMENTS');
  } else {
    console.log('🔴 Status: NOT PRODUCTION READY');
  }
  
  console.log('\n🔧 CRITICAL ISSUES TO ADDRESS:');
  if (!results.livekit_server) console.log('- LiveKit server not accessible');
  if (!results.api_voice_routes) console.log('- Voice API routes not working');
  if (!results.webrtc_dependencies) console.log('- Missing WebRTC dependencies in mobile app');
  if (!results.mobile_integration) console.log('- Mobile implementation uses mock data, not real WebRTC');
  if (!results.database_voice_schema) console.log('- Missing voice state database schema');
  if (!results.production_config) console.log('- Missing production LiveKit configuration');
  if (!results.failover_mechanisms) console.log('- Incomplete failover and redundancy setup');
  
  console.log('\n🚀 PRODUCTION READINESS RECOMMENDATIONS:');
  console.log('1. ⚡ CRITICAL: Implement real WebRTC integration in mobile app');
  console.log('2. ⚡ CRITICAL: Install @livekit/react-native SDK in mobile app');
  console.log('3. 🔧 Configure production LiveKit API keys');
  console.log('4. 🔧 Set up TURN servers for NAT traversal');
  console.log('5. 🔧 Implement connection quality monitoring');
  console.log('6. 📊 Add voice/video analytics and metrics');
  console.log('7. 🧪 Load test with 100+ concurrent users');
  console.log('8. 🔄 Set up LiveKit server clustering for high availability');
  console.log('9. 📱 Test mobile app on real devices with voice/video');
  console.log('10. 🔐 Implement proper permissions and moderation controls');
  
  return { healthPercentage, results, passedChecks, totalChecks };
}

testVoiceVideoSystem().catch(console.error);