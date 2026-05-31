import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { logSystemActivity } from '../utils/logger.js';
import { mockController } from '../utils/mockController.js';

/**
 * Generate JWT token helper
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @desc    Register a new user (First user becomes admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.register(req, res, next);
  }

  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email address already exists.' 
      });
    }

    const userCount = await User.countDocuments();
    let role = 'user';
    if (userCount === 0) {
      role = 'admin';
    } else if (req.body.role && ['user', 'operator'].includes(req.body.role)) {
      role = req.body.role;
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      status: 'active'
    });

    const token = generateToken(user._id);

    await logSystemActivity('REGISTER', `Registered new account: ${user.name} (${user.email}) as role ${user.role}`, user._id);

    res.status(201).json({
      success: true,
      token,
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
 * @desc    Login user / return token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.login(req, res, next);
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    const token = generateToken(user._id);

    await logSystemActivity('LOGIN', `Logged in operator: ${user.name} (${user.email})`, user._id);

    res.status(200).json({
      success: true,
      token,
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
export default { register, login, getMe };
