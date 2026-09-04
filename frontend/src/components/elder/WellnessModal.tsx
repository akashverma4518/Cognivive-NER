import React, { useState } from 'react';
import { Footprints, X, Check, Sparkles, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface WellnessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ACTIVITIES = [
  { type: 'Walking', icon: '🚶‍♂️', desc: 'Veranda or garden stroll' },
  { type: 'Stretching', icon: '🧘‍♂️', desc: 'Gentle morning joint stretches' },
  { type: 'Light Exercise', icon: '🤸‍♂️', desc: 'Chair yoga or light movement' },
  { type: 'Breathing/Relaxation', icon: '🪷', desc: 'Calming deep breath meditation' },
  { type: 'Household Activity', icon: '🪴', desc: 'Watering plants, light chores' },
  { type: 'Other Movement', icon: '✨', desc: 'General active movement' }
];

export const WellnessModal: React.FC<WellnessModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedType, setSelectedType] = useState('Walking');
  const [duration, setDuration] = useState(15);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg(null);

    try {
      const res = await api.post('/care/wellness', {
        activityType: selectedType,
        durationMinutes: duration,
        notes: notes.trim() || undefined,
        completed: true
      });

      if (res.data.success) {
        setMsg('Movement logged successfully! Excellent job staying active.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Could not log activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border-2 border-purple-200 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Log Wellness Activity"
      >
        <div className="flex items-center justify-between border-b border-purple-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Log Daily Movement</h2>
              <p className="text-xs text-slate-500 font-semibold">Gentle Wellness & Activity Tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Activity Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map((act) => (
                <button
                  key={act.type}
                  type="button"
                  onClick={() => setSelectedType(act.type)}
                  className={`min-h-[64px] p-3 rounded-2xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedType === act.type
                      ? 'border-[#6C3EDC] bg-purple-50 text-slate-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-purple-200 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{act.icon}</span>
                  <div>
                    <p className="text-sm font-black leading-tight">{act.type}</p>
                    <p className="text-xs text-slate-500 leading-tight">{act.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Duration (Minutes): {duration} min
            </label>
            <div className="flex gap-2">
              {[10, 15, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`flex-1 py-2 rounded-xl font-black text-sm transition-all cursor-pointer ${
                    duration === mins
                      ? 'bg-[#6C3EDC] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-purple-100 text-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Optional Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Felt refreshed, strolled with tea"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[54px] rounded-2xl bg-[#6C3EDC] hover:bg-purple-700 active:scale-98 text-white font-black text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer mt-2"
          >
            <Check className="w-5 h-5" />
            <span>{isSubmitting ? 'Recording...' : 'Record Wellness Activity'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
