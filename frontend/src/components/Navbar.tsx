import React from 'react';
import { Shield, UserCheck, AlertTriangle, LogOut, ChevronDown } from 'lucide-react';
import type { User, Role } from '../types';

interface NavbarProps {
  currentUser: User | null;
  currentRole: Role;
  onRoleSwitch: (roleKey: string) => void;
  onLogout: () => void;
  onNavigatePublic: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRole,
  onRoleSwitch,
  onLogout,
  onNavigatePublic,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const roleLabels: Record<string, { label: string; color: string }> = {
    STUDENT: { label: 'Student', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    TEACHER: { label: 'Teacher / Adviser', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    COUNSELOR: { label: 'Guidance Counselor', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-rose-100 text-rose-800 border-rose-300' },
    PUBLIC: { label: 'Public Guest Portal', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  };

  const activeRoleBadge = roleLabels[currentRole] || { label: currentRole, color: 'bg-gray-100 text-gray-800' };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Compliance / Privacy Banner per Client Kickoff Doc */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase">
            Academic Prototype
          </span>
          <span>UPIS Demo Sandbox — Synthetic data only. Compliant with Data Privacy Act (RA 10173).</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>MSIT 632 Group 10</span>
          <span>v1.0.0</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">CAMPUS SENTINEL</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${activeRoleBadge.color}`}>
                  {activeRoleBadge.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">School Behavioral Monitoring & Early Warning System</p>
            </div>
          </div>

          {/* Right Controls: Demo Role Switcher & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Impersonation Switcher */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Switch Demo Persona</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Synthetic Persona
                  </div>
                  <button
                    onClick={() => onRoleSwitch('student_miguel')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800">Miguel Bautista (Student)</span>
                    <span className="text-[11px] text-amber-600">🟡 Watchlist: Declining mood story</span>
                  </button>
                  <button
                    onClick={() => onRoleSwitch('student_juan')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800">Juan Dela Cruz (Student)</span>
                    <span className="text-[11px] text-rose-600">🔴 Critical: Aggression & threat flag</span>
                  </button>
                  <button
                    onClick={() => onRoleSwitch('student_althea')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800">Althea Mendoza (Student)</span>
                    <span className="text-[11px] text-emerald-600">🟢 Baseline: Positive wellness profile</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={() => onRoleSwitch('teacher')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800">Elena Cruz (Adviser)</span>
                    <span className="text-[11px] text-slate-500">Grade 9 Diamond Class Roster</span>
                  </button>
                  <button
                    onClick={() => onRoleSwitch('counselor')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800">Maria Santos (Guidance Counselor)</span>
                    <span className="text-[11px] text-purple-600">Early Warning Dashboard & Case Notes</span>
                  </button>
                  <button
                    onClick={() => onRoleSwitch('super_admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
                  >
                    <span className="font-semibold text-slate-800">System Admin</span>
                    <span className="text-[11px] text-slate-500">RBAC Directory & RA 10173 Audit Logs</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  <button
                    onClick={onNavigatePublic}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 text-amber-800 flex items-center gap-2 font-medium"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Public Concern Portal (No Login)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Public report shortcut button */}
            <button
              onClick={onNavigatePublic}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Public Incident Form</span>
            </button>

            {/* User Info & Avatar */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.first_name}`}
                  alt={currentUser.first_name}
                  className="w-8 h-8 rounded-full border border-slate-300 bg-slate-100"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.first_name} {currentUser.last_name}
                  </div>
                  <div className="text-[10px] text-slate-500">{currentUser.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
