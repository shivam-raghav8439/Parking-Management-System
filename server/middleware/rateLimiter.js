import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Login rate limit: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Try again after 15 minutes." },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// Register rate limit: 3 accounts per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many accounts created from this IP. Try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

// OTP rate limit: 3 OTPs per hour per IP
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many OTP requests. Try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false
});

// Slow down repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 500 // add 500ms per extra request
});
