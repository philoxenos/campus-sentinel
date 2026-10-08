import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Download, Eye, Clock, AlertCircle, Plus, Search
} from 'lucide-react';
import { api } from '../services/api';
import type { User, RiskEvaluation, IncidentReport, CounselingCase } from '../types';

interface CounselorPortalProps {
  currentUser: User;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const CounselorPortal: React.FC<CounselorPortalProps> = ({ currentUser, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'incidents' | 'cases'>('matrix');

  // Stats & Matrix
  const [stats, setStats] = useState<any>({});
  const [riskMatrix, setRiskMatrix] = useState<RiskEvaluation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 360 Profile Modal
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<any | null>(null);

  // Incidents
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);

  // Cases
  const [cases, setCases] = useState<CounselingCase[]>([]);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseStudentId, setCaseStudentId] = useState<number>(0);
  const [caseStage, setCaseStage] = useState('INTAKE');
  const [caseNotes, setCaseNotes] = useState('');
  const [caseParentNotified, setCaseParentNotified] = useState(false);
  const [caseSWC, setCaseSWC] = useState('');
  const [casePrincipal, setCasePrincipal] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, matrixData, incData, casesData] = await Promise.all([
        api.getDashboardStats().catch(() => ({})),
        api.getRiskMatrix().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getCases().catch(() => []),
      ]);

      setStats(statsData);
      setRiskMatrix(matrixData);
      setIncidents(incData);
      setCases(casesData);
      if (matrixData.length > 0 && caseStudentId === 0) {
        setCaseStudentId(matrixData[0].student_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewProfile = async (studentId: number) => {
    try {
      const data = await api.getStudentProfile360(studentId);
      setSelectedStudentProfile(data);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to load profile', 'error');
    }
  };

  const handleUpdateIncidentStatus = async (id: number, status: string) => {
    try {
      const updated = await api.updateIncidentStatus(id, status, currentUser.id);
      setIncidents(prev => prev.map(inc => (inc.id === id ? updated : inc)));
      onShowToast(`Incident status updated to ${status}. Early warning recalculation queued.`, 'success', 'Incident Triage');
      // Refresh risk matrix
      const matrixData = await api.getRiskMatrix();
      setRiskMatrix(matrixData);
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim() || !caseNotes.trim()) return;

    try {
      const newCase = await api.createCase({
        student_id: Number(caseStudentId),
        case_title: caseTitle,
        stage: caseStage,
        confidential_notes: caseNotes,
        parent_notified: caseParentNotified,
        swc_recommendation: caseSWC,
        principal_action: casePrincipal,
      });

      setCases([newCase, ...cases]);
      setShowCaseModal(false);
      setCaseTitle('');
      setCaseNotes('');
      setCaseSWC('');
      setCasePrincipal('');
      onShowToast('Counseling Case record created successfully.', 'success', 'Case Management');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to create case', 'error');
    }
  };

  const filteredMatrix = riskMatrix.filter(item => {
    if (!searchQuery) return true;
    const name = `${item.student?.first_name} ${item.student?.last_name}`.toLowerCase();
    const idNum = item.student?.student_profile?.student_id_number?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || idNum.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Overview KPIs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-600" />
              <span>Early Warning & Behavioral Monitoring Console</span>
            </h1>
            <p className="text-xs text-slate-500">
              Centralized oversight for UPIS Guidance Office (Grades 7–12). Multi-factor early detection engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/reports/export-csv"
              download
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV Summary</span>
            </a>
            <button
              onClick={() => setShowCaseModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Case Record</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Monitored Students</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total_students || 5}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Grades 7-12 enrolled</div>
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
            <div className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
              <span>🔴 High / Critical</span>
            </div>
            <div className="text-2xl font-black text-rose-900 mt-1">{stats.critical_count || 1}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">Immediate intervention</div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
              <span>🟡 Watchlist Tier</span>
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{stats.watchlist_count || 1}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Adviser check-in active</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Unverified Reports</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.unverified_reports || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pending counselor triage</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 shadow-xs">
            <div className="text-[11px] font-bold text-purple-700 uppercase flex items-center gap-1">
              <span>Vent Conversations</span>
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1">{stats.open_vent_threads || 1}</div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">Confidential chats</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'matrix'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Early Warning Risk Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'incidents'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Incident Triage Queue ({incidents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'cases'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-4 h-4 text-purple-600" />
          <span>Counselor Case Records ({cases.length})</span>
        </button>
      </div>

      {/* 2. TAB: Early Warning Risk Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Risk Scoring & Indicators</h2>
              <p className="text-xs text-slate-500">
                Calculated dynamically from attendance spikes, verified incident reports, teacher observations, and mood drops.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">Student</th>
                  <th className="p-3">Class & Section</th>
                  <th className="p-3">Risk Tier</th>
                  <th className="p-3">Score (0-100)</th>
                  <th className="p-3">Primary Warning Triggers</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatrix.map((evalItem) => {
                  const student = evalItem.student;
                  let parsedBreakdown: any = {};
                  try {
                    parsedBreakdown = JSON.parse(evalItem.breakdown_json);
                  } catch (e) {}

                  return (
                    <tr key={evalItem.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                        <img
                          src={student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.first_name}`}
                          alt=""
                          className="w-7 h-7 rounded-full bg-slate-100"
                        />
                        <div>
                          <div>{student?.first_name} {student?.last_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {student?.student_profile?.student_id_number}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-600">
                        {student?.student_profile?.class ? (
                          <span>Grade {student.student_profile.class.grade_level} - {student.student_profile.class.section_name}</span>
                        ) : '—'}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                            evalItem.risk_level === 'HIGH_CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : evalItem.risk_level === 'MODERATE'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {evalItem.risk_level.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 w-6">{evalItem.total_score}</span>
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                evalItem.total_score >= 65
                                  ? 'bg-rose-600'
                                  : evalItem.total_score >= 30
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(evalItem.total_score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {parsedBreakdown.triggers && parsedBreakdown.triggers.length > 0 ? (
                            parsedBreakdown.triggers.map((t: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">Normal baseline</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewProfile(evalItem.student_id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-semibold rounded-lg text-[11px] transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>360° Profile</span>
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

      {/* 3. TAB: Incident Triage Queue */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incident & Concern Triage Queue</h2>
            <p className="text-xs text-slate-500">
              Review public bystander reports, peer submissions, and teacher incident filings. Substantiated reports feed risk calculation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">Tracking Code</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Target Student / Situation</th>
                  <th className="p-3">Category & Urgency</th>
                  <th className="p-3">Narrative Summary</th>
                  <th className="p-3">Triage Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-indigo-700">{inc.tracking_code}</td>
                    <td className="p-3 text-slate-600">
                      <span className="font-semibold text-slate-800">{inc.reporter_type.replace('_', ' ')}</span>
                      {inc.reporter_contact && <div className="text-[10px] text-slate-400">{inc.reporter_contact}</div>}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {inc.target_student ? (
                        <span>{inc.target_student.first_name} {inc.target_student.last_name}</span>
                      ) : (
                        <span className="text-slate-500">General Campus Incident</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">{inc.category.replace('_', ' ')}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          inc.urgency === 'CRITICAL_IMMEDIATE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inc.urgency}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-slate-700 italic">"{inc.narrative}"</td>
                    <td className="p-3">
                      <select
                        value={inc.status}
                        onChange={(e) => handleUpdateIncidentStatus(inc.id, e.target.value)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold ${
                          inc.status === 'SUBSTANTIATED'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : inc.status === 'INVESTIGATING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : inc.status === 'CLOSED'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        <option value="UNVERIFIED">Unverified</option>
                        <option value="INVESTIGATING">Investigating</option>
                        <option value="SUBSTANTIATED">Substantiated (Flags Student)</option>
                        <option value="UNSUBSTANTIATED">Unsubstantiated</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: Counselor Case Records */}
      {activeTab === 'cases' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Counselor Case Records & Interventions</h2>
              <p className="text-xs text-slate-500">
                Official confidential counseling log, Student Welfare Committee (SWC) referrals, and sanctions.
              </p>
            </div>
            <button
              onClick={() => setShowCaseModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Case Record</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cases.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.case_title}</h3>
                    <div className="text-xs text-slate-500">
                      Subject Student: {c.student ? `${c.student.first_name} ${c.student.last_name}` : `ID #${c.student_id}`}
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                    {c.stage.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-2 border border-slate-100">
                  <div className="font-semibold text-slate-800">Confidential Counseling Notes:</div>
                  <p className="text-slate-600 leading-relaxed italic">"{c.confidential_notes}"</p>
                </div>

                {c.swc_recommendation && (
                  <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200">
                    <span className="font-bold block mb-0.5">Student Welfare Committee (SWC) Recommendation:</span>
                    {c.swc_recommendation}
                  </div>
                )}

                {c.principal_action && (
                  <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-200">
                    <span className="font-bold block mb-0.5">Principal Administrative Action:</span>
                    {c.principal_action}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Parent Notified: {c.parent_notified ? '✓ Yes' : 'Pending'}</span>
                  <span>Handled by: {c.counselor ? `${c.counselor.first_name} ${c.counselor.last_name}` : 'Counselor'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: 360 Degree Student Behavioral Profile Drilldown */}
      {selectedStudentProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentProfile.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudentProfile.student.first_name}`}
                  alt=""
                  className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedStudentProfile.student.first_name} {selectedStudentProfile.student.last_name}
                  </h2>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {selectedStudentProfile.student.student_profile?.student_id_number} • Class:{' '}
                    Grade {selectedStudentProfile.student.student_profile?.class?.grade_level} - {selectedStudentProfile.student.student_profile?.class?.section_name}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={() => setSelectedStudentProfile(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Risk Overview */}
            {selectedStudentProfile.risk && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Cumulative Early Warning Risk Score</div>
                  <div className="text-xl font-black text-slate-900">
                    {selectedStudentProfile.risk.total_score} / 100
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs border ${
                    selectedStudentProfile.risk.risk_level === 'HIGH_CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : selectedStudentProfile.risk.risk_level === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {selectedStudentProfile.risk.risk_level}
                </span>
              </div>
            )}

            {/* Attendance & Behavioral Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Recent Attendance Log (Truancy Check)</span>
                </div>
                {selectedStudentProfile.attendance.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedStudentProfile.attendance.map((att: any) => (
                      <div key={att.id} className="flex justify-between items-center text-[11px] p-1.5 bg-slate-50 rounded">
                        <span>{att.recorded_date}</span>
                        <span className={`font-semibold ${att.status.includes('ABSENCE') || att.status.includes('CUTTING') ? 'text-rose-600' : 'text-slate-600'}`}>
                          {att.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No attendance irregularities recorded.</p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Teacher Behavioral Observations</span>
                </div>
                {selectedStudentProfile.observations.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedStudentProfile.observations.map((obs: any) => (
                      <div key={obs.id} className="p-2 bg-slate-50 rounded text-[11px] space-y-0.5">
                        <div className="font-bold text-slate-800 flex justify-between">
                          <span>{obs.category}</span>
                          <span className="text-rose-600">{obs.severity}</span>
                        </div>
                        <p className="text-slate-600">"{obs.details}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No teacher observations flagged.</p>
                )}
              </div>
            </div>

            {/* Linked Incidents */}
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-800">Linked Incident Reports</div>
              {selectedStudentProfile.incidents.length > 0 ? (
                <div className="space-y-2">
                  {selectedStudentProfile.incidents.map((inc: any) => (
                    <div key={inc.id} className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <div className="font-bold text-rose-900 flex justify-between">
                        <span>{inc.category} ({inc.urgency})</span>
                        <span className="font-mono text-[10px]">{inc.tracking_code}</span>
                      </div>
                      <p className="text-rose-800 italic text-[11px]">"{inc.narrative}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400">No incidents linked to this student.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Case Record */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">New Counseling Case Record</h3>
              <button onClick={() => setShowCaseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Student</label>
                <select
                  value={caseStudentId}
                  onChange={(e) => setCaseStudentId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {riskMatrix.map(m => (
                    <option key={m.student_id} value={m.student_id}>
                      {m.student?.first_name} {m.student?.last_name} ({m.student?.student_profile?.student_id_number}) — {m.risk_level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aggression Outburst & Peer Threat Intervention"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Intervention Stage</label>
                <select
                  value={caseStage}
                  onChange={(e) => setCaseStage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="INTAKE">Initial Intake</option>
                  <option value="ACTIVE_COUNSELING">Active Counseling</option>
                  <option value="SWC_REFERRED">Referred to Student Welfare Committee (SWC)</option>
                  <option value="MONITORING">Monitoring & Behavioral Follow-up</option>
                  <option value="CLOSED">Case Closed / Resolved</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Confidential Counseling Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Document counseling notes, behavioral goals, parent discussions..."
                  value={caseNotes}
                  onChange={(e) => setCaseNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parentNotified"
                  checked={caseParentNotified}
                  onChange={(e) => setCaseParentNotified(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="parentNotified" className="font-semibold text-slate-700">
                  Parent / Guardian has been formally contacted for conference
                </label>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Student Welfare Committee Recommendation (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mandatory peer mediation, behavioral probation"
                  value={caseSWC}
                  onChange={(e) => setCaseSWC(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Case Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
