const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 8000;

const env = {
  SUPABASE_URL: 'https://puqhpgsbyvthttfhbmru.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cWhwZ3NieXZ0aHR0ZmhibXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjQ4MjAsImV4cCI6MjA3MDQ0MDgyMH0.6vatjsBk3ZkvoYRvAwbm8Ogb3ZacJm9bL6dqTX_cckY',
  EMAIL_HOST: 'smtp.protonmail.ch',
  EMAIL_PORT: 587,
  EMAIL_USER: 'play@eggception.club',
  EMAIL_PASS: 'N427C3NWS8RE5PXP',
  EMAIL_FROM: 'play@eggception.club',
  ADMIN_DASHBOARD_URL: 'https://egg-store-admin.vercel.app/dashboard/presets'
};

// Initialize Supabase client
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Create email transporter
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.log('Email transporter error:', error);
  } else {
    console.log('Email server is ready to take messages');
  }
});

// CORS Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'https://egg-store-admin.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Send response email to user
app.post('/api/responseemail', async (req, res) => {
  try {
    console.log('📧 Received email request:', req.body);
    
    const { presetId, action, adminNotes, rejectionReason, germanTitle, authorEmail, presetImages } = req.body;

    // Validate required fields
    if (!presetId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Preset ID and action are required'
      });
    }

    // Use authorEmail directly
    let userEmail = authorEmail;

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email not found in request'
      });
    }

    console.log(`📧 Using email: ${userEmail}`);
    console.log(`🖼️ Preset images count: ${presetImages ? presetImages.length : 0}`);

    let emailSubject = '';
    let emailHtml = '';

    if (action === 'approve') {
      emailSubject = `🎉 Your Preset Has Been Approved - Eggception`;
      
      // Generate HTML for preset images - 6 images per line
      let imagesHtml = '';
      if (presetImages && presetImages.length > 0) {
        const imageRows = [];
        for (let i = 0; i < presetImages.length; i += 6) {
          const rowImages = presetImages.slice(i, i + 6);
          const rowHtml = `
            <tr>
              ${rowImages.map(imageUrl => `
                <td style="padding: 8px; text-align: center; vertical-align: top;">
                  <img 
                    src="${imageUrl}" 
                    alt="Preset preview" 
                    style="width: 85px; height: 85px; object-fit: cover; border-radius: 8px;"
                  />
                </td>
              `).join('')}
              ${Array(6 - rowImages.length).fill('<td style="width: 85px;"></td>').join('')}
            </tr>
          `;
          imageRows.push(rowHtml);
        }
        
        imagesHtml = `
          <div style="margin: 25px 0;">
            <h3 style="color: #000000; margin-bottom: 15px; font-size: 16px; font-weight: 600;">Your Preset Images:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${imageRows.join('')}
            </table>
          </div>
        `;
      }
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    line-height: 1.6; 
                    color: #000000; 
                    background-color: #ffffff; 
                    margin: 0; 
                    padding: 0; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 30px 20px; 
                    background-color: #ffffff; 
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .title { 
                    color: #000000; 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin: 0 0 10px 0;
                }
                .subtitle {
                    color: #666666;
                    font-size: 16px;
                    margin: 0;
                }
                .content {
                    margin: 25px 0;
                }
                .preset-info {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .info-label {
                    font-weight: 600;
                    color: #000000;
                    margin-bottom: 5px;
                }
                .info-value {
                    color: #333333;
                    margin-bottom: 12px;
                }
                .success-message {
                    background-color: #d4edda;
                    color: #155724;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    border-left: 4px solid #28a745;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #f0f0f0; 
                    font-size: 12px; 
                    text-align: center;
                    color: #666666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="title">🎉 Congratulations!</div>
                    <div class="subtitle">Your preset has been approved</div>
                </div>
                
                <div class="content">
                    <div class="success-message">
                        <strong>Great news!</strong> Your preset has been approved and will be published publicly in the Eggception store.
                    </div>

                    <div class="preset-info">
                        <div class="info-label">German Title:</div>
                        <div class="info-value">${germanTitle || 'N/A'}</div>
                        
                      
                    </div>

                    ${imagesHtml}

                    ${adminNotes ? `
                    <div style="margin: 25px 0;">
                        <div class="info-label">Admin Notes:</div>
                        <div style="color: #333333; margin-top: 8px; padding: 12px; background-color: #f8f9fa; border-radius: 6px;">
                            ${adminNotes}
                        </div>
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #666666; font-size: 14px;">
                            Thank you for contributing to the Eggception community! 🥚
                        </p>
                    </div>
                </div>

                <div class="footer">
                    <p>Eggception Team</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (action === 'reject') {
      emailSubject = `Your Preset Needs Changes - Eggception`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: 'Arial', sans-serif; 
                    line-height: 1.6; 
                    color: #000000; 
                    background-color: #ffffff; 
                    margin: 0; 
                    padding: 0; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 30px 20px; 
                    background-color: #ffffff; 
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                .title { 
                    color: #000000; 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin: 0 0 10px 0;
                }
                .content {
                    margin: 25px 0;
                }
                .rejection-info {
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #dc3545;
                }
                .info-label {
                    font-weight: 600;
                    color: #000000;
                    margin-bottom: 8px;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #f0f0f0; 
                    font-size: 12px; 
                    text-align: center;
                    color: #666666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="title">Preset Review Required</div>
                </div>
                
                <div class="content">
                    <div class="rejection-info">
                        <strong>Attention Required:</strong> Your preset needs some changes before it can be published.
                    </div>

                    <div style="margin: 25px 0;">
                        <div class="info-label">Reason for Rejection:</div>
                        <div style="color: #333333; margin-top: 8px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
                            ${rejectionReason || 'No specific reason provided'}
                        </div>
                    </div>

                    ${adminNotes ? `
                    <div style="margin: 25px 0;">
                        <div class="info-label">Admin Notes:</div>
                        <div style="color: #333333; margin-top: 8px; padding: 12px; background-color: #f8f9fa; border-radius: 6px;">
                            ${adminNotes}
                        </div>
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #666666; font-size: 14px;">
                            Please make the necessary changes and resubmit your preset.
                        </p>
                    </div>
                </div>

                <div class="footer">
                    <p>Eggception Team</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "approve" or "reject"'
      });
    }

    // Send email
    const mailOptions = {
      from: `Eggception <${env.EMAIL_FROM}>`,
      to: userEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    console.log(`📧 Sending email to: ${userEmail}`);
    console.log(`🖼️ Including ${presetImages ? presetImages.length : 0} images in approval email`);
    
    try {
      const emailResult = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${userEmail}`);
      console.log(`📫 Message ID: ${emailResult.messageId}`);

      res.json({
        success: true,
        message: `Email sent successfully to ${userEmail}`,
        emailId: emailResult.messageId,
        imagesIncluded: presetImages ? presetImages.length : 0
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('❌ Error in response email API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Email server is running on port 8000',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Email server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/responseemail`);
  console.log(`🌐 Allowed origins: http://localhost:3001, https://egg-store-admin.vercel.app`);
});