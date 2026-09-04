import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gamesApi } from '../../services/api';
import { MemoryBlossom } from '../../games/MemoryBlossom';
import { QuickHarvest } from '../../games/QuickHarvest';
import { GoldenMemories } from '../../games/GoldenMemories';
import { PatternPath } from '../../games/PatternPath';
import { MatchPairs } from '../../games/MatchPairs';
import { SortRemember } from '../../games/SortRemember';
import { SequenceStories } from '../../games/SequenceStories';
import { Navbar } from '../../components/common/Navbar';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const ActiveGamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameState = async () => {
      if (!gameId) {
        setError('No game selected.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await gamesApi.getState(gameId);
        if (res.success && res.state) {
          const currentDiff = Math.max(1, Math.min(8, res.state.current_difficulty || 1));
          setDifficulty(currentDiff);
        }
      } catch (err) {
        console.warn('Could not retrieve remote difficulty state, starting at base level 1:', err);
        setDifficulty(1);
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-elder-bg flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[#6C3EDC] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-elder-xl font-black text-elder-navy">Setting up activity...</h2>
        <p className="text-slate-500 text-elder-base mt-1">Calibrating your personal difficulty level</p>
      </div>
    );
  }

  if (error || !gameId) {
    return (
      <div className="min-h-screen bg-elder-bg p-6 flex flex-col items-center justify-center">
        <div className="card-elder max-w-md bg-white border-2 border-rose-300 p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-elder-lg font-black text-elder-navy">Game Not Found</h2>
          <p className="text-slate-600">{error || 'Unknown cognitive game ID'}</p>
          <button onClick={() => navigate('/elder')} className="w-full btn-elder-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (gameId === 'memory_blossom') {
    return <MemoryBlossom initialDifficulty={difficulty} />;
  }

  if (gameId === 'quick_harvest') {
    return <QuickHarvest initialDifficulty={difficulty} />;
  }

  if (gameId === 'golden_memories') {
    return <GoldenMemories initialDifficulty={difficulty} />;
  }

  if (gameId === 'pattern_path') {
    return <PatternPath initialDifficulty={difficulty} />;
  }

  if (gameId === 'match_pairs') {
    return <MatchPairs initialDifficulty={difficulty} />;
  }

  if (gameId === 'sort_remember') {
    return <SortRemember initialDifficulty={difficulty} />;
  }

  if (gameId === 'sequence_stories') {
    return <SequenceStories initialDifficulty={difficulty} />;
  }

  return (
    <div className="min-h-screen bg-elder-bg p-6 flex flex-col items-center justify-center">
      <div className="card-elder max-w-md bg-white border-2 border-slate-300 p-8 text-center space-y-4">
        <h2 className="text-elder-lg font-black text-elder-navy">Unknown Exercise</h2>
        <button onClick={() => navigate('/elder')} className="w-full btn-elder-primary">
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
