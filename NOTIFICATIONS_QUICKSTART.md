# 📧 Automatic Notification System

## Quick Start

Your CivicPulse app now automatically notifies users when their complaints are resolved!

### What You Need:

1. **Email notifications** (Required):
   - Gmail account
   - App password from Google

2. **SMS notifications** (Optional):
   - Twilio account (free trial available)

---

## Setup in 5 Minutes ⚡

### Step 1: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Click **App passwords**
4. Select **Mail** → **Other** → Name it "CivicPulse"
5. Copy the 16-character password

### Step 2: Update .env File

```bash
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your 16-char app password
FRONTEND_URL=http://localhost:4200
```

### Step 3: Test It!

```bash
# Install packages
npm install

# Test the notification system
node test-notifications.js

# Start your server
npm start
```

---

## How It Works 🔄

1. **User creates complaint** → System saves email/mobile
2. **Worker resolves issue** → Marks as "resolved"
3. **Automatic notification** → Email & SMS sent instantly! 📧📱
4. **User gets notified** → Beautiful email with all details

---

## Email Preview

The email includes:
- ✅ Status badge (RESOLVED)
- 📋 Complete complaint details
- 📅 Reported and resolved dates
- 🔗 Link to view in dashboard
- 🎨 Professional responsive design

---

## Testing Your Setup

### Quick Test:
```bash
node test-notifications.js
```

This will:
- ✅ Send a test email to yourself
- ✅ Verify configuration is correct
- ✅ Show any errors if something is wrong

### Full Test:
1. Create a complaint as a citizen
2. Login as a worker
3. Mark complaint as resolved
4. Check your email! 📧

---

## Production Deployment (Render)

Add these to Render Environment Variables:

```
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=https://civicpulse-ggwz.onrender.com
```

---

## SMS Setup (Optional)

### Free Trial:
1. Sign up at https://www.twilio.com/try-twilio
2. Get $15 free credit
3. Get a phone number

### Add to .env:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Troubleshooting

### Email not working?
- ✅ Use App Password, NOT regular password
- ✅ Enable 2-Step Verification in Google
- ✅ Check for error logs in terminal

### SMS not working?
- ✅ Verify phone numbers in Twilio trial
- ✅ Check format: +1234567890
- ✅ Make sure you have credit

---

## Cost

- **Email**: FREE ✅ (500/day with Gmail)
- **SMS**: ~$0.0079 per message (after $15 free trial)

---

## Need Help?

Read the full guide: [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md)

---

**That's it! Your users will now get notified automatically when their issues are resolved! 🎉**
