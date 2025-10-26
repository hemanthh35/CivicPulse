const nodemailer = require('nodemailer');

/**
 * Notification Service
 * Handles email notifications for complaint updates using Gmail SMTP (100% FREE)
 */

// Configure Gmail email transporter
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD // Your Gmail app password
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

/**
 * Send welcome email to new users
 * @param {Object} user - User object with email and name
 */
const sendWelcomeEmail = async (user) => {
  try {
    // Check if Gmail is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Gmail not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file');
      return { success: false, error: 'Email not configured' };
    }

    console.log(`📧 Sending welcome email to: ${user.email}`);
    
    const transporter = createEmailTransporter();
    const fromEmail = process.env.EMAIL_USER;
    
    const mailOptions = {
      from: fromEmail,
      to: user.email,
      subject: '🎉 Welcome to CivicPulse - Thanks for Registering!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .test-notice { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px; color: #856404; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .welcome-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; margin: 20px 0; }
            .feature-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #667eea; border-radius: 4px; }
            .feature-title { font-weight: bold; color: #667eea; font-size: 18px; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .emoji { font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-notice">
              <strong>⚠️ TEST EMAIL - For Development/Presentation Only</strong><br>
              <small>This is a test notification. If you received this by mistake, please disregard. No action required.</small>
            </div>
            <div class="header">
              <div class="emoji">🎉</div>
              <h1>Welcome to CivicPulse, ${user.name}!</h1>
              <p>Thank you for registering and joining our community</p>
            </div>
            <div class="content">
              <p><span class="welcome-badge">REGISTRATION SUCCESSFUL</span></p>
              
              <p style="font-size: 16px;">Hey ${user.name}! 👋</p>
              
              <p>We're excited to have you on board! CivicPulse is your platform to make a real difference in your community.</p>

              <div class="feature-box">
                <div class="feature-title">🚀 What You Can Do:</div>
                <ul>
                  <li><strong>Report Issues:</strong> Easily report civic problems in your area</li>
                  <li><strong>Track Progress:</strong> Monitor the status of your complaints in real-time</li>
                  <li><strong>Get Notifications:</strong> Receive email updates when issues are resolved</li>
                  <li><strong>Make Impact:</strong> Help improve your community, one report at a time</li>
                </ul>
              </div>

              <div class="feature-box">
                <div class="feature-title">📊 Your Account Details:</div>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                <p><strong>Registered On:</strong> ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>

              <p style="margin-top: 20px;">Ready to get started? Login to your account and start making a difference!</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4201'}/login" class="button">
                  Go to Dashboard
                </a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                💡 <strong>Pro Tip:</strong> You'll receive email notifications whenever your reported issues are updated or resolved.
              </p>
            </div>
            <div class="footer">
              <p>Thanks for being part of the change! 🙏</p>
              <p>This is an automated test message from CivicPulse (Development/Presentation Mode)</p>
              <p>© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification when complaint is resolved
 * @param {Object} user - User object with email and name
 * @param {Object} complaint - Complaint object with details
 */
const sendComplaintResolvedEmail = async (user, complaint) => {
  try {
    // Check if Gmail is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Gmail not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file');
      return { success: false, error: 'Email not configured' };
    }

    console.log(`📧 Sending email to: ${user.email}`);
    console.log(`Using Gmail: ${process.env.EMAIL_USER}`);
    
    const transporter = createEmailTransporter();

    const fromEmail = process.env.EMAIL_USER;
    
    const mailOptions = {
      from: fromEmail,
      to: user.email,
      subject: `✅ Your Complaint Has Been Resolved - ${complaint.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .test-notice { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px; color: #856404; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }
            .complaint-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 4px; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-notice">
              <strong>⚠️ TEST EMAIL - For Development/Presentation Only</strong><br>
              <small>This is a test notification. If you received this by mistake, please disregard. No action required.</small>
            </div>
            <div class="header">
              <h1>🎉 Great News, ${user.name}!</h1>
              <p>Your reported issue has been successfully resolved</p>
            </div>
            <div class="content">
              <p><span class="status-badge">RESOLVED</span></p>
              
              <div class="complaint-details">
                <h2>Complaint Details:</h2>
                <div class="detail-row">
                  <span class="label">Title:</span> ${complaint.title}
                </div>
                <div class="detail-row">
                  <span class="label">Category:</span> ${complaint.type}
                </div>
                <div class="detail-row">
                  <span class="label">Description:</span> ${complaint.description}
                </div>
                <div class="detail-row">
                  <span class="label">Priority:</span> ${complaint.priority.toUpperCase()}
                </div>
                <div class="detail-row">
                  <span class="label">Reported On:</span> ${new Date(complaint.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div class="detail-row">
                  <span class="label">Resolved On:</span> ${new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <p>Thank you for being an active citizen and helping make our community better! 🙏</p>
              
              ${complaint.resolutionProof && complaint.resolutionProof.mediaURL ? 
                `<p>The resolution team has provided proof of completion. You can view it in your dashboard.</p>` : 
                ''
              }
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #856404;">📝 How was our service?</h3>
                <p style="margin-bottom: 10px;">We'd love to hear your feedback! Please take a moment to rate the resolution.</p>
                <center>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/complaints?feedback=${complaint._id}" 
                     style="background: #ffc107; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-top: 10px;">
                    ⭐ Rate Our Service
                  </a>
                </center>
              </div>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/complaints" class="button">
                  View Your Complaints
                </a>
              </center>
            </div>
            <div class="footer">
              <p>This is an automated test notification from CivicPulse (Development/Presentation Mode)</p>
              <p>If you received this by mistake, no action is needed. This is part of a college project demonstration.</p>
              <p>© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${user.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};



/**
 * Send OTP email for 2FA
 * @param {Object} user - User object with email and name
 * @param {String} otp - 6-digit OTP code
 */
const send2FAEmail = async (user, otp) => {
  try {
    // Check if Gmail is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Gmail not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file');
      return { success: false, error: 'Email not configured' };
    }

    console.log(`🔐 Sending 2FA OTP to: ${user.email}`);
    
    const transporter = createEmailTransporter();
    const fromEmail = process.env.EMAIL_USER;
    
    const mailOptions = {
      from: fromEmail,
      to: user.email,
      subject: '🔐 Your CivicPulse Login OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 3px solid #667eea; padding: 30px; margin: 25px 0; text-align: center; border-radius: 10px; }
            .otp-code { font-size: 42px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 15px 0; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .security-icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="security-icon">🔐</div>
              <h1>Login Verification Code</h1>
              <p>Two-Factor Authentication</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hello ${user.name}! 👋</p>
              
              <p>We received a login request for your CivicPulse account. To verify it's really you, please use the OTP code below:</p>

              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 2px;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
              </div>

              <p style="text-align: center; font-size: 16px; color: #667eea;">
                <strong>Enter this code in the OTP verification screen to continue.</strong>
              </p>

              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
                <ul style="margin: 10px 0;">
                  <li>Never share this OTP with anyone</li>
                  <li>CivicPulse staff will never ask for your OTP</li>
                  <li>This code expires in 10 minutes</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                📧 <strong>Email:</strong> ${user.email}<br>
                🕐 <strong>Time:</strong> ${new Date().toLocaleString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div class="footer">
              <p>This is an automated security message from CivicPulse</p>
              <p>© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 2FA OTP email sent to ${user.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending 2FA email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to user when complaint status changes
 * @param {Object} user - User object
 * @param {Object} complaint - Complaint object
 * @param {String} newStatus - New status of the complaint
 */
const notifyComplaintStatusChange = async (user, complaint, newStatus) => {
  try {
    const notifications = [];

    if (newStatus === 'resolved') {
      // Send email notification only
      if (user.email) {
        const emailResult = await sendComplaintResolvedEmail(user, complaint);
        notifications.push({ type: 'email', ...emailResult });
      }
    } else if (newStatus === 'in-progress') {
      // Optional: Send notification when work starts
      console.log(`ℹ️ Complaint ${complaint._id} is now in-progress. Notification can be added here.`);
    }

    return notifications;
  } catch (error) {
    console.error('Error in notification service:', error);
    return [];
  }
};

/**
 * Send email notification when complaint is assigned to worker
 * @param {Object} worker - Worker user object
 * @param {Object} complaint - Complaint object
 */
const sendWorkerAssignmentEmail = async (worker, complaint) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Gmail not configured');
      return { success: false, error: 'Email not configured' };
    }

    console.log(`📧 Sending assignment notification to worker: ${worker.email}`);
    
    const transporter = createEmailTransporter();
    const fromEmail = process.env.EMAIL_USER;
    
    const mailOptions = {
      from: fromEmail,
      to: worker.email,
      subject: `🔔 New Complaint Assigned - ${complaint.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .priority-badge { padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; text-transform: uppercase; }
            .priority-high { background: #ef4444; color: white; }
            .priority-medium { background: #f59e0b; color: white; }
            .priority-low { background: #10b981; color: white; }
            .complaint-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 4px; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Assignment</h1>
              <p>You have a new complaint to handle</p>
            </div>
            <div class="content">
              <p>Hello ${worker.name}! 👋</p>
              
              <p>A new complaint has been assigned to you. Please review and take appropriate action.</p>

              <div class="complaint-box">
                <h2 style="margin-top: 0; color: #0f172a;">${complaint.title}</h2>
                
                <div class="detail-row">
                  <span class="label">Priority:</span> 
                  <span class="priority-badge priority-${complaint.priority}">
                    ${complaint.priority.toUpperCase()}
                  </span>
                </div>
                
                <div class="detail-row">
                  <span class="label">Category:</span> ${complaint.type}
                </div>
                
                <div class="detail-row">
                  <span class="label">Description:</span><br>
                  ${complaint.description}
                </div>
                
                <div class="detail-row">
                  <span class="label">Reported By:</span> ${complaint.createdBy?.name || 'Anonymous'}
                </div>
                
                <div class="detail-row">
                  <span class="label">Reported On:</span> ${new Date(complaint.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                
                ${complaint.location ? `
                <div class="detail-row">
                  <span class="label">Location:</span> 
                  Lat: ${complaint.location.lat?.toFixed(4)}, Lng: ${complaint.location.lng?.toFixed(4)}
                </div>
                ` : ''}
              </div>

              <p style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <strong>⏱️ Action Required:</strong><br>
                Please review this complaint and update its status as you make progress. Timely action helps maintain community trust!
              </p>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/worker/assigned-complaints" class="button">
                  View Assignment
                </a>
              </center>
            </div>
            <div class="footer">
              <p>This is an automated notification from CivicPulse Worker Management System</p>
              <p>© ${new Date().getFullYear()} CivicPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Worker assignment email sent to ${worker.email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending worker assignment email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send generic email notification
 * @param {String} to - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} htmlContent - HTML email content
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Check if Gmail is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Gmail not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file');
      return { success: false, error: 'Email not configured' };
    }

    console.log(`📧 Sending email to: ${to}`);
    
    const transporter = createEmailTransporter();
    const fromEmail = process.env.EMAIL_USER;
    
    const mailOptions = {
      from: fromEmail,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendComplaintResolvedEmail,
  notifyComplaintStatusChange,
  send2FAEmail,
  sendEmail,
  sendWorkerAssignmentEmail
};
