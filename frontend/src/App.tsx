import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { StudentPortal } from './pages/StudentPortal';
import { TeacherPortal } from './pages/TeacherPortal';
import { CounselorPortal } from './pages/CounselorPortal';
import { AdminPortal } from './pages/AdminPortal';
import { PublicConcernPage } from './pages/PublicConcernPage';
import { api, getAuthToken, setAuthToken, removeAuthToken } from './services/api';
import type { User, Role } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>('PUBLIC');
  const [isPublicMode, setIsPublicMode] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        setCurrentRole(user.role);
      } catch (err) {
        removeAuthToken();
        setCurrentUser(null);
        setCurrentRole('PUBLIC');
      }
    }
    setLoading(false);
  };

  const handleShowToast = (
    message: string,
    type: 'error' | 'success' | 'warning' = 'error',
    title?: string
  ) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type, title }]);

    setTimeout(() => {
      handleDismissToast(id);
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRoleSwitch = async (roleKey: string) => {
    setIsPublicMode(false);
    try {
      const res = await api.demoSwitch(roleKey);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      handleShowToast(
        `Switched to demo persona: ${res.user.first_name} ${res.user.last_name} (${res.user.role})`,
        'success',
        'Demo Persona Switch'
      );
    } catch (err: any) {
      handleShowToast(err.message || 'Failed to switch demo persona', 'error');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
    setCurrentRole('PUBLIC');
    setIsPublicMode(false);
    handleShowToast('You have signed out successfully.', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Initializing Campus Sentinel...
      </div>
    );
  }

  // Render Public Concern Form
  if (isPublicMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar
          currentUser={currentUser}
          currentRole="PUBLIC"
          onRoleSwitch={handleRoleSwitch}
          onLogout={handleLogout}
          onNavigatePublic={() => setIsPublicMode(true)}
        />
        <PublicConcernPage
          onBackToApp={() => setIsPublicMode(false)}
          onShowToast={handleShowToast}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  // If not authenticated, render Login Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar
          currentUser={null}
          currentRole="PUBLIC"
          onRoleSwitch={handleRoleSwitch}
          onLogout={handleLogout}
          onNavigatePublic={() => setIsPublicMode(true)}
        />
        <LoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setCurrentRole(user.role);
          }}
          onNavigatePublic={() => setIsPublicMode(true)}
          onShowToast={handleShowToast}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Universal Header with Compliance Banner & Role Controls */}
      <Navbar
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        onNavigatePublic={() => setIsPublicMode(true)}
      />

      {/* Main Role-Specific View */}
      <main className="flex-1 pb-16">
        {currentRole === 'STUDENT' && (
          <StudentPortal currentUser={currentUser} onShowToast={handleShowToast} />
        )}

        {currentRole === 'TEACHER' && (
          <TeacherPortal currentUser={currentUser} onShowToast={handleShowToast} />
        )}

        {(currentRole === 'COUNSELOR' || currentRole === 'GLC') && (
          <CounselorPortal currentUser={currentUser} onShowToast={handleShowToast} />
        )}

        {currentRole === 'SUPER_ADMIN' && (
          <AdminPortal currentUser={currentUser} onShowToast={handleShowToast} />
        )}
      </main>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
