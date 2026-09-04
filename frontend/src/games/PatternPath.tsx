import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { Compass, Sparkles, Check, X, RotateCcw, Footprints } from 'lucide-react';

interface PatternPathProps {
  initialDifficulty?: number;
}

interface PathNode {
  id: number;
  label: string;
  icon: string;
}

const NODES: PathNode[] = [
  { id: 0, label: 'Temple', icon: '🛕' },
  { id: 1, label: 'Garden', icon: '🌳' },
  { id: 2, label: 'River', icon: '🌊' },
  { id: 3, label: 'Banyan', icon: '🌴' },
  { id: 4, label: 'Courtyard', icon: '🏡' },
  { id: 5, label: 'Market', icon: '🛍️' },
  { id: 6, label: 'Well', icon: '⛲' },
  { id: 7, label: 'Lawn', icon: '🌾' },
  { id: 8, label: 'Pavilion', icon: '🏛️' },
];

export const PatternPath: React.FC<PatternPathProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 3;

  // Level parameters
  const pathLength = difficulty === 1 ? 3 : difficulty === 2 ? 4 : Math.min(6, 4 + Math.floor(difficulty / 2));
  const stepDelayMs = difficulty === 1 ? 1100 : difficulty === 2 ? 900 : 750;

  const [pathSequence, setPathSequence] = useState<number[]>([]);
  const [playerSteps, setPlayerSteps] = useState<number[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'SHOWING' | 'PLAYER_TURN' | 'EVALUATING'>('IDLE');
  const [promptMessage, setPromptMessage] = useState<string>('Observe the pathway steps...');

  // Telemetry across trials
  const sessionStartTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const [trialsTelemetry, setTrialsTelemetry] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [ddaResult, setDdaResult] = useState<any>(null);

  const playTone = (freq = 440, duration = 0.2) => {
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
    } catch {
      // AudioContext unavailable
    }
  };

  const startTrial = () => {
    setPlayerSteps([]);
    setActiveNodeId(null);
    setGameState('SHOWING');
    setPromptMessage(`Round ${currentTrial} of ${totalTrials}: Follow the glowing path!`);

    // Generate non-repeating adjacent/distributed path
    const newPath: number[] = [];
    const used = new Set<number>();
    for (let i = 0; i < pathLength; i++) {
      let candidate = Math.floor(Math.random() * 9);
      while (used.has(candidate) && used.size < 9) {
        candidate = Math.floor(Math.random() * 9);
      }
      used.add(candidate);
      newPath.push(candidate);
    }
    setPathSequence(newPath);

    // Playback sequence
    newPath.forEach((nodeId, idx) => {
      setTimeout(() => {
        setActiveNodeId(nodeId);
        playTone(320 + nodeId * 50, 0.25);
        setTimeout(() => {
          setActiveNodeId(null);
          if (idx === newPath.length - 1) {
            setGameState('PLAYER_TURN');
            setPromptMessage('Your turn! Tap the locations in the exact order shown.');
            trialStartTimeRef.current = Date.now();
          }
        }, stepDelayMs - 250);
      }, (idx + 1) * stepDelayMs);
    });
  };

  useEffect(() => {
    startTrial();
  }, [currentTrial, difficulty]);

  const handleNodeClick = (nodeId: number) => {
    if (gameState !== 'PLAYER_TURN') return;

    playTone(380 + nodeId * 40, 0.15);
    const nextExpectedIdx = playerSteps.length;
    const isStepCorrect = pathSequence[nextExpectedIdx] === nodeId;

    if (!isStepCorrect) {
      // Mistake made
      setGameState('EVALUATING');
      playTone(200, 0.35);
      setTotalMistakes(m => m + 1);
      setPromptMessage('Almost there! Take a breath, we will review the sequence.');

      const reactionTime = Date.now() - trialStartTimeRef.current;
      const trialRecord = {
        trial_number: currentTrial,
        correct: false,
        reaction_time_ms: reactionTime,
        steps_completed: playerSteps.length,
        total_steps: pathLength,
      };
      const updatedTelemetry = [...trialsTelemetry, trialRecord];
      setTrialsTelemetry(updatedTelemetry);

      setTimeout(() => {
        if (currentTrial < totalTrials) {
          setCurrentTrial(t => t + 1);
        } else {
          submitSessionTelemetry(updatedTelemetry);
        }
      }, 1500);
      return;
    }

    const updatedSteps = [...playerSteps, nodeId];
    setPlayerSteps(updatedSteps);

    // If whole path completed successfully
    if (updatedSteps.length === pathSequence.length) {
      setGameState('EVALUATING');
      playTone(660, 0.25);
      setTimeout(() => playTone(880, 0.35), 180);

      const reactionTime = Date.now() - trialStartTimeRef.current;
      const roundScore = Math.max(100, Math.round(500 - reactionTime / 15) * difficulty);
      setTotalScore(s => s + roundScore);
      setConsecutiveCorrect(c => c + 1);
      setPromptMessage('Excellent! Pathway followed accurately.');

      const trialRecord = {
        trial_number: currentTrial,
        correct: true,
        reaction_time_ms: reactionTime,
        steps_completed: updatedSteps.length,
        total_steps: pathLength,
      };
      const updatedTelemetry = [...trialsTelemetry, trialRecord];
      setTrialsTelemetry(updatedTelemetry);

      setTimeout(() => {
        if (currentTrial < totalTrials) {
          setCurrentTrial(t => t + 1);
        } else {
          submitSessionTelemetry(updatedTelemetry);
        }
      }, 1400);
    }
  };

  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(5, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / (completedTrials.length || 1));
    const correctCount = completedTrials.filter(t => t.correct).length;
    const accuracyPercentage = parseFloat(((correctCount / (completedTrials.length || 1)) * 100).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'pattern_path',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          pathLength,
          totalTrials,
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Offline: queuing pattern path session:', err);
      await offlineDb.queueSession({
        gameId: 'pattern_path',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { pathLength, totalTrials }
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
      title="Pattern Path"
      icon="🧭"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions={promptMessage}
    >
      <div className="flex flex-col items-center max-w-xl mx-auto w-full">
        {/* Status prompt */}
        <div className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6 text-center shadow-xs">
          <p className="text-elder-base font-bold text-elder-navy">
            {promptMessage}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Path Steps:</span>
            {pathSequence.map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-colors ${
                  i < playerSteps.length
                    ? 'bg-emerald-500 ring-2 ring-emerald-200'
                    : i === playerSteps.length && gameState === 'PLAYER_TURN'
                    ? 'bg-[#6C3EDC] ring-2 ring-purple-200 animate-pulse'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3x3 Grid of Location Nodes */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 p-4 bg-white/80 rounded-3xl border-2 border-purple-100 shadow-md">
          {NODES.map((node) => {
            const isHighlighted = activeNodeId === node.id;
            const isSelected = playerSteps.includes(node.id);
            const stepOrder = playerSteps.indexOf(node.id);

            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                disabled={gameState !== 'PLAYER_TURN'}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center p-2 border-3 transition-all relative select-none active:scale-95 ${
                  isHighlighted
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 border-amber-600 scale-105 shadow-xl ring-4 ring-amber-200'
                    : isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                    : 'bg-purple-50/70 hover:bg-purple-100/90 border-purple-200 hover:border-purple-400 text-slate-800'
                } ${gameState === 'PLAYER_TURN' ? 'cursor-pointer' : 'cursor-default'}`}
                aria-label={node.label}
              >
                <span className="text-3xl sm:text-4xl mb-1">{node.icon}</span>
                <span className="text-xs font-bold truncate max-w-full text-elder-navy">
                  {node.label}
                </span>

                {/* Step indicator badge */}
                {stepOrder >= 0 && (
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                    {stepOrder + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {ddaResult && (
        <GameResultModal
          isOpen={showResultModal}
          gameTitle="Pattern Path"
          score={totalScore}
          accuracy={
            trialsTelemetry.length > 0
              ? (trialsTelemetry.filter(t => t.correct).length / trialsTelemetry.length) * 100
              : 100
          }
          averageReactionTimeMs={
            trialsTelemetry.length > 0
              ? Math.round(trialsTelemetry.reduce((acc, t) => acc + t.reaction_time_ms, 0) / trialsTelemetry.length)
              : 1000
          }
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
