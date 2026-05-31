import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, required: true,
    unique: true, lowercase: true, trim: true
  },
  password: { type: String, required: true, minlength: 6 },
  mobile: { type: String, default: null },
  role: {
    type: String,
    enum: ['superadmin','admin','operator','security','user'],
    default: 'user'
  },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String, default: null },
  emailVerifyExpires: { type: Date, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  passwordResetOTP: { type: String, default: null },
  passwordResetOTPExpires: { type: Date, default: null },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
