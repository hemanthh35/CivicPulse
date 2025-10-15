/**
 * Test Notification Service
 * This script tests the email and SMS notification functionality
 */

require('dotenv').config();
const { sendComplaintResolvedEmail, sendComplaintResolvedSMS } = require('./backend/services/notification.service');

// Sample user data
const testUser = {
  name: 'Test User',
  email: process.env.EMAIL_USER || 'test@example.com', // Send to yourself for testing
  mobile: '+919876543210' // Change this to your number for SMS testing
};

// Sample complaint data
const testComplaint = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Broken Street Light on Main Road',
  type: 'Electricity',
  description: 'The street light near the park has been broken for 3 days',
  priority: 'high',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  status: 'resolved'
};

async function testNotifications() {
  console.log('🧪 Testing Notification Service...\n');

  // Test Email
  console.log('📧 Testing Email Notification...');
  console.log(`Sending to: ${testUser.email}\n`);
  
  const emailResult = await sendComplaintResolvedEmail(testUser, testComplaint);
  
  if (emailResult.success) {
    console.log('✅ Email sent successfully!');
    console.log(`Message ID: ${emailResult.messageId}\n`);
  } else {
    console.log('❌ Email failed to send');
    console.log(`Error: ${emailResult.error}\n`);
  }

  // Test SMS (only if Twilio is configured)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    console.log('📱 Testing SMS Notification...');
    console.log(`Sending to: ${testUser.mobile}\n`);
    
    const smsResult = await sendComplaintResolvedSMS(testUser, testComplaint);
    
    if (smsResult.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`Message ID: ${smsResult.messageId}\n`);
    } else {
      console.log('❌ SMS failed to send');
      console.log(`Error: ${smsResult.error}\n`);
    }
  } else {
    console.log('ℹ️ Twilio not configured. Skipping SMS test.');
    console.log('To test SMS, add TWILIO credentials to .env file\n');
  }

  console.log('🏁 Test completed!');
  process.exit(0);
}

// Run the test
testNotifications().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
