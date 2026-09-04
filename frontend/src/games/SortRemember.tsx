import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { Layers, Sparkles, Check, X, ArrowDown } from 'lucide-react';

interface SortRememberProps {
  initialDifficulty?: number;
}

interface SortItem {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface CategoryBasket {
  id: string;
  name: string;
  icon: string;
  color: string;
  borderColor: string;
}

const ALL_ITEMS: SortItem[] = [
  // Fruits
  { id: 'mango', name: 'Mango', icon: '🥭', category: 'FRUIT' },
  { id: 'apple', name: 'Apple', icon: '🍎', category: 'FRUIT' },
  { id: 'banana', name: 'Banana', icon: '🍌', category: 'FRUIT' },
  { id: 'orange', name: 'Orange', icon: '🍊', category: 'FRUIT' },
  // Flowers
  { id: 'lotus', name: 'Lotus', icon: '🪷', category: 'FLOWER' },
  { id: 'rose', name: 'Rose', icon: '🌹', category: 'FLOWER' },
  { id: 'sunflower', name: 'Sunflower', icon: '🌻', category: 'FLOWER' },
  { id: 'jasmine', name: 'Jasmine', icon: '🌼', category: 'FLOWER' },
  // Spices & Herbs
  { id: 'ginger', name: 'Ginger', icon: '🫚', category: 'SPICE' },
  { id: 'chili', name: 'Chili', icon: '🌶️', category: 'SPICE' },
  { id: 'garlic', name: 'Garlic', icon: '🧄', category: 'SPICE' },
  { id: 'clove', name: 'Herb Leaf', icon: '🌿', category: 'SPICE' },
];

const BASKETS: Record<string, CategoryBasket> = {
  FRUIT: { id: 'FRUIT', name: 'Fresh Fruits', icon: '🧺 Fruit Basket', color: 'bg-emerald-50 hover:bg-emerald-100', borderColor: 'border-emerald-300' },
  FLOWER: { id: 'FLOWER', name: 'Fragrant Flowers', icon: '🌸 Flower Garden', color: 'bg-rose-50 hover:bg-rose-100', borderColor: 'border-rose-300' },
  SPICE: { id: 'SPICE', name: 'Kitchen Spices', icon: '🏺 Spice Jar', color: 'bg-amber-50 hover:bg-amber-100', borderColor: 'border-amber-300' },
};

export const SortRemember: React.FC<SortRememberProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 5;

  // Level setup
  const numCategories = difficulty >= 2 ? 3 : 2;
  const activeBaskets = numCategories === 3 
    ? [BASKETS.FRUIT, BASKETS.FLOWER, BASKETS.SPICE] 
    : [BASKETS.FRUIT, BASKETS.FLOWER];

  const [currentItem, setCurrentItem] = useState<SortItem | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

  const playTone = (isHigh = true) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(isHigh ? 600 : 250, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const nextItem = () => {
    setFeedback(null);
    setIsProcessing(false);

    // Filter available pool to active categories
    const validPool = ALL_ITEMS.filter(item => 
      activeBaskets.some(b => b.id === item.category)
    );
    const chosen = validPool[Math.floor(Math.random() * validPool.length)];
    setCurrentItem(chosen);
    trialStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    nextItem();
  }, [currentTrial, difficulty]);

  const handleBasketSelect = (basketId: string) => {
    if (isProcessing || !currentItem) return;

    setIsProcessing(true);
    const reactionTime = Date.now() - trialStartTimeRef.current;
    const isCorrect = currentItem.category === basketId;

    if (isCorrect) {
      playTone(true);
      setTotalScore(s => s + 120 * difficulty);
      setConsecutiveCorrect(c => c + 1);
      setFeedback({ isCorrect: true, text: `Correct! ${currentItem.name} placed in ${BASKETS[basketId].name}` });
    } else {
      playTone(false);
      setTotalMistakes(m => m + 1);
      setFeedback({ isCorrect: false, text: `Oops! ${currentItem.name} belongs to ${BASKETS[currentItem.category].name}` });
    }

    const trialRecord = {
      trial_number: currentTrial,
      correct: isCorrect,
      reaction_time_ms: reactionTime,
      item_name: currentItem.name,
      selected_category: basketId,
      expected_category: currentItem.category,
    };
    const updatedTelemetry = [...trialsTelemetry, trialRecord];
    setTrialsTelemetry(updatedTelemetry);

    setTimeout(() => {
      if (currentTrial < totalTrials) {
        setCurrentTrial(t => t + 1);
      } else {
        submitSessionTelemetry(updatedTelemetry);
      }
    }, 1300);
  };

  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(5, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / (completedTrials.length || 1));
    const correctCount = completedTrials.filter(t => t.correct).length;
    const accuracyPercentage = parseFloat(((correctCount / (completedTrials.length || 1)) * 100).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'sort_remember',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          categoriesCount: numCategories,
          totalTrials,
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Offline: queuing sort remember session:', err);
      await offlineDb.queueSession({
        gameId: 'sort_remember',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { categoriesCount: numCategories, totalTrials }
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
      title="Sort & Remember"
      icon="🧺"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions="Where does this item belong? Tap the matching basket below."
    >
      <div className="flex flex-col items-center max-w-xl mx-auto w-full">
        {/* Instruction Banner */}
        <div className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6 text-center shadow-xs">
          <p className="text-elder-base font-bold text-elder-navy">
            Where does this item belong? Tap the matching basket below.
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Question {currentTrial} of {totalTrials}
          </p>
        </div>

        {/* Current Item Card */}
        {currentItem && (
          <div className="w-full max-w-xs bg-white rounded-3xl border-3 border-purple-300 p-6 flex flex-col items-center justify-center shadow-lg mb-8 relative transition-transform animate-in zoom-in-95">
            <span className="text-6xl sm:text-7xl mb-2">{currentItem.icon}</span>
            <h3 className="text-2xl font-black text-elder-navy">{currentItem.name}</h3>

            {feedback && (
              <div className={`mt-3 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                feedback.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {feedback.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                <span>{feedback.text}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center text-slate-400 mb-4 animate-bounce">
          <ArrowDown className="w-6 h-6" />
        </div>

        {/* Category Baskets */}
        <div className={`grid gap-4 w-full ${activeBaskets.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {activeBaskets.map((basket) => (
            <button
              key={basket.id}
              onClick={() => handleBasketSelect(basket.id)}
              disabled={isProcessing}
              className={`min-h-[80px] p-4 rounded-3xl border-3 ${basket.borderColor} ${basket.color} flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50`}
            >
              <span className="text-2xl sm:text-3xl mb-1">{basket.icon.split(' ')[0]}</span>
              <span className="text-base font-black text-elder-navy">{basket.name}</span>
            </button>
          ))}
        </div>
      </div>

      {ddaResult && (
        <GameResultModal
          isOpen={showResultModal}
          gameTitle="Sort & Remember"
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
