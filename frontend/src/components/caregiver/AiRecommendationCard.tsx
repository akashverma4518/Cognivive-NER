import React from 'react';
import { Sparkles, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

interface AiRecommendationProps {
  recommendation?: {
    primary_recommended_game?: string;
    recommended_difficulty?: number;
    rationale?: string;
    suggested_daily_schedule?: {
      time_of_day: string;
      activity_type: string;
      game_or_task: string;
      duration_minutes: number;
    }[];
  } | null;
}

export const AiRecommendationCard: React.FC<AiRecommendationProps> = ({ recommendation }) => {
  const formatGameName = (slug?: string) => {
    switch (slug) {
      case 'memory_blossom': return 'Memory Blossom (Working Memory)';
      case 'quick_harvest': return 'Quick Harvest (Processing Speed)';
      case 'golden_memories': return 'Golden Memories (Reminiscence)';
      default: return slug || 'Personalized Activity';
    }
  };

  return (
    <div className="card-elder bg-gradient-to-br from-[#EDE9FE]/50 to-[#DDD6FE]/30 border-2 border-purple-200 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-200 text-[#6C3EDC] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C3EDC]">
              Personalized Calibration
            </span>
            <h3 className="text-xl font-black text-elder-navy">
              AI Activity Recommendation
            </h3>
          </div>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-[#6C3EDC] rounded-full text-xs font-black uppercase">
          Dynamic Recommendation
        </span>
      </div>

      {/* Recommended Game & Level */}
      <div className="p-4 bg-white/90 border border-purple-200/80 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-black text-elder-navy">
            {formatGameName(recommendation?.primary_recommended_game)}
          </h4>
          <span className="px-3 py-1 bg-[#EDE9FE] text-[#6C3EDC] text-xs font-black rounded-lg">
            Recommended: Level {recommendation?.recommended_difficulty || 1}
          </span>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          {recommendation?.rationale || 'Recommended to reinforce processing speed and attentional agility based on current activity profile metrics.'}
        </p>
      </div>

      {/* Daily schedule suggestions */}
      {recommendation?.suggested_daily_schedule && recommendation.suggested_daily_schedule.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Suggested Daily Schedule
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {recommendation.suggested_daily_schedule.map((item, i) => (
              <div key={i} className="p-2.5 bg-white/80 border border-purple-100 rounded-xl text-xs space-y-0.5">
                <span className="font-bold text-[#6C3EDC] uppercase block text-[10px]">{item.time_of_day}</span>
                <p className="font-black text-elder-navy truncate">{item.game_or_task}</p>
                <span className="text-[11px] text-slate-500">{item.duration_minutes} minutes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-Diagnostic Disclaimer */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Cognitive activities are supportive exercises and do not substitute medical care or therapy.</span>
      </div>
    </div>
  );
};
