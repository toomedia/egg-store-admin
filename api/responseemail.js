const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8000;

const env = {
  SUPABASE_URL: 'https://puqhpgsbyvthttfhbmru.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1cWhwZ3NieXZ0aHR0ZmhibXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjQ4MjAsImV4cCI6MjA3MDQ0MDgyMH0.6vatjsBk3ZkvoYRvAwbm8Ogb3ZacJm9bL6dqTX_cckY',
  EMAIL_HOST: 'smtp.protonmail.ch',
  EMAIL_PORT: 587,
  EMAIL_USER: 'play@eggception.club',
  EMAIL_PASS: 'N427C3NWS8RE5PXP',
  EMAIL_FROM: 'play@eggception.club',
  ADMIN_DASHBOARD_URL: 'https://egg-store-admin.vercel.app/dashboard/presets',
  PORT: 8000,
  NODE_ENV: 'development'
};

// Initialize Supabase client
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Create email transporter - FIXED: createTransport instead of createTransporter
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

// Middleware
app.use(cors());
app.use(express.json());

// Send response email to user
app.post('/api/responseemail', async (req, res) => {
  try {
    const { presetId, action, adminNotes, rejectionReason, germanTitle, germanDescription } = req.body;

    // Validate required fields
    if (!presetId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Preset ID and action are required'
      });
    }

    // Fetch preset details with user profile
    const { data: preset, error: presetError } = await supabase
      .from('presets')
      .select(`
        *,
        profiles (
          email,
          username
        )
      `)
      .eq('id', presetId)
      .single();

    if (presetError || !preset) {
      return res.status(404).json({
        success: false,
        message: 'Preset not found'
      });
    }

    // Get user email from preset
    const userEmail = preset.profiles?.email;
    
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email not found'
      });
    }

    let emailSubject = '';
    let emailHtml = '';

    if (action === 'approve') {
      // Approval email
      emailSubject = `🎉 Your Preset Has Been Approved! - ${preset.preset_name?.en_name || 'Untitled Preset'}`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #e6d281, #d4c070); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { background: #e6d281; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="color: white; margin: 0;">🎉 Preset Approved!</h1>
                </div>
                <div class="content">
                    <h2>Great News!</h2>
                    <p>Your preset "<strong>${preset.preset_name?.en_name || 'Untitled Preset'}</strong>" has been approved and is now live on Eggception!</p>
                    
                    <div class="details">
                        <h3>Preset Details:</h3>
                        <p><strong>English Title:</strong> ${preset.preset_name?.en_name || 'N/A'}</p>
                        <p><strong>German Title:</strong> ${germanTitle || preset.preset_name?.de_name || 'N/A'}</p>
                        <p><strong>Size:</strong> ${preset.preset_size_json?.value || 'N/A'} cards</p>
                        <p><strong>Price:</strong> €${preset.preset_price || '0.00'}</p>
                        ${germanDescription ? `<p><strong>German Description:</strong> ${germanDescription}</p>` : ''}
                    </div>

                    ${adminNotes ? `
                    <div class="details">
                        <h3>📝 Admin Notes:</h3>
                        <p>${adminNotes}</p>
                    </div>
                    ` : ''}

                    <p>Your preset is now available for other users to purchase and enjoy. Thank you for contributing to the Eggception community!</p>
                    
                    <a href="${env.ADMIN_DASHBOARD_URL}" class="button">View Your Presets</a>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        Best regards,<br>
                        The Eggception Team
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;
    } else if (action === 'reject') {
      // Rejection email
      emailSubject = `❌ Your Preset Needs Changes - ${preset.preset_name?.en_name || 'Untitled Preset'}`;
      
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #ff6b6b, #ee5a52); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { background: #e6d281; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="color: white; margin: 0;">❌ Preset Review Required</h1>
                </div>
                <div class="content">
                    <h2>Attention Required</h2>
                    <p>Your preset "<strong>${preset.preset_name?.en_name || 'Untitled Preset'}</strong>" requires some changes before it can be approved.</p>
                    
                    <div class="details">
                        <h3>Preset Details:</h3>
                        <p><strong>Title:</strong> ${preset.preset_name?.en_name || 'N/A'}</p>
                        <p><strong>Size:</strong> ${preset.preset_size_json?.value || 'N/A'} cards</p>
                        <p><strong>Submitted:</strong> ${new Date(preset.created_at).toLocaleDateString()}</p>
                    </div>

                    <div class="details">
                        <h3>📋 Reason for Rejection:</h3>
                        <p>${rejectionReason || 'No specific reason provided.'}</p>
                    </div>

                    ${adminNotes ? `
                    <div class="details">
                        <h3>💡 Suggestions for Improvement:</h3>
                        <p>${adminNotes}</p>
                    </div>
                    ` : ''}

                    <p>Please review the feedback above and resubmit your preset with the necessary changes.</p>
                    
                    <a href="${env.ADMIN_DASHBOARD_URL}" class="button">Update Your Preset</a>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        If you have any questions, please don't hesitate to contact us.<br><br>
                        Best regards,<br>
                        The Eggception Team
                    </p>
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

    const emailResult = await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${userEmail} for preset ${presetId} (${action})`);

    res.json({
      success: true,
      message: `Email sent successfully to ${userEmail}`,
      emailId: emailResult.messageId
    });

  } catch (error) {
    console.error('Error sending response email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});