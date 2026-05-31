import express from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import { 
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
  refreshToken,
  googleAuthSuccess
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter, registerLimiter, otpLimiter, speedLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Existing routes with added rate limits / speed slow down
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

router.get('/me', protect, getMe);

// FIX 1: Email Verification routes
router.get('/verify-email', verifyEmail);
router.post(
  '/resend-verification',
  [body('email').trim().isEmail().withMessage('Please provide a valid email address.')],
  validate,
  resendVerification
);

// FIX 3: SMS OTP Verification routes
router.post(
  '/send-otp',
  otpLimiter,
  [body('mobile').trim().notEmpty().withMessage('Mobile number is required.')],
  validate,
  sendOtp
);
router.post(
  '/verify-otp',
  [
    body('mobile').trim().notEmpty().withMessage('Mobile number is required.'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
  ],
  validate,
  verifyOtp
);
router.post(
  '/resend-otp',
  otpLimiter,
  [body('mobile').trim().notEmpty().withMessage('Mobile number is required.')],
  validate,
  resendOtp
);

// FIX 4: Forgot / Reset Password routes
router.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Please provide a valid email address.')],
  validate,
  forgotPassword
);
router.post(
  '/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Token is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
  ],
  validate,
  resetPassword
);
router.post(
  '/reset-password-otp',
  [
    body('mobile').trim().notEmpty().withMessage('Mobile is required.'),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
  ],
  validate,
  resetPasswordOtp
);

// FIX 5: Google Login OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed', session: false }),
  googleAuthSuccess
);

// FIX 6: Silent Refresh Token route
router.post(
  '/refresh-token',
  [body('refreshToken').trim().notEmpty().withMessage('Refresh token is required.')],
  validate,
  refreshToken
);

export default router;
