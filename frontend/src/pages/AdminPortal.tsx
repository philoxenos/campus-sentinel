import React, { useState, useEffect } from 'react';
import { 
  Users, ShieldCheck, Activity, Search, RefreshCw, 
  UserX, UserCheck, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { api } from '../services/api';
import type { User, AuditLog } from '../types';

interface AdminPortalProps {
  currentUser: User;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');

  // Deactivation / Activation confirmation modal
  const [pendingStatusUser, setPendingStatusUser] = useState<User | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [uList, logs] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getAuditLogs().catch(() => []),
      ]);
      setUsers(uList);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole as any } : u)));
      onShowToast(`User role updated to ${newRole}. Recorded in audit trail.`, 'success', 'RBAC Updated');
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!pendingStatusUser) return;
    const target = pendingStatusUser;
    const nextStatus = !target.is_active;

    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateUserStatus(target.id, nextStatus);
      setUsers(prev => prev.map(u => (u.id === target.id ? { ...u, is_active: updated.is_active } : u)));
      const actionWord = nextStatus ? 'activated' : 'deactivated';
      onShowToast(
        `Account for ${target.first_name} ${target.last_name} (${target.email}) has been ${actionWord}. Recorded in audit trail.`,
        nextStatus ? 'success' : 'warning',
        `Account ${nextStatus ? 'Activated' : 'Deactivated'}`
      );
      setPendingStatusUser(null);
      const updatedLogs = await api.getAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update account status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const activeCount = users.filter(u => u.is_active !== false).length;
  const deactivatedCount = users.filter(u => u.is_active === false).length;

  const filteredUsers = users.filter(u => {
    // Status filter
    if (statusFilter === 'active' && u.is_active === false) return false;
    if (statusFilter === 'deactivated' && u.is_active !== false) return false;

    // Search query
    if (!searchUser) return true;
    const name = `${u.first_name} ${u.last_name} ${u.email} ${u.role}`.toLowerCase();
    return name.includes(searchUser.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600 shrink-0" />
            <span>Super Administrator Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            RBAC Access Control, User Directory Management, and RA 10173 Audit Logging.
          </p>
        </div>

        <button
          onClick={loadData}
          className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold overflow-x-auto pb-px no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition shrink-0 ${
            activeTab === 'users'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Status ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition shrink-0 ${
            activeTab === 'audit'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Data Privacy Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* 1. Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Accounts Directory</h2>
              <p className="text-xs text-slate-500">
                Manage roles and account availability. Deactivated accounts cannot sign in via Google or password.
              </p>
            </div>

            {/* Filter pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    statusFilter === 'active'
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active ({activeCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('deactivated')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    statusFilter === 'deactivated'
                      ? 'bg-rose-50 text-rose-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Deactivated ({deactivatedCount})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Assigned Role (RBAC)</th>
                  <th className="p-3">Profile Info</th>
                  <th className="p-3">Account Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No accounts found matching your filter or search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    const isSelf = currentUser && currentUser.id === u.id;

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/70 transition ${!isActive ? 'bg-slate-50/40 text-slate-400' : ''}`}>
                        <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.first_name}`}
                            alt=""
                            className={`w-7 h-7 rounded-full bg-slate-100 shrink-0 ${!isActive ? 'grayscale opacity-70' : ''}`}
                          />
                          <span className={!isActive ? 'text-slate-500 line-through' : ''}>
                            {u.first_name} {u.last_name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                              You
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            disabled={!isActive}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="p-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="TEACHER">Teacher / Adviser</option>
                            <option value="COUNSELOR">Guidance Counselor</option>
                            <option value="GLC">Grade Level Coord (GLC)</option>
                            <option value="SUPER_ADMIN">Super Administrator</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-500">
                          {u.student_profile ? (
                            <span>ID: {u.student_profile.student_id_number}</span>
                          ) : (
                            <span>Staff Profile</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Deactivated
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-slate-400 italic">Self Account</span>
                          ) : isActive ? (
                            <button
                              onClick={() => setPendingStatusUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                              title="Disable / deactivate this user account"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setPendingStatusUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                              title="Reactivate this user account"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            🛡️ <strong>Compliance Notice (Republic Act 10173 - Data Privacy Act):</strong> Every instance where a staff member accesses confidential student profiles, modifies risk classifications, or alters account statuses is recorded with immutable timestamps and IP tracking.
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-xs text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Resource</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Metadata Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{log.actor_email}</td>
                    <td className="p-3 font-bold text-slate-600 text-[10px]">{log.actor_role}</td>
                    <td className="p-3 font-mono font-semibold text-indigo-700 text-[11px] whitespace-nowrap">
                      {log.action_type}
                    </td>
                    <td className="p-3 text-slate-600">{log.target_resource}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">{log.ip_address}</td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate" title={log.metadata}>{log.metadata || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Account Status Toggle */}
      {pendingStatusUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${pendingStatusUser.is_active !== false ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {pendingStatusUser.is_active !== false ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">
                  {pendingStatusUser.is_active !== false ? 'Deactivate User Account?' : 'Reactivate User Account?'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {pendingStatusUser.is_active !== false ? (
                    <>
                      Are you sure you want to disable access for <strong>{pendingStatusUser.first_name} {pendingStatusUser.last_name}</strong> ({pendingStatusUser.email})?
                      This user will be immediately blocked from signing in or accessing school records.
                    </>
                  ) : (
                    <>
                      Reactivate login access for <strong>{pendingStatusUser.first_name} {pendingStatusUser.last_name}</strong> ({pendingStatusUser.email})?
                      They will be able to sign in and resume standard role permissions.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1 font-mono">
              <div><strong>User:</strong> {pendingStatusUser.first_name} {pendingStatusUser.last_name}</div>
              <div><strong>Email:</strong> {pendingStatusUser.email}</div>
              <div><strong>Role:</strong> {pendingStatusUser.role}</div>
              <div><strong>Target Status:</strong> {pendingStatusUser.is_active !== false ? '❌ DEACTIVATED / INACTIVE' : '✅ ACTIVE'}</div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setPendingStatusUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleConfirmStatusToggle}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                  pendingStatusUser.is_active !== false
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus ? (
                  <span>Updating...</span>
                ) : pendingStatusUser.is_active !== false ? (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Confirm Deactivation</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Confirm Reactivation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
