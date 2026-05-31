import nodemailer from 'nodemailer';

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user === 'your_gmail@gmail.com') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};

export const sendVerificationEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verifyLink = `${frontendUrl}/verify-email?token=${token}`;

  console.log(`\n======================================`);
  console.log(`[EMAIL SIMULATOR: VERIFICATION]`);
  console.log(`To: ${email}`);
  console.log(`Link: ${verifyLink}`);
  console.log(`======================================\n`);

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] SMTP settings missing. Verification simulated, logged above.`);
    return;
  }

  const mailOptions = {
    from: `"GU Parking System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - GU Parking Management System',
    html: `
      <h2>Welcome to Galgotias University Parking Management System</h2>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <a href="${verifyLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p>This verification link will expire in 24 hours.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, token, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  console.log(`\n======================================`);
  console.log(`[EMAIL SIMULATOR: PASSWORD RESET]`);
  console.log(`To: ${email}`);
  console.log(`Link: ${resetLink}`);
  if (otp) console.log(`OTP: ${otp}`);
  console.log(`======================================\n`);

  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] SMTP settings missing. Reset email simulated, logged above.`);
    return;
  }

  const mailOptions = {
    from: `"GU Parking System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Password - GU Parking Management System',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Please use the link below to reset your password:</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      ${otp ? `<p>Alternatively, verify with this mobile SMS OTP code: <strong>${otp}</strong></p>` : ''}
      <p>This request expires in 1 hour. If you did not request this, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendResetConfirmationEmail = async (email) => {
  console.log(`\n======================================`);
  console.log(`[EMAIL SIMULATOR: RESET CONFIRMATION]`);
  console.log(`To: ${email}`);
  console.log(`Message: Your password has been successfully reset.`);
  console.log(`======================================\n`);

  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"GU Parking System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Changed Successfully',
    html: `
      <h3>Security Notification</h3>
      <p>Your password was changed successfully. If you did not make this change, please contact the administrator immediately.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendAdminAlert = async (type, details) => {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@smartpark.in';

  console.log(`\n======================================`);
  console.log(`[ADMIN SECURITY ALERT]`);
  console.log(`Type: ${type}`);
  console.log(`Details:`, details);
  console.log(`======================================\n`);

  const transporter = createTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: `"Security System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🚨 [SECURITY ALERT] ${type}`,
    html: `
      <h2>System Security Warning</h2>
      <p>The system detected suspicious activity matching rule: <strong>${type}</strong></p>
      <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px; border-left: 4px solid #ef4444;">${JSON.stringify(details, null, 2)}</pre>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[ALERT EMAIL ERROR] Failed sending admin security alert:', err.message);
  }
};
