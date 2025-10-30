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
    
    const { presetId, action, adminNotes, rejectionReason, germanTitle, germanDescription, authorEmail, presetImages } = req.body;

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
              ${rowImages.map((imageUrl, index) => `
                <td style="padding: 5px; text-align: center; vertical-align: top;">
                  <img 
                    src="${imageUrl}" 
                    alt="Image ${i + index + 1}" 
                    style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #000000;"
                  />
                  <div style="font-size: 10px; margin-top: 2px; color: #000000;">${i + index + 1}</div>
                </td>
              `).join('')}
              ${Array(6 - rowImages.length).fill('<td style="width: 80px;"></td>').join('')}
            </tr>
          `;
          imageRows.push(rowHtml);
        }
        
        imagesHtml = `
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            ${imageRows.join('')}
          </table>
        `;
      }
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.4; 
                    color: #000000; 
                    background-color: #ffffff; 
                    margin: 0; 
                    padding: 0; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background-color: #ffffff; 
                }
                h1, h2, h3 { 
                    color: #000000; 
                    margin: 0 0 10px 0;
                }
                p { 
                    margin: 0 0 10px 0; 
                }
                .header { 
                    padding: 20px 0; 
                    text-align: center; 
                    border-bottom: 2px solid #000000; 
                    margin-bottom: 20px; 
                }
                .section { 
                    margin: 15px 0; 
                    padding: 0; 
                }
                .footer { 
                    margin-top: 20px; 
                    padding-top: 15px; 
                    border-top: 1px solid #000000; 
                    font-size: 12px; 
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Preset Approved</h1>
                </div>
                
                <div class="section">
                    <h2>Your preset has been approved</h2>
                    <p><strong>German Title:</strong> ${germanTitle || ''}</p>
                    <p><strong>German Description:</strong> ${germanDescription || ''}</p>
                </div>

                ${imagesHtml}

                ${adminNotes ? `
                <div class="section">
                    <h3>Admin Notes:</h3>
                    <p>${adminNotes}</p>
                </div>
                ` : ''}

                <div class="footer">
                    <p>Eggception Team</p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (action === 'reject') {
      emailSubject = `Preset Rejected - Eggception`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.4; 
                    color: #000000; 
                    background-color: #ffffff; 
                    margin: 0; 
                    padding: 0; 
                }
                .container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background-color: #ffffff; 
                }
                h1, h2, h3 { 
                    color: #000000; 
                    margin: 0 0 10px 0;
                }
                p { 
                    margin: 0 0 10px 0; 
                }
                .header { 
                    padding: 20px 0; 
                    text-align: center; 
                    border-bottom: 2px solid #000000; 
                    margin-bottom: 20px; 
                }
                .section { 
                    margin: 15px 0; 
                    padding: 0; 
                }
                .footer { 
                    margin-top: 20px; 
                    padding-top: 15px; 
                    border-top: 1px solid #000000; 
                    font-size: 12px; 
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Preset Rejected</h1>
                </div>
                
                <div class="section">
                    <h2>Your preset needs changes</h2>
                    <p><strong>Reason:</strong> ${rejectionReason || ''}</p>
                </div>

                ${adminNotes ? `
                <div class="section">
                    <h3>Admin Notes:</h3>
                    <p>${adminNotes}</p>
                </div>
                ` : ''}

                <div class="footer">
                    <p>Eggception Team</p>
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