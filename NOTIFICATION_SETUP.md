# Automatic Notification System Setup

## Overview
CivicPulse now includes an automatic notification system that sends emails and SMS messages to users when their complaints are resolved!

## Features
✅ **Email Notifications** - Beautiful HTML emails sent when issues are resolved
✅ **SMS Notifications** - Text messages via Twilio (optional)
✅ **Automatic Triggers** - Notifications sent automatically when worker marks complaint as "resolved"
✅ **User Information** - Uses email and mobile number from user profile

---

## Email Setup (Gmail)

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** > **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Click **Create** and select:
   - App: **Mail**
   - Device: **Other** (name it "CivicPulse")
5. Copy the 16-character password generated

### Step 2: Update .env File

Add these lines to your `.env` file:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Frontend URL (for links in emails)
FRONTEND_URL=http://localhost:4200
```

**For Production (Render):**
```env
FRONTEND_URL=https://civicpulse-ggwz.onrender.com
```

---

## SMS Setup (Twilio - Optional)

### Step 1: Create Twilio Account

1. Sign up at https://www.twilio.com/try-twilio
2. Get a **free trial account** ($15 credit)
3. Get a Twilio phone number

### Step 2: Get Credentials

1. Go to Twilio Console: https://console.twilio.com/
2. Find your:
   - **Account SID**
   - **Auth Token**
   - **Phone Number**

### Step 3: Update .env File

Add these lines to your `.env` file:

```env
# SMS Configuration (Twilio - Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** SMS is optional. If you don't configure Twilio, only emails will be sent.

---

## Environment Variables (Complete List)

Your `.env` file should look like this:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://23eg107e37_db_user:D9vvxhOO3eQSAXkv@cluster0.m5vgxsi.mongodb.net/civicpulse

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Frontend URL
FRONTEND_URL=http://localhost:4200

# SMS Configuration (Twilio - Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## How It Works

### 1. User Reports Issue
- User creates a complaint with their email and mobile number
- Complaint is saved in the database

### 2. Worker Resolves Issue
- Worker assigned to the complaint marks it as "resolved"
- Worker can optionally upload resolution proof (before/after photos)

### 3. Automatic Notification Sent
- System automatically detects status change to "resolved"
- Sends beautiful HTML email to user's email address
- Sends SMS to user's mobile number (if Twilio configured)

### 4. User Receives Notification
**Email includes:**
- ✅ Complaint title and description
- ✅ Category and priority
- ✅ Reported date and resolved date
- ✅ Link to view complaint details
- ✅ Beautiful responsive design

**SMS includes:**
- ✅ Brief message confirming resolution
- ✅ Complaint title

---

## Testing Notifications

### Test Email Locally:

1. Update your `.env` with Gmail credentials
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Create a complaint as a citizen/student
5. Login as a worker
6. Mark the complaint as "resolved"
7. Check the email inbox! 📧

### Test SMS (Optional):

1. Add Twilio credentials to `.env`
2. Make sure user has a valid mobile number in their profile
3. Follow same steps as email testing
4. Check your phone! 📱

---

## Email Template Preview

The email includes:
- 🎨 Professional gradient header
- ✅ Resolved status badge
- 📋 Complete complaint details
- 🔗 Link to view in dashboard
- 📱 Mobile-responsive design

---

## Production Deployment (Render)

### Add Environment Variables in Render:

1. Go to your Render Dashboard
2. Select your service (civicpulse)
3. Go to **Environment** tab
4. Add these variables:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=https://civicpulse-ggwz.onrender.com
   TWILIO_ACCOUNT_SID=your_account_sid (optional)
   TWILIO_AUTH_TOKEN=your_auth_token (optional)
   TWILIO_PHONE_NUMBER=+1234567890 (optional)
   ```

5. Click **Save Changes**
6. Render will automatically redeploy

---

## Alternative Email Services

Instead of Gmail, you can use:

### 1. **SendGrid** (Recommended for Production)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
```

### 2. **Mailgun**
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.mailgun.org
```

### 3. **AWS SES** (Amazon Simple Email Service)
```env
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
```

---

## Troubleshooting

### Email Not Sending?

1. **Check Gmail App Password:**
   - Make sure 2-Step Verification is enabled
   - Generate a new app password if needed
   - Don't use your regular Gmail password!

2. **Check Environment Variables:**
   ```bash
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   ```

3. **Check Server Logs:**
   - Look for `✅ Email sent` or `❌ Error sending email`
   - Check for any error messages

4. **Gmail Security:**
   - Gmail might block less secure apps
   - Use App Password instead of regular password

### SMS Not Sending?

1. **Verify Twilio Credentials:**
   - Check Account SID and Auth Token
   - Verify phone number format: +1234567890

2. **Trial Account Limitations:**
   - Twilio trial can only send to verified numbers
   - Verify recipient phone numbers in Twilio console

3. **Check Logs:**
   - Look for `✅ SMS sent` or `❌ Error sending SMS`

---

## Cost Information

### Email (Gmail):
- **FREE** ✅
- Up to 500 emails/day with Gmail
- No cost for basic usage

### SMS (Twilio):
- **$15 Free Trial Credit** 🎁
- ~$0.0079/SMS in the US
- ~$0.0040/SMS in India
- After trial: Pay-as-you-go pricing

### Recommended for Production:
- **Email:** SendGrid (12,000 free emails/month)
- **SMS:** Twilio or SNS (Amazon)

---

## Features Coming Soon

🔜 In-app notifications (real-time)
🔜 Notification when complaint is assigned
🔜 Notification when complaint is in-progress
🔜 User notification preferences (email/SMS/in-app)
🔜 Admin notification dashboard

---

## Support

If you have any questions or issues:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first before SMS
4. Make sure user profile has valid email/mobile number

Happy notifying! 🎉📧📱
