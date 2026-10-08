import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Phone, Search, Lock, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

interface PublicConcernPageProps {
  onBackToApp: () => void;
  onShowToast: (message: string, type: 'error' | 'success' | 'warning', title?: string) => void;
}

export const PublicConcernPage: React.FC<PublicConcernPageProps> = ({ onBackToApp, onShowToast }) => {
  const [reporterType, setReporterType] = useState('BYSTANDER_ANONYMOUS');
  const [reporterContact, setReporterContact] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('BULLYING');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [narrative, setNarrative] = useState('');

  // Result state
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Check state
  const [lookupCode, setLookupCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [trackingError, setTrackingError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim() || !location.trim()) {
      onShowToast('Please fill in the incident location and narrative description.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitPublicIncident({
        reporter_type: reporterType,
        reporter_contact: reporterContact,
        incident_date: incidentDate,
        location,
        category,
        urgency,
        narrative,
      });

      setSubmittedCode(res.tracking_code);
      onShowToast('Concern report submitted. Guidance counselors notified.', 'success', 'Report Filed');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    setTrackingError('');
    setTrackingResult(null);

    try {
      const res = await api.trackPublicIncident(lookupCode.trim().toUpperCase());
      setTrackingResult(res);
    } catch (err: any) {
      setTrackingError('No report found matching that tracking code.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </button>
          <div className="text-xs text-slate-500 font-medium">Campus Sentinel Public Safety Portal</div>
        </div>

        {/* Emergency Notice Banner */}
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-rose-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>URGENT SAFETY NOTICE — ACTIVE EMERGENCIES</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-900">
            This web portal is monitored during school hours. If there is an <strong>active threat, weapon sighting, or immediate violence occurring right now on campus</strong>, do not wait for this form:
          </p>
          <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-rose-800">
            <span className="flex items-center gap-1.5 bg-rose-200/60 px-2.5 py-1 rounded-lg">
              <Phone className="w-3.5 h-3.5 text-rose-700" />
              <span>Campus Security: (02) 8981-8500 loc. 4000</span>
            </span>
            <span className="flex items-center gap-1.5 bg-rose-200/60 px-2.5 py-1 rounded-lg">
              <Phone className="w-3.5 h-3.5 text-rose-700" />
              <span>Emergency Services: 911</span>
            </span>
          </div>
        </div>

        {/* Submission Confirmation Modal */}
        {submittedCode ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Concern Report Successfully Submitted</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your report has been securely routed to the UPIS Guidance Office and assigned counselor triage queue.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-xs mx-auto">
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Your Tracking Code</div>
              <div className="text-2xl font-mono font-black text-indigo-700 tracking-wider mt-1">
                {submittedCode}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Save this code to check the triage status anytime</div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSubmittedCode(null);
                  setNarrative('');
                  setLocation('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Submit Another Report
              </button>
              <button
                onClick={onBackToApp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                Return to Campus Sentinel
              </button>
            </div>
          </div>
        ) : (
          /* Public Report Form */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                <span>File a Student Concern or Incident Report</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Open to students, teachers, parents, and community members. You may report anonymously or provide contact details for counselor follow-up.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Your Identity / Role</label>
                  <select
                    value={reporterType}
                    onChange={(e) => setReporterType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="BYSTANDER_ANONYMOUS">Anonymous Bystander / Student</option>
                    <option value="STUDENT">Student (Self / Peer)</option>
                    <option value="PARENT">Parent or Guardian</option>
                    <option value="TEACHER">Faculty / Staff Member</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Contact Email or Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank if reporting completely anonymously"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Incident Date</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Campus Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bldg B Restroom, Cafeteria, Courtyard"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Incident Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="BULLYING">Bullying / Peer Harassment</option>
                    <option value="PHYSICAL_VIOLENCE">Physical Violence / Fight</option>
                    <option value="WEAPON_THREAT">Weapon / Firearm Threat</option>
                    <option value="VERBAL_THREAT">Verbal / Online Threat</option>
                    <option value="SELF_HARM">Self-Harm or Mental Crisis</option>
                    <option value="SUBSTANCE">Substance / Vaping Concern</option>
                    <option value="OTHER">Other Behavioral Concern</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Perceived Urgency Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'ROUTINE', label: 'Routine', desc: 'Needs regular check-in' },
                    { id: 'ELEVATED', label: 'Elevated', desc: 'Priority follow-up' },
                    { id: 'CRITICAL_IMMEDIATE', label: 'Critical / Urgent', desc: 'Possible immediate danger' },
                  ].map(u => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => setUrgency(u.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        urgency === u.id
                          ? u.id === 'CRITICAL_IMMEDIATE'
                            ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-400'
                            : 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-400'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{u.label}</div>
                      <div className="text-[10px] text-slate-500">{u.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Detailed Narrative of Concern or Incident
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Provide facts: what happened, students involved or witnessed, words spoken, physical signs..."
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  All reports are encrypted and held strictly under Republic Act 10173 (Data Privacy Act of 2012).
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {isSubmitting ? 'Submitting Report...' : 'Submit Incident / Concern Report'}
              </button>
            </form>
          </div>
        )}

        {/* Status Tracker Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Check Status of a Previously Filed Report</h3>
          </div>

          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your Tracking Code (e.g. CS-2026-9041)"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              Lookup
            </button>
          </form>

          {trackingError && <div className="text-xs text-rose-600">{trackingError}</div>}

          {trackingResult && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between items-center font-bold">
                <span className="font-mono text-indigo-700">{trackingResult.tracking_code}</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full text-[10px]">
                  Status: {trackingResult.status}
                </span>
              </div>
              <div className="text-slate-600">Category: {trackingResult.category}</div>
              <div className="text-slate-400 text-[10px]">
                Filed on: {new Date(trackingResult.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
