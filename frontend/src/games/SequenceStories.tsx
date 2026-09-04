import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { ArrowUp, ArrowDown, Check, Sparkles, BookOpen, RotateCcw } from 'lucide-react';

interface SequenceStoriesProps {
  initialDifficulty?: number;
}

interface StoryStep {
  id: string;
  order: number;
  text: string;
  icon: string;
}

interface Story {
  id: string;
  title: string;
  subtitle: string;
  steps: StoryStep[];
}

const STORIES: Story[] = [
  {
    id: 'morning_routine',
    title: 'Peaceful Morning Routine',
    subtitle: 'From dawn to the morning breeze',
    steps: [
      { id: 's1', order: 1, text: 'Waking up at dawn and drinking warm water', icon: '🌅' },
      { id: 's2', order: 2, text: 'Taking a refreshing morning walk in the park', icon: '🚶‍♂️' },
      { id: 's3', order: 3, text: 'Brewing a fresh cup of ginger tea with family', icon: '☕' },
      { id: 's4', order: 4, text: 'Reading the daily newspaper in the balcony', icon: '📰' },
    ],
  },
  {
    id: 'diwali_prep',
    title: 'Festival of Lights Celebration',
    subtitle: 'Welcoming prosperity and joy into the home',
    steps: [
      { id: 'd1', order: 1, text: 'Cleaning and decorating the home courtyard', icon: '🧹' },
      { id: 'd2', order: 2, text: 'Drawing colorful flower rangoli at the entrance', icon: '🎨' },
      { id: 'd3', order: 3, text: 'Lighting traditional clay diyas in the evening', icon: '🪔' },
      { id: 'd4', order: 4, text: 'Sharing sweet mithai with family and neighbors', icon: '🍬' },
    ],
  },
  {
    id: 'village_harvest',
    title: 'Bountiful Harvest Celebration',
    subtitle: 'Honoring the season of harvest and gratitude',
    steps: [
      { id: 'h1', order: 1, text: 'Sowing green seeds before the monsoon showers', icon: '🌱' },
      { id: 'h2', order: 2, text: 'Golden crops ripening under the warm sun', icon: '🌾' },
      { id: 'h3', order: 3, text: 'Harvesting the golden grains with cheerful songs', icon: '🧑‍🌾' },
      { id: 'h4', order: 4, text: 'Gathering for a grand harvest feast together', icon: '🍲' },
    ],
  },
];

