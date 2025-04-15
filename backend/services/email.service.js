// backend/services/email.service.js
const nodemailer = require('nodemailer');

// Environment variables should be set in .env file
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.example.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER || 'user@example.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'password';
const EMAIL_FROM = process.env.EMAIL_FROM || 'DAM System <dam@example.com>';

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // For local development/testing without a real SMTP server
  // Comment this out in production!
  ...(process.env.NODE_ENV !== 'production' && {
    tls: {
      rejectUnauthorized: false
    }
  })
});

// Format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Send domain expiry notification
exports.sendDomainExpiryNotification = async (userId, domain, daysUntilExpiry) => {
  try {
    // Get user email
    const [users] = await global.db.query('SELECT email, username FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      console.error(`User with ID ${userId} not found.`);
      return;
    }
    
    const user = users[0];
    
    // Create email content
    const mailOptions = {
      from: EMAIL_FROM,
      to: user.email,
      subject: `Domain Expiry Alert: ${domain.domain_name} expires in ${daysUntilExpiry} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Domain Expiry Alert</h2>
          <p>Hello ${user.username},</p>
          <p>This is an automated notification to remind you that your domain is approaching its expiration date.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Domain:</strong> ${domain.domain_name}</p>
            <p><strong>Expiry Date:</strong> ${formatDate(domain.expiry_date)}</p>
            <p><strong>Days Remaining:</strong> ${daysUntilExpiry}</p>
            <p><strong>Registrar:</strong> ${domain.provider_name || 'Not specified'}</p>
          </div>
          
          <p>Please take action to renew your domain to prevent any service disruption.</p>
          <p>You can manage your domains by logging into your Domain & Account Management System.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Domain expiry notification sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending domain expiry notification:', error);
    throw error;
  }
};

// Send account expiry notification
exports.sendAccountExpiryNotification = async (userId, provider, daysUntilExpiry) => {
  try {
    // Get user email
    const [users] = await global.db.query('SELECT email, username FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      console.error(`User with ID ${userId} not found.`);
      return;
    }
    
    const user = users[0];
    
    // Create email content
    const mailOptions = {
      from: EMAIL_FROM,
      to: user.email,
      subject: `Account Expiry Alert: ${provider.provider_name} account expires in ${daysUntilExpiry} days`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Account Expiry Alert</h2>
          <p>Hello ${user.username},</p>
          <p>This is an automated notification to remind you that your hosting/service account is approaching its expiration date.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Provider:</strong> ${provider.provider_name}</p>
            <p><strong>Account:</strong> ${provider.username || 'Not specified'}</p>
            <p><strong>Expiry Date:</strong> ${formatDate(provider.account_expiry_date)}</p>
            <p><strong>Days Remaining:</strong> ${daysUntilExpiry}</p>
          </div>
          
          <p>Please take action to renew your account to prevent any service disruption.</p>
          <p>You can manage your accounts by logging into your Domain & Account Management System.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Account expiry notification sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending account expiry notification:', error);
    throw error;
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    // Create email content
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498db;">Password Reset Request</h2>
          <p>You requested a password reset for your Domain & Account Management System account.</p>
          <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Test email configuration
exports.testEmailConfig = async () => {
  try {
    const testResult = await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { success: false, message: error.message };
  }
};