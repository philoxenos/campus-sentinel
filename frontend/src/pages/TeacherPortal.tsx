import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, ClipboardList, CheckCircle2, Plus } from 'lucide-react';
import { api } from '../services/api';
import type { User, Class, BehavioralObservation } from '../types';

interface TeacherPortalProps {
  currentUser: User;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const TeacherPortal: React.FC<TeacherPortalProps> = ({ currentUser, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'observations' | 'roster'>('attendance');

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number>(1);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, { status: string; remarks: string }>>({});
  
  // Observations state
  const [observations, setObservations] = useState<BehavioralObservation[]>([]);
  const [obsStudentId, setObsStudentId] = useState<number>(0);
  const [obsCategory, setObsCategory] = useState<string>('SOCIAL_WITHDRAWAL');
  const [obsSeverity, setObsSeverity] = useState<string>('MODERATE');
  const [obsDetails, setObsDetails] = useState<string>('');
  const [showObsModal, setShowObsModal] = useState(false);

  useEffect(() => {
    loadClasses();
    loadObservations();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassStudents(selectedClassId);
      loadAttendance(selectedClassId, attendanceDate);
    }
  }, [selectedClassId, attendanceDate]);

  const loadClasses = async () => {
    try {
      const cls = await api.getClasses();
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadClassStudents = async (cid: number) => {
    try {
      const profiles = await api.getClassStudents(cid);
      setStudents(profiles);
      if (profiles.length > 0 && obsStudentId === 0) {
        setObsStudentId(profiles[0].user_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async (cid: number, date: string) => {
    try {
      const logs = await api.getAttendance(cid, date);
      const recordMap: Record<number, { status: string; remarks: string }> = {};
      logs.forEach(log => {
        recordMap[log.student_id] = { status: log.status, remarks: log.remarks || '' };
      });
      setAttendanceRecords(recordMap);
    } catch (err) {
      console.error(err);
    }
  };

  const loadObservations = async () => {
    try {
      const obs = await api.getObservations();
      setObservations(obs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || '',
      },
    }));
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'PRESENT',
        remarks,
      },
    }));
  };

  const handleSaveAttendance = async (studentId: number) => {
    const entry = attendanceRecords[studentId] || { status: 'PRESENT', remarks: '' };
    try {
      await api.recordAttendance({
        student_id: studentId,
        class_id: selectedClassId,
        date: attendanceDate,
        status: entry.status,
        remarks: entry.remarks,
      });
      onShowToast('Attendance saved and early warning metrics updated.', 'success', 'Attendance Log');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save attendance', 'error');
    }
  };

  const handleSaveAllAttendance = async () => {
    try {
      for (const p of students) {
        const entry = attendanceRecords[p.user_id] || { status: 'PRESENT', remarks: '' };
        await api.recordAttendance({
          student_id: p.user_id,
          class_id: selectedClassId,
          date: attendanceDate,
          status: entry.status,
          remarks: entry.remarks,
        });
      }
      onShowToast(`Saved attendance for all ${students.length} students.`, 'success', 'Class Attendance Logged');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save all attendance', 'error');
    }
  };

  const handleCreateObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsDetails.trim()) return;

