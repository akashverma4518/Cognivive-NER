import React, { useState, useEffect, useRef } from 'react';
import { GameShell } from '../components/games/GameShell';
import { GameResultModal } from '../components/games/GameResultModal';
import { gamesApi } from '../services/api';
import { offlineDb } from '../services/offlineDb';
import { Sparkles, Check, HelpCircle } from 'lucide-react';

interface MatchPairsProps {
  initialDifficulty?: number;
}

interface CardItem {
  id: number;
  symbolKey: string;
  label: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_CARDS = [
  { symbolKey: 'diya', label: 'Diya', icon: '🪔' },
  { symbolKey: 'lotus', label: 'Lotus', icon: '🪷' },
  { symbolKey: 'peacock', label: 'Peacock', icon: '🦚' },
  { symbolKey: 'mango', label: 'Mango', icon: '🥭' },
  { symbolKey: 'elephant', label: 'Elephant', icon: '🐘' },
  { symbolKey: 'flute', label: 'Flute', icon: '🪈' },
  { symbolKey: 'sun', label: 'Surya', icon: '☀️' },
  { symbolKey: 'bell', label: 'Ghanti', icon: '🔔' },
];

export const MatchPairs: React.FC<MatchPairsProps> = ({ initialDifficulty = 1 }) => {
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const totalTrials = 2;

  // Pairs based on difficulty
  const numPairs = difficulty === 1 ? 4 : difficulty === 2 ? 6 : 8;

  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [promptMessage, setPromptMessage] = useState<string>('Find and match the identical pairs');

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
      osc.frequency.setValueAtTime(high ? 587.33 : 329.63, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // Generate board
  const setupBoard = () => {
    const selectedSymbols = ALL_CARDS.slice(0, numPairs);
    const cardPool: CardItem[] = [];

    selectedSymbols.forEach((sym, idx) => {
      // 2 cards per symbol
      cardPool.push({
        id: idx * 2,
        symbolKey: sym.symbolKey,
        label: sym.label,
        icon: sym.icon,
        isFlipped: false,
        isMatched: false,
      });
      cardPool.push({
        id: idx * 2 + 1,
        symbolKey: sym.symbolKey,
        label: sym.label,
        icon: sym.icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    for (let i = cardPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPool[i], cardPool[j]] = [cardPool[j], cardPool[i]];
    }

    setCards(cardPool);
    setSelectedCards([]);
    setIsLocked(false);
    setPromptMessage(`Round ${currentTrial} of ${totalTrials}: Match all ${numPairs} pairs!`);
    trialStartTimeRef.current = Date.now();
  };

  useEffect(() => {
    setupBoard();
  }, [currentTrial, difficulty]);

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    const clickedCard = cards[index];
    if (clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip the clicked card
    playChime(true);
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsLocked(true);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.symbolKey === secondCard.symbolKey) {
        // MATCH!
        playChime(true);
        setTimeout(() => playChime(true), 150);
        newCards[firstIdx].isMatched = true;
        newCards[secondIdx].isMatched = true;
        setCards([...newCards]);
        setSelectedCards([]);
        setIsLocked(false);
        setTotalScore(s => s + 150 * difficulty);
        setConsecutiveCorrect(c => c + 1);

        // Check if all matched
        const allMatched = newCards.every(c => c.isMatched);
        if (allMatched) {
          handleTrialComplete(newCards);
        }
      } else {
        // MISMATCH
        setTotalMistakes(m => m + 1);
        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setSelectedCards([]);
          setIsLocked(false);
        }, 1100);
      }
    }
  };

  const handleTrialComplete = (completedBoard: CardItem[]) => {
    const trialDuration = Date.now() - trialStartTimeRef.current;
    const trialRecord = {
      trial_number: currentTrial,
      correct: true,
      reaction_time_ms: trialDuration,
      pairs_matched: numPairs,
      mistakes: totalMistakes,
    };
    const updatedTelemetry = [...trialsTelemetry, trialRecord];
    setTrialsTelemetry(updatedTelemetry);

    setPromptMessage('Great job! All pairs matched accurately.');

    setTimeout(() => {
      if (currentTrial < totalTrials) {
        setCurrentTrial(t => t + 1);
      } else {
        submitSessionTelemetry(updatedTelemetry);
      }
    }, 1400);
  };

  const submitSessionTelemetry = async (completedTrials: any[]) => {
    const durationSeconds = Math.max(8, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const avgRt = Math.round(completedTrials.reduce((sum, t) => sum + t.reaction_time_ms, 0) / (completedTrials.length || 1));
    const totalFlips = completedTrials.length * numPairs * 2 + totalMistakes;
    const accuracy = parseFloat(Math.max(30, Math.min(100, 100 - (totalMistakes * 8))).toFixed(2));

    try {
      const response = await gamesApi.recordSession({
        gameId: 'match_pairs',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage: accuracy,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: {
          numPairs,
          totalCards: numPairs * 2,
        }
      });

      if (response.success) {
        setDdaResult(response.dda);
        setShowResultModal(true);
      }
    } catch (err) {
      console.warn('Offline: queuing match pairs session:', err);
      await offlineDb.queueSession({
        gameId: 'match_pairs',
        difficultyLevel: difficulty,
        durationSeconds,
        score: totalScore,
        accuracyPercentage: accuracy,
        averageReactionTimeMs: avgRt,
        mistakesCount: totalMistakes,
        consecutiveCorrect,
        trials: completedTrials,
        telemetryPayload: { numPairs, totalCards: numPairs * 2 }
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
      title="Match Pairs"
      icon="🪔"
      difficulty={difficulty}
      currentTrial={currentTrial}
      totalTrials={totalTrials}
      instructions={promptMessage}
    >
      <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
        {/* Status prompt */}
        <div className="w-full bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6 text-center shadow-xs">
          <p className="text-elder-base font-bold text-elder-navy">
            {promptMessage}
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Pairs Matched: {cards.filter(c => c.isMatched).length / 2} / {numPairs}
          </p>
        </div>

        {/* Card Grid */}
        <div className={`grid gap-3 sm:gap-4 p-4 bg-white/80 rounded-3xl border-2 border-purple-100 shadow-md ${
          numPairs === 4 ? 'grid-cols-4' : numPairs === 6 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-4'
        }`}>
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={isRevealed || isLocked}
                className={`w-20 h-24 sm:w-24 sm:h-28 rounded-2xl flex flex-col items-center justify-center p-2 border-3 transition-all relative select-none ${
                  card.isMatched
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 opacity-90'
                    : isRevealed
                    ? 'bg-purple-100 border-[#6C3EDC] text-slate-900 shadow-lg scale-102'
                    : 'bg-gradient-to-br from-purple-600 to-[#6C3EDC] hover:from-purple-700 hover:to-purple-900 border-purple-700 text-white shadow-md active:scale-95 cursor-pointer'
                }`}
                aria-label={isRevealed ? card.label : 'Hidden card'}
              >
                {isRevealed ? (
                  <>
                    <span className="text-3xl sm:text-4xl mb-1">{card.icon}</span>
                    <span className="text-xs font-bold truncate max-w-full text-elder-navy">
                      {card.label}
                    </span>
                    {card.isMatched && (
                      <span className="absolute top-1 right-1 text-emerald-600">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center opacity-80">
                    <HelpCircle className="w-8 h-8 text-white/90 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Flip</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {ddaResult && (
        <GameResultModal
          isOpen={showResultModal}
          gameTitle="Match Pairs"
          score={totalScore}
          accuracy={parseFloat(Math.max(30, Math.min(100, 100 - (totalMistakes * 8))).toFixed(1))}
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