export const SequenceStories: React.FC<SequenceStoriesProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 2;

  // Level setup
  const stepCount = difficulty === 1 ? 3 : 4;

  const [currentStory, setCurrentStory] = useState<Story>(STORIES[0]);
  const [arrangedSteps, setArrangedSteps] = useState<StoryStep[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Telemetry
  const sessionStartTimeRef = useRef<number>(Date.now());
  const trialStartTimeRef = useRef<number>(Date.now());
  const [trialsTelemetry, setTrialsTelemetry] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);

  // Result modal
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [ddaResult, setDdaResult] = useState<any>(null);

  const playChime = (high = true) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(high ? 523.25 : 293.66, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const loadStoryTrial = () => {
    const storyIdx = (currentTrial - 1) % STORIES.length;
    const baseStory = STORIES[storyIdx];
    setCurrentStory(baseStory);

    const activeSteps = baseStory.steps.slice(0, stepCount);
    // Shuffle steps so they are scrambled
    let scrambled = [...activeSteps].sort(() => Math.random() - 0.5);
    // Ensure it's not already in exact order
    const isExact = scrambled.every((s, i) => s.order === i + 1);
    if (isExact && scrambled.length > 1) {
      [scrambled[0], scrambled[1]] = [scrambled[1], scrambled[0]];
    }

    setArrangedSteps(scrambled);
    setFeedback(null);
    setIsSuccess(false);
    trialStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    loadStoryTrial();
  }, [currentTrial, difficulty]);

  const moveStep = (index: number, direction: 'UP' | 'DOWN') => {
    if (isSuccess) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= arrangedSteps.length) return;

    playChime(true);
    const newArranged = [...arrangedSteps];
    [newArranged[index], newArranged[targetIndex]] = [newArranged[targetIndex], newArranged[index]];
    setArrangedSteps(newArranged);
    setFeedback(null);
  };

  const handleVerifySequence = () => {
    const reactionTime = Date.now() - trialStartTimeRef.current;
    const isCorrect = arrangedSteps.every((step, idx) => step.order === idx + 1);

    if (isCorrect) {
      playChime(true);
      setTimeout(() => playChime(true), 150);
      setIsSuccess(true);
      setFeedback('Beautiful! The sequence flows in the perfect chronological order.');
      setTotalScore(s => s + 200 * difficulty);
      setConsecutiveCorrect(c => c + 1);

      const trialRecord = {
        trial_number: currentTrial,
        correct: true,
        reaction_time_ms: reactionTime,
        story_title: currentStory.title,
        steps_count: stepCount,
      };
      const updatedTelemetry = [...trialsTelemetry, trialRecord];
      setTrialsTelemetry(updatedTelemetry);

      setTimeout(() => {
        if (currentTrial < totalTrials) {
          setCurrentTrial(t => t + 1);
        } else {
          submitSessionTelemetry(updatedTelemetry);
        }
      }, 1600);
    } else {
      playChime(false);
      setTotalMistakes(m => m + 1);
      setFeedback('Not quite in order yet. Look at the icons and arrange from first to last.');
    }
  };

  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(8, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / (completedTrials.length || 1));
    const correctCount = completedTrials.filter(t => t.correct).length;
    const accuracy = parseFloat(Math.max(40, Math.min(100, 100 - (totalMistakes * 12))).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'sequence_stories',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage: accuracy,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          stepCount,
          totalTrials,
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Offline: queuing sequence stories session:', err);
      await offlineDb.queueSession({
        gameId: 'sequence_stories',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage: accuracy,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { stepCount, totalTrials }
      });
      const nextDiff = accuracy >= 80 ? Math.min(difficulty + 1, 8) : accuracy < 50 ? Math.max(difficulty - 1, 1) : difficulty;
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
      title="Sequence Stories"
      icon="📜"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions="Arrange the events in order from start to finish using the Up and Down arrows."
    >
      <div className="flex flex-col items-center max-w-xl mx-auto w-full">
        {/* Story Header */}
        <div className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-5 text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 text-[#6C3EDC] font-bold text-sm mb-1">
            <BookOpen className="w-5 h-5" />
            <span>Story {currentTrial} of {totalTrials}</span>
          </div>
          <h3 className="text-xl font-black text-elder-navy">{currentStory.title}</h3>
          <p className="text-slate-600 text-sm mt-0.5">{currentStory.subtitle}</p>
          <p className="text-xs font-bold text-purple-700 mt-2">
            Use the Up and Down arrows to arrange the events in order from start to finish.
          </p>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`w-full mb-4 p-3.5 rounded-2xl border-2 text-center text-sm font-bold flex items-center justify-center gap-2 ${
            isSuccess 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}>
            {isSuccess ? <Check className="w-5 h-5 text-emerald-600" /> : <Sparkles className="w-5 h-5 text-amber-600" />}
            <span>{feedback}</span>
          </div>
        )}

        {/* Arranged Steps List */}
        <div className="w-full space-y-3 mb-6">
          {arrangedSteps.map((step, idx) => (
            <div
              key={step.id}
              className={`p-4 rounded-2xl border-2 bg-white flex items-center justify-between gap-3 shadow-sm transition-all ${
                isSuccess
                  ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200'
                  : 'border-purple-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C3EDC] font-black text-sm flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-2xl sm:text-3xl shrink-0">{step.icon}</span>
                <span className="text-base font-bold text-slate-800 leading-snug">
                  {step.text}
                </span>
              </div>

              {/* Up / Down Controls */}
              {!isSuccess && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveStep(idx, 'UP')}
                    disabled={idx === 0}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-purple-100 disabled:opacity-30 flex items-center justify-center text-slate-700 border border-slate-200 transition-colors"
                    aria-label="Move step up"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => moveStep(idx, 'DOWN')}
                    disabled={idx === arrangedSteps.length - 1}
                    className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-purple-100 disabled:opacity-30 flex items-center justify-center text-slate-700 border border-slate-200 transition-colors"
                    aria-label="Move step down"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Verification Button */}
        {!isSuccess && (
          <button
            onClick={handleVerifySequence}
            className="w-full min-h-[56px] rounded-2xl bg-gradient-to-r from-[#6C3EDC] to-[#8B5CF6] hover:from-[#5B32C4] hover:to-[#7C4DFF] text-white font-black text-lg shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-6 h-6" />
            <span>Check Story Sequence</span>
          </button>
        )}
      </div>

      {ddaResult && (
        <GameResultModal
          isOpen={showResultModal}
          gameTitle="Sequence Stories"
          score={totalScore}
          accuracy={parseFloat(Math.max(40, Math.min(100, 100 - (totalMistakes * 12))).toFixed(1))}
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