    try {
      const obs = await api.createObservation({
        student_id: Number(obsStudentId),
        observation_date: new Date().toISOString().split('T')[0],
        category: obsCategory,
        details: obsDetails,
        severity: obsSeverity,
      });
      setObservations([obs, ...observations]);
      setShowObsModal(false);
      setObsDetails('');
      onShowToast('Significant observation recorded. Risk indicators updated.', 'success', 'Observation Logged');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create observation', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Adviser Console: {currentUser.first_name} {currentUser.last_name}
          </h1>
          <p className="text-xs text-slate-500">
            Monitor class attendance, student rosters, and log significant behavioral changes.
          </p>
        </div>

        {/* Class Selector */}
        <div className="flex items-center gap-3 text-xs">
          <label className="font-semibold text-slate-700">Advisory Class:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="p-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                Grade {c.grade_level} - {c.section_name} ({c.school_year})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance & Absence Log</span>
        </button>
        <button
          onClick={() => setActiveTab('observations')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'observations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Significant Observations</span>
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'roster'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Class Roster ({students.length})</span>
        </button>
      </div>

      {/* 1. TAB: Attendance & Absence Log */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Daily Absence & Truancy Tracker</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  Feeds Early Warning
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Mark student attendance. 3+ unexcused cuts or absences will raise a watchlist indicator.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                onClick={handleSaveAllAttendance}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save All Records</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks / Reason</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((profile) => {
                  const student = profile.user;
                  const currentRecord = attendanceRecords[student.id] || { status: 'PRESENT', remarks: '' };

                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                        <img
                          src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.first_name}`}
                          alt=""
                          className="w-7 h-7 rounded-full bg-slate-100"
                        />
                        <span>{student.first_name} {student.last_name}</span>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{profile.student_id_number}</td>
                      <td className="p-3">
                        <select
                          value={currentRecord.status}
                          onChange={(e) => handleStatusChange(student.id, e.target.value)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold ${
                            currentRecord.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : currentRecord.status === 'CUTTING_CLASS' || currentRecord.status === 'UNEXCUSED_ABSENCE'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="TARDY">Tardy</option>
                          <option value="EXCUSED_ABSENCE">Excused Absence</option>
                          <option value="UNEXCUSED_ABSENCE">Unexcused Absence</option>
                          <option value="CUTTING_CLASS">Cutting Class</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Add remark..."
                          value={currentRecord.remarks}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSaveAttendance(student.id)}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. TAB: Significant Behavioral Observations */}
      {activeTab === 'observations' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Significant Behavioral Observations</span>
              </h2>
              <p className="text-xs text-slate-500">
                Record significant observations (aggression, social isolation, abrupt grade drop) to alert counselors early.
              </p>
            </div>
            <button
              onClick={() => setShowObsModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Observation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {observations.map(obs => (
              <div
                key={obs.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">
                      Student: {obs.student ? `${obs.student.first_name} ${obs.student.last_name}` : `ID #${obs.student_id}`}
                    </div>
                    <div className="text-[11px] text-slate-400">Date: {obs.observation_date}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      obs.severity === 'URGENT'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : obs.severity === 'MODERATE'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {obs.severity} SEVERITY
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-semibold text-indigo-700 uppercase tracking-wider text-[10px] block mb-1">
                    {obs.category.replace('_', ' ')}
                  </span>
                  "{obs.details}"
                </div>

                <div className="text-[10px] text-slate-400">
                  Recorded by: {obs.observer ? `${obs.observer.first_name} ${obs.observer.last_name}` : 'Adviser'}
                </div>
              </div>
            ))}
          </div>

          {/* Modal */}
          {showObsModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-base">Record Significant Observation</h3>
                  <button onClick={() => setShowObsModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleCreateObservation} className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Student</label>
                    <select
                      value={obsStudentId}
                      onChange={(e) => setObsStudentId(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    >
                      {students.map(p => (
                        <option key={p.id} value={p.user_id}>
                          {p.user.first_name} {p.user.last_name} ({p.student_id_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Behavior Category</label>
                      <select
                        value={obsCategory}
                        onChange={(e) => setObsCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        <option value="SOCIAL_WITHDRAWAL">Social Withdrawal</option>
                        <option value="AGGRESSION">Aggression / Outburst</option>
                        <option value="ACADEMIC_DROP">Abrupt Academic Drop</option>
                        <option value="DISRUPTIVE">Disruptive Behavior</option>
                        <option value="DISTRESS">Extreme Distress</option>
                        <option value="POSITIVE_GROWTH">Positive Behavioral Growth</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Severity Flag</label>
                      <select
                        value={obsSeverity}
                        onChange={(e) => setObsSeverity(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        <option value="MILD">Mild (Context note)</option>
                        <option value="MODERATE">Moderate (Follow-up)</option>
                        <option value="URGENT">Urgent (Immediate triage)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Specific Observation Details</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe the factual behavior observed, context, and environment..."
                      value={obsDetails}
                      onChange={(e) => setObsDetails(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowObsModal(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                    >
                      Submit Observation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: Class Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Enrolled Students in Advisory Section</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {students.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                <img
                  src={p.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.first_name}`}
                  alt=""
                  className="w-10 h-10 rounded-full bg-slate-100"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{p.user.first_name} {p.user.last_name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{p.student_id_number}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    {p.parent_consent_given ? '✓ Parental Consent Verified' : 'Pending Consent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
