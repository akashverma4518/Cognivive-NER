import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { BookOpen, Volume2, Sparkles } from 'lucide-react';

interface GoldenMemoriesProps {
  initialDifficulty?: number;
}

const TRIVIA_QUESTIONS = [
  {
    id: 'sitar',
    question: 'Which classical Indian string instrument was made world-renowned by Pandit Ravi Shankar?',
    correctAnswer: 'Classical Sitar',
    correctIcon: '🪕',
    options: [
      { name: 'Classical Sitar', icon: '🪕', correct: true },
      { name: 'Western Acoustic Guitar', icon: '🎸', correct: false },
      { name: 'Classical Violin', icon: '🎻', correct: false },
      { name: 'Woodwind Flute', icon: '🪈', correct: false }
    ],
    hint: 'A long-necked string instrument with sympathetic strings and resonant gourd.'
  },
  {
    id: 'steam_engine',
    question: 'Which iconic vintage transport connected Indian towns with whistling steam and coal smoke?',
    correctAnswer: 'Steam Locomotive',
    correctIcon: '🚂',
    options: [
      { name: 'Steam Locomotive', icon: '🚂', correct: true },
      { name: 'Modern Electric Metro', icon: '🚇', correct: false },
      { name: 'High Speed Aeroplane', icon: '✈️', correct: false },
      { name: 'Vintage Bicycle', icon: '🚲', correct: false }
    ],
    hint: 'Famous heritage trains like the Darjeeling Himalayan Railway.'
  },
  {
    id: 'tabla',
    question: 'Which pair of traditional hand drums provides the rhythmic taal in classical music?',
    correctAnswer: 'Classical Tabla',
    correctIcon: '🥁',
    options: [
      { name: 'Classical Tabla', icon: '🥁', correct: true },
      { name: 'Brass Temple Bell', icon: '🔔', correct: false },
      { name: 'Western Snare Drum', icon: '🪘', correct: false },
      { name: 'Bamboo Flute', icon: '🪈', correct: false }
    ],
    hint: 'Comprises a wooden treble drum (dayan) and larger bass drum (bayan).'
  },
  {
    id: 'diya',
    question: 'What traditional clay oil lamp is lit to bring warmth, light, and blessings during Diwali?',
    correctAnswer: 'Clay Diya',
    correctIcon: '🪔',
    options: [
      { name: 'Clay Diya', icon: '🪔', correct: true },
      { name: 'Electric Torch', icon: '🔦', correct: false },
      { name: 'Modern Wax Candle', icon: '🕯️', correct: false },
      { name: 'Kerosene Lantern', icon: '🏮', correct: false }
    ],
    hint: 'Handmade earthen lamp fueled with pure mustard or sesame oil with cotton wick.'
  },
  {
    id: 'charkha',
    question: 'Which traditional spinning wheel was popularized by Mahatma Gandhi for spinning Khadi?',
    correctAnswer: 'Handloom Charkha',
    correctIcon: '🧵',
    options: [
      { name: 'Handloom Charkha', icon: '🧵', correct: true },
      { name: 'Modern Power Loom', icon: '🏭', correct: false },
      { name: 'Potter’s Clay Wheel', icon: '🏺', correct: false },
      { name: 'Wooden Waterwheel', icon: '⚙️', correct: false }
    ],
    hint: 'Symbol of self-reliance and home-spun yarn across Indian households.'
  }
];

