import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, RotateCcw, Home, Sparkles, TrendingUp, Clock, Target, Award } from 'lucide-react';

interface GameResultModalProps {
  isOpen: boolean;
  gameTitle: string;
  score: number;
  accuracy: number;
  averageReactionTimeMs: number;
  mistakesCount: number;
  durationSeconds: number;
  currentDifficulty: number;
  nextDifficulty: number;
  adjustmentRationale: string;
  adjustmentType: string;
  onPlayAgain: () => void;
}

export const GameResultModal: React.FC<GameResultModalProps> = ({
  isOpen,
  gameTitle,
  score,
  accuracy,
  averageReactionTimeMs,
  mistakesCount,
  durationSeconds,
  currentDifficulty,
  nextDifficulty,
  adjustmentRationale,
  adjustmentType,
  onPlayAgain
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const reactionTimeSec = (averageReactionTimeMs / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-elder bg-white max-w-lg w-full border-2 border-purple-200 p-6 md:p-8 space-y-6 shadow-[0_20px_50px_rgba(108,62,220,0.18)] animate-in fade-in zoom-in-95 duration-200">
        {/* Celebration Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] rounded-3xl border-2 border-purple-300 text-4xl shadow-md">
            🎉
          </div>
          <h2 className="text-elder-xl font-black text-elder-navy">
            Great Job!
          </h2>
          <p className="text-elder-base text-slate-600 font-medium">
            You completed your <span className="font-bold text-[#6C3EDC]">{gameTitle}</span> activity!
          </p>
          <span className="inline-block px-3 py-1 bg-purple-50 text-[#6C3EDC] border border-purple-200 rounded-full text-xs font-bold uppercase tracking-wider">
            Activity Performance Summary (Non-Diagnostic)
          </span>
        </div>

        {/* Real Performance Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 bg-[#F7F5FF] rounded-2xl border border-purple-100 flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Accuracy</p>
              <p className="text-elder-lg font-black text-emerald-700">{accuracy.toFixed(0)}%</p>
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F5FF] rounded-2xl border border-purple-100 flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#8B5CF6] shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Response Time</p>
              <p className="text-elder-lg font-black text-[#6C3EDC]">{reactionTimeSec}s</p>
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F5FF] rounded-2xl border border-purple-100 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#6C3EDC] shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Points Scored</p>
              <p className="text-elder-lg font-black text-[#6C3EDC]">{score}</p>
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F5FF] rounded-2xl border border-purple-100 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Current Level</p>
              <p className="text-elder-lg font-black text-indigo-700">Level {currentDifficulty}</p>
            </div>
          </div>
        </div>

        {/* AI Dynamic Difficulty Adjustment Card */}
        <div className="p-4 bg-gradient-to-br from-[#EDE9FE]/50 to-[#DDD6FE]/40 rounded-2xl border-2 border-purple-200 space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#6C3EDC] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span>AI Adaptive Progression</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-200 text-[#6C3EDC]">
              Next: Level {nextDifficulty} ({adjustmentType})
            </span>
          </div>
          <p className="text-sm md:text-elder-base text-slate-700 font-medium leading-relaxed">
            {adjustmentRationale}
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 btn-elder-primary"
          >
            <RotateCcw className="w-6 h-6" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => navigate('/elder')}
            className="flex-1 btn-elder-secondary"
          >
            <Home className="w-6 h-6" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
