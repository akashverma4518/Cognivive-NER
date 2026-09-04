import React from 'react';
import { CheckCircle2, Clock, BellOff, Calendar, Mic, AlertCircle } from 'lucide-react';

interface ReminderLog {
  id: string;
  title: string;
  type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'TAKEN' | 'SNOOZED' | 'PENDING';
  acknowledged_at: string | null;
  delay_minutes: number | null;
  voice_confirmed: boolean;
}

interface ReminderAdherenceViewProps {
  summary: {
    total: number;
    completed: number;
    snoozed: number;
    pending: number;
    adherence_percentage: number;
  };
  totalConfigured: number;
  history?: ReminderLog[];
}

export const ReminderAdherenceView: React.FC<ReminderAdherenceViewProps> = ({
  summary,
  totalConfigured,
  history = []
}) => {
  return (
    <div className="card-elder bg-white border-2 border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Routine & Memory Assistance
          </span>
          <h3 className="text-xl font-black text-elder-navy mt-1">
            Reminder Adherence Overview
          </h3>
        </div>

        {/* Adherence Rate Badge */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-700 uppercase">Today's Adherence</span>
            <p className="text-2xl font-black text-emerald-800">{summary.adherence_percentage}%</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-emerald-200 flex items-center justify-center font-black text-emerald-800 text-sm">
            ✓
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-xs font-bold text-slate-400 uppercase">Configured</span>
          <p className="text-xl font-black text-slate-800">{totalConfigured}</p>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-xs font-bold text-emerald-600 uppercase">Completed (Taken)</span>
          <p className="text-xl font-black text-emerald-700">{summary.completed}</p>
        </div>
        <div className="p-3 bg-[#F7F5FF] border border-purple-200 rounded-xl">
          <span className="text-xs font-bold text-[#6C3EDC] uppercase">Snoozed</span>
          <p className="text-xl font-black text-[#6C3EDC]">{summary.snoozed}</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-xs font-bold text-blue-600 uppercase">Pending Today</span>
          <p className="text-xl font-black text-blue-700">{summary.pending}</p>
        </div>
      </div>

      {/* Recent Reminder History Table / List */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-elder-navy uppercase tracking-wider">
          Recent Activity & Adherence Log ({history.length})
        </h4>

        {history.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm bg-slate-50 rounded-xl">
            No recent reminder completion logs recorded.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {history.slice(0, 10).map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    log.status === 'TAKEN' ? 'bg-emerald-100 text-emerald-700' :
                    log.status === 'SNOOZED' ? 'bg-purple-100 text-[#6C3EDC]' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.status === 'TAKEN' ? <CheckCircle2 className="w-4 h-4" /> :
                     log.status === 'SNOOZED' ? <Clock className="w-4 h-4" /> :
                     <BellOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-black text-elder-navy block text-sm">{log.title}</span>
                    <span className="text-slate-400">
                      Scheduled: {log.scheduled_date ? new Date(log.scheduled_date).toLocaleDateString() : 'Today'} at {log.scheduled_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {log.voice_confirmed && (
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded flex items-center gap-1" title="Voice Confirmed by Elder">
                      <Mic className="w-3 h-3" /> Voice
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full font-black uppercase text-xs ${
                    log.status === 'TAKEN' ? 'bg-emerald-100 text-emerald-800' :
                    log.status === 'SNOOZED' ? 'bg-purple-100 text-[#6C3EDC]' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Non-Diagnostic Reminder Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs">
        <p className="font-semibold">
          ℹ️ This view describes adherence to configured platform reminders only. It does not provide medical or pharmaceutical advice.
        </p>
      </div>
    </div>
  );
};