export const GoldenMemories: React.FC<GoldenMemoriesProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 3;

  // Number of choices based on difficulty
  const numChoices = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;

  const [currentQuestion, setCurrentQuestion] = useState<any>(TRIVIA_QUESTIONS[0]);
  const [choices, setChoices] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Select the matching memory card');

  // Telemetry references
  const sessionStartTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const [trialsTelemetry, setTrialsTelemetry] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [ddaResult, setDdaResult] = useState<any>(null);

  // Audio tone helper
  const playTone = (freq = 550, duration = 0.25) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Launch trial
  const startTrial = () => {
    setSelectedAnswer(null);
    const qIndex = (currentTrial - 1) % TRIVIA_QUESTIONS.length;
    const q = TRIVIA_QUESTIONS[qIndex];
    setCurrentQuestion(q);
    setFeedbackMessage('Take your time and tap your chosen answer below.');

    // Build choices (always include correct option + distractors up to numChoices)
    const correctOpt = q.options.find(o => o.correct);
    const distractors = q.options.filter(o => !o.correct).slice(0, numChoices - 1);
    const combined = [correctOpt, ...distractors].sort(() => Math.random() - 0.5);

    setChoices(combined);
    trialStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    startTrial();
  }, [currentTrial]);

  // Handle option selection
  const handleSelectOption = (choice: any) => {
    if (selectedAnswer !== null) return; // Prevent double submission

    const reactionTime = Date.now() - trialStartTimeRef.current;
    setSelectedAnswer(choice.name);
    const isCorrect = choice.correct;

    if (isCorrect) {
      playTone(660, 0.35);
      const points = 100 * difficulty;
      setTotalScore(s => s + points);
      setConsecutiveCorrect(c => c + 1);
      setFeedbackMessage(`✨ Splendid memory! ${choice.name} is correct.`);
    } else {
      playTone(240, 0.35);
      setTotalMistakes(m => m + 1);
      setConsecutiveCorrect(0);
      setFeedbackMessage(`A wonderful thought, but the answer is ${currentQuestion.correctAnswer}.`);
    }

    const trialRecord = {
      trial_index: currentTrial,
      correct: isCorrect,
      reaction_time_ms: reactionTime,
      question_id: currentQuestion.id,
      selected_id: choice.name
    };
    const updated = [...trialsTelemetry, trialRecord];
    setTrialsTelemetry(updated);

    setTimeout(async () => {
      if (currentTrial < totalTrials) {
        setCurrentTrial(t => t + 1);
      } else {
        await submitSessionTelemetry(updated);
      }
    }, 1800);
  };

  // Submit telemetry to backend -> PostgreSQL -> Python AI
  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(5, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / completedTrials.length);
    const correctCount = completedTrials.filter(t => t.correct).length;
    const accuracyPercentage = parseFloat(((correctCount / completedTrials.length) * 100).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'golden_memories',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          numChoices,
          totalTrials
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Network unavailable, queuing Golden Memories session offline:', err);
      await offlineDb.queueSession({
        gameId: 'golden_memories',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { numChoices, totalTrials }
      });
      const nextDiff = accuracyPercentage >= 80 ? Math.min(difficulty + 1, 8) : accuracyPercentage < 50 ? Math.max(difficulty - 1, 1) : difficulty;
      const adj = nextDiff > difficulty ? 'INCREASED' : nextDiff < difficulty ? 'EASED' : 'STABLE';
      setDdaResult({
        next_difficulty: nextDiff,
        adjustment: adj,
        rationale: 'Saved offline on this device. Your progress will be synchronized automatically when connection returns.'
      });
      setShowResultModal(true);
    }
  };

  const handlePlayAgain = () => {
    if (ddaResult) {
      setDifficulty(ddaResult.next_difficulty);
    }
    setCurrentTrial(1);
    setTrialsTelemetry([]);
    setTotalScore(0);
    setTotalMistakes(0);
    setConsecutiveCorrect(0);
    sessionStartTimeRef.current = Date.now();
    setShowResultModal(false);
  };

  return (
    <GameShell
      title="Golden Memories"
      icon="📖"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions={feedbackMessage}
    >
      <div className="card-elder bg-white border-2 border-slate-200 p-6 md:p-8 flex flex-col items-center space-y-6">
        {/* Heritage Question Card */}
        <div className="w-full bg-[#F7F5FF] rounded-2xl border-2 border-purple-200 p-6 text-center space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] border-2 border-purple-200 shadow-sm mx-auto flex items-center justify-center text-3xl">
            {currentQuestion.correctIcon}
          </div>
          <h2 className="text-elder-lg md:text-elder-xl font-black text-elder-navy leading-snug">
            "{currentQuestion.question}"
          </h2>
          <p className="text-sm font-semibold text-[#6C3EDC] italic">
            Hint: {currentQuestion.hint}
          </p>
        </div>

        {/* Big Choice Cards */}
        <div className={`grid gap-4 w-full max-w-xl ${
          numChoices === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          {choices.map((choice, idx) => {
            const isSelected = selectedAnswer === choice.name;
            const isRevealed = selectedAnswer !== null;

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(choice)}
                disabled={selectedAnswer !== null}
                className={`min-h-[90px] p-4 rounded-3xl border-3 flex items-center gap-4 transition-all duration-150 select-none text-left ${
                  isRevealed
                    ? choice.correct
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black'
                    : isSelected
                    ? 'bg-rose-100 border-rose-400 text-rose-950 opacity-80'
                    : 'bg-slate-50 border-slate-200 opacity-50'
                  : 'bg-white hover:bg-purple-50/70 active:scale-95 border-2 border-purple-100 hover:border-[#8B5CF6] shadow-sm cursor-pointer'
                }`}
              >
                <span className="text-4xl md:text-5xl shrink-0">{choice.icon}</span>
                <span className="text-elder-base font-black text-elder-navy">
                  {choice.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Modal */}
      {ddaResult && (
        <GameResultModal
          isOpen={showResultModal}
          gameTitle="Golden Memories"
          score={totalScore}
          accuracy={trialsTelemetry.length ? (trialsTelemetry.filter(t => t.correct).length / trialsTelemetry.length) * 100 : 100}
          averageReactionTimeMs={trialsTelemetry.length ? Math.round(trialsTelemetry.reduce((s, t) => s + t.reaction_time_ms, 0) / trialsTelemetry.length) : 1200}
          mistakesCount={totalMistakes}
          durationSeconds={Math.round((Date.now() - sessionStartTimeRef.current) / 1000)}
          currentDifficulty={difficulty}
          nextDifficulty={ddaResult.next_difficulty}
          adjustmentRationale={ddaResult.rationale}
          adjustmentType={ddaResult.adjustment}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </GameShell>
  );
};
