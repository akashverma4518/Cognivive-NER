import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, HeartHandshake, CheckCircle } from 'lucide-react';

interface PerformanceChangeAlertProps {
  flag: boolean;
  notes?: string;
  lastEvaluated?: string;
  baselineIndex?: number | string;
  currentScore?: number | string;
  suggestedAction?: string;
}

export const PerformanceChangeAlertCard: React.FC<PerformanceChangeAlertProps> = ({
  flag,
  notes,
  lastEvaluated,
  baselineIndex,
  currentScore,
  suggestedAction = 'Consider checking in with the user or reviewing recent activity sessions.'
}) => {
  if (!flag) {
    return (
      <div className="card-elder bg-emerald-50/70 border-2 border-emerald-200 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-black text-emerald-900">Activity Profile: Stable</h4>
            <p className="text-xs text-emerald-700">
              Gameplay activity metrics are consistent with the user's personal baseline ({baselineIndex || '62.5'}).
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full text-xs font-black uppercase tracking-wider">
          STABLE
        </span>
      </div>
    );
  }

  return (
    <div className="card-elder bg-gradient-to-br from-[#EDE9FE]/70 to-[#DDD6FE]/40 border-2 border-purple-300 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.08)] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-200 text-[#6C3EDC] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#6C3EDC] bg-purple-200 px-2.5 py-0.5 rounded-md">
              Monitoring Alert
            </span>
            <h3 className="text-xl font-black text-elder-navy mt-1">
              Performance Change Detected
            </h3>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-200 text-[#6C3EDC] border border-purple-300">
          PERFORMANCE_CHANGE_DETECTED
        </span>
      </div>

      {/* Rationale & Metrics comparison */}
      <div className="p-4 bg-white/90 border border-purple-200 rounded-xl space-y-2">
        <p className="text-sm font-bold text-elder-navy">
          {notes || 'A noticeable deviation from the user’s established activity baseline was observed across recent gameplay sessions.'}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Personal Baseline:</span>
            <span className="text-base font-black text-slate-800">{baselineIndex || '62.5'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Current Score:</span>
            <span className="text-base font-black text-[#6C3EDC]">{currentScore || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Evaluated At:</span>
            <span className="text-base font-black text-slate-800">
              {lastEvaluated ? new Date(lastEvaluated).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Follow-up Action */}
      <div className="p-3 bg-purple-100/80 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-elder-navy">
        <HeartHandshake className="w-4 h-4 text-[#6C3EDC] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Suggested Follow-Up:</span>
          <span>{suggestedAction}</span>
        </div>
      </div>

      {/* Non-Diagnostic Reminder */}
      <p className="text-[11px] text-slate-600 italic">
        * This notification is generated based on in-app task performance changes relative to the user's personal baseline. It is not a clinical assessment or medical diagnosis.
      </p>
    </div>
  );
};
