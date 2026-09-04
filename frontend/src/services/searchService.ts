import { apiClient } from './api';

export interface SearchResultItem {
  id: string;
  category: 'GAME' | 'REMINDER' | 'PATIENT' | 'NAVIGATION' | 'HELP';
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  actionUrl?: string;
  actionType?: 'NAVIGATE' | 'SCROLL' | 'VOICE';
  payload?: any;
}

export interface UnifiedSearchResults {
  games: SearchResultItem[];
  reminders: SearchResultItem[];
  patients: SearchResultItem[];
  navigation: SearchResultItem[];
  help: SearchResultItem[];
  totalCount: number;
}

// 1. Static Client-side Indexed Games & Activities
const STATIC_GAMES: SearchResultItem[] = [
  {
    id: 'memory_blossom',
    category: 'GAME',
    title: 'Memory Blossom',
    subtitle: 'Calming garden sequence recall to stimulate working memory',
    badge: 'Working Memory',
    icon: '🌸',
    actionUrl: '/elder/play/memory_blossom',
    actionType: 'NAVIGATE'
  },
  {
    id: 'quick_harvest',
    category: 'GAME',
    title: 'Quick Harvest',
    subtitle: 'Tap seasonal fruits quickly to exercise visual reaction and processing speed',
    badge: 'Processing Speed',
    icon: '🍎',
    actionUrl: '/elder/play/quick_harvest',
    actionType: 'NAVIGATE'
  },
  {
    id: 'golden_memories',
    category: 'GAME',
    title: 'Golden Memories',
    subtitle: 'Nostalgic cultural sights, melodies, and historic trivia for semantic recall',
    badge: 'Reminiscence',
    icon: '📖',
    actionUrl: '/elder/play/golden_memories',
    actionType: 'NAVIGATE'
  },
  {
    id: 'pattern_path',
    category: 'GAME',
    title: 'Pattern Path',
    subtitle: 'Follow and reproduce illuminated path sequences for attentional focus',
    badge: 'Attention',
    icon: '🧩',
    actionUrl: '/elder/play/pattern_path',
    actionType: 'NAVIGATE'
  },
  {
    id: 'match_pairs',
    category: 'GAME',
    title: 'Match the Pairs',
    subtitle: 'Flip cards and discover matching cultural and nature pairs',
    badge: 'Working Memory',
    icon: '🎴',
    actionUrl: '/elder/play/match_pairs',
    actionType: 'NAVIGATE'
  },
  {
    id: 'sort_remember',
    category: 'GAME',
    title: 'Sort & Remember',
    subtitle: 'Categorize everyday items into matching baskets followed by quick recall',
    badge: 'Executive Flexibility',
    icon: '🧺',
    actionUrl: '/elder/play/sort_remember',
    actionType: 'NAVIGATE'
  },
  {
    id: 'sequence_stories',
    category: 'GAME',
    title: 'Sequence Stories',
    subtitle: 'Reorder everyday story cards (Making Chai, Planting) chronologically',
    badge: 'Reminiscence',
    icon: '📚',
    actionUrl: '/elder/play/sequence_stories',
    actionType: 'NAVIGATE'
  }
];

// 2. Helpful Elder Guides and Shortcuts
const STATIC_HELP: SearchResultItem[] = [
  {
    id: 'help_voice',
    category: 'HELP',
    title: 'Voice Assistant Commands',
    subtitle: 'Tap microphone and say "Start Memory Blossom", "Show reminders", or "Search"',
    badge: 'Voice Guide',
    icon: '🎙️',
    actionType: 'VOICE'
  },
  {
    id: 'help_reminders',
    category: 'HELP',
    title: "Today's Schedule & Medicine",
    subtitle: 'View your scheduled morning tablets, afternoon sessions, and routines',
    badge: 'Schedule',
    icon: '⏰',
    actionUrl: '/elder#reminders',
    actionType: 'NAVIGATE'
  },
  {
    id: 'help_dashboard',
    category: 'NAVIGATION',
    title: 'Elder Home Dashboard',
    subtitle: 'Return to the main greeting screen and daily recommendations',
    badge: 'Home',
    icon: '🏠',
    actionUrl: '/elder',
    actionType: 'NAVIGATE'
  }
];

export const searchService = {
  /**
   * Search client-side and combine with debounced backend results
   */
  search: async (queryText: string): Promise<UnifiedSearchResults> => {
    const q = queryText.trim().toLowerCase();
    if (!q) {
      return {
        games: [],
        reminders: [],
        patients: [],
        navigation: [],
        help: [],
        totalCount: 0
      };
    }

    // 1. Client-side matching for games and help
    const matchedGames = STATIC_GAMES.filter(g =>
      g.title.toLowerCase().includes(q) ||
      (g.subtitle && g.subtitle.toLowerCase().includes(q)) ||
      (g.badge && g.badge.toLowerCase().includes(q))
    );

    const matchedHelp = STATIC_HELP.filter(h =>
      h.title.toLowerCase().includes(q) ||
      (h.subtitle && h.subtitle.toLowerCase().includes(q)) ||
      (h.badge && h.badge.toLowerCase().includes(q))
    );

    // 2. Fetch backend dynamic results (reminders, patients)
    let backendReminders: SearchResultItem[] = [];
    let backendPatients: SearchResultItem[] = [];

    try {
      const res = await apiClient.get(`/search?q=${encodeURIComponent(q)}`);
      if (res.data.success && res.data.results) {
        const { reminders = [], patients = [] } = res.data.results;

        backendReminders = reminders.map((r: any) => ({
          id: r.id,
          category: 'REMINDER',
          title: r.title,
          subtitle: `${r.scheduled_time?.slice(0, 5) || ''} — ${r.dosage_or_notes || r.type || 'Routine'}`,
          badge: r.type,
          icon: '⏰',
          actionUrl: '/elder#reminders',
          actionType: 'NAVIGATE'
        }));

        backendPatients = patients.map((p: any) => ({
          id: p.patient_id,
          category: 'PATIENT',
          title: p.full_name,
          subtitle: `${p.relationship || 'Assigned Patient'} — Score: ${p.overall_performance_score || 'N/A'}`,
          badge: p.activity_status || 'STABLE',
          icon: '👤',
          actionUrl: `/caregiver?patientId=${p.patient_id}`,
          actionType: 'NAVIGATE'
        }));
      }
    } catch (err) {
      // Offline fallback: use local matching gracefully
      console.warn('Backend search unreachable, presenting client-matched results');
    }

    const navigationResults = matchedHelp.filter(h => h.category === 'NAVIGATION');
    const helpResults = matchedHelp.filter(h => h.category === 'HELP');

    return {
      games: matchedGames,
      reminders: backendReminders,
      patients: backendPatients,
      navigation: navigationResults,
      help: helpResults,
      totalCount: matchedGames.length + backendReminders.length + backendPatients.length + matchedHelp.length
    };
  }
};
