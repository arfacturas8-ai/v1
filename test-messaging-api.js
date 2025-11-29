const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function testMessagingAPI() {
  const prisma = new PrismaClient();
  
  try {
    // Get a real user
    const user = await prisma.user.findFirst({
      select: { id: true, username: true, email: true }
    });
    
    if (!user) {
      console.error('No user found');
      process.exit(1);
    }
    
    console.log('Found user:', user);
    
    // Create JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      },
      secret,
      { expiresIn: '24h' }
    );
    
    console.log('Generated token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Get a test channel
    const channel = await prisma.channel.findFirst({
      where: { type: 'TEXT' },
      select: { id: true, name: true }
    });
    
    console.log('Using channel:', channel);
    
    // Test message creation via REST API
    console.log('\n🧪 Testing REST API message creation...');
    
    const response = await fetch('http://localhost:3002/api/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        channelId: channel.id,
        content: 'Test message via REST API with valid authentication - ' + new Date().toISOString()
      })
    });
    
    const result = await response.json();
    console.log('Message creation result:', result);
    
    if (result.success || result.id) {
      console.log('✅ REST API messaging is working!');
      
      // Test retrieving messages
      console.log('\n🧪 Testing message retrieval...');
      const getResponse = await fetch(`http://localhost:3002/api/v1/messages?channelId=${channel.id}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const messages = await getResponse.json();
      console.log('Retrieved messages:', messages);
      
    } else {
      console.log('❌ REST API messaging failed:', result.error || result);
    }
    
    // Test typing indicators
    console.log('\n🧪 Testing typing indicators...');
    const typingResponse = await fetch(`http://localhost:3002/api/v1/channels/${channel.id}/typing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const typingResult = await typingResponse.json();
    console.log('Typing indicator result:', typingResult);
    
    console.log('\n✅ ALL MESSAGING TESTS COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessagingAPI();