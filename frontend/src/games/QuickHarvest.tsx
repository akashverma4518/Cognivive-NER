import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { Clock, Zap, Target } from 'lucide-react';

interface QuickHarvestProps {
  initialDifficulty?: number;
}

const FRUITS = [
  { id: 'apple', name: 'Golden Apple', icon: '🍏' },
  { id: 'mango', name: 'Juicy Mango', icon: '🥭' },
  { id: 'banana', name: 'Ripe Banana', icon: '🍌' },
  { id: 'orange', name: 'Sweet Orange', icon: '🍊' },
  { id: 'grape', name: 'Purple Grapes', icon: '🍇' },
  { id: 'pomegranate', name: 'Fresh Anar', icon: '🍎' },
];

const DECOYS = [
  { id: 'leaf', name: 'Autumn Leaf', icon: '🍂' },
  { id: 'droplet', name: 'Morning Dew', icon: '💧' },
  { id: 'wood', name: 'Orchard Branch', icon: '🪵' },
  { id: 'clover', name: 'Green Clover', icon: '🍀' },
  { id: 'flower', name: 'Wild Flower', icon: '🌸' },
  { id: 'mushroom', name: 'Mushroom', icon: '🍄' },
];

export const QuickHarvest: React.FC<QuickHarvestProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 4;

  // Level parameters
  const totalItems = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;
  const timeoutMs = difficulty === 1 ? 5500 : difficulty === 2 ? 4000 : 3000;

  const [targetFruit, setTargetFruit] = useState<any>(FRUITS[0]);
  const [gridItems, setGridItems] = useState<any[]>([]);
  const [gameState, setGameState] = useState<'ANNOUNCING' | 'HARVESTING' | 'FEEDBACK'>('ANNOUNCING');
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Telemetry references
  const sessionStartTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const timeoutTimerRef = useRef<any>(null);
  const [trialsTelemetry, setTrialsTelemetry] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [ddaResult, setDdaResult] = useState<any>(null);

  // Audio tone helper
  const playChime = (freq = 600, duration = 0.25) => {
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
    // Pick random target fruit
    const chosenTarget = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    setTargetFruit(chosenTarget);
    setGameState('ANNOUNCING');
    setFeedbackText(`Target: Find the ${chosenTarget.name} ${chosenTarget.icon}`);

    // Wait 1.2s for user to read/hear target, then spawn grid
    setTimeout(() => {
      // Pick distractors
      const distractors = [...DECOYS, ...FRUITS.filter(f => f.id !== chosenTarget.id)]
        .sort(() => Math.random() - 0.5)
        .slice(0, totalItems - 1);

      const combined = [chosenTarget, ...distractors].sort(() => Math.random() - 0.5);
      setGridItems(combined);
      setGameState('HARVESTING');
      trialStartTimeRef.current = Date.now();

      // Timeout handler
      timeoutTimerRef.current = setTimeout(() => {
        handleTimeout();
      }, timeoutMs);
    }, 1200);
  };

  useEffect(() => {
    startTrial();
    return () => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    };
  }, [currentTrial]);

  // Handle timeout (missed target)
  const handleTimeout = () => {
    if (gameState !== 'HARVESTING') return;
    setGameState('FEEDBACK');
    setTotalMistakes(m => m + 1);
    setConsecutiveCorrect(0);
    playChime(250, 0.3);
    setFeedbackText('Time is up! Let’s try the next harvest.');

    const trialRecord = {
      trial_index: currentTrial,
      correct: false,
      reaction_time_ms: timeoutMs,
      target_id: targetFruit.id,
      selected_id: 'TIMEOUT'
    };
    const updated = [...trialsTelemetry, trialRecord];
    setTrialsTelemetry(updated);

    setTimeout(() => advanceOrFinish(updated), 1500);
  };

  // Handle item tap
  const handleItemTap = (item: any) => {
    if (gameState !== 'HARVESTING') return;
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    const reactionTime = Date.now() - trialStartTimeRef.current;
    const isCorrect = item.id === targetFruit.id;
    setGameState('FEEDBACK');

    if (isCorrect) {
      playChime(660, 0.3);
      // Speed bonus: faster tap = higher points
      const speedBonus = Math.max(10, Math.round((timeoutMs - reactionTime) / 20));
      const points = (100 + speedBonus) * difficulty;
      setTotalScore(s => s + points);
      setConsecutiveCorrect(c => c + 1);
      setFeedbackText(`🎉 Quick catch! Tap response: ${(reactionTime / 1000).toFixed(2)}s`);
    } else {
      playChime(220, 0.3);
      setTotalMistakes(m => m + 1);
      setConsecutiveCorrect(0);
      setFeedbackText(`Oops! That was ${item.name}. Look for ${targetFruit.name}.`);
    }

    const trialRecord = {
      trial_index: currentTrial,
      correct: isCorrect,
      reaction_time_ms: reactionTime,
      target_id: targetFruit.id,
      selected_id: item.id
    };
    const updated = [...trialsTelemetry, trialRecord];
    setTrialsTelemetry(updated);

    setTimeout(() => advanceOrFinish(updated), 1500);
  };

  const advanceOrFinish = async (completedTrials: any[]) => {
    if (currentTrial < totalTrials) {
      setCurrentTrial(t => t + 1);
    } else {
      await submitSessionTelemetry(completedTrials);
    }
  };

  // Submit telemetry to backend -> PostgreSQL -> Python AI
  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(5, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / completedTrials.length);
    const correctCount = completedTrials.filter(t => t.correct).length;
    const accuracyPercentage = parseFloat(((correctCount / completedTrials.length) * 100).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'quick_harvest',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          totalItems,
          timeoutMs
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Network unavailable, queuing Quick Harvest session offline:', err);
      await offlineDb.queueSession({
        gameId: 'quick_harvest',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { totalItems, timeoutMs }
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
      title="Quick Harvest"
      icon="🍎"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions={feedbackText}
    >
      <div className="card-elder bg-white border-2 border-slate-200 p-6 md:p-8 flex flex-col items-center">
        {/* Target Fruit Banner */}
        <div className="w-full max-w-md bg-[#F7F5FF] rounded-2xl border-2 border-purple-200 p-4 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{targetFruit.icon}</span>
            <div className="text-left">
              <span className="text-xs font-black uppercase text-[#6C3EDC] tracking-wider">Tap Target Fruit:</span>
              <p className="text-elder-lg font-black text-elder-navy">{targetFruit.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[#6C3EDC] font-bold text-sm bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4" />
            <span>{(timeoutMs / 1000).toFixed(0)}s window</span>
          </div>
        </div>

        {/* Harvest Grid Arena */}
        {gameState === 'ANNOUNCING' ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <span className="text-7xl animate-bounce">{targetFruit.icon}</span>
            <p className="text-elder-lg font-black text-elder-navy">Get ready to tap...</p>
          </div>
        ) : (
          <div className={`grid gap-4 w-full max-w-lg ${
            totalItems <= 4 ? 'grid-cols-2' : totalItems <= 6 ? 'grid-cols-3' : 'grid-cols-4'
          }`}>
            {gridItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleItemTap(item)}
                disabled={gameState !== 'HARVESTING'}
                className="h-28 md:h-32 rounded-3xl bg-slate-50 hover:bg-purple-50/70 active:scale-95 border-2 border-slate-200 hover:border-[#8B5CF6] flex flex-col items-center justify-center p-2 shadow-sm transition-all select-none cursor-pointer"
              >
                <span className="text-4xl md:text-5xl">{item.icon}</span>
                <span className="text-xs font-bold text-slate-600 mt-1 truncate max-w-[80px]">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Modal */}
      {ddaResult && (
        <GameResultModal
          isOpen={showResultModal}
          gameTitle="Quick Harvest"
          score={totalScore}
          accuracy={trialsTelemetry.length ? (trialsTelemetry.filter(t => t.correct).length / trialsTelemetry.length) * 100 : 100}
          averageReactionTimeMs={trialsTelemetry.length ? Math.round(trialsTelemetry.reduce((s, t) => s + t.reaction_time_ms, 0) / trialsTelemetry.length) : 1000}
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
