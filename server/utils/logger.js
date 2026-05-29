import ActivityLog from '../models/ActivityLog.js';

/**
 * Logs a system operation / event into the database.
 * @param {string} action - Action enum code (LOGIN, REGISTER, etc.)
 * @param {string} details - Detailed text description of what occurred
 * @param {string|null} operatorId - Mongoose User ID of the operator, or null
 */
export async function logSystemActivity(action, details, operatorId = null) {
  try {
    if (global.isMockDB) {
      // Fetch mock operator object details
      const op = (global.mockDb.users || []).find(u => String(u._id) === String(operatorId));
      
      const newLog = {
        _id: `mock_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        action,
        details,
        operator: op ? { _id: op._id, name: op.name, email: op.email, role: op.role } : null,
        timestamp: new Date()
      };

      global.mockDb.activityLogs.unshift(newLog);
      return;
    }

    await ActivityLog.create({
      action,
      details,
      operator: operatorId,
      timestamp: new Date()
    });
  } catch (error) {
    console.error(`Failed to record system activity log: ${error.message}`);
  }
}
export default logSystemActivity;
