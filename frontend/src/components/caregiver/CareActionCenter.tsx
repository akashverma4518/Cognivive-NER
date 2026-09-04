import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Footprints, Brain, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import api from '../../services/api';

interface CareAlert {
  patientId: string;
  patientName: string;
  type: 'MISSED_REMINDERS' | 'WELLNESS_PENDING' | 'COGNITIVE_PENDING' | 'PERFORMANCE_CHANGE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  actionType: string;
}

interface CareActionCenterProps {
  onSelectPatient?: (patientId: string) => void;
  onOpenReport?: (patientId: string) => void;
}

export const CareActionCenter: React.FC<CareActionCenterProps> = ({
  onSelectPatient,
  onOpenReport
}) => {
  const [alerts, setAlerts] = useState<CareAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/care/action-center');
        if (res.data.success) {
          setAlerts(res.data.alerts);
        }
      } catch (e) {
        console.warn('Could not load action center alerts:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const getAlertIcon = (type: CareAlert['type']) => {
    switch (type) {
      case 'MISSED_REMINDERS':
        return <span className="text-xl">🚨</span>;
      case 'WELLNESS_PENDING':
        return <span className="text-xl">🟠</span>;
      case 'COGNITIVE_PENDING':
        return <span className="text-xl">🟡</span>;
      case 'PERFORMANCE_CHANGE':
        return <span className="text-xl">📊</span>;
      default:
        return <span className="text-xl">ℹ️</span>;
    }
  };

  const getBadgeStyle = (severity: CareAlert['severity']) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="card-elder bg-white border-2 border-purple-100 rounded-3xl p-6 shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C3EDC] to-purple-800 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-elder-navy">Care Action Center</h3>
            <p className="text-xs text-slate-500 font-semibold">Real-time Routine, Wellness & Adherence Status</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-[#6C3EDC] rounded-full border border-purple-200 w-fit">
          {alerts.length} Active Items
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="p-6 text-center text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col items-center justify-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <p className="text-base font-bold">All assigned seniors are on track today!</p>
          <p className="text-xs text-emerald-700">Reminders, movement logs, and cognitive activities are stable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((al, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{getAlertIcon(al.type)}</div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {al.patientName}
                    </h4>
                    <p className="text-xs text-slate-700 font-medium mt-1 leading-snug">
                      {al.message}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border shrink-0 ${getBadgeStyle(al.severity)}`}>
                  {al.severity}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 justify-end">
                <button
                  onClick={() => onSelectPatient?.(al.patientId)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6C3EDC] text-xs font-bold border border-purple-200 flex items-center gap-1 cursor-pointer"
                >
                  <span>Check Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onOpenReport?.(al.patientId)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
