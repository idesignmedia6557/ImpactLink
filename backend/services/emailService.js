/**
 * Email Service for ImpactLink
 * Handles all email notifications using Nodemailer
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to ImpactLink!',
    html: `
      <h1>Welcome to ImpactLink, ${name}!</h1>
      <p>Thank you for joining our transparent micro-donation platform.</p>
      <p>You can now start making a difference by supporting verified charity projects.</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  donationReceived: (name, amount, projectName) => ({
    subject: 'Donation Received - Thank You!',
    html: `
      <h1>Thank You for Your Donation!</h1>
      <p>Dear ${name},</p>
      <p>We have received your donation of <strong>$${amount.toFixed(2)}</strong> to the project "${projectName}".</p>
      <p>Your contribution will make a real impact. You can track the progress of this project in your dashboard.</p>
      <p>Receipt and tax information are available in your account.</p>
      <p>Thank you for your generosity!</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  donationFailed: (name, reason) => ({
    subject: 'Donation Payment Failed',
    html: `
      <h1>Payment Failed</h1>
      <p>Dear ${name},</p>
      <p>Unfortunately, your recent donation payment could not be processed.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please try again using a different payment method or contact your bank for assistance.</p>
      <p>If you continue experiencing issues, please contact our support team.</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  projectUpdate: (name, projectName, updateTitle) => ({
    subject: `New Update: ${projectName}`,
    html: `
      <h1>Project Update</h1>
      <p>Dear ${name},</p>
      <p>The project "${projectName}" that you supported has a new update:</p>
      <p><strong>${updateTitle}</strong></p>
      <p>Log in to your dashboard to read the full update and see the impact of your contribution.</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  impactReport: (name, projectName, reportTitle) => ({
    subject: `Impact Report Available: ${projectName}`,
    html: `
      <h1>New Impact Report</h1>
      <p>Dear ${name},</p>
      <p>A new impact report is available for "${projectName}":</p>
      <p><strong>${reportTitle}</strong></p>
      <p>This report shows how your donation has been used and the outcomes achieved.</p>
      <p>View the full report in your dashboard to see the transparency and accountability you helped support.</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  recurringDonationConfirmation: (name, amount, frequency, projectName) => ({
    subject: 'Recurring Donation Set Up Successfully',
    html: `
      <h1>Recurring Donation Confirmed</h1>
      <p>Dear ${name},</p>
      <p>Your recurring donation has been set up successfully:</p>
      <ul>
        <li><strong>Amount:</strong> $${amount.toFixed(2)}</li>
        <li><strong>Frequency:</strong> ${frequency}</li>
        <li><strong>Project:</strong> ${projectName}</li>
      </ul>
      <p>You will receive a confirmation email each time a donation is processed.</p>
      <p>You can manage your recurring donations anytime from your dashboard.</p>
      <p>Thank you for your ongoing support!</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  recurringDonationCancelled: (name, projectName) => ({
    subject: 'Recurring Donation Cancelled',
    html: `
      <h1>Recurring Donation Cancelled</h1>
      <p>Dear ${name},</p>
      <p>Your recurring donation to "${projectName}" has been cancelled as requested.</p>
      <p>We hope you'll continue to support other projects on ImpactLink.</p>
      <p>You can always set up new recurring donations from your dashboard.</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  charityVerified: (charityName, email) => ({
    subject: 'Your Charity Has Been Verified!',
    html: `
      <h1>Congratulations!</h1>
      <p>Dear ${charityName} Team,</p>
      <p>Your charity organization has been successfully verified on ImpactLink!</p>
      <p>You can now:</p>
      <ul>
        <li>Create and manage projects</li>
        <li>Receive donations from supporters</li>
        <li>Post updates and impact reports</li>
        <li>Access your charity dashboard</li>
      </ul>
      <p>Log in to get started and create your first project.</p>
      <p>Welcome to the ImpactLink community!</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  }),

  passwordReset: (name, resetLink) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Dear ${name},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password (valid for 1 hour):</p>
      <p><a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      <p>For security reasons, this link will expire in 1 hour.</p>
      <p>Best regards,<br>The ImpactLink Team</p>
    `
  })
};

/**
 * Send email function
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<Object>} - Email send result
 */
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'ImpactLink'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * Send welcome email
 */
async function sendWelcomeEmail(email, name) {
  const template = emailTemplates.welcome(name);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send donation received confirmation
 */
async function sendDonationReceivedEmail(email, name, amount, projectName) {
  const template = emailTemplates.donationReceived(name, amount, projectName);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send donation failed notification
 */
async function sendDonationFailedEmail(email, name, reason) {
  const template = emailTemplates.donationFailed(name, reason);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send project update notification
 */
async function sendProjectUpdateEmail(email, name, projectName, updateTitle) {
  const template = emailTemplates.projectUpdate(name, projectName, updateTitle);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send impact report notification
 */
async function sendImpactReportEmail(email, name, projectName, reportTitle) {
  const template = emailTemplates.impactReport(name, projectName, reportTitle);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send recurring donation confirmation
 */
async function sendRecurringDonationConfirmation(email, name, amount, frequency, projectName) {
  const template = emailTemplates.recurringDonationConfirmation(name, amount, frequency, projectName);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send recurring donation cancellation confirmation
 */
async function sendRecurringDonationCancellation(email, name, projectName) {
  const template = emailTemplates.recurringDonationCancelled(name, projectName);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send charity verification notification
 */
async function sendCharityVerifiedEmail(email, charityName) {
  const template = emailTemplates.charityVerified(charityName, email);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetLink) {
  const template = emailTemplates.passwordReset(name, resetLink);
  return sendEmail(email, template.subject, template.html);
}

/**
 * Verify email configuration
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendDonationReceivedEmail,
  sendDonationFailedEmail,
  sendProjectUpdateEmail,
  sendImpactReportEmail,
  sendRecurringDonationConfirmation,
  sendRecurringDonationCancellation,
  sendCharityVerifiedEmail,
  sendPasswordResetEmail,
  verifyEmailConfig
};
