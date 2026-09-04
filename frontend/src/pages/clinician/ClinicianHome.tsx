import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { Stethoscope, ShieldCheck, Database, Layers } from 'lucide-react';

export const ClinicianHome: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-elder-bg pb-16">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="card-elder bg-white flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center text-3xl">
            🩺
          </div>
          <div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
              Clinician & Administrator Portal
            </span>
            <h1 className="text-elder-xl font-black text-elder-navy mt-1">
              Welcome, {user?.full_name}
            </h1>
            <p className="text-slate-600 text-sm">
              Non-diagnostic cognitive activity oversight and longitudinal telemetry analysis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-elder bg-white space-y-2">
            <Database className="w-8 h-8 text-emerald-600" />
            <h3 className="text-elder-lg font-black">Cohort Analytics</h3>
            <p className="text-sm text-slate-600">Review aggregated reaction time and consistency trends across patient cohorts.</p>
          </div>
          <div className="card-elder bg-white space-y-2">
            <Layers className="w-8 h-8 text-sky-600" />
            <h3 className="text-elder-lg font-black">Difficulty Calibration</h3>
            <p className="text-sm text-slate-600">Fine-tune DDA sensitivity thresholds and minimum cognitive exercise bounds.</p>
          </div>
          <div className="card-elder bg-white space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#6C3EDC]" />
            <h3 className="text-elder-lg font-black">Audit & Compliance</h3>
            <p className="text-sm text-slate-600">Ensure all AI telemetry outputs strictly comply with non-diagnostic assistive guidelines.</p>
          </div>
        </div>
      </main>
    </div>
  );
};
