import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSync, SyncStatusBar } from '../../context/SyncContext';
import { Navbar } from '../../components/common/Navbar';
import { remindersApi, gamesApi, profileApi, aiApi } from '../../services/api';
import { offlineDb } from '../../services/offlineDb';
import { Reminder, GameItem, DailyRecommendations, CognitiveProfile } from '../../types';
import {
  CheckCircle2,
  Clock,
  Play,
  Volume2,
  Mic,
  Sparkles,
  Award,
  Activity,
  Calendar,
  AlertCircle,
  TrendingUp,
  Brain,
  Bell,
  BellOff,
  RotateCcw
} from 'lucide-react';

export const ElderHome: React.FC = () => {
  const { user, profile } = useAuth();
  const { isOnline, pendingCount, triggerSync } = useSync();
  const navigate = useNavigate();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [recommendations, setRecommendations] = useState<DailyRecommendations | null>(null);
  const [cognitiveProfile, setCognitiveProfile] = useState<CognitiveProfile | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Notification status
  const [notificationsGranted, setNotificationsGranted] = useState<boolean>(false);

  // Voice Interaction State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const remindersRef = useRef<HTMLDivElement>(null);

  // Audio Confirmation Player
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('AudioContext not allowed without interaction yet');
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Pleasant slower speed for seniors
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Browser Notification helper
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationsGranted(perm === 'granted');
        if (perm === 'granted') {
          speakText('Reminders will now notify you on this device.');
        }
      } catch (e) {
        console.warn('Notification permission request failed gracefully:', e);
      }
    }
  };

  const showSystemNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Could not post system notification:', e);
      }
    }
  };

  // Fetch real data on mount or from offline cache
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check notification permission state
        if ('Notification' in window && Notification.permission === 'granted') {
          setNotificationsGranted(true);
        }

        if (navigator.onLine) {
          const [remindersRes, gamesRes, recsRes, profRes] = await Promise.allSettled([
            remindersApi.getToday(),
            gamesApi.getAll(),
            profileApi.getRecommendations(),
            profileApi.getCognitive()
          ]);

          if (remindersRes.status === 'fulfilled' && remindersRes.value.success) {
            setReminders(remindersRes.value.reminders);
            // Cache reminders locally for offline availability
            await offlineDb.cacheReminders(remindersRes.value.reminders);
          }
          if (gamesRes.status === 'fulfilled' && gamesRes.value.success) {
            setGames(gamesRes.value.games);
          }
          if (recsRes.status === 'fulfilled' && recsRes.value.success) {
            setRecommendations(recsRes.value.recommendations);
          }
          if (profRes.status === 'fulfilled' && profRes.value.success) {
            setCognitiveProfile(profRes.value.profile);
          }
        } else {
          // Offline fallback
          const cachedRems = await offlineDb.getCachedReminders();
          if (cachedRems.length > 0) {
            setReminders(cachedRems);
          }
        }
      } catch (err: any) {
        console.warn('Network issue during fetch, checking local cache:', err);
        const cachedRems = await offlineDb.getCachedReminders();
        if (cachedRems.length > 0) {
          setReminders(cachedRems);
        } else {
          setError('Saved offline mode. Activity will sync when connection returns.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle Mark as Done for a reminder (Online + Offline)
  const handleAcknowledgeReminder = async (id: string, title: string, voiceConfirmed = false) => {
    playChime();
    speakText(`${title} marked as completed. Well done!`);

    // Optimistic UI update
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, today_status: 'TAKEN' as const } : r)
    );

    if (navigator.onLine) {
      try {
        await remindersApi.acknowledge(id, voiceConfirmed, 'Completed via Elder Home');
        // Update local cache
        offlineDb.cacheReminders(reminders);
      } catch (err) {
        console.warn('Network drop during reminder acknowledgement, queuing offline:', err);
        await offlineDb.queueReminderAck(id, 'TAKEN', voiceConfirmed, 'Offline acknowledged');
      }
    } else {
      // Stored locally in IndexedDB
      await offlineDb.queueReminderAck(id, 'TAKEN', voiceConfirmed, 'Offline acknowledged');
    }
  };

  // Handle Snooze Reminder
  const handleSnoozeReminder = async (id: string, title: string) => {
    playChime();
    speakText(`${title} snoozed. We will remind you again soon.`);

    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, today_status: 'SNOOZED' as const } : r)
    );

    if (navigator.onLine) {
      try {
        await remindersApi.acknowledge(id, false, 'Snoozed by elder');
      } catch (e) {
        await offlineDb.queueReminderAck(id, 'SNOOZED', false, 'Offline snoozed');
      }
    } else {
      await offlineDb.queueReminderAck(id, 'SNOOZED', false, 'Offline snoozed');
    }
  };

  // Voice Interaction Engine: Handles English & Hindi commands
  const handleVoiceAssistant = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceFeedback('Voice recognition is not supported in this browser. Please use standard buttons.');
      speakText('Voice recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Recognizes Indian English and Hindi transliterated phrases
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setVoiceFeedback('Listening... (Aap bol sakte hain)');
    speakText('I am listening.');

    recognition.onresult = async (event: any) => {
      const spokenText = event.results[0][0].transcript;
      const lower = spokenText.trim().toLowerCase();
      setIsListening(false);
      setVoiceFeedback(`You said: "${spokenText}"`);

      // 1. Direct Voice Commands (Instant Navigation)
      if (lower.includes('memory') || lower.includes('blossom')) {
        speakText('Starting Memory Blossom.');
        setTimeout(() => navigate('/elder/play/memory_blossom'), 1000);
        return;
      }
      if (lower.includes('harvest') || lower.includes('fruit')) {
        speakText('Starting Quick Harvest.');
        setTimeout(() => navigate('/elder/play/quick_harvest'), 1000);
        return;
      }
      if (lower.includes('golden') || lower.includes('memories') || lower.includes('trivia')) {
        speakText('Starting Golden Memories.');
        setTimeout(() => navigate('/elder/play/golden_memories'), 1000);
        return;
      }
      if (lower.includes('read') && (lower.includes('reminder') || lower.includes('schedule') || lower.includes('dawai'))) {
        const pending = reminders.filter(r => r.today_status === 'PENDING');
        if (pending.length === 0) {
          speakText('All your scheduled activities for today are currently completed.');
        } else {
          const names = pending.map(p => `${p.title} at ${p.scheduled_time.slice(0, 5)}`).join('. ');
          speakText(`You have ${pending.length} pending reminders: ${names}`);
        }
        return;
      }
      if (lower.includes('show') && (lower.includes('reminder') || lower.includes('schedule'))) {
        speakText('Here are your reminders for today.');
        remindersRef.current?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (lower.includes('home') || lower.includes('dashboard')) {
        speakText('You are on your home dashboard.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 2. Call AI Intent Parser for complex phrasing
      try {
        const parseRes = await aiApi.parseVoice(spokenText);
        const intent = parseRes.parsed?.intent;

        if (intent === 'ACKNOWLEDGE_REMINDER') {
          const pending = reminders.find(r => r.today_status === 'PENDING' || r.today_status === 'SNOOZED');
          if (pending) {
            handleAcknowledgeReminder(pending.id, pending.title, true);
            setVoiceFeedback(`Understood! Marked "${pending.title}" as done.`);
          } else {
            speakText('All your scheduled routines are currently completed.');
            setVoiceFeedback('All routines are currently completed.');
          }
        } else if (intent === 'START_GAME') {
          const gid = parseRes.parsed?.entities?.game_id || 'memory_blossom';
          speakText(`Starting your game.`);
          setTimeout(() => navigate(`/elder/play/${gid}`), 1000);
        } else {
          speakText("I didn't quite catch that. You can tap any big button on the screen.");
          setVoiceFeedback('Command not recognized. Please tap any button.');
        }
      } catch (err) {
        speakText("I didn't quite catch that. You can tap any big button on the screen.");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceFeedback('Could not hear clearly. Please tap again and speak.');
      speakText('Could not hear clearly. Please tap again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-elder-bg">
        <Navbar />
        <main className="max-w-5xl mx-auto p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-[#6C3EDC] border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-elder-xl font-black text-elder-navy">Loading Your Dashboard...</h2>
          <p className="text-elder-base text-slate-500 mt-2">Retrieving your today's schedule and activities</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-elder-bg pb-16">
      <Navbar />
      {/* Offline & Sync Status Banner */}
      <SyncStatusBar />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="card-elder bg-rose-50 border-rose-300 text-rose-900 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
            <p className="font-bold text-elder-base">{error}</p>
          </div>
        )}

        {/* 1. Welcoming Hero Greeting with Audio Announcement */}
        <section className="card-elder bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#DDD6FE] text-[#111827] border-2 border-purple-200 shadow-[0_8px_30px_rgb(108,62,220,0.08)] relative overflow-hidden">
          {/* Soft decorative background glow shapes */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-purple-300/30 blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -top-8 w-36 h-36 rounded-full bg-violet-200/40 blur-xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-sm font-bold text-purple-900 border border-purple-200 tracking-wider mb-2">
                Today: {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <h1 className="text-elder-xl md:text-elder-2xl font-black tracking-tight leading-tight text-[#111827]">
                {getGreeting()}, <span className="text-[#6C3EDC]">{user?.full_name || 'Friend'}!</span> 🙏
              </h1>
              <p className="text-elder-base text-[#4B5563] font-medium mt-1">
                Here is your gentle brain workout and routine schedule for today.
              </p>
            </div>

            {/* Read Page Out Loud Button */}
            <button
              onClick={() => {
                const pendingCount = reminders.filter(r => r.today_status === 'PENDING').length;
                speakText(`Hello ${user?.full_name}. Here is your schedule for today. You have ${pendingCount} pending reminders.`);
                showSystemNotification('Cognivive Schedule', `You have ${pendingCount} pending reminders today.`);
              }}
              className="min-h-touch px-5 py-3 rounded-2xl bg-white text-[#6C3EDC] hover:bg-purple-50 active:scale-95 font-black text-elder-base border-2 border-purple-300 flex items-center gap-3 shadow-sm shrink-0 transition-all"
            >
              <Volume2 className="w-7 h-7 text-[#6C3EDC]" />
              <span>Listen Out Loud</span>
            </button>
          </div>
        </section>

        {/* 2. Voice Assistant Interaction Section */}
        <section className="card-elder bg-white border-2 border-purple-200 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 border-2 border-purple-300 flex items-center justify-center shrink-0 shadow-sm">
                <Mic className="w-8 h-8 text-[#6C3EDC]" />
              </div>
              <div>
                <h2 className="text-elder-lg font-black text-elder-navy">Voice Assistant (Aawaz Sahayak)</h2>
                <p className="text-elder-base text-slate-600">
                  {isListening ? 'Listening now... (Aap bol sakte hain)' : 'Say: "Start Memory Blossom", "Read my reminders", or "Mark reminder as done"'}
                </p>
              </div>
            </div>

            <button
              onClick={handleVoiceAssistant}
              className={`min-h-touch px-6 py-3 rounded-2xl font-black text-elder-base flex items-center gap-3 border-2 transition-all shadow-md shrink-0 ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-gradient-to-r from-[#6C3EDC] to-[#8B5CF6] hover:from-[#5B32C4] hover:to-[#7C4DFF] text-white border-[#5B32C4] shadow-purple-500/25 active:scale-95'
              }`}
            >
              <Mic className="w-6 h-6" />
              <span>{isListening ? 'Listening...' : 'Tap to Speak'}</span>
            </button>
          </div>

          {voiceFeedback && (
            <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-elder-base font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#6C3EDC] shrink-0" />
              <span>{voiceFeedback}</span>
            </div>
          )}
        </section>

        {/* 3. AI Personalized Recommended Game Highlight */}
        {recommendations?.primary_recommendation && (
          <section className="card-elder bg-[#F7F5FF] border-2 border-[#DDD6FE] shadow-sm relative overflow-hidden">
            {/* Soft background decorative glow */}
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-purple-200/50 blur-xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[#EDE9FE] text-[#6C3EDC] border border-[#DDD6FE] font-black text-xs rounded-full uppercase tracking-wider">
                    AI Personalized Activity
                  </span>
                  <span className="text-sm font-bold text-slate-600">
                    Target: {recommendations.primary_recommendation.target_domain.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-elder-xl font-black text-elder-navy">
                  {recommendations.primary_recommendation.title} (Level {recommendations.primary_recommendation.suggested_difficulty})
                </h2>
                <p className="text-elder-base text-slate-700 font-medium">
                  {recommendations.primary_recommendation.rationale}
                </p>
              </div>

              <button
                onClick={() => navigate(`/elder/play/${recommendations.primary_recommendation.game_id}`)}
                className="btn-elder-primary min-w-[200px] shrink-0 text-elder-base font-black shadow-lg shadow-purple-500/25"
              >
                <Play className="w-7 h-7 fill-white" />
                <span>Start Exercise</span>
              </button>
            </div>
          </section>
        )}

        {/* 4. Today's Reminders & Routine Schedule */}
        <section ref={remindersRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-7 h-7 text-[#6C3EDC]" />
              <h2 className="text-elder-xl font-black text-elder-navy">Today's Reminders</h2>
            </div>
            <div className="flex items-center gap-2">
              {!notificationsGranted && 'Notification' in window && (
                <button
                  onClick={requestNotificationPermission}
                  className="min-h-touch px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6C3EDC] text-xs font-bold border border-purple-200 flex items-center gap-1.5"
                >
                  <Bell className="w-4 h-4 text-[#6C3EDC]" />
                  <span>Enable Reminder Alerts</span>
                </button>
              )}
              <span className="text-sm font-bold px-3 py-1 bg-purple-100 text-[#6C3EDC] rounded-full">
                {reminders.filter(r => r.today_status === 'TAKEN').length} of {reminders.length} Done
              </span>
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="card-elder text-center py-8">
              <p className="text-elder-lg font-bold text-slate-600">No scheduled reminders for today.</p>
              <p className="text-slate-500 text-sm mt-1">Enjoy your peaceful day!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.map((rem) => {
                const isTaken = rem.today_status === 'TAKEN';
                const isSnoozed = rem.today_status === 'SNOOZED';

                return (
                  <div
                    key={rem.id}
                    className={`card-elder border-2 transition-all flex flex-col justify-between gap-4 ${
                      isTaken
                        ? 'bg-emerald-50/50 border-emerald-300'
                        : isSnoozed
                        ? 'bg-purple-50/60 border-purple-300'
                        : 'bg-white border-purple-100/80 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          rem.type === 'MEDICATION'
                            ? 'bg-rose-100 text-rose-800'
                            : rem.type === 'APPOINTMENT'
                            ? 'bg-purple-100 text-purple-800'
                            : rem.type === 'ROUTINE'
                            ? 'bg-[#EDE9FE] text-[#6C3EDC]'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {rem.type}
                        </span>

                        <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{rem.scheduled_time.slice(0, 5)}</span>
                        </div>
                      </div>

                      <h3 className={`text-elder-lg font-black leading-snug ${
                        isTaken ? 'text-emerald-950 line-through opacity-75' : 'text-elder-navy'
                      }`}>
                        {rem.title}
                      </h3>

                      {rem.dosage_or_notes && (
                        <p className="text-elder-base text-slate-600 mt-1 font-medium">
                          {rem.dosage_or_notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {isTaken ? (
                        <div className="min-h-touch px-4 py-2 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-900 font-black text-elder-base flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleAcknowledgeReminder(rem.id, rem.title)}
                            className="flex-1 btn-elder-success text-elder-base font-black"
                          >
                            <CheckCircle2 className="w-7 h-7" />
                            <span>Mark as Done</span>
                          </button>

                          <button
                            onClick={() => handleSnoozeReminder(rem.id, rem.title)}
                            className="btn-elder-secondary px-4 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-purple-50 hover:border-purple-300"
                            title="Remind me again in a short while"
                          >
                            <RotateCcw className="w-4 h-4 text-slate-600" />
                            <span>Snooze</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. Cognitive Games Suite (From PostgreSQL Games Catalog) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Brain className="w-7 h-7 text-[#6C3EDC]" />
            <h2 className="text-elder-xl font-black text-elder-navy">Cognitive Activities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((g) => (
              <div
                key={g.id}
                className="card-elder flex flex-col justify-between border border-purple-100 hover:border-[#8B5CF6] hover:shadow-lg hover:shadow-purple-500/10 transition-all bg-white"
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] border-2 border-purple-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
                    {g.id === 'memory_blossom' ? '🌸' : g.id === 'quick_harvest' ? '🍎' : '📖'}
                  </div>

                  <span className="px-3 py-1 bg-purple-50 text-[#6C3EDC] text-xs font-bold rounded-full uppercase tracking-wider border border-purple-100">
                    {g.primary_domain.replace('_', ' ')}
                  </span>

                  <h3 className="text-elder-lg font-black text-elder-navy mt-2">
                    {g.title}
                  </h3>

                  <p className="text-elder-base text-slate-600 font-medium mt-2 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-purple-100/60">
                  <button
                    onClick={() => navigate(`/elder/play/${g.id}`)}
                    className="w-full btn-elder-secondary hover:bg-purple-50 hover:border-purple-300 font-black"
                  >
                    <Play className="w-6 h-6 text-[#6C3EDC]" />
                    <span>Play Exercise</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Today's Activity Summary (Non-Diagnostic) */}
        <section className="card-elder bg-white border border-purple-100 shadow-[0_4px_20px_-2px_rgba(108,62,220,0.06)]">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-emerald-600" />
            <h2 className="text-elder-lg font-black text-elder-navy">Today's Activity Summary</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-[#F7F5FF] rounded-2xl border border-purple-100">
              <p className="text-sm font-bold text-slate-500 uppercase">Overall Activity</p>
              <p className="text-elder-xl font-black text-[#6C3EDC] mt-1">
                {cognitiveProfile?.overall_performance_score || '69.1'}
              </p>
              <span className="text-xs font-bold text-emerald-700">Non-Diagnostic</span>
            </div>

            <div className="p-4 bg-[#F7F5FF] rounded-2xl border border-purple-100">
              <p className="text-sm font-bold text-slate-500 uppercase">Activity Trend</p>
              <p className="text-elder-xl font-black text-emerald-600 mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-5 h-5" />
                <span>{profile?.status || 'STABLE'}</span>
              </p>
              <span className="text-xs font-bold text-slate-500">Personal Baseline</span>
            </div>

            <div className="p-4 bg-[#F7F5FF] rounded-2xl border border-purple-100">
              <p className="text-sm font-bold text-slate-500 uppercase">Consistency</p>
              <p className="text-elder-xl font-black text-[#8B5CF6] mt-1">
                {cognitiveProfile?.consistency_index || '97.9'}%
              </p>
              <span className="text-xs font-bold text-slate-500">Reaction Focus</span>
            </div>

            <div className="p-4 bg-[#F7F5FF] rounded-2xl border border-purple-100">
              <p className="text-sm font-bold text-slate-500 uppercase">Exercise Time</p>
              <p className="text-elder-xl font-black text-slate-700 mt-1">
                {cognitiveProfile?.engagement_minutes_total || 155} min
              </p>
              <span className="text-xs font-bold text-slate-500">Total Minutes</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
