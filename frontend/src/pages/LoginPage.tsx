import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import type { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigatePublic: () => void;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigatePublic,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token);
      onLoginSuccess(res.user);
      onShowToast(`Signed in successfully as ${res.user.first_name}!`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setLoading(true);
    try {
      const res = await api.googleAuth({
        email: googleEmail.trim(),
        first_name: googleEmail.split('@')[0],
        last_name: 'User',
      });
      setAuthToken(res.token);
      onLoginSuccess(res.user);
      setShowGoogleModal(false);
      onShowToast(`Google authentication successful for ${googleEmail}!`, 'success');
    } catch (err: any) {
      onShowToast(
        err.message || 'Google account not registered in school directory.',
        'error',
        'Google Auth Restriction'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (roleKey: string) => {
    setLoading(true);
    try {
      const res = await api.demoSwitch(roleKey);
      setAuthToken(res.token);
      onLoginSuccess(res.user);
      onShowToast(`Demo signed in as ${res.user.first_name} (${res.user.role})!`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to switch demo persona', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 to-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-200">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CAMPUS SENTINEL</h1>
          <p className="text-xs text-slate-500">
            School Behavioral Monitoring & Early Warning System
          </p>
        </div>

        {/* Google Authentication Button */}
        <div className="space-y-3">
          <button
            onClick={() => setShowGoogleModal(true)}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              or Super Admin Credentials
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>
        </div>

        {/* Local Super Admin Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@sentinel.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In as Administrator'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Demo Personas for Quick Presentation */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>1-Click Presentation Personas</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemoLogin('counselor')}
              className="p-2 text-left rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition font-semibold"
            >
              🩺 Guidance Counselor
            </button>
            <button
              onClick={() => handleQuickDemoLogin('teacher')}
              className="p-2 text-left rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 transition font-semibold"
            >
              👩‍🏫 Class Adviser (Gr. 9)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('student_miguel')}
              className="p-2 text-left rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition font-semibold"
            >
              🟡 Student (Watchlist)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('student_juan')}
              className="p-2 text-left rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-900 transition font-semibold"
            >
              🔴 Student (High Risk)
            </button>
          </div>
        </div>

        {/* Public Incident Link */}
        <div className="text-center pt-2">
          <button
            onClick={onNavigatePublic}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center justify-center gap-1.5 mx-auto"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Submit a Concern / Incident Report (No Login Needed)</span>
          </button>
        </div>
      </div>

      {/* Modal for Google Auth Email Entry */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Google Account Sign-In</h3>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400">✕</button>
            </div>
            <p className="text-slate-500">
              Per requirements, any registered Google account can sign in without domain restriction.
            </p>
            <form onSubmit={handleGoogleSignIn} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Enter Pre-Registered Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. student.miguel@sentinel.edu or your Google address"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
