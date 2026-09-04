import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Sparkles, HelpCircle } from 'lucide-react';

interface GameShellProps {
  title: string;
  icon: string;
  difficulty: number;
  currentTrial: number;
  totalTrials: number;
  instructions: string;
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({
  title,
  icon,
  difficulty,
  currentTrial,
  totalTrials,
  instructions,
  children
}) => {
  const navigate = useNavigate();

  const speakInstructions = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${title}. ${instructions}`);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-elder-bg flex flex-col justify-between pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-purple-100 shadow-sm px-4 md:px-8 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/elder')}
              className="min-h-touch px-4 py-2 rounded-2xl bg-purple-50/70 hover:bg-purple-100 text-elder-navy font-bold text-sm md:text-base border border-purple-200 flex items-center gap-2 transition-all"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Exit</span>
            </button>

            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{icon}</span>
              <div>
                <h1 className="text-elder-lg font-black text-elder-navy leading-none">{title}</h1>
                <span className="text-xs font-bold text-slate-500">Cognitive Activity</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Help */}
            <button
              onClick={speakInstructions}
              className="min-h-touch px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-[#6C3EDC] border-2 border-purple-200 font-bold text-sm flex items-center gap-2 transition-all"
              title="Listen to Instructions"
            >
              <Volume2 className="w-5 h-5 text-[#6C3EDC]" />
              <span className="hidden sm:inline">Read Help</span>
            </button>

            {/* Trial & Difficulty Pill */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 text-[#6C3EDC] font-black text-xs md:text-sm">
                Level {difficulty}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs md:text-sm">
                Round {currentTrial} of {totalTrials}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 flex-1 flex flex-col justify-center">
        {/* Instruction Banner */}
        <div className="card-elder bg-white border-2 border-purple-100 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)] mb-6 p-4 flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#6C3EDC] shrink-0" />
          <p className="text-elder-base text-elder-navy font-bold leading-relaxed">{instructions}</p>
        </div>

        {children}
      </main>
    </div>
  );
};
