import React, { useState, useEffect } from 'react';
import { parkingApi } from '../../api/parkingApi';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  Loader, 
  ShieldAlert, 
  User, 
  Mail, 
  Clock,
  UserCheck2,
  Lock
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await parkingApi.getUsers({ search: searchTerm });
      if (res && res.users) {
        setUsers(res.users);
        computeStats(res.users);
      }
    } catch (err) {
      toast.error('Failed to load registered users.');
    } finally {
      setLoading(false);
    }
  };

  const computeStats = (userList) => {
    const total = userList.length;
    const active = userList.filter(u => u.status === 'active').length;
    const blocked = userList.filter(u => u.status === 'blocked').length;
    setStats({ total, active, blocked });
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const handleBlockUser = async (id) => {
    try {
      const res = await parkingApi.blockUser(id);
      if (res && res.success) {
        toast.success(res.message || 'User blocked successfully.');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block user.');
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      const res = await parkingApi.unblockUser(id);
      if (res && res.success) {
        toast.success(res.message || 'User unblocked successfully.');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await parkingApi.deleteUser(id);
      if (res && res.success) {
        toast.success(res.message || 'User deleted successfully.');
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            User Whitelist Configuration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Manage registrations, control access, block violators, and delete accounts.
          </p>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Users */}
        <div className="glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Total Members</p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>

        {/* Active Members */}
        <div className="glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <UserCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Active Members</p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-900 dark:text-white">{stats.active}</h3>
          </div>
        </div>

        {/* Blocked Members */}
        <div className="glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Blocked Members</p>
            <h3 className="text-xl font-extrabold mt-0.5 text-slate-900 dark:text-white">{stats.blocked}</h3>
          </div>
        </div>
      </div>

      {/* Control Console */}
      <div className="glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl overflow-hidden">
        {/* Search Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <span className="absolute left-3 top-3 text-slate-450 dark:text-slate-500">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-850 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-305 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            Refresh Database
          </button>
        </div>

        {/* User Database Grid */}
        <div className="overflow-x-auto">
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-mono">Quering Database Registry...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShieldAlert className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No users found.</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs text-center font-semibold">Try modifying your query or seeding mock accounts.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">
                  <th className="py-4 px-6">User Profile</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Assigned Role</th>
                  <th className="py-4 px-6">System Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-all">
                    {/* User Profile Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-sm select-none ${
                          item.role === 'admin' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                            : item.role === 'operator'
                            ? 'bg-indigo-50 text-indigo-750 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                            : 'bg-primary-50 text-primary-750 border-primary-200 dark:bg-primary-950/20 dark:text-primary-400 dark:border-primary-900/30'
                        }`}>
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">
                            ID: {item._id || item.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email Address */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-650 dark:text-slate-350 text-sm font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.email}</span>
                      </div>
                    </td>

                    {/* Assigned Role */}
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border leading-none ${
                        item.role === 'admin'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
                          : item.role === 'operator'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                      }`}>
                        {item.role}
                      </span>
                    </td>

                    {/* System Status */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.status === 'blocked' ? 'bg-rose-500 shadow-rose-500/40 shadow' : 'bg-emerald-500 shadow-emerald-500/40 shadow'}`}></span>
                        <span className={`text-xs font-semibold capitalize ${item.status === 'blocked' ? 'text-rose-600 dark:text-rose-450' : 'text-emerald-600 dark:text-emerald-450'}`}>
                          {item.status === 'blocked' ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.role !== 'admin' && (
                          <>
                            {item.status === 'blocked' ? (
                              <button
                                onClick={() => handleUnblockUser(item._id || item.id)}
                                className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/30"
                                title="Unblock Account"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(item._id || item.id)}
                                className="p-2 bg-rose-55 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all cursor-pointer dark:bg-rose-955/25 dark:text-rose-400 dark:border-rose-900/30"
                                title="Block Account"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(item._id || item.id)}
                              className="p-2 bg-slate-50 text-slate-500 border border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-rose-950/20 dark:hover:text-rose-450"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
