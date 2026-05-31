import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  verifyEmail, 
  login, 
  forgotPasswordEmail, 
  forgotPasswordOTP, 
  verifyOTPAndReset, 
  resetPasswordToken 
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter, registerLimiter, otpLimiter, speedLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Register route
router.post(
  '/register',
  registerLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
  ],
  validate,
  register
);

// Login route
router.post(
  '/login',
  loginLimiter,
  speedLimiter,
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  login
);

// Verify Email route
router.get('/verify-email', verifyEmail);

// Forgot Password via Email route
router.post(
  '/forgot-password/email',
  [body('email').trim().isEmail().withMessage('Please provide a valid email address.')],
  validate,
  forgotPasswordEmail
);

// Forgot Password via OTP route
router.post(
  '/forgot-password/otp',
  otpLimiter,
  [body('mobile').trim().notEmpty().withMessage('Mobile number is required.')],
  validate,
  forgotPasswordOTP
);

// Verify OTP and reset password route
router.post(
  '/verify-otp-reset',
  [
    body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
  ],
  validate,
  verifyOTPAndReset
);

// Reset password via email link token route
router.post(
  '/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Token is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
  ],
  validate,
  resetPasswordToken
);

export default router;
