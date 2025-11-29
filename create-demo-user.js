const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function createDemoUser() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'cryb_user',
    password: 'cryb_password',
    database: 'cryb_platform'
  });

  try {
    // Generate password hash for 'demo123'
    const passwordHash = await bcrypt.hash('demo123', 10);
    
    // Create demo user
    const query = `
      INSERT INTO "User" (
        id,
        email,
        username,
        "displayName",
        "passwordHash",
        "isVerified",
        "createdAt",
        "updatedAt"
      ) VALUES (
        'demo_user_001',
        'demo@cryb.ai',
        'demouser',
        'Demo User',
        $1,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        "passwordHash" = $1,
        "isVerified" = true,
        "updatedAt" = NOW()
      RETURNING id, email, username;
    `;
    
    const result = await pool.query(query, [passwordHash]);
    console.log('Demo user created/updated:', result.rows[0]);
    
  } catch (error) {
    console.error('Error creating demo user:', error);
  } finally {
    await pool.end();
  }
}

createDemoUser();