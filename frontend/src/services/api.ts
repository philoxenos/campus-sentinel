const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleAuth: (data: { email: string; google_id?: string; first_name: string; last_name: string; avatar_url?: string }) =>
    request<{ token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  demoSwitch: (role: string) =>
    request<{ token: string; user: any }>(`/auth/demo-switch?role=${role}`),

  getMe: () => request<any>('/auth/me'),

  // Kudos Wall
  getKudos: () => request<any[]>('/kudos'),
  postKudos: (data: { recipient_name: string; message: string; category: string }) =>
    request<any>('/kudos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Vent Space
  getVentThread: (studentId?: number) =>
    request<any>(studentId ? `/vent/thread?student_id=${studentId}` : '/vent/thread'),
  sendVentMessage: (data: { thread_id: number; message: string }) =>
    request<any>('/vent/message', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateComfortPreference: (preference: string) =>
    request<any>('/vent/comfort-preference', {
      method: 'PUT',
      body: JSON.stringify({ preference }),
    }),

  // Daily Widget
  getDailyWidget: () => request<any>('/daily-widget'),

  // Mood Calendar
  getMoodCalendar: (studentId?: number) =>
    request<any[]>(studentId ? `/mood/calendar?student_id=${studentId}` : '/mood/calendar'),
  submitMoodCheckIn: (data: { check_date: string; score: number; note: string }) =>
    request<any>('/mood/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Classes & Attendance
  getClasses: () => request<any[]>('/classes'),
  getClassStudents: (classId: number) => request<any[]>(`/classes/${classId}/students`),
  getAttendance: (classId?: number, date?: string) => {
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId.toString());
    if (date) params.append('date', date);
    return request<any[]>(`/attendance?${params.toString()}`);
  },
  recordAttendance: (data: { student_id: number; class_id: number; date: string; status: string; remarks?: string }) =>
    request<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Observations
  getObservations: (studentId?: number) =>
    request<any[]>(studentId ? `/observations?student_id=${studentId}` : '/observations'),
  createObservation: (data: { student_id: number; observation_date: string; category: string; details: string; severity: string }) =>
    request<any>('/observations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Incidents
  submitPublicIncident: (data: any) =>
    request<any>('/public/incident-report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  trackPublicIncident: (code: string) =>
    request<any>(`/public/incident-report/${code}`),
  getIncidents: () => request<any[]>('/incidents'),
  updateIncidentStatus: (id: number, status: string, assignedCounselorId?: number) =>
    request<any>(`/incidents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, assigned_counselor_id: assignedCounselorId }),
    }),

  // Dashboard & Risk
  getDashboardStats: () => request<any>('/dashboard/stats'),
  getRiskMatrix: () => request<any[]>('/dashboard/risk-matrix'),
  getStudentProfile360: (studentId: number) => request<any>(`/dashboard/student/${studentId}`),

  // Cases
  getCases: () => request<any[]>('/cases'),
  createCase: (data: any) =>
    request<any>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCase: (id: number, data: any) =>
    request<any>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Admin
  getUsers: () => request<any[]>('/users'),
  updateUserRole: (id: number, role: string) =>
    request<any>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  getAuditLogs: () => request<any[]>('/audit-logs'),
};
