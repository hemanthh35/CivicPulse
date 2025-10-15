const nodemailer = require('nodemailer');

/**
 * Notification Service
 * Handles email and SMS notifications for complaint updates
 */

// Configure email transporter (using Gmail with explicit settings for better compatibility)
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD // Your email app password
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

/**
 * Send email notification when complaint is resolved
 * @param {Object} user - User object with email and name
 * @param {Object} complaint - Complaint object with details
 */
const sendComplaintResolvedEmail = async (user, complaint) => {
  try {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in environment variables.');
      return { success: false, error: 'Email not configured' };
    }

    console.log(`📧 Attempting to send email to: ${user.email}`);
    console.log(`Using email account: ${process.env.EMAIL_USER}`);
    
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@civicpulse.com',
      to: user.email,
      subject: `✅ Your Complaint Has Been Resolved - ${complaint.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
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
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/complaints" class="button">
                  View Your Complaints
                </a>
              </center>
            </div>
            <div class="footer">
              <p>This is an automated notification from CivicPulse</p>
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
 * Send SMS notification (using Twilio as example)
 * Note: Requires Twilio account and credentials
 * @param {Object} user - User object with mobile number
 * @param {Object} complaint - Complaint object with details
 */
const sendComplaintResolvedSMS = async (user, complaint) => {
  try {
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('ℹ️ Twilio credentials not configured. Skipping SMS notification.');
      return { success: false, error: 'Twilio not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: `Hi ${user.name}! Your complaint "${complaint.title}" has been resolved. Thank you for making our community better! - CivicPulse`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.mobile
    });

    console.log(`✅ SMS sent to ${user.mobile}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
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
      // Send email notification
      if (user.email) {
        const emailResult = await sendComplaintResolvedEmail(user, complaint);
        notifications.push({ type: 'email', ...emailResult });
      }

      // Send SMS notification if mobile number exists
      if (user.mobile) {
        const smsResult = await sendComplaintResolvedSMS(user, complaint);
        notifications.push({ type: 'sms', ...smsResult });
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

module.exports = {
  sendComplaintResolvedEmail,
  sendComplaintResolvedSMS,
  notifyComplaintStatusChange
};
