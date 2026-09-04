import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Sparkles, Brain, Pill, Footprints, Calendar, ShieldCheck, HeartHandshake } from 'lucide-react';
import api from '../../services/api';

export const PatientReportPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/care/progress-report/${patientId}`);
        if (res.data.success) {
          setReport(res.data.report);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load progress report.');
      } finally {
        setIsLoading(false);
      }
    };
    if (patientId) fetchReport();
  }, [patientId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-elder-bg flex items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-[#6C3EDC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-elder-bg p-8 flex flex-col items-center justify-center text-center">
        <p className="text-xl font-bold text-rose-700 mb-4">{error || 'Report not found'}</p>
        <button
          onClick={() => navigate('/caregiver')}
          className="px-5 py-2.5 bg-[#6C3EDC] text-white rounded-xl font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { patient, cognitiveProfile, cognitiveAnalytics, medicineAdherence, routineAdherence, wellness, observationalNotes } = report;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 text-slate-800 font-sans print:bg-white print:p-0">
      {/* Top Navigation Bar - Hidden on print */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={() => navigate('/caregiver')}
          className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-sm text-slate-700 flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-5 py-2 bg-[#6C3EDC] hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-2">
        {/* Document Header */}
        <div className="border-b-2 border-purple-200 pb-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🧠</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Cognivive <span className="text-[#6C3EDC]">NER</span>
              </h1>
            </div>
            <p className="text-sm font-bold text-purple-800 uppercase tracking-wider">
              Personal Daily Care & Cognitive Activity Progress Report
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500 font-medium">
            <p>Generated: <span className="font-bold text-slate-800">{new Date(report.generatedAt).toLocaleString()}</span></p>
            <p>Non-Diagnostic Assistive Care Companion</p>
          </div>
        </div>

        {/* Non-Diagnostic Clinical Disclaimer */}
        <div className="mb-6 p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-950 font-medium leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#6C3EDC] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wide text-purple-900 mb-0.5">Observational Non-Diagnostic Disclaimer</p>
            <p>{report.nonDiagnosticDisclaimer}</p>
          </div>
        </div>

        {/* Patient Overview Section */}
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">1. Senior Patient Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Full Name</p>
              <p className="text-base font-black text-slate-900">{patient.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Age & Gender</p>
              <p className="text-base font-black text-slate-900">{patient.age || 74} yrs • {patient.gender || 'Male'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">State / NER Region</p>
              <p className="text-base font-black text-slate-900">{patient.ner_region || 'Assam'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Activity Status</p>
              <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full border border-emerald-300">
                {patient.baseline_status || 'STABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Cognitive Activities & 5-Domain Profile */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-[#6C3EDC]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Cognitive Activities & Domain Profile</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Sessions</p>
              <p className="text-2xl font-black text-[#6C3EDC]">{cognitiveAnalytics.totalSessions}</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Avg Accuracy</p>
              <p className="text-2xl font-black text-[#6C3EDC]">{cognitiveAnalytics.averageAccuracyPercentage}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Reaction Speed</p>
              <p className="text-2xl font-black text-[#6C3EDC]">{cognitiveAnalytics.averageReactionTimeMs} ms</p>
            </div>
          </div>

          {/* Domain Breakdown */}
          {cognitiveProfile && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">5-Domain Personal Activity Scores</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 font-semibold">Memory</p>
                  <p className="font-black text-slate-800 text-sm">{cognitiveProfile.working_memory_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 font-semibold">Speed</p>
                  <p className="font-black text-slate-800 text-sm">{cognitiveProfile.processing_speed_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 font-semibold">Attention</p>
                  <p className="font-black text-slate-800 text-sm">{cognitiveProfile.attention_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 font-semibold">Flexibility</p>
                  <p className="font-black text-slate-800 text-sm">{cognitiveProfile.executive_flexibility_score}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                  <p className="text-slate-500 font-semibold">Reminiscence</p>
                  <p className="font-black text-slate-800 text-sm">{cognitiveProfile.reminiscence_score}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Medicine & Routine Adherence */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Medicine */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-3 text-purple-700">
              <Pill className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Medicine Adherence (30 Days)</h4>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-black text-purple-900">{medicineAdherence.adherencePercentage}%</span>
              <span className="text-xs font-bold text-slate-500">{medicineAdherence.taken} of {medicineAdherence.totalScheduled} Taken</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${medicineAdherence.adherencePercentage}%` }} />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
              <span>Missed: {medicineAdherence.missed}</span>
              <span>Snoozed: {medicineAdherence.snoozed}</span>
            </div>
          </div>

          {/* Routine */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-3 text-indigo-700">
              <Calendar className="w-5 h-5" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Daily Routine Completion</h4>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-black text-indigo-900">{routineAdherence.adherencePercentage}%</span>
              <span className="text-xs font-bold text-slate-500">{routineAdherence.completed} of {routineAdherence.totalScheduled} Routines</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${routineAdherence.adherencePercentage}%` }} />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-2">
              Hydration, gentle walks, and meal schedule adherence
            </p>
          </div>
        </div>

        {/* Wellness Activity Summary */}
        <div className="mb-8 p-5 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-3 text-emerald-700">
            <Footprints className="w-5 h-5" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Wellness & Movement Tracking</h4>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50/60 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold">Active Days (Month)</p>
              <p className="text-xl font-black text-emerald-800">{wellness.activeDaysLast30Days} Days</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold">Total Minutes</p>
              <p className="text-xl font-black text-emerald-800">{wellness.totalMinutesLast30Days} min</p>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold">Sessions Logged</p>
              <p className="text-xl font-black text-emerald-800">{wellness.totalActivitiesLogged}</p>
            </div>
          </div>
        </div>

        {/* Observational Caregiver Notes */}
        {observationalNotes && observationalNotes.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Recent Caregiver Observations</h4>
            <div className="space-y-2">
              {observationalNotes.map((n: any, idx: number) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
                  <p className="font-semibold text-slate-800">"{n.note_text}"</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Recorded by {n.author_name} on {new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-center text-xs text-slate-400 font-semibold">
          Cognivive NER • Assistive Multilingual Daily Living & Cognitive Platform • SIH 2026
        </div>
      </div>
    </div>
  );
};
