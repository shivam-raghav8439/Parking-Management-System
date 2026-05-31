import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect route - Verify JWT Token and attach user to request object
 */
export const protect = async (req, res, next) => {
  let token;

  // Read header token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized to access this route. No token provided.' 
    });
  }

  // Handle In-Memory Sandbox Mode authentication bypass
  if (global.isMockDB) {
    let userId = 'mock_admin_id';
    if (token && token.startsWith('mock_token_')) {
      userId = token.replace('mock_token_', '');
    }
    
    const user = global.mockDb.users.find(u => u._id === userId) || global.mockDb.users[0] || { 
      _id: 'mock_admin_id', 
      name: 'Campus Admin', 
      email: 'admin@campus.edu', 
      role: 'admin',
      status: 'active'
    };

    if (user.status === 'blocked') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been blocked by admin.'
      });
    }

    req.user = user;
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'The user belonging to this token no longer exists.' 
      });
    }

    if (user.status === 'blocked') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been blocked by admin.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized. Invalid or expired token.' 
    });
  }
};

/**
 * Restrict to roles - Enforce role-based access control
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have permission to perform this action.' 
      });
    }
    next();
  };
};
export default { protect, restrictTo };
