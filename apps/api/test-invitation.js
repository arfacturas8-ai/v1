// Test Invitation Email Script
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
const inviterName = 'Johnny';
const invitationCode = 'CRYB-INVITE-' + Math.random().toString(36).substring(2, 10).toUpperCase();
const platformUrl = 'https://platform.cryb.ai';
const invitationUrl = `${platformUrl}/signup?invite=${invitationCode}`;

const invitationTemplate = {
  subject: `${inviterName} invited you to join CRYB! 🎉`,
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
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.02em;">CRYB</h1>
                  <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Next-Generation Community Platform</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 600;">You're Invited! 🎉</h2>
                  <p style="margin: 0 0 24px; color: #b4b4b5; font-size: 16px; line-height: 1.6;">
                    <strong style="color: #58a6ff;">${inviterName}</strong> has invited you to join <strong style="background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">CRYB</strong> - the next-generation community platform where conversations come alive!
                  </p>

                  <!-- Invitation Card -->
                  <div style="margin: 32px 0; padding: 24px; background: rgba(88, 166, 255, 0.08); border-radius: 12px; border: 1px solid rgba(88, 166, 255, 0.2);">
                    <p style="margin: 0 0 16px; color: #ffffff; font-size: 16px; font-weight: 600; text-align: center;">
                      🌟 What Awaits You on CRYB
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0;">
                          <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                            <span style="color: #58a6ff; font-weight: 600;">💬</span> Join vibrant communities and connect with like-minded people
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                            <span style="color: #a371f7; font-weight: 600;">💰</span> Access Web3 features - NFTs, crypto wallets, and token rewards
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                            <span style="color: #34d399; font-weight: 600;">🎤</span> Voice & video calls with real-time conversations
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <p style="margin: 0; color: #b4b4b5; font-size: 14px;">
                            <span style="color: #ff6b6b; font-weight: 600;">🎨</span> Share content, create posts, and express yourself
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
                    <tr>
                      <td align="center">
                        <a href="${invitationUrl}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #58a6ff 0%, #a371f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 18px; font-weight: 700; box-shadow: 0 8px 24px rgba(88, 166, 255, 0.4); letter-spacing: 0.5px;">
                          Accept Invitation & Join CRYB
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Alternative Link -->
                  <p style="margin: 32px 0 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 8px; color: #7e7e80; font-size: 14px; line-height: 1.6; text-align: center;">
                    Or copy and paste this invitation link:<br>
                    <span style="color: #58a6ff; word-break: break-all; font-size: 13px;">${invitationUrl}</span>
                  </p>

                  <!-- Inviter Info -->
                  <div style="margin: 24px 0 0; padding: 20px; background: rgba(163, 113, 247, 0.1); border-left: 4px solid #a371f7; border-radius: 8px;">
                    <p style="margin: 0; color: #b4b4b5; font-size: 13px; line-height: 1.6;">
                      💡 <strong style="color: #ffffff;">${inviterName}</strong> is already part of the CRYB community and thought you'd love it too. Join them and start exploring!
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                  <p style="margin: 0 0 8px; color: #7e7e80; font-size: 13px;">
                    © 2024 CRYB Platform. All rights reserved.
                  </p>
                  <p style="margin: 0; color: #7e7e80; font-size: 12px;">
                    This invitation was sent to ${testEmail}. If you don't want to join, you can safely ignore this email.
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
};

async function sendInvitationEmail() {
  console.log('🚀 Sending CRYB Invitation Email Test...\n');
  console.log(`📧 To: ${testEmail}`);
  console.log(`👤 From: ${inviterName}`);
  console.log(`🎟️  Invitation Code: ${invitationCode}`);
  console.log(`🔗 Invitation URL: ${invitationUrl}\n`);

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified\n');

    console.log('📨 Sending invitation email...');

    await transporter.sendMail({
      from: 'CRYB Platform <therealcryb@gmail.com>',
      to: testEmail,
      subject: `[TEST] ${invitationTemplate.subject}`,
      html: invitationTemplate.html,
    });

    console.log('✅ Invitation email sent successfully!\n');
    console.log('='.repeat(60));
    console.log(`\n🎉 Test Complete!`);
    console.log(`\n📬 Check ${testEmail} for the invitation email.`);
    console.log(`\n🔗 Test the invitation URL: ${invitationUrl}\n`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
sendInvitationEmail();
