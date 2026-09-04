import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { apiClient } from '../../services/api';
import {
  User,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  HeartHandshake,
  Calendar,
  CheckCircle,
  RefreshCw,
  Phone,
  ArrowRight,
  Sliders,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Bell
} from 'lucide-react';

import { CognitiveRadarChart } from '../../components/caregiver/CognitiveRadarChart';
import { TrendLineChart } from '../../components/caregiver/TrendLineChart';
import { GameAnalyticsCard } from '../../components/caregiver/GameAnalyticsCard';
import { ReminderAdherenceView } from '../../components/caregiver/ReminderAdherenceView';
import { PerformanceChangeAlertCard } from '../../components/caregiver/PerformanceChangeAlertCard';
import { AiRecommendationCard } from '../../components/caregiver/AiRecommendationCard';

export const CaregiverHome: React.FC = () => {
  const { user } = useAuth();

  // State
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetail, setPatientDetail] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [remindersData, setRemindersData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>({ overdueMedicationAlerts: [], performanceChangeAlerts: [] });

  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'games' | 'reminders'>('overview');

  // Load patients roster & system alerts
  const loadCaregiverRoster = async () => {
    try {
      setLoading(true);
      const [pRes, aRes] = await Promise.all([
        apiClient.get('/caregiver/patients'),
        apiClient.get('/caregiver/alerts')
      ]);

      if (pRes.data.success) {
        setPatients(pRes.data.patients);
        if (pRes.data.patients.length > 0 && !selectedPatientId) {
          setSelectedPatientId(pRes.data.patients[0].patient_id);
        }
      }
      if (aRes.data.success) {
        setAlerts(aRes.data);
      }
    } catch (err) {
      console.error('Failed to load caregiver roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaregiverRoster();
  }, []);

  // Load details for the currently selected patient
  const loadSelectedPatientData = async (patientId: string) => {
    try {
      setPatientLoading(true);
      const [detailRes, trendsRes, gamesRes, remindersRes] = await Promise.all([
        apiClient.get(`/caregiver/patients/${patientId}`),
        apiClient.get(`/caregiver/patients/${patientId}/trends`),
        apiClient.get(`/caregiver/patients/${patientId}/games`),
        apiClient.get(`/caregiver/patients/${patientId}/reminders`)
      ]);

      if (detailRes.data.success) setPatientDetail(detailRes.data);
      if (trendsRes.data.success) setTrends(trendsRes.data);
      if (gamesRes.data.success) setGames(gamesRes.data.games);
      if (remindersRes.data.success) setRemindersData(remindersRes.data);
    } catch (err) {
      console.error('Failed to load patient analytics data:', err);
    } finally {
      setPatientLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadSelectedPatientData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId);

  // Status badge styling helper (Strictly non-diagnostic)
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'IMPROVING':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'PERFORMANCE_CHANGE_DETECTED':
        return 'bg-purple-100 text-[#6C3EDC] border-purple-300 animate-pulse font-black';
      case 'BASELINE':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300';
      case 'STABLE':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-elder-bg pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="card-elder bg-white border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 border-2 border-sky-400 flex items-center justify-center text-3xl shrink-0">
              👩‍⚕️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-black rounded-full uppercase tracking-wider">
                  Caregiver Intelligence Portal
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                  Non-Diagnostic Monitoring
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-elder-navy mt-1">
                Welcome, {user?.full_name}
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm">
                Real-time cognitive activity telemetry, routine assistance & longitudinal adherence tracking.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              loadCaregiverRoster();
              if (selectedPatientId) loadSelectedPatientData(selectedPatientId);
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Global Urgent Alerts Section (if any overdue medications) */}
        {alerts.overdueMedicationAlerts && alerts.overdueMedicationAlerts.length > 0 && (
          <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
              <Bell className="w-5 h-5 text-rose-600 animate-bounce" />
              <span>Overdue Medication Reminders Today ({alerts.overdueMedicationAlerts.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {alerts.overdueMedicationAlerts.map((oa: any, i: number) => (
                <div key={i} className="p-3 bg-white border border-rose-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-rose-900 block">{oa.patient_name}</span>
                  <p className="text-slate-700 font-medium">{oa.title}</p>
                  <span className="text-rose-600 font-bold text-[11px]">
                    Scheduled: {oa.scheduled_time?.slice(0, 5)} (Not completed)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. Patient Roster & Selector */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-elder-navy flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>Assigned Elderly Patients ({patients.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Click a patient to inspect their activity profile</span>
          </div>

          {loading ? (
            <div className="card-elder bg-white p-8 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading patient roster...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="card-elder bg-white p-8 text-center text-slate-500">
              No patients assigned to your caregiver account.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((pt) => {
                const isSelected = pt.patient_id === selectedPatientId;
                return (
                  <div
                    key={pt.patient_id}
                    onClick={() => setSelectedPatientId(pt.patient_id)}
                    className={`card-elder bg-white border-2 cursor-pointer transition-all p-5 space-y-3 ${
                      isSelected
                        ? 'border-sky-500 shadow-md ring-2 ring-sky-200 bg-sky-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-black text-elder-navy">{pt.full_name}</h3>
                        <span className="text-xs text-slate-500 font-medium">Relationship: {pt.relationship}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${getStatusBadge(pt.activity_status)}`}>
                        {pt.activity_status || 'STABLE'}
                      </span>
                    </div>

                    {/* Quick KPIs */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Score</span>
                        <span className="text-sm font-black text-[#6C3EDC]">
                          {Number(pt.overall_performance_score || 65).toFixed(1)}
                        </span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Baseline</span>
                        <span className="text-sm font-black text-slate-700">
                          {Number(pt.baseline_activity_index || 62.5).toFixed(1)}
                        </span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Adherence</span>
                        <span className="text-sm font-black text-emerald-700">
                          {pt.reminder_adherence_rate || 90}%
                        </span>
                      </div>
                    </div>

                    {/* Last active & today's reminder status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {pt.last_active_time ? new Date(pt.last_active_time).toLocaleDateString() : 'Active today'}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {pt.today_reminders_completed}/{pt.today_reminders_total} Reminders Done
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. Selected Patient Deep-Dive Section */}
        {selectedPatient && (
          <section className="space-y-6 pt-4">
            {/* Patient Header Card */}
            <div className="card-elder bg-white border-2 border-purple-100 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)] p-6 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] border-2 border-purple-200 flex items-center justify-center text-2xl font-black text-[#6C3EDC] shrink-0">
                    {selectedPatient.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black text-elder-navy">{selectedPatient.full_name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(patientDetail?.patient?.activity_status || selectedPatient.activity_status)}`}>
                        {patientDetail?.patient?.activity_status || selectedPatient.activity_status || 'STABLE'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>Emergency Contact: {patientDetail?.patient?.emergency_contact_phone || selectedPatient.emergency_contact_phone || 'Family'}</span>
                      <span>Language: {patientDetail?.patient?.preferred_language?.toUpperCase() || 'EN'}</span>
                      <span>Total Sessions: {patientDetail?.stats?.total_sessions || selectedPatient.total_sessions || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Patient Baseline VS Current Performance Comparison (Strictly Non-Competitive) */}
                <div className="flex items-center gap-4 bg-[#F7F5FF] border border-purple-100 p-3 rounded-2xl">
                  <div className="text-center px-3 border-r border-purple-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Personal Baseline</span>
                    <span className="text-lg font-black text-slate-700">
                      {Number(patientDetail?.patient?.baseline_activity_index || selectedPatient.baseline_activity_index || 62.5).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Activity</span>
                    <span className="text-lg font-black text-[#6C3EDC]">
                      {Number(patientDetail?.cognitiveProfile?.overall_performance_score || selectedPatient.overall_performance_score || 65).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 text-xs sm:text-sm font-bold overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === 'overview'
                      ? 'bg-white text-elder-navy shadow-sm border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overview & Profile
                </button>
                <button
                  onClick={() => setActiveTab('trends')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === 'trends'
                      ? 'bg-white text-elder-navy shadow-sm border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Longitudinal Trends
                </button>
                <button
                  onClick={() => setActiveTab('games')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === 'games'
                      ? 'bg-white text-elder-navy shadow-sm border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Game-Wise Analytics ({games.length})
                </button>
                <button
                  onClick={() => setActiveTab('reminders')}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeTab === 'reminders'
                      ? 'bg-white text-elder-navy shadow-sm border border-slate-200 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reminder Adherence
                </button>
              </div>
            </div>

            {/* Performance Change Alert Card (Shows if flag is active or confirms stability) */}
            <PerformanceChangeAlertCard
              flag={Boolean(patientDetail?.cognitiveProfile?.performance_change_flag || selectedPatient.performance_change_flag)}
              notes={patientDetail?.cognitiveProfile?.performance_change_notes || selectedPatient.performance_change_notes}
              lastEvaluated={patientDetail?.cognitiveProfile?.last_evaluated_at}
              baselineIndex={patientDetail?.patient?.baseline_activity_index || selectedPatient.baseline_activity_index}
              currentScore={patientDetail?.cognitiveProfile?.overall_performance_score || selectedPatient.overall_performance_score}
            />

            {patientLoading ? (
              <div className="card-elder bg-white p-12 text-center text-slate-500">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="font-bold text-sm">Gathering patient activity analytics...</span>
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW & PROFILE */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 5-Domain Radar Chart */}
                      <CognitiveRadarChart
                        scores={patientDetail?.cognitiveProfile}
                        overallScore={patientDetail?.cognitiveProfile?.overall_performance_score}
                      />

                      {/* AI Activity Recommendation */}
                      <AiRecommendationCard
                        recommendation={patientDetail?.recommendation}
                      />
                    </div>

                    {/* Quick Summary of Recent Activity */}
                    <div className="card-elder bg-white border-2 border-slate-200 shadow-sm p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-elder-navy">
                          Recent Activity Sessions
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                          Last 5 of {patientDetail?.stats?.total_sessions || 0} sessions
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {patientDetail?.recentSessions?.slice(0, 5).map((s: any) => (
                          <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-black text-elder-navy capitalize block text-sm">
                                {s.game_id.replace('_', ' ')}
                              </span>
                              <span className="text-slate-400">
                                {new Date(s.client_created_at).toLocaleDateString()} at {new Date(s.client_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-bold text-slate-700">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                                Lvl {s.difficulty_level}
                              </span>
                              <span className="text-emerald-700 font-black">
                                {s.accuracy_percentage}% Acc
                              </span>
                              <span className="text-sky-700 font-black">
                                {s.average_reaction_time_ms}ms
                              </span>
                              <span className="text-[#6C3EDC] font-black">
                                {s.score} pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LONGITUDINAL TRENDS */}
                {activeTab === 'trends' && (
                  <div className="space-y-6">
                    <TrendLineChart
                      timeline={trends?.timeline}
                      overallAvgAccuracy={trends?.overall_avg_accuracy}
                      overallAvgReactionTime={trends?.overall_avg_reaction_time_ms}
                      trendDirection={trends?.trend_direction}
                    />
                  </div>
                )}

                {/* TAB 3: GAME-WISE ANALYTICS */}
                {activeTab === 'games' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-elder-navy">Game Performance & Calibration</h3>
                        <p className="text-xs text-slate-500">
                          Monitor individual game engagement and calibrate challenge levels appropriately.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {games.map((g) => (
                        <GameAnalyticsCard
                          key={g.game_id}
                          game={g}
                          patientId={selectedPatientId!}
                          onDifficultyUpdated={() => {
                            if (selectedPatientId) loadSelectedPatientData(selectedPatientId);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: REMINDER ADHERENCE */}
                {activeTab === 'reminders' && remindersData && (
                  <ReminderAdherenceView
                    summary={remindersData.today_summary}
                    totalConfigured={remindersData.total_configured}
                    history={remindersData.history}
                  />
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
