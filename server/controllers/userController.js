import User from '../models/User.js';
import { logSystemActivity } from '../utils/logger.js';

export const getUsers = async (req, res, next) => {
  if (global.isMockDB) {
    let list = [...global.mockDb.users];
    const { search } = req.query;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return res.status(200).json({ success: true, count: list.length, users: list });
  }

  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

export const blockUser = async (req, res, next) => {
  const { id } = req.params;

  if (global.isMockDB) {
    const user = global.mockDb.users.find(u => u._id === id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block administrative accounts.' });
    }
    user.status = 'blocked';
    await logSystemActivity('SETTINGS_UPDATE', `Blocked mock user: ${user.name} (${user.email})`, req.user?._id || 'mock_admin_id');
    return res.status(200).json({ success: true, message: 'User blocked successfully', user });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block administrative accounts.' });
    }

    user.status = 'blocked';
    await user.save();

    await logSystemActivity('SETTINGS_UPDATE', `Blocked account: ${user.name} (${user.email})`, req.user._id);

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
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

export const unblockUser = async (req, res, next) => {
  const { id } = req.params;

  if (global.isMockDB) {
    const user = global.mockDb.users.find(u => u._id === id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }
    user.status = 'active';
    await logSystemActivity('SETTINGS_UPDATE', `Unblocked mock user: ${user.name} (${user.email})`, req.user?._id || 'mock_admin_id');
    return res.status(200).json({ success: true, message: 'User unblocked successfully', user });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = 'active';
    await user.save();

    await logSystemActivity('SETTINGS_UPDATE', `Unblocked account: ${user.name} (${user.email})`, req.user._id);

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully',
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

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  if (global.isMockDB) {
    const index = global.mockDb.users.findIndex(u => u._id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User not found in memory.' });
    }
    const user = global.mockDb.users[index];
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete administrative accounts.' });
    }
    global.mockDb.users.splice(index, 1);
    await logSystemActivity('SETTINGS_UPDATE', `Deleted mock user: ${user.name} (${user.email})`, req.user?._id || 'mock_admin_id');
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete administrative accounts.' });
    }

    await User.findByIdAndDelete(id);

    await logSystemActivity('SETTINGS_UPDATE', `Deleted user account: ${user.name} (${user.email})`, req.user._id);

    res.status(200).json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
