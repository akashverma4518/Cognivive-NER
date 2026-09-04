import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { User, Lock, HeartHandshake, Sparkles, AlertCircle, Phone, Globe, MapPin, CheckCircle2 } from 'lucide-react';
import { NER_LANGUAGES } from '../../services/voice/languageRegistry';

const NER_REGIONS = [
  'Assam',
  'Arunachal Pradesh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'ELDER' | 'CAREGIVER'>('ELDER');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Elder-specific
  const [age, setAge] = useState('72');
  const [gender, setGender] = useState('Male');
  const [nerRegion, setNerRegion] = useState('Assam');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        role,
        phoneNumber: phoneNumber.trim() || undefined
      };

      if (role === 'ELDER') {
        payload.age = parseInt(age, 10) || 70;
        payload.gender = gender;
        payload.nerRegion = nerRegion;
        payload.preferredLanguage = preferredLanguage;
        payload.emergencyContactName = emergencyContactName.trim() || 'Family Contact';
        payload.emergencyContactPhone = emergencyContactPhone.trim() || '+91 9876543210';
      }

      const res = await authApi.register(payload);
      if (res.success && res.token) {
        // Save token and role to local storage for automatic login
        localStorage.setItem('cognivive_token', res.token);
        localStorage.setItem('cognivive_role', res.user.role);
        localStorage.setItem('cognivive_user', JSON.stringify(res.user));

        setSuccessMsg(`Welcome, ${res.user.full_name}! Registration successful. Redirecting...`);
        setTimeout(() => {
          if (res.user.role === 'CAREGIVER') {
            window.location.href = '/caregiver';
          } else {
            window.location.href = '/elder';
          }
        }, 1200);
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-elder-bg flex flex-col justify-center items-center p-4 md:p-8">
      {/* Platform Branding Header */}
      <div className="text-center max-w-xl mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] border-2 border-purple-300 rounded-3xl text-3xl mb-2 shadow-md shadow-purple-500/15">
          🧠
        </div>
        <h1 className="text-elder-xl md:text-elder-2xl font-black text-elder-navy tracking-tight">
          Join Cognivive <span className="text-[#6C3EDC]">NER</span>
        </h1>
        <p className="text-elder-base text-slate-600 mt-1 font-medium">
          Create a personalized account for elderly daily assistance & care
        </p>
      </div>

      <div className="card-elder max-w-2xl w-full p-6 md:p-8 bg-white border border-purple-100 shadow-xl rounded-3xl">
        {/* Role Toggle */}
        <div className="flex bg-purple-50/80 p-1.5 rounded-2xl mb-6 border border-purple-200">
          <button
            type="button"
            onClick={() => { setRole('ELDER'); setError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'ELDER'
                ? 'bg-[#6C3EDC] text-white shadow-md'
                : 'text-slate-700 hover:text-purple-900'
            }`}
          >
            <span>👴</span>
            <span>Senior / Elder</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('CAREGIVER'); setError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'CAREGIVER'
                ? 'bg-[#6C3EDC] text-white shadow-md'
                : 'text-slate-700 hover:text-purple-900'
            }`}
          >
            <span>👩‍⚕️</span>
            <span>Caregiver</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-start gap-3 text-rose-900 text-sm font-semibold animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-start gap-3 text-emerald-900 text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-elder-base font-bold text-elder-navy mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={role === 'ELDER' ? 'e.g., Ramchandra Sharma' : 'e.g., Ananya Sharma'}
                className="input-elder pl-12 w-full py-3 rounded-2xl border-2 border-slate-200 focus:border-[#6C3EDC] focus:outline-none text-base"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-elder-base font-bold text-elder-navy mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="input-elder w-full py-3 px-4 rounded-2xl border-2 border-slate-200 focus:border-[#6C3EDC] focus:outline-none text-base"
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-elder-base font-bold text-elder-navy mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-elder pl-12 w-full py-3 rounded-2xl border-2 border-slate-200 focus:border-[#6C3EDC] focus:outline-none text-base"
                />
              </div>
            </div>
            <div>
              <label className="block text-elder-base font-bold text-elder-navy mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="input-elder pl-12 w-full py-3 rounded-2xl border-2 border-slate-200 focus:border-[#6C3EDC] focus:outline-none text-base"
                />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-elder-base font-bold text-elder-navy mb-1.5">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="input-elder pl-12 w-full py-3 rounded-2xl border-2 border-slate-200 focus:border-[#6C3EDC] focus:outline-none text-base"
              />
            </div>
          </div>

          {/* ELDER SPECIFIC FIELDS */}
          {role === 'ELDER' && (
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-4 my-2">
              <h3 className="text-sm font-black text-purple-900 uppercase tracking-wider">
                Senior Profile & Personalization
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Age */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="50"
                    max="115"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* NER Region */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NER Region / State</label>
                  <select
                    value={nerRegion}
                    onChange={(e) => setNerRegion(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
                  >
                    {NER_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Language (NER & National)
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
                >
                  {NER_LANGUAGES.map((l) => (
                    <option key={l.id} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="e.g., Ananya Sharma (Daughter)"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="+91 9876543211"
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#6C3EDC]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[58px] rounded-2xl bg-[#6C3EDC] hover:bg-purple-700 active:scale-98 text-white font-black text-elder-base flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all mt-6 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Create {role === 'ELDER' ? 'Senior' : 'Caregiver'} Account</span>
              </>
            )}
          </button>
        </form>

        {/* Existing user link */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6C3EDC] font-bold hover:underline">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
