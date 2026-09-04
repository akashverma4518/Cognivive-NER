import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, User, Lock, AlertCircle, Sparkles, HeartHandshake, Stethoscope } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      // Role-based redirect
      const storedRole = localStorage.getItem('cognivive_role');
      if (storedRole === 'CAREGIVER') {
        navigate('/caregiver');
      } else if (storedRole === 'CLINICIAN' || storedRole === 'ADMIN') {
        navigate('/clinician');
      } else {
        navigate('/elder');
      }
    } else {
      setError(result.message || 'Invalid credentials. Please try again.');
    }
  };

  const setDemoCredentials = (eMail: string, pass: string) => {
    setEmail(eMail);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-elder-bg flex flex-col justify-center items-center p-4 md:p-8">
      {/* Platform Branding Header */}
      <div className="text-center max-w-xl mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] border-2 border-purple-300 rounded-3xl text-4xl mb-3 shadow-md shadow-purple-500/15">
          🧠
        </div>
        <h1 className="text-elder-xl md:text-elder-2xl font-black text-elder-navy tracking-tight">
          Welcome to Cognivive <span className="text-[#6C3EDC]">NER</span>
        </h1>
        <p className="text-elder-base text-slate-600 mt-2 font-medium">
          Personalized Cognitive Stimulation & Daily Living Assistance
        </p>
        <span className="inline-block mt-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-bold text-[#6C3EDC] uppercase tracking-wider">
          Non-Diagnostic Assistive System
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(108,62,220,0.08)] border border-purple-100 p-6 md:p-8">
        <h2 className="text-elder-lg font-bold text-elder-navy mb-4 text-center">
          Sign In to Your Account
        </h2>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-600" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-elder-base font-bold text-elder-navy mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full min-h-touch pl-14 pr-4 rounded-2xl border-2 border-purple-200 focus:border-[#8B5CF6] focus:ring-4 focus:ring-purple-200 text-elder-base font-medium transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-elder-base font-bold text-elder-navy mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-touch pl-14 pr-4 rounded-2xl border-2 border-purple-200 focus:border-[#8B5CF6] focus:ring-4 focus:ring-purple-200 text-elder-base font-medium transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-elder-primary mt-2"
          >
            <LogIn className="w-6 h-6" />
            <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="mt-8 pt-6 border-t-2 border-purple-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
            One-Click Demo Profiles (Pre-loaded)
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('elder@cognivive.com', 'password123')}
              className="min-h-touch px-4 py-2.5 rounded-2xl bg-[#F7F5FF] hover:bg-purple-100/70 border-2 border-purple-200 text-[#111827] font-bold text-sm flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👴</span>
                <span className="text-left leading-tight">
                  Elder Portal<br />
                  <span className="text-xs font-normal text-[#6C3EDC]">Ramchandra Sharma</span>
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-purple-200 text-[#6C3EDC] rounded-lg">Fill</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('caregiver@cognivive.com', 'password123')}
              className="min-h-touch px-4 py-2.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border-2 border-indigo-200 text-indigo-950 font-bold text-sm flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👩‍⚕️</span>
                <span className="text-left leading-tight">
                  Caregiver Portal<br />
                  <span className="text-xs font-normal text-indigo-700">Ananya Sharma (Daughter)</span>
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-indigo-200 text-indigo-800 rounded-lg">Fill</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('clinician@cognivive.com', 'password123')}
              className="min-h-touch px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-950 font-bold text-sm flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🩺</span>
                <span className="text-left leading-tight">
                  Clinician Portal<br />
                  <span className="text-xs font-normal text-emerald-800">Dr. Arvind Verma</span>
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-200 text-emerald-800 rounded-lg">Fill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
