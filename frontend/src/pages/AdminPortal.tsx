import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Activity, Search, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { User, AuditLog } from '../types';

interface AdminPortalProps {
  currentUser: User;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser: _unused, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchUser, setSearchUser] = useState('');

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

  const filteredUsers = users.filter(u => {
    if (!searchUser) return true;
    const name = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    return name.includes(searchUser.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-600" />
            <span>Super Administrator Console</span>
          </h1>
          <p className="text-xs text-slate-500">
            RBAC Access Control, User Directory Management, and RA 10173 Audit Logging.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'users'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory & Roles ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registered Accounts Directory</h2>
              <p className="text-xs text-slate-500">
                Any Google account registered here can log in via Google Authentication.
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Assigned Role (RBAC)</th>
                  <th className="p-3">Profile Info</th>
                  <th className="p-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.first_name}`}
                        alt=""
                        className="w-7 h-7 rounded-full bg-slate-100"
                      />
                      <span>{u.first_name} {u.last_name}</span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="p-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
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
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Audit Trail Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
            🛡️ <strong>Compliance Notice (Republic Act 10173 - Data Privacy Act):</strong> Every instance where a staff member accesses confidential student profiles, modifies risk classifications, or exports student data is recorded with immutable timestamps and IP tracking.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
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
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{log.actor_email}</td>
                    <td className="p-3 font-bold text-slate-600 text-[10px]">{log.actor_role}</td>
                    <td className="p-3 font-mono font-semibold text-indigo-700 text-[11px]">
                      {log.action_type}
                    </td>
                    <td className="p-3 text-slate-600">{log.target_resource}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{log.ip_address}</td>
                    <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate">{log.metadata || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
