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
    
    const { presetId, action, adminNotes, rejectionReason, germanTitle, germanDescription, authorEmail } = req.body;

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

    let emailSubject = '';
    let emailHtml = '';

    if (action === 'approve') {
      emailSubject = `Your Preset Has Been Approved`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
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
                .header { 
                    padding: 20px 0; 
                    text-align: center; 
                    border-bottom: 1px solid #eeeeee; 
                    margin-bottom: 20px; 
                }
                .content { 
                    padding: 0; 
                }
                .details { 
                    margin: 20px 0; 
                    padding: 15px; 
                    background-color: #f8f8f8; 
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eeeeee; 
                    font-size: 14px; 
                    color: #666666; 
                }
                h1, h2, h3 { 
                    color: #000000; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Preset Approved</h1>
                </div>
                <div class="content">
                    <h2>Great News!</h2>
                    <p>Dear user, your preset has been approved and is now live on Eggception!</p>
                    
                    <div class="details">
                        <h3>Preset Details:</h3>
                        <p><strong>German Title:</strong> ${germanTitle || 'N/A'}</p>
                        <p><strong>German Description:</strong> ${germanDescription || 'N/A'}</p>
                    </div>

                    ${adminNotes ? `
                    <div class="details">
                        <h3>Admin Notes:</h3>
                        <p>${adminNotes}</p>
                    </div>
                    ` : ''}

                    <p>Your preset is now available for other users to purchase and enjoy. Thank you for contributing to the Eggception community!</p>
                </div>
                
                <div class="footer">
                    <p>Best regards,<br>The Eggception Team</p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (action === 'reject') {
      emailSubject = `Your Preset Has Been Rejected`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.6; 
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
                .header { 
                    padding: 20px 0; 
                    text-align: center; 
                    border-bottom: 1px solid #eeeeee; 
                    margin-bottom: 20px; 
                }
                .content { 
                    padding: 0; 
                }
                .details { 
                    margin: 20px 0; 
                    padding: 15px; 
                    background-color: #f8f8f8; 
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 20px; 
                    border-top: 1px solid #eeeeee; 
                    font-size: 14px; 
                    color: #666666; 
                }
                h1, h2, h3 { 
                    color: #000000; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Preset Rejected</h1>
                </div>
                <div class="content">
                    <h2>Attention Required</h2>
                    <p>Dear user, your preset has been rejected.</p>

                    <div class="details">
                        <h3>Reason for Rejection:</h3>
                        <p>${rejectionReason || 'No specific reason provided.'}</p>
                    </div>

                    ${adminNotes ? `
                    <div class="details">
                        <h3>Admin Notes:</h3>
                        <p>${adminNotes}</p>
                    </div>
                    ` : ''}

                    <p>Please review the feedback above and make necessary changes to your preset.</p>
                </div>
                
                <div class="footer">
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    <p>Best regards,<br>The Eggception Team</p>
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
    
    try {
      const emailResult = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${userEmail}`);
      console.log(`📫 Message ID: ${emailResult.messageId}`);

      res.json({
        success: true,
        message: `Email sent successfully to ${userEmail}`,
        emailId: emailResult.messageId
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

// Test endpoint
app.post('/api/test', (req, res) => {
  console.log('Test endpoint hit:', req.body);
  res.json({ 
    success: true, 
    message: 'Test endpoint working',
    received: req.body
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Email server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/responseemail`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🌐 Allowed origins: http://localhost:3001, https://egg-store-admin.vercel.app`);
});