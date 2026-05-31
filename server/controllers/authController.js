import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { logSystemActivity } from '../utils/logger.js';
import { mockController } from '../utils/mockController.js';
import { sendOTP, generateOTP } from '../utils/smsOtp.js';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendResetConfirmationEmail, 
  sendAdminAlert 
} from '../utils/email.js';

// Password rules: min 8 characters, at least 1 number, at least 1 uppercase letter
const validatePasswordRules = (password) => {
  if (password.length < 8) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  return true;
};

// Generate Access Token (15 mins)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'access_secret_key_123', {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_789', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.register(req, res, next);
  }

  try {
    const { name, email, password, mobile } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email address already exists.' 
      });
    }

    // IP Registration Protection: max 3 per IP per day
    const clientIp = req.ip || '127.0.0.1';
    const ipCount = await User.countDocuments({
      registrationIp: clientIp,
      createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
    });
    if (ipCount >= 3) {
      await sendAdminAlert('IP_REGISTRATION_LIMIT', { ip: clientIp, count: ipCount });
      return res.status(429).json({
        success: false,
        message: "Maximum 3 accounts per IP per day. Contact admin if needed."
      });
    }

    // Password strength rules
    if (!validatePasswordRules(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.'
      });
    }

    const userCount = await User.countDocuments();
    let role = 'user';
    if (userCount === 0) {
      role = 'admin';
    } else if (req.body.role && ['user', 'operator'].includes(req.body.role)) {
      role = req.body.role;
    }

    // Save user with unverified email
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role,
      status: 'active',
      isEmailVerified: false,
      emailVerifyToken,
      emailVerifyExpires,
      mobile: mobile || null,
      isMobileVerified: false,
      registrationIp: clientIp
    });

    await logSystemActivity('REGISTER', `Registered new account: ${user.name} (${user.email}) as role ${user.role}`, user._id);

    // If mobile is provided, trigger Mobile OTP first
    if (mobile) {
      const otp = generateOTP();
      const salt = await bcrypt.genSalt(10);
      user.mobileOtp = await bcrypt.hash(otp, salt);
      user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await user.save();
      await sendOTP(mobile, otp);

      return res.status(201).json({
        success: true,
        step: 'verify-otp',
        message: "OTP sent to mobile",
        email: user.email,
        mobile: user.mobile
      });
    }

    // No mobile, send email verification link directly
    await sendVerificationEmail(user.email, emailVerifyToken);

    res.status(201).json({
      success: true,
      step: 'verify-email',
      message: "Check your email to verify account",
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user / return token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.login(req, res, next);
  }

  try {
    const { email, password, mobile, otp } = req.body;
    let user;

    if (mobile && otp) {
      user = await User.findOne({ mobile });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No user registered with this mobile number.' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked by admin.'
        });
      }

      // Check lockout status
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          message: `Account locked. Try again after ${remainingMinutes} minutes.`,
          lockUntil: user.lockUntil
        });
      }

      if (!user.mobileOtp || user.mobileOtpExpires < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
      }

      const isOtpMatch = await bcrypt.compare(otp, user.mobileOtp);
      if (!isOtpMatch) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        if (user.otpAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // block 30m
          user.mobileOtp = null;
          user.mobileOtpExpires = null;
          user.otpAttempts = 0;
          await user.save();
          return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Mobile verification locked for 30 minutes.' });
        }
        await user.save();
        return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.` });
      }

      user.isMobileVerified = true;
      user.mobileOtp = null;
      user.mobileOtpExpires = null;
      user.otpAttempts = 0;
    } else {
      const cleanEmail = (email || '').trim().toLowerCase();
      try {
        user = await User.findOne({ email: cleanEmail });
      } catch (dbError) {
        console.error("Database connection/query failed during login:", dbError);
        return res.status(500).json({
          success: false,
          message: 'Server error: Database connection or query failed. Please contact administrator.'
        });
      }

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password.' 
        });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked by admin.'
        });
      }

      // Account Lockout Protection check
      const MAX_ATTEMPTS = 5;
      const LOCK_TIME = 30 * 60 * 1000; // 30 minutes
      if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          message: `Account locked for 30 minutes due to too many failed attempts. Try again after ${remainingMinutes} minutes.`,
          lockUntil: user.lockUntil
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.loginAttempts += 1;
        
        // Suspicious Login IP attempts tracker
        if (!global.failedLoginIps) global.failedLoginIps = {};
        const clientIp = req.ip || '127.0.0.1';
        const now = Date.now();
        if (!global.failedLoginIps[clientIp]) global.failedLoginIps[clientIp] = [];
        global.failedLoginIps[clientIp].push(now);
        global.failedLoginIps[clientIp] = global.failedLoginIps[clientIp].filter(t => now - t < 3600000); // last 1 hour
        if (global.failedLoginIps[clientIp].length >= 10) {
          await sendAdminAlert('SUSPICIOUS_LOGIN_ATTEMPTS', { ip: clientIp, attemptsCount: global.failedLoginIps[clientIp].length });
        }

        if (user.loginAttempts >= MAX_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_TIME);
          await user.save();
          return res.status(423).json({
            success: false,
            message: "Account locked for 30 minutes due to too many failed attempts",
            lockUntil: user.lockUntil
          });
        }

        await user.save();
        const remaining = MAX_ATTEMPTS - user.loginAttempts;
        return res.status(401).json({
          success: false,
          message: `Invalid email or password. ${remaining} attempts remaining before lockout.`,
          attempts: user.loginAttempts
        });
      }
    }

    // Auto Resend Email Verification if false
    if (!user.isEmailVerified) {
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');
      user.emailVerifyToken = emailVerifyToken;
      user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user.email, emailVerifyToken);

      return res.status(403).json({
        success: false,
        step: 'verify-email',
        message: "Please verify your email first. A new verification link has been sent to your email.",
        email: user.email
      });
    }

    // Reset Login Attempts
    user.loginAttempts = 0;
    user.lockUntil = null;

    // IP change security alert check
    const clientIp = req.ip || '127.0.0.1';
    if (user.lastLoginIp && user.lastLoginIp !== clientIp) {
      await sendAdminAlert('IP_CHANGE_DETECTION', { email: user.email, name: user.name, oldIp: user.lastLoginIp, newIp: clientIp });
    }
    user.lastLoginIp = clientIp;
    user.ipHistory.push({ ip: clientIp, date: new Date() });

    // Generate JWT Access & Refresh Tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    user.lastActive = new Date();
    await user.save();

    await logSystemActivity('LOGIN', `Logged in operator: ${user.name} (${user.email})`, user._id);

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Login API Error:", error);
    next(error);
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getMe(req, res, next);
  }

  try {
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email token
 * @route   GET /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.verifyEmail(req, res, next);
  }

  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    await logSystemActivity('SETTINGS_UPDATE', `Email verified for user: ${user.name} (${user.email})`, user._id);

    res.status(200).json({
      success: true,
      message: 'Email verification successful.',
      token: accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend Verification Email
 * @route   POST /api/auth/resend-verification
 */
export const resendVerification = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.resendVerification(req, res, next);
  }

  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email address already verified.' });
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerifyToken = emailVerifyToken;
    user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, emailVerifyToken);

    res.status(200).json({
      success: true,
      message: 'Verification link resent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send OTP to mobile
 * @route   POST /api/auth/send-otp
 */
export const sendOtp = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.sendOtp(req, res, next);
  }

  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user matches this mobile number.' });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    user.mobileOtp = await bcrypt.hash(otp, salt);
    user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTP(mobile, otp);

    res.status(200).json({ success: true, message: 'OTP sent to mobile successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify mobile OTP
 * @route   POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.verifyOtp(req, res, next);
  }

  try {
    const { mobile, otp } = req.body;
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.mobileOtp || user.mobileOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
    }

    // Rate limit OTP verify attempts
    const isMatch = await bcrypt.compare(otp, user.mobileOtp);
    if (!isMatch) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 3) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // block 30m
        user.mobileOtp = null;
        user.mobileOtpExpires = null;
        user.otpAttempts = 0;
        await user.save();
        return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Mobile verification locked for 30 minutes.' });
      }
      await user.save();
      return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.` });
    }

    user.isMobileVerified = true;
    user.mobileOtp = null;
    user.mobileOtpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    // OTP verified successfully -> send email verification now to trigger next step
    if (!user.isEmailVerified) {
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');
      user.emailVerifyToken = emailVerifyToken;
      user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user.email, emailVerifyToken);
    }

    res.status(200).json({
      success: true,
      message: 'Mobile OTP verified. Verification link sent to your registered email.',
      email: user.email
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 */
export const resendOtp = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.resendOtp(req, res, next);
  }

  try {
    const { mobile } = req.body;
    
    // Check hourly limit: max 3 resends per hour
    if (!global.otpResends) global.otpResends = {};
    const now = Date.now();
    if (!global.otpResends[mobile]) global.otpResends[mobile] = [];
    global.otpResends[mobile] = global.otpResends[mobile].filter(t => now - t < 3600000);
    if (global.otpResends[mobile].length >= 3) {
      return res.status(429).json({ success: false, message: 'Maximum 3 OTP resends per hour per mobile.' });
    }
    global.otpResends[mobile].push(now);

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    user.mobileOtp = await bcrypt.hash(otp, salt);
    user.mobileOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendOTP(mobile, otp);

    res.status(200).json({ success: true, message: 'New OTP sent to mobile.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password Request
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.forgotPassword(req, res, next);
  }

  try {
    const { email } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email address does not exist.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    let resetOtp = null;
    if (user.isMobileVerified && user.mobile) {
      resetOtp = generateOTP();
      const salt = await bcrypt.genSalt(10);
      user.passwordResetOtp = await bcrypt.hash(resetOtp, salt);
      user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await sendOTP(user.mobile, resetOtp);
    }

    await user.save();
    await sendPasswordResetEmail(user.email, resetToken, resetOtp);

    res.status(200).json({
      success: true,
      message: "Reset link sent to your email",
      mobileVerified: !!(user.isMobileVerified && user.mobile)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password via email token
 * @route   POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.resetPassword(req, res, next);
  }

  try {
    const { token, newPassword } = req.body;

    if (!validatePasswordRules(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.'
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    await user.save();

    await sendResetConfirmationEmail(user.email);

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password via SMS OTP
 * @route   POST /api/auth/reset-password-otp
 */
export const resetPasswordOtp = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.resetPasswordOtp(req, res, next);
  }

  try {
    const { mobile, otp, newPassword } = req.body;

    if (!validatePasswordRules(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long, contain at least 1 number, and at least 1 uppercase letter.'
      });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.passwordResetOtp || user.passwordResetOtpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
    }

    const isMatch = await bcrypt.compare(otp, user.passwordResetOtp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid reset OTP.' });
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    await user.save();

    await sendResetConfirmationEmail(user.email);

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    OAuth Callback login success
 */
export const googleAuthSuccess = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_failed`);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.lastActive = new Date();
    await user.save();

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/success?token=${accessToken}&refreshToken=${refreshToken}`);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Silent Refresh Token
 * @route   POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.refreshToken(req, res, next);
  }

  try {
    const { refreshToken: clientRefreshToken } = req.body;

    const user = await User.findOne({
      refreshToken: clientRefreshToken,
      refreshTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const newAccessToken = generateAccessToken(user._id);
    user.lastActive = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    next(error);
  }
};

export default { 
  register, 
  login, 
  getMe, 
  verifyEmail, 
  resendVerification,
  sendOtp,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  resetPasswordOtp,
  googleAuthSuccess,
  refreshToken
};
