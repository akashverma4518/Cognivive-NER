import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Droplet, 
  Brain, 
  Footprints, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Mic, 
  HeartHandshake 
} from 'lucide-react';
import api from '../../services/api';

interface MyDayData {
  medication: { total: number; taken: number; pending: number; missed: number; snoozed: number };
  hydration: { total: number; taken: number; pending: number };
  cognitive: { completedToday: boolean; sessionsCountToday: number };
  wellness: { completedToday: boolean; totalMinutesToday: number };
  routine: { total: number; completed: number; pending: number };
  nextUpcoming: any;
}

interface MyDayCompanionProps {
  onStartGame?: () => void;
  onOpenReminders?: () => void;
  onOpenWellness?: () => void;
  onOpenVoice?: () => void;
  onOpenMemoryVault?: () => void;
}

export const MyDayCompanion: React.FC<MyDayCompanionProps> = ({
  onStartGame,
  onOpenReminders,
  onOpenWellness,
  onOpenVoice,
  onOpenMemoryVault
}) => {
  const [data, setData] = useState<MyDayData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMyDay = async () => {
      try {
        const res = await api.get('/care/my-day');
        if (res.data.success) {
          setData(res.data.myDay);
        }
      } catch (e) {
        console.warn('Could not load live My Day data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyDay();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 🌅';
    if (hour < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  return (
    <div className="card-elder bg-gradient-to-br from-white to-purple-50/40 border-2 border-purple-200 rounded-3xl p-6 md:p-8 shadow-lg shadow-purple-500/10">
      {/* Header with Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-4 mb-6">
        <div>
          <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#EDE9FE] text-[#6C3EDC] border border-purple-200">
            Daily Care Companion
          </span>
          <h2 className="text-elder-xl md:text-elder-2xl font-black text-elder-navy mt-2">
            {getGreeting()}
          </h2>
          <p className="text-elder-base text-slate-600 font-medium">
            Here is your daily routine and wellness progress for today.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Today</p>
          <p className="text-base font-black text-slate-800">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Today's Progress Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Medicine */}
        <div className="p-4 rounded-2xl bg-white border-2 border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <Pill className="w-6 h-6" />
            <span className="text-xs font-bold uppercase text-slate-500">Meds</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {data ? `${data.medication.taken} / ${data.medication.total}` : '1 / 1'}
          </p>
          <p className="text-xs font-semibold text-emerald-700 mt-1">
            {data && data.medication.pending === 0 ? '✓ Completed' : 'Schedule active'}
          </p>
        </div>

        {/* Hydration */}
        <div className="p-4 rounded-2xl bg-white border-2 border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-500 mb-2">
            <Droplet className="w-6 h-6" />
            <span className="text-xs font-bold uppercase text-slate-500">Hydration</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {data ? `${data.hydration.taken} / ${Math.max(4, data.hydration.total)}` : '4 Glasses'}
          </p>
          <p className="text-xs font-semibold text-blue-700 mt-1">
            Water reminder on
          </p>
        </div>

        {/* Cognitive Activity */}
        <div className="p-4 rounded-2xl bg-white border-2 border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6C3EDC] mb-2">
            <Brain className="w-6 h-6" />
            <span className="text-xs font-bold uppercase text-slate-500">Brain Game</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {data && data.cognitive.completedToday ? '✓ Done' : 'Pending'}
          </p>
          <p className="text-xs font-semibold text-purple-700 mt-1">
            {data?.cognitive.sessionsCountToday || 0} session(s) today
          </p>
        </div>

        {/* Movement & Wellness */}
        <div className="p-4 rounded-2xl bg-white border-2 border-purple-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <Footprints className="w-6 h-6" />
            <span className="text-xs font-bold uppercase text-slate-500">Wellness</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {data ? `${data.wellness.totalMinutesToday} min` : '15 min'}
          </p>
          <p className="text-xs font-semibold text-emerald-700 mt-1">
            {data && data.wellness.completedToday ? '✓ Movement logged' : 'Gentle walking'}
          </p>
        </div>
      </div>

      {/* Next Upcoming Reminder */}
      {data?.nextUpcoming && (
        <div className="p-4 rounded-2xl bg-purple-100/70 border border-purple-200 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C3EDC] text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-800">Next Scheduled</p>
              <p className="text-base font-black text-slate-900">{data.nextUpcoming.title}</p>
              <p className="text-xs text-slate-600 font-medium">Time: {data.nextUpcoming.scheduled_time?.slice(0, 5)}</p>
            </div>
          </div>
          <button
            onClick={onOpenReminders}
            className="px-4 py-2 bg-white text-[#6C3EDC] hover:bg-purple-50 font-bold rounded-xl text-sm border border-purple-200 shadow-xs cursor-pointer shrink-0"
          >
            View Reminders
          </button>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <button
          onClick={onStartGame}
          className="min-h-[58px] p-3 rounded-2xl bg-[#6C3EDC] hover:bg-purple-700 active:scale-98 text-white font-black text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
        >
          <Brain className="w-5 h-5" />
          <span>Play Activity</span>
        </button>

        <button
          onClick={onOpenReminders}
          className="min-h-[58px] p-3 rounded-2xl bg-white hover:bg-purple-50 border-2 border-purple-200 text-elder-navy font-black text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Pill className="w-5 h-5 text-purple-600" />
          <span>My Reminders</span>
        </button>

        <button
          onClick={onOpenWellness}
          className="min-h-[58px] p-3 rounded-2xl bg-white hover:bg-purple-50 border-2 border-purple-200 text-elder-navy font-black text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Footprints className="w-5 h-5 text-emerald-600" />
          <span>Log Movement</span>
        </button>

        <button
          onClick={onOpenMemoryVault}
          className="min-h-[58px] p-3 rounded-2xl bg-white hover:bg-purple-50 border-2 border-purple-200 text-elder-navy font-black text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <HeartHandshake className="w-5 h-5 text-pink-600" />
          <span>Family Vault</span>
        </button>

        <button
          onClick={onOpenVoice}
          className="min-h-[58px] p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 active:scale-98 text-white font-black text-sm sm:text-base flex flex-col sm:flex-row items-center justify-center gap-2 shadow-md col-span-2 sm:col-span-1 cursor-pointer"
        >
          <Mic className="w-5 h-5" />
          <span>Voice Help</span>
        </button>
      </div>
    </div>
  );
};
