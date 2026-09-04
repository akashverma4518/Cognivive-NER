import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Globe, Volume2, ShieldAlert } from 'lucide-react';
import { aiApi } from '../../services/api';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<'EN' | 'HI' | 'TA'>('EN');
  const [sosSent, setSosSent] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTriggerSos = async () => {
    try {
      await aiApi.triggerSos('Emergency alert triggered from Elder Navbar');
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b-2 border-purple-100 shadow-sm px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 bg-purple-100 rounded-2xl border-2 border-purple-300 flex items-center justify-center text-2xl shadow-sm">
            🧠
          </div>
          <div>
            <h1 className="text-elder-lg md:text-elder-xl font-black tracking-tight text-elder-navy leading-none">
              Cognivive <span className="text-[#6C3EDC]">NER</span>
            </h1>
            <p className="text-sm font-semibold text-slate-500 hidden sm:block">
              Cognitive Assistance & Activity Platform
            </p>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Secondary SOS Button (for Elder) */}
          {role === 'ELDER' && (
            <button
              onClick={handleTriggerSos}
              className={`min-h-touch px-4 py-2 rounded-2xl font-black text-sm md:text-base flex items-center gap-2 border-2 transition-all ${
                sosSent
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
              }`}
              title="Emergency Caregiver Alert"
            >
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>{sosSent ? 'Caregiver Alerted!' : 'SOS Help'}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLang(l => l === 'EN' ? 'HI' : l === 'HI' ? 'TA' : 'EN')}
            className="min-h-touch px-3 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-slate-800 font-bold text-sm md:text-base border border-purple-200 flex items-center gap-1.5 transition-colors"
            title="Switch Language"
          >
            <Globe className="w-5 h-5 text-purple-600" />
            <span>{lang}</span>
          </button>

          {/* User & Role Badge */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 bg-purple-50/50 border border-purple-100 rounded-2xl px-3 py-1.5">
              <UserIcon className="w-5 h-5 text-purple-600" />
              <div className="text-left leading-tight">
                <p className="font-bold text-sm text-elder-navy truncate max-w-[150px]">{user.full_name}</p>
                <span className="text-xs font-black text-[#6C3EDC] uppercase tracking-wider">{role}</span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="min-h-touch px-4 py-2 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-sm md:text-base border border-slate-300 hover:border-rose-300 flex items-center gap-2 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
