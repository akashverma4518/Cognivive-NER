import React, { useState } from 'react';
import { Sliders, TrendingUp, TrendingDown, Minus, Check, Clock, Award } from 'lucide-react';
import { apiClient } from '../../services/api';

interface GameAnalytics {
  game_id: string;
  name: string;
  domain: string;
  description: string;
  current_difficulty: number;
  ai_adjustment_notes: string;
  sessions_completed: number;
  avg_accuracy: number;
  avg_reaction_time_ms: number;
  best_score: number;
  last_played_at: string | null;
  trend: 'IMPROVING' | 'STABLE' | 'LOWER';
  difficulty_history: { difficulty: number; date: string }[];
  recent_sessions: any[];
}

interface GameAnalyticsCardProps {
  game: GameAnalytics;
  patientId: string;
  onDifficultyUpdated?: () => void;
}

export const GameAnalyticsCard: React.FC<GameAnalyticsCardProps> = ({
  game,
  patientId,
  onDifficultyUpdated
}) => {
  const [calibrating, setCalibrating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState(game.current_difficulty);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'WORKING_MEMORY': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'PROCESSING_SPEED': return 'bg-purple-50 text-[#6C3EDC] border-purple-200';
      case 'REMINISCENCE': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default: return 'bg-sky-50 text-sky-800 border-sky-200';
    }
  };

  const handleSaveDifficulty = async () => {
    try {
      setSaving(true);
      const res = await apiClient.post(`/caregiver/patients/${patientId}/games/${game.game_id}/difficulty`, {
        newDifficulty: selectedDifficulty,
        notes: `Caregiver manual calibration to Level ${selectedDifficulty}`
      });
      if (res.data.success) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          setCalibrating(false);
          if (onDifficultyUpdated) onDifficultyUpdated();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to calibrate difficulty:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-elder bg-white border-2 border-purple-100 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)] p-6 space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getDomainColor(game.domain)}`}>
              {game.domain.replace('_', ' ')}
            </span>
            <h4 className="text-xl font-black text-elder-navy mt-1.5">{game.name}</h4>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1 ${
            game.trend === 'IMPROVING' ? 'bg-emerald-100 text-emerald-800' :
            game.trend === 'LOWER' ? 'bg-purple-100 text-[#6C3EDC]' :
            'bg-slate-100 text-slate-700'
          }`}>
            {game.trend === 'IMPROVING' && <TrendingUp className="w-3.5 h-3.5" />}
            {game.trend === 'LOWER' && <TrendingDown className="w-3.5 h-3.5" />}
            {game.trend === 'STABLE' && <Minus className="w-3.5 h-3.5" />}
            {game.trend}
          </span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2">{game.description}</p>

        {/* Key Game Stats */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Sessions</span>
            <p className="text-lg font-black text-elder-navy">{game.sessions_completed}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Accuracy</span>
            <p className="text-lg font-black text-emerald-600">{game.avg_accuracy}%</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Speed</span>
            <p className="text-lg font-black text-[#6C3EDC]">{game.avg_reaction_time_ms}ms</p>
          </div>
        </div>

        {/* Current Difficulty & AI Notes */}
        <div className="p-3 bg-[#F7F5FF] border border-purple-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#6C3EDC]">Current AI Difficulty:</span>
            <span className="px-2 py-0.5 bg-purple-200 text-[#6C3EDC] rounded font-black text-sm">
              Level {game.current_difficulty}
            </span>
          </div>
          <p className="text-xs text-slate-600 italic">
            "{game.ai_adjustment_notes}"
          </p>
        </div>

        {/* Difficulty Progression Badges */}
        {game.difficulty_history.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Progression History:</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {game.difficulty_history.slice(-6).map((dh, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200"
                  title={new Date(dh.date).toLocaleDateString()}
                >
                  L{dh.difficulty}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Caregiver Difficulty Override / Calibration Toggle */}
      <div className="pt-3 border-t border-slate-100">
        {!calibrating ? (
          <button
            onClick={() => setCalibrating(true)}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Calibrate Difficulty Level</span>
          </button>
        ) : (
          <div className="space-y-3 p-3 bg-slate-50 border border-slate-300 rounded-xl">
            <div className="flex items-center justify-between text-xs font-bold text-elder-navy">
              <span>Set Difficulty (1-8):</span>
              <span className="text-sm font-black text-sky-600">Level {selectedDifficulty}</span>
            </div>

            <input
              type="range"
              min="1"
              max="8"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSaveDifficulty}
                disabled={saving || savedSuccess}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : saving ? (
                  <span>Saving...</span>
                ) : (
                  <span>Confirm Level {selectedDifficulty}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedDifficulty(game.current_difficulty);
                  setCalibrating(false);
                }}
                className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
