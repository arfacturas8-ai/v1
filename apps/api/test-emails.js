// Test Email Script - Send all CRYB email templates for review
// This script sends sample emails of all templates to jhonnyaraya7@gmail.com

const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'therealcryb@gmail.com',
    pass: 'urnc xnci abxl nyvv'
  }
});

const testEmail = 'jhonnyaraya7@gmail.com';
const testUsername = 'TestUser';
const platformUrl = 'https://platform.cryb.ai';

// Email Templates
const templates = {
  verification: {
    subject: 'Verify your CRYB account 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Welcome to CRYB, ${testUsername}! 🎉</h2>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      You're just one step away from joining the next-generation community platform where conversations come alive.
                    </p>
                    <p style="margin: 0 0 32px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      Click the button below to verify your email address and complete your registration:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${platformUrl}/verify-email?token=test123" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px rgba(88, 166, 255, 0.3);">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 8px; color: #7e7e80; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:<br>
                      <span style="color: #58a6ff; word-break: break-all;">${platformUrl}/verify-email?token=test123</span>
                    </p>
                    <p style="margin: 24px 0 0; color: #7e7e80; font-size: 13px; line-height: 1.5;">
                      🔒 This verification link expires in 24 hours for your security.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                      © 2024 CRYB Platform. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                      Didn't create this account? You can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  welcome: {
    subject: 'Welcome to CRYB! Your journey begins now 🚀',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to CRYB, ${testUsername}! 🚀</h2>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      Your account is now fully activated! You're now part of a next-generation community platform where conversations come alive and connections are real.
                    </p>
                    <div style="margin: 32px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 16px; background: rgba(88, 166, 255, 0.1); border-radius: 12px; border-left: 4px solid #58a6ff;">
                            <p style="margin: 0 0 8px; color: #58a6ff; font-size: 18px; font-weight: 600;">💬 Join Communities</p>
                            <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.5;">
                              Discover and join communities that match your interests. From gaming to art, tech to finance - there's something for everyone!
                            </p>
                          </td>
                        </tr>
                        <tr><td style="height: 16px;"></td></tr>
                        <tr>
                          <td style="padding: 16px; background: rgba(163, 113, 247, 0.1); border-radius: 12px; border-left: 4px solid #a371f7;">
                            <p style="margin: 0 0 8px; color: #a371f7; font-size: 18px; font-weight: 600;">💰 Web3 Integration</p>
                            <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.5;">
                              Connect your crypto wallet, send tips, trade NFTs, and participate in token-gated communities. The future is here!
                            </p>
                          </td>
                        </tr>
                        <tr><td style="height: 16px;"></td></tr>
                        <tr>
                          <td style="padding: 16px; background: rgba(52, 211, 153, 0.1); border-radius: 12px; border-left: 4px solid #34d399;">
                            <p style="margin: 0 0 8px; color: #34d399; font-size: 18px; font-weight: 600;">🎤 Voice & Video</p>
                            <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.5;">
                              Join voice channels, start video calls, and connect with your community in real-time. Face-to-face conversations made easy!
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                      <tr>
                        <td align="center">
                          <a href="${platformUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px rgba(88, 166, 255, 0.3);">
                            Explore CRYB Now
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                      <p style="margin: 0 0 12px; color: #ffffff; font-size: 16px; font-weight: 600;">
                        Quick Tips to Get Started:
                      </p>
                      <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.8;">
                        ✓ Complete your profile and add a profile picture<br>
                        ✓ Explore trending communities and join your favorites<br>
                        ✓ Share your first post and connect with others<br>
                        ✓ Enable notifications to stay updated<br>
                        ✓ Connect your wallet to access Web3 features
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                      © 2024 CRYB Platform. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                      You're receiving this email because you created a CRYB account.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  passwordReset: {
    subject: 'Reset your CRYB password 🔐',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Password Reset Request 🔐</h2>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      Hi ${testUsername},
                    </p>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to create a new password for your account:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${platformUrl}/reset-password?token=test456" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px rgba(88, 166, 255, 0.3);">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 8px; color: #7e7e80; font-size: 14px; line-height: 1.6;">
                      Or copy and paste this link into your browser:<br>
                      <span style="color: #58a6ff; word-break: break-all;">${platformUrl}/reset-password?token=test456</span>
                    </p>
                    <div style="margin: 24px 0 0; padding: 20px; background: rgba(255, 59, 48, 0.1); border-left: 4px solid #ff3b30; border-radius: 8px;">
                      <p style="margin: 0 0 8px; color: #ff6b6b; font-size: 14px; font-weight: 600;">
                        ⚠️ Important Security Information
                      </p>
                      <p style="margin: 0; color: #b4b4b5; font-size: 13px; line-height: 1.5;">
                        This password reset link expires in 1 hour for your security.<br>
                        If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                      © 2024 CRYB Platform. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                      This is an automated security email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  passwordChanged: {
    subject: 'Your CRYB password was changed ✅',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #34d399 0%, #10b981 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Password Successfully Changed ✅</h2>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      Hi ${testUsername},
                    </p>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      This email confirms that your CRYB account password was successfully changed. You can now use your new password to log in.
                    </p>
                    <div style="margin: 24px 0; padding: 20px; background: rgba(52, 211, 153, 0.1); border-left: 4px solid #34d399; border-radius: 8px;">
                      <p style="margin: 0 0 8px; color: #34d399; font-size: 14px; font-weight: 600;">
                        ✓ Your account is secure
                      </p>
                      <p style="margin: 0; color: #b4b4b5; font-size: 13px; line-height: 1.5;">
                        Your password has been updated successfully. All existing sessions on other devices remain active.
                      </p>
                    </div>
                    <div style="margin: 24px 0; padding: 20px; background: rgba(255, 59, 48, 0.1); border-left: 4px solid #ff3b30; border-radius: 8px;">
                      <p style="margin: 0 0 8px; color: #ff6b6b; font-size: 14px; font-weight: 600;">
                        ⚠️ Didn't make this change?
                      </p>
                      <p style="margin: 0 0 16px; color: #b4b4b5; font-size: 13px; line-height: 1.5;">
                        If you didn't change your password, someone else may have accessed your account. Please secure your account immediately.
                      </p>
                      <a href="${platformUrl}/settings/security" style="display: inline-block; padding: 12px 24px; background: #ff3b30; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
                        Secure My Account
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                      © 2024 CRYB Platform. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                      This is an automated security email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  securityAlert: {
    subject: 'CRYB Security Alert: Unusual Login Activity 🔒',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0A0B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0A0A0B; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1A1A1B 0%, #2A2A2B 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Security Alert</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Security Alert: Unusual Login Activity 🔒</h2>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      Hi ${testUsername},
                    </p>
                    <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                      We detected unusual activity on your CRYB account and wanted to alert you immediately.
                    </p>
                    <div style="margin: 24px 0; padding: 20px; background: rgba(255, 59, 48, 0.15); border-left: 4px solid #ff3b30; border-radius: 8px;">
                      <p style="margin: 0 0 8px; color: #ff6b6b; font-size: 14px; font-weight: 600;">
                        ⚠️ What happened:
                      </p>
                      <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.6;">
                        A login attempt was detected from a new device in New York, United States using Chrome on Windows. If this wasn't you, please secure your account immediately.
                      </p>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                      <tr>
                        <td align="center">
                          <a href="${platformUrl}/settings/security" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #ff3b30 0%, #ff6b6b 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 8px 24px rgba(255, 59, 48, 0.3);">
                            Review Security Settings
                          </a>
                        </td>
                      </tr>
                    </table>
                    <div style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 12px;">
                      <p style="margin: 0 0 12px; color: #ffffff; font-size: 16px; font-weight: 600;">
                        Recommended Actions:
                      </p>
                      <p style="margin: 0; color: #b4b4b5; font-size: 14px; line-height: 1.8;">
                        ✓ Review your recent account activity<br>
                        ✓ Change your password immediately<br>
                        ✓ Enable two-factor authentication<br>
                        ✓ Check active sessions and logout unfamiliar devices<br>
                        ✓ Contact support if you need assistance
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                    <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                      © 2024 CRYB Platform. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                      This is an automated security email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
};

async function sendTestEmails() {
  console.log('🚀 Starting CRYB Email Template Test...\n');
  console.log(`📧 Sending all templates to: ${testEmail}\n`);

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified\n');

    const templateNames = Object.keys(templates);
    let successCount = 0;

    for (const name of templateNames) {
      try {
        console.log(`📨 Sending ${name} email...`);

        await transporter.sendMail({
          from: 'CRYB Platform <therealcryb@gmail.com>',
          to: testEmail,
          subject: `[TEST] ${templates[name].subject}`,
          html: templates[name].html,
        });

        console.log(`✅ ${name} email sent successfully!\n`);
        successCount++;

        // Wait 2 seconds between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Failed to send ${name} email:`, error.message, '\n');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 Test Complete! ${successCount}/${templateNames.length} emails sent successfully.`);
    console.log(`\n📬 Check ${testEmail} for all email templates.\n`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
sendTestEmails();
