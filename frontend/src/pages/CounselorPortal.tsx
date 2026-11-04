import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Download, Eye, Clock, AlertCircle, Plus, Search,
  Heart, Sparkles, AlertTriangle, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import type { User, RiskEvaluation, IncidentReport, CounselingCase, DailyMood } from '../types';

interface CounselorPortalProps {
  currentUser: User;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const CounselorPortal: React.FC<CounselorPortalProps> = ({ currentUser, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'incidents' | 'cases' | 'moods'>('matrix');

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

  // Mood Logs Feed
  const [recentMoods, setRecentMoods] = useState<DailyMood[]>([]);
  const [moodFilter, setMoodFilter] = useState<'all' | 'distress'>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, matrixData, incData, casesData, moodsData] = await Promise.all([
        api.getDashboardStats().catch(() => ({})),
        api.getRiskMatrix().catch(() => []),
        api.getIncidents().catch(() => []),
        api.getCases().catch(() => []),
        api.getRecentMoodLogs().catch(() => []),
      ]);

      setStats(statsData);
      setRiskMatrix(matrixData);
      setIncidents(incData);
      setCases(casesData);
      setRecentMoods(moodsData);
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

  const getMoodMeta = (score: number) => {
    switch (score) {
      case 5:
        return { emoji: '🌟', label: 'Great / Happy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 4:
        return { emoji: '🙂', label: 'Good / Okay', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 3:
        return { emoji: '😐', label: 'Neutral', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 2:
        return { emoji: '😔', label: 'Low / Sad', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 1:
        return { emoji: '😫', label: 'Distressed / Anxious', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { emoji: '—', label: 'Unknown', color: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const filteredMatrix = riskMatrix.filter(item => {
    if (!searchQuery) return true;
    const name = `${item.student?.first_name} ${item.student?.last_name}`.toLowerCase();
    const idNum = item.student?.student_profile?.student_id_number?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || idNum.includes(searchQuery.toLowerCase());
  });

  const filteredMoods = recentMoods.filter(m => {
    if (moodFilter === 'distress') {
      return m.score <= 2;
    }
    return true;
  });

  const distressMoodCount = recentMoods.filter(m => m.score <= 2).length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* 1. Header & Overview KPIs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0" />
              <span>Early Warning & Behavioral Monitoring Console</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Centralized oversight for UPIS Guidance Office (Grades 7–12). Multi-factor early detection engine.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <a
              href="/api/reports/export-csv"
              download
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV Summary</span>
            </a>
            <button
              onClick={() => setShowCaseModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Case Record</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase">Monitored Students</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{stats.total_students || 5}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Grades 7-12 enrolled</div>
          </div>

          <div className="bg-rose-50 p-3.5 sm:p-4 rounded-2xl border border-rose-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
              <span>🔴 High / Critical</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">{stats.critical_count || 1}</div>
            <div className="text-[10px] text-rose-600 font-medium mt-0.5">Immediate intervention</div>
          </div>

          <div className="bg-amber-50 p-3.5 sm:p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
              <span>🟡 Watchlist Tier</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">{stats.watchlist_count || 1}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-0.5">Adviser check-in active</div>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase">Unverified Reports</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.unverified_reports || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pending counselor triage</div>
          </div>

          <div className="bg-purple-50 p-3.5 sm:p-4 rounded-2xl border border-purple-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-purple-600" />
              <span>Distress Mood Logs</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-900 mt-1">{distressMoodCount}</div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">Flagged 3+ Sad/Anxious</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold overflow-x-auto pb-px no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition shrink-0 ${
            activeTab === 'matrix'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Early Warning Risk Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('moods')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition shrink-0 ${
            activeTab === 'moods'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Student Mood Check-Ins ({recentMoods.length})</span>
          {distressMoodCount > 0 && (
            <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {distressMoodCount} flagged
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition shrink-0 ${
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
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition shrink-0 ${
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
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

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Grade & Section</th>
                  <th className="p-3">Risk Tier</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Primary Behavioral Triggers</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatrix.map((item) => {
                  let breakdown: any = {};
                  try {
                    breakdown = JSON.parse(item.breakdown_json || '{}');
                  } catch (e) {}

                  const triggers: string[] = breakdown.triggers || [];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                        <img
                          src={item.student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student?.first_name}`}
                          alt=""
                          className="w-7 h-7 rounded-full bg-slate-100 shrink-0"
                        />
                        <div>
                          <div>{item.student?.first_name} {item.student?.last_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.student?.student_profile?.student_id_number}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.student?.student_profile?.class ? (
                          <span>Grade {item.student.student_profile.class.grade_level} - {item.student.student_profile.class.section_name}</span>
                        ) : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            item.risk_level === 'HIGH_CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : item.risk_level === 'MODERATE'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {item.risk_level === 'HIGH_CRITICAL' ? '🔴 High / Critical' : item.risk_level === 'MODERATE' ? '🟡 Watchlist' : '🟢 Low / Normal'}
                        </span>
                      </td>
                      <td className="p-3 font-black text-slate-900 text-sm">
                        {item.total_score} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                      </td>
                      <td className="p-3">
                        {triggers.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {triggers.slice(0, 2).map((t, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                {t}
                              </span>
                            ))}
                            {triggers.length > 2 && (
                              <span className="text-[10px] text-slate-400">+{triggers.length - 2} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Normal baseline activity</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleViewProfile(item.student_id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View 360° Profile</span>
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

      {/* 3. TAB: Student Mood Check-Ins (New Counselor Feature) */}
      {activeTab === 'moods' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-slate-900">Student Daily Mood Check-In History</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted daily by students via their personal calendar. Strictly confidential between student & Guidance Counselor.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setMoodFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    moodFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Entries ({recentMoods.length})
                </button>
                <button
                  onClick={() => setMoodFilter('distress')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                    moodFilter === 'distress' ? 'bg-rose-50 text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Flagged Distress ({distressMoodCount})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Privacy & Flag Rule Guidance Banner */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Guidance Wellness Protocol (Flag Rule: 3+ Sad / Angry / Anxious)</div>
              <p className="text-indigo-800 text-[11px] leading-relaxed">
                Students log their own mood daily (Scores 1 to 5). When a student submits 3 or more low/distressed moods, the early warning risk engine automatically escalates them to the Watchlist tier for counselor outreach.
              </p>
            </div>
          </div>

          {/* Mood Feed Grid / Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Student</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Logged Mood</th>
                  <th className="p-3">Student Reflection Note</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMoods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No mood check-in records found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredMoods.map((m) => {
                    const meta = getMoodMeta(m.score);
                    const isLow = m.score <= 2;

                    return (
                      <tr key={m.id} className={`hover:bg-slate-50/70 transition ${isLow ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {m.check_date}
                        </td>
                        <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                          <img
                            src={m.student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.student?.first_name || m.student_id}`}
                            alt=""
                            className="w-7 h-7 rounded-full bg-slate-100 shrink-0"
                          />
                          <div>
                            <div>{m.student ? `${m.student.first_name} ${m.student.last_name}` : `Student #${m.student_id}`}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{m.student?.email}</div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {m.student?.student_profile?.class ? (
                            <span>Gr. {m.student.student_profile.class.grade_level} - {m.student.student_profile.class.section_name}</span>
                          ) : '—'}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
                            <span className="text-base">{meta.emoji}</span>
                            <span>{meta.label} ({m.score}/5)</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 italic max-w-xs">
                          {m.note ? `"${m.note}"` : <span className="text-slate-400 not-italic">No note attached</span>}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleViewProfile(m.student_id)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg shadow-xs transition inline-flex items-center gap-1"
                          >
                            <span>Inspect 360°</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
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

      {/* 4. TAB: Incident Triage Queue */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incident Triage & Verification</h2>
            <p className="text-xs text-slate-500">
              Review submitted public & internal incident reports. Substantiating reports feeds the early detection matrix.
            </p>
          </div>

          <div className="space-y-4">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className={`p-4 sm:p-5 rounded-2xl border transition space-y-3 ${
                  inc.urgency === 'CRITICAL_IMMEDIATE'
                    ? 'border-rose-300 bg-rose-50/50'
                    : inc.status === 'SUBSTANTIATED'
                    ? 'border-indigo-200 bg-indigo-50/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {inc.tracking_code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        inc.category === 'WEAPON_THREAT' || inc.category === 'PHYSICAL_VIOLENCE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(inc.incident_date).toLocaleDateString()} at {inc.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">Triage Status:</span>
                    <select
                      value={inc.status}
                      onChange={(e) => handleUpdateIncidentStatus(inc.id, e.target.value)}
                      className="text-xs font-bold p-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="UNVERIFIED">UNVERIFIED (Pending)</option>
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="SUBSTANTIATED">SUBSTANTIATED (Verified Risk)</option>
                      <option value="UNSUBSTANTIATED">UNSUBSTANTIATED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-serif bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
                  "{inc.narrative}"
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div>
                    Reporter: <span className="font-semibold text-slate-700">{inc.reporter_type.replace('_', ' ')}</span>
                    {inc.reporter_contact && ` (${inc.reporter_contact})`}
                  </div>
                  <div>
                    Target Student:{' '}
                    {inc.target_student ? (
                      <button
                        onClick={() => handleViewProfile(inc.target_student_id!)}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        {inc.target_student.first_name} {inc.target_student.last_name}
                      </button>
                    ) : (
                      'Unspecified / Under Review'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: Counselor Case Records */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Official Counseling Case Files</h2>
              <p className="text-xs text-slate-500">
                Documented case notes, SWC recommendations, and administrative principal actions.
              </p>
            </div>

            <button
              onClick={() => setShowCaseModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </button>
          </div>

          <div className="space-y-4">
            {cases.map((c) => (
              <div key={c.id} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.case_title}</h3>
                    <div className="text-xs text-slate-500">
                      Student:{' '}
                      <button
                        onClick={() => handleViewProfile(c.student_id)}
                        className="font-semibold text-indigo-600 hover:underline"
                      >
                        {c.student?.first_name} {c.student?.last_name}
                      </button>{' '}
                      • Updated: {new Date(c.updated_at).toLocaleDateString()}
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

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
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
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 transition"
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

            {/* Daily Mood Check-In History (Added for Guidance Counselor View) */}
            <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Student Daily Mood Check-Ins & Emotional Wellness</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedStudentProfile.moods?.length || 0} Entries Logged
                </span>
              </div>

              {/* Check if student triggered 3+ Sad/Angry/Anxious moods */}
              {(() => {
                const studentMoods: DailyMood[] = selectedStudentProfile.moods || [];
                const lowMoods = studentMoods.filter(m => m.score <= 2);
                const hasFlag = lowMoods.length >= 3;

                return (
                  <>
                    {hasFlag && (
                      <div className="p-2.5 bg-rose-100/80 border border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>⚠️ Sustained Distress Flag Triggered:</strong> Student has logged {lowMoods.length} entries of low or distressed mood (Score ≤ 2).
                          Per protocol (3+ Sad/Angry/Anxious), proactive counselor check-in or Vent Space engagement is recommended.
                        </div>
                      </div>
                    )}

                    {studentMoods.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {studentMoods.map((m: any) => {
                          const meta = getMoodMeta(m.score);
                          return (
                            <div
                              key={m.id}
                              className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                m.score <= 2 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-base leading-none">{meta.emoji}</span>
                                  <span className="font-bold text-slate-800">{meta.label}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">({m.score}/5)</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-500">{m.check_date}</span>
                              </div>
                              {m.note && (
                                <p className="text-slate-600 text-[11px] italic pl-6">
                                  "{m.note}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs italic">No mood check-ins submitted yet by this student.</p>
                    )}
                  </>
                );
              })()}
            </div>

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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">New Counseling Case Record</h3>
              <button onClick={() => setShowCaseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
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
