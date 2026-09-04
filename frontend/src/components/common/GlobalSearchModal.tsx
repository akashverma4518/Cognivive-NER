import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Mic, ArrowRight, Sparkles, Clock, HelpCircle, User, Compass, Play } from 'lucide-react';
import { searchService, SearchResultItem, UnifiedSearchResults } from '../../services/searchService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onOpenVoiceSearch?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onOpenVoiceSearch
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<'ALL' | 'GAMES' | 'REMINDERS' | 'HELP'>('ALL');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UnifiedSearchResults>({
    games: [],
    reminders: [],
    patients: [],
    navigation: [],
    help: [],
    totalCount: 0
  });

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialQuery]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults({
        games: [],
        reminders: [],
        patients: [],
        navigation: [],
        help: [],
        totalCount: 0
      });
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.search(trimmed);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    if (item.actionUrl) {
      if (item.actionUrl.includes('#')) {
        const [path, hash] = item.actionUrl.split('#');
        navigate(path);
        setTimeout(() => {
          const el = document.getElementById(hash);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        navigate(item.actionUrl);
      }
    } else if (item.actionType === 'VOICE' && onOpenVoiceSearch) {
      onOpenVoiceSearch();
    }
  };

  const getFilteredItems = (): SearchResultItem[] => {
    if (filter === 'GAMES') return results.games;
    if (filter === 'REMINDERS') return results.reminders;
    if (filter === 'HELP') return [...results.navigation, ...results.help];
    return [
      ...results.games,
      ...results.reminders,
      ...results.patients,
      ...results.navigation,
      ...results.help
    ];
  };

  const filteredItems = getFilteredItems();
  const hasQuery = query.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-[0_20px_60px_rgba(108,62,220,0.2)] border-2 border-purple-200 mt-6 md:mt-12 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Search Input Bar (Elder-friendly, min 60px target) */}
        <div className="p-4 sm:p-6 border-b border-purple-100 bg-[#F7F5FF] flex items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 w-7 h-7 text-[#6C3EDC] pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activities, reminders, or games..."
              className="w-full min-h-[64px] pl-14 pr-12 text-lg sm:text-xl font-bold text-elder-navy rounded-2xl border-2 border-purple-200 focus:border-[#6C3EDC] focus:ring-4 focus:ring-purple-200 bg-white shadow-inner transition-all placeholder:text-slate-400"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 text-slate-500 hover:text-[#6C3EDC] transition-colors"
                title="Clear search input"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Voice Search Entry Button */}
          {onOpenVoiceSearch && (
            <button
              onClick={() => {
                onClose();
                onOpenVoiceSearch();
              }}
              className="min-h-[64px] min-w-[64px] px-4 rounded-2xl bg-gradient-to-br from-[#6C3EDC] to-[#8B5CF6] text-white flex items-center justify-center shadow-md hover:shadow-purple-500/25 transition-all active:scale-95 shrink-0"
              title="Speak to Search (Voice Command)"
            >
              <Mic className="w-7 h-7" />
            </button>
          )}

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="min-h-[64px] px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-base flex items-center justify-center border border-slate-300 transition-colors shrink-0"
            title="Close (Esc)"
          >
            Close
          </button>
        </div>

        {/* Filter Chips (Elder-friendly pills) */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-purple-50 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Filter:</span>
          {(['ALL', 'GAMES', 'REMINDERS', 'HELP'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-black transition-all whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#6C3EDC] text-white shadow-sm'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100 border border-purple-100'
              }`}
            >
              {cat === 'ALL' ? 'All Results' : cat === 'GAMES' ? 'Cognitive Activities' : cat === 'REMINDERS' ? 'Today’s Schedule' : 'Help & Navigation'}
            </button>
          ))}
        </div>

        {/* Search Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 border-4 border-[#6C3EDC] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-elder-base font-bold text-slate-600">Searching activities & schedule...</p>
            </div>
          ) : !hasQuery ? (
            /* Empty State: Quick Suggestions */
            <div className="py-6 space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#EDE9FE] text-3xl mb-1 shadow-sm">
                🔍
              </div>
              <h3 className="text-elder-lg font-black text-elder-navy">What would you like to find?</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Type any keyword or pick a quick suggestion below:
              </p>

              <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-lg mx-auto">
                {['Memory Blossom', 'Quick Harvest', 'Pattern Path', 'Morning Medicine', 'Match Pairs', 'How to play'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="min-h-[48px] px-4 py-2 rounded-2xl bg-[#F7F5FF] hover:bg-purple-100 border border-purple-200 text-elder-navy font-bold text-sm transition-all"
                  >
                    "{term}"
                  </button>
                ))}
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            /* No Results State */
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-100 text-3xl mb-1">
                🧩
              </div>
              <h3 className="text-elder-lg font-black text-elder-navy">No activities found for "{query}"</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Try typing simple words like <span className="font-bold text-[#6C3EDC]">"Memory"</span>, <span className="font-bold text-[#6C3EDC]">"Harvest"</span>, or <span className="font-bold text-[#6C3EDC]">"Medicine"</span>.
              </p>
            </div>
          ) : (
            /* Results List */
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
                Found {filteredItems.length} matching result{filteredItems.length > 1 ? 's' : ''}:
              </p>

              {filteredItems.map((item) => (
                <button
                  key={`${item.category}-${item.id}`}
                  onClick={() => handleSelectResult(item)}
                  className="w-full min-h-[68px] p-4 rounded-2xl bg-white hover:bg-[#F7F5FF] border-2 border-purple-100 hover:border-[#8B5CF6] flex items-center justify-between gap-4 transition-all text-left shadow-sm group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <span className="text-3xl shrink-0">
                      {item.icon || (item.category === 'GAME' ? '🎮' : item.category === 'REMINDER' ? '⏰' : '📄')}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h4 className="text-elder-base font-black text-elder-navy group-hover:text-[#6C3EDC] transition-colors truncate">
                          {item.title}
                        </h4>
                        {item.badge && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-[#6C3EDC] uppercase shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-purple-50 group-hover:bg-[#6C3EDC] text-[#6C3EDC] group-hover:text-white flex items-center justify-center transition-all shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
