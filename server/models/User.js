import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },  // bcrypt hash
  role: { type: String, enum: ['admin', 'user', 'operator'], default: 'user' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  
  // FIX 1: Email Verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyExpires: { type: Date, default: null },

  // FIX 3: SMS OTP Verification
  mobile: { type: String, default: null },
  isMobileVerified: { type: Boolean, default: false },
  mobileOtp: { type: String, default: null },
  mobileOtpExpires: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },

  // FIX 4: Reset Password
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  passwordResetOtp: { type: String, default: null },
  passwordResetOtpExpires: { type: Date, default: null },

  // FIX 5: Google Login
  googleId: { type: String, default: null },
  avatar: { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

  // FIX 6: Auto Logout & Inactivity
  refreshToken: { type: String, default: null },
  refreshTokenExpires: { type: Date, default: null },
  lastActive: { type: Date, default: Date.now },

  // FIX 7: IP Protection & Lockout
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  registrationIp: { type: String },
  lastLoginIp: { type: String },
  ipHistory: [{ ip: { type: String }, date: { type: Date, default: Date.now } }]
}, { timestamps: true });

// Pre-save password hashing hook
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password verification method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
