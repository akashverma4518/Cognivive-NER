import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (role === 'CAREGIVER') navigate('/caregiver');
    else if (role === 'CLINICIAN' || role === 'ADMIN') navigate('/clinician');
    else navigate('/elder');
  };

  return (
    <div className="min-h-screen bg-elder-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="card-elder max-w-md bg-white border-2 border-rose-300 p-8 space-y-6 shadow-lg">
        <div className="w-20 h-20 bg-rose-100 rounded-3xl border-2 border-rose-400 flex items-center justify-center mx-auto text-rose-600">
          <ShieldX className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-elder-xl font-black text-elder-navy">Access Restricted</h1>
          <p className="text-elder-base text-slate-600 mt-2 font-medium">
            Your current role (<span className="font-bold text-[#6C3EDC]">{role || 'GUEST'}</span>) does not have permission to view this section.
          </p>
        </div>

        <button
          onClick={handleGoHome}
          className="w-full btn-elder-primary"
        >
          <Home className="w-6 h-6" />
          <span>Return to My Dashboard</span>
        </button>
      </div>
    </div>
  );
};
