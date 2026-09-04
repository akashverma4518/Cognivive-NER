import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { Sparkles, Check, X, RotateCcw } from 'lucide-react';

interface MemoryBlossomProps {
  initialDifficulty?: number;
}

const FLOWERS = [
  { id: 'lotus', name: 'Pink Lotus', icon: '🪷', color: 'from-pink-400 to-rose-400', border: 'border-pink-300' },
  { id: 'jasmine', name: 'White Jasmine', icon: '🌼', color: 'from-amber-200 to-yellow-300', border: 'border-amber-300' },
  { id: 'hibiscus', name: 'Red Hibiscus', icon: '🌺', color: 'from-red-400 to-rose-500', border: 'border-red-300' },
  { id: 'sunflower', name: 'Golden Sunflower', icon: '🌻', color: 'from-amber-400 to-yellow-500', border: 'border-yellow-400' },
  { id: 'marigold', name: 'Orange Marigold', icon: '🏵️', color: 'from-orange-400 to-amber-500', border: 'border-orange-300' },
  { id: 'rose', name: 'Royal Rose', icon: '🌹', color: 'from-rose-500 to-red-600', border: 'border-rose-400' },
];

export const MemoryBlossom: React.FC<MemoryBlossomProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 3;

  // Level parameters
  const numFlowers = difficulty >= 3 ? 6 : 4;
  const sequenceLength = difficulty === 1 ? 3 : difficulty === 2 ? 4 : 5;
  const displaySpeedMs = difficulty === 1 ? 1200 : difficulty === 2 ? 900 : 700;

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeFlowerIdx, setActiveFlowerIdx] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'SHOWING' | 'PLAYER_TURN' | 'EVALUATING'>('IDLE');
  const [promptMessage, setPromptMessage] = useState<string>('Watch the flowers bloom in sequence...');

  // Telemetry collection across trials
  const sessionStartTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const [trialsTelemetry, setTrialsTelemetry] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [ddaResult, setDdaResult] = useState<any>(null);

  const activeFlowers = FLOWERS.slice(0, numFlowers);

  // Audio tone helper
  const playTone = (freq = 520, duration = 0.2) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Start a new trial sequence
  const startTrial = () => {
    setPlayerInput([]);
    setActiveFlowerIdx(null);
    setGameState('SHOWING');
    setPromptMessage('🌸 Watch carefully as flowers blossom in order...');

    // Generate random sequence of flower indexes
    const newSeq: number[] = [];
    for (let i = 0; i < sequenceLength; i++) {
      newSeq.push(Math.floor(Math.random() * numFlowers));
    }
    setSequence(newSeq);

    // Play sequence animation
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        const flowerIdx = newSeq[step];
        setActiveFlowerIdx(flowerIdx);
        playTone(400 + flowerIdx * 100, 0.3);

        setTimeout(() => {
          setActiveFlowerIdx(null);
        }, displaySpeedMs - 200);

        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setGameState('PLAYER_TURN');
          setPromptMessage('👉 Your turn! Tap the flowers in the same order.');
          trialStartTimeRef.current = Date.now();
        }, 500);
      }
    }, displaySpeedMs);
  };

  // Launch trial on mount or trial change
  useEffect(() => {
    const timer = setTimeout(() => {
      startTrial();
    }, 600);
    return () => clearTimeout(timer);
  }, [currentTrial]);

  // Handle player tap
  const handleFlowerTap = (flowerIndex: number) => {
    if (gameState !== 'PLAYER_TURN') return;

    const reactionTime = Date.now() - trialStartTimeRef.current;
    playTone(500 + flowerIndex * 80, 0.2);

    const nextInput = [...playerInput, flowerIndex];
    setPlayerInput(nextInput);

    // Check if the current tap matches sequence
    const currentIndex = playerInput.length;
    const isCorrectTap = sequence[currentIndex] === flowerIndex;

    if (!isCorrectTap) {
      // Mistake made
      setTotalMistakes(m => m + 1);
      playTone(220, 0.3); // Low gentle error tone
    }

    // Check if full sequence completed
    if (nextInput.length === sequence.length) {
      setGameState('EVALUATING');
      const allCorrect = nextInput.every((val, idx) => val === sequence[idx]);

      const trialAccuracy = allCorrect ? 100 : Math.max(0, Math.round((sequence.filter((v, i) => v === nextInput[i]).length / sequence.length) * 100));
      const trialScore = allCorrect ? 100 * difficulty : trialAccuracy * difficulty;

      setTotalScore(s => s + trialScore);
      if (allCorrect) {
        setConsecutiveCorrect(c => c + 1);
        setPromptMessage('✨ Correct pattern! Excellent sequence memory.');
        playTone(680, 0.35);
      } else {
        setConsecutiveCorrect(0);
        setPromptMessage('🌱 Good effort! Let’s continue practicing.');
      }

      const recordedTrial = {
        trial_index: currentTrial,
        correct: allCorrect,
        reaction_time_ms: reactionTime,
        sequence_length: sequenceLength
      };
      const updatedTelemetry = [...trialsTelemetry, recordedTrial];
      setTrialsTelemetry(updatedTelemetry);

      // Check if session finished
      setTimeout(async () => {
        if (currentTrial < totalTrials) {
          setCurrentTrial(t => t + 1);
        } else {
          // Finalize session and send REAL telemetry to backend
          await submitSessionTelemetry(updatedTelemetry);
        }
      }, 1500);
    }
  };

  // Submits real session to Backend -> PostgreSQL -> Python AI
  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(5, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / completedTrials.length);
    const correctCount = completedTrials.filter(t => t.correct).length;
    const accuracyPercentage = parseFloat(((correctCount / completedTrials.length) * 100).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'memory_blossom',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          sequenceLength,
          totalTrials,
          flowersCount: numFlowers
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Network unavailable, queuing session offline:', err);
      await offlineDb.queueSession({
        gameId: 'memory_blossom',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { sequenceLength, totalTrials, flowersCount: numFlowers }
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
      title="Memory Blossom"
      icon="🌸"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions={promptMessage}
    >
      {/* Blossom Cards Arena */}
      <div className="card-elder bg-white border-2 border-slate-200 p-6 md:p-10 flex flex-col items-center">
        {/* Sequence Progress Tracker */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-sm font-bold text-slate-500 uppercase mr-2">Pattern:</span>
          {Array.from({ length: sequenceLength }).map((_, idx) => {
            const isFilled = idx < playerInput.length;
            const isTarget = gameState === 'PLAYER_TURN' && idx === playerInput.length;
            return (
              <div
                key={idx}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  isFilled
                    ? 'bg-[#6C3EDC] border-[#552dbb] scale-110 shadow-sm'
                    : isTarget
                    ? 'border-[#8B5CF6] bg-purple-100 animate-pulse'
                    : 'border-slate-300 bg-slate-100'
                }`}
              />
            );
          })}
        </div>

        {/* Blossom Touch Grid */}
        <div className={`grid gap-4 md:gap-6 w-full max-w-lg ${
          numFlowers === 6 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
        }`}>
          {activeFlowers.map((flower, idx) => {
            const isGlowing = activeFlowerIdx === idx;
            const isEnabled = gameState === 'PLAYER_TURN';

            return (
              <button
                key={flower.id}
                onClick={() => handleFlowerTap(idx)}
                disabled={!isEnabled}
                className={`h-32 md:h-36 rounded-3xl border-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 shadow-sm select-none ${flower.border} ${
                  isGlowing
                    ? 'bg-gradient-to-br from-[#DDD6FE] to-[#EDE9FE] scale-105 shadow-xl ring-4 ring-[#8B5CF6] border-[#6C3EDC]'
                    : 'bg-white hover:bg-purple-50/60 active:scale-95'
                } ${!isEnabled ? 'cursor-default' : 'cursor-pointer hover:shadow-md'}`}
              >
                <span className={`text-5xl md:text-6xl transition-transform ${isGlowing ? 'scale-125' : ''}`}>
                  {flower.icon}
                </span>
                <span className="text-sm font-bold text-elder-navy">
                  {flower.name}
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
          gameTitle="Memory Blossom"
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
