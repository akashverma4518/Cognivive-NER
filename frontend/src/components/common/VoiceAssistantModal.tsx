import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Sparkles, Send } from 'lucide-react';
import { speechManager } from '../../services/voice/speechProviders';
import { aiApi } from '../../services/api';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchRequest?: (query: string) => void;
}

interface PendingConfirmation {
  intent: string;
  entity?: string;
  prompt: string;
  action: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onSearchRequest,
}) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('Tap the microphone to speak');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [manualText, setManualText] = useState<string>('');

  const currentLang = speechManager.getLanguage();

  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setStatusMessage(`Listening in ${currentLang.nativeName} (${currentLang.name})...`);
      setPendingConfirmation(null);
      startVoiceListening();
    } else {
      stopVoiceListening();
      speechManager.cancelSpeech();
    }
    return () => {
      stopVoiceListening();
      speechManager.cancelSpeech();
    };
  }, [isOpen]);

  const startVoiceListening = () => {
    setTranscript('');
    setPendingConfirmation(null);
    setIsListening(true);
    setStatusMessage(`Listening in ${currentLang.nativeName}...`);

    speechManager.getActiveProvider().startListening({
      langCode: currentLang.code,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text: string, conf: number) => {
        setIsListening(false);
        setTranscript(text);
        setConfidence(conf);
        handleProcessSpeech(text, conf);
      },
      onError: (err: string) => {
        setIsListening(false);
        setStatusMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const stopVoiceListening = () => {
    setIsListening(false);
    speechManager.getActiveProvider().stopListening();
  };

  const handleProcessSpeech = async (spokenText: string, confScore: number) => {
    const lower = spokenText.trim().toLowerCase();
    const isConfident = confScore >= 0.70;

    // Helper to queue or immediately execute based on confidence
    const dispatchAction = (
      intentName: string,
      readableAction: string,
      actionFn: () => void,
      speakAnnouncement: string
    ) => {
      if (isConfident) {
        setStatusMessage(`Recognized: "${readableAction}"`);
        speechManager.speak(speakAnnouncement);
        setTimeout(() => {
          actionFn();
          onClose();
        }, 1200);
      } else {
        // Low confidence flow: Ask user confirmation
        setStatusMessage(`Low confidence (${Math.round(confScore * 100)}%). Please confirm.`);
        speechManager.speak(`Did you mean to ${readableAction}?`);
        setPendingConfirmation({
          intent: intentName,
          prompt: `Did you want to: ${readableAction}?`,
          action: () => {
            actionFn();
            onClose();
          }
        });
      }
    };

    // 1. GAME INTENTS (7 games)
    if (lower.includes('pattern') || lower.includes('path') || lower.includes('sequence path')) {
      dispatchAction(
        'START_GAME',
        'Play Pattern Path (Attention Game)',
        () => navigate('/elder/play/pattern_path'),
        'Starting Pattern Path'
      );
      return;
    }

    if (lower.includes('match') || lower.includes('pair') || lower.includes('card') || lower.includes('jodee') || lower.includes('jodi')) {
      dispatchAction(
        'START_GAME',
        'Play Match Pairs (Working Memory)',
        () => navigate('/elder/play/match_pairs'),
        'Starting Match Pairs'
      );
      return;
    }

    if (lower.includes('sort') || lower.includes('basket') || lower.includes('alga') || lower.includes('vargikaran')) {
      dispatchAction(
        'START_GAME',
        'Play Sort & Remember (Flexibility)',
        () => navigate('/elder/play/sort_remember'),
        'Starting Sort and Remember'
      );
      return;
    }

    if (lower.includes('story') || lower.includes('stories') || lower.includes('sequence') || lower.includes('kahani')) {
      dispatchAction(
        'START_GAME',
        'Play Sequence Stories (Reminiscence)',
        () => navigate('/elder/play/sequence_stories'),
        'Starting Sequence Stories'
      );
      return;
    }

    if (lower.includes('memory') || lower.includes('blossom') || lower.includes('flower')) {
      dispatchAction(
        'START_GAME',
        'Play Memory Blossom',
        () => navigate('/elder/play/memory_blossom'),
        'Starting Memory Blossom'
      );
      return;
    }

    if (lower.includes('harvest') || lower.includes('fruit') || lower.includes('speed')) {
      dispatchAction(
        'START_GAME',
        'Play Quick Harvest',
        () => navigate('/elder/play/quick_harvest'),
        'Starting Quick Harvest'
      );
      return;
    }

    if (lower.includes('golden') || lower.includes('trivia') || lower.includes('yaadein')) {
      dispatchAction(
        'START_GAME',
        'Play Golden Memories',
        () => navigate('/elder/play/golden_memories'),
        'Starting Golden Memories'
      );
      return;
    }

    // 2. SEARCH INTENT
    if (lower.startsWith('search') || lower.startsWith('find') || lower.startsWith('dhoondo') || lower.startsWith('khojo')) {
      const query = lower.replace(/^(search|find|dhoondo|khojo|for)\s+/i, '').trim();
      dispatchAction(
        'SEARCH',
        `Search for "${query}"`,
        () => {
          onSearchRequest?.(query);
        },
        `Searching for ${query}`
      );
      return;
    }

    // 3. NAVIGATION & REMINDERS
    if (lower.includes('home') || lower.includes('dashboard') || lower.includes('ghar')) {
      dispatchAction(
        'GO_HOME',
        'Go to Home Dashboard',
        () => navigate('/elder'),
        'Navigating to Home'
      );
      return;
    }

    if (lower.includes('reminder') || lower.includes('schedule') || lower.includes('dawai') || lower.includes('task')) {
      dispatchAction(
        'VIEW_REMINDERS',
        'View Today\'s Reminders',
        () => {
          navigate('/elder');
          const el = document.getElementById('reminders-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        },
        'Showing your scheduled reminders'
      );
      return;
    }

    // 4. EMERGENCY SOS
    if (lower.includes('emergency') || lower.includes('help') || lower.includes('madad') || lower.includes('bachao')) {
      dispatchAction(
        'TRIGGER_SOS',
        'Send Caregiver Emergency Alert',
        async () => {
          try {
            await aiApi.triggerSos('Voice Assistant Emergency Alert');
          } catch (e) {
            console.error(e);
          }
        },
        'Sending emergency alert to your caregiver'
      );
      return;
    }

    // Fallback: If no direct match
    setStatusMessage(`Did not understand: "${spokenText}". You can try: "Play Pattern Path", "Search reminders", or "Go home".`);
    speechManager.speak('I did not quite catch that. Please try again.');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscript(manualText);
    setConfidence(1.0);
    handleProcessSpeech(manualText, 1.0);
    setManualText('');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Voice Assistant"
    >
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-700 via-[#6C3EDC] to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">Voice Assistant</h2>
              <p className="text-xs text-purple-200">
                Language: <span className="font-bold text-white">{currentLang.nativeName} ({currentLang.name})</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white border border-white/20 transition-all active:scale-95"
            aria-label="Close voice assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Voice Pulse Interaction */}
        <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-purple-400/30 animate-ping scale-150 pointer-events-none" />
            )}
            <button
              onClick={isListening ? stopVoiceListening : startVoiceListening}
              className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white ring-8 ring-rose-200 animate-pulse'
                  : 'bg-[#6C3EDC] hover:bg-purple-700 text-white ring-8 ring-purple-100'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? (
                <MicOff className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>
          </div>

          {/* Status Message */}
          <p className="text-base font-bold text-elder-navy mb-2 min-h-[24px]">
            {statusMessage}
          </p>

          {/* Transcript Display */}
          {transcript && (
            <div className="w-full bg-purple-50 border border-purple-200 rounded-2xl p-4 my-2 text-center">
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Recognized Words</p>
              <p className="text-lg font-bold text-slate-800">"{transcript}"</p>
              {confidence !== null && (
                <p className="text-xs text-slate-500 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>
          )}

          {/* Low Confidence Confirmation Card */}
          {pendingConfirmation && (
            <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 my-3 text-center animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-amber-800 font-bold mb-2">
                <AlertCircle className="w-5 h-5" />
                <span>Confirmation Needed</span>
              </div>
              <p className="text-base font-extrabold text-slate-800 mb-4">
                {pendingConfirmation.prompt}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={pendingConfirmation.action}
                  className="min-h-touch py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md"
                >
                  <Check className="w-5 h-5" />
                  <span>Yes, Proceed</span>
                </button>
                <button
                  onClick={() => {
                    setPendingConfirmation(null);
                    startVoiceListening();
                  }}
                  className="min-h-touch py-3 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-base flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  <span>No, Try Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Voice Command Hints */}
          <div className="mt-4 pt-4 border-t border-slate-100 w-full text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Try saying:</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-slate-100 hover:bg-purple-100 text-slate-700 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => handleProcessSpeech('Play Pattern Path', 1.0)}>
                "Play Pattern Path"
              </span>
              <span className="text-xs bg-slate-100 hover:bg-purple-100 text-slate-700 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => handleProcessSpeech('Play Match Pairs', 1.0)}>
                "Play Match Pairs"
              </span>
              <span className="text-xs bg-slate-100 hover:bg-purple-100 text-slate-700 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => handleProcessSpeech('Show my reminders', 1.0)}>
                "Show reminders"
              </span>
              <span className="text-xs bg-slate-100 hover:bg-purple-100 text-slate-700 px-3 py-1.5 rounded-full cursor-pointer" onClick={() => handleProcessSpeech('Go home', 1.0)}>
                "Go home"
              </span>
            </div>
          </div>
        </div>

        {/* Fallback Text Input Form */}
        <form 
          onSubmit={handleManualSubmit}
          className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Or type a command here..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6C3EDC] text-sm"
          />
          <button
            type="submit"
            disabled={!manualText.trim()}
            className="px-4 py-2.5 rounded-xl bg-[#6C3EDC] hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold text-sm flex items-center gap-1 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
