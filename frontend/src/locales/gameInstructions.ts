import { getSavedLanguageId } from '../services/voice/languageRegistry';

export interface LocalizedGameContent {
  title: string;
  subtitle: string;
  instructions: string;
  voicePrompt: string;
}

export const GAME_INSTRUCTIONS: Record<string, Record<string, LocalizedGameContent>> = {
  // 1. Memory Blossom (Working Memory)
  memory_blossom: {
    EN: {
      title: 'Memory Blossom',
      subtitle: 'Working Memory & Visual Sequencing',
      instructions: 'Watch the flowers bloom in sequence, then tap them in the exact order shown.',
      voicePrompt: 'Watch the flowers bloom and repeat the pattern.',
    },
    HI: {
      title: 'मेमोरी ब्लॉसम (फूलों की याद)',
      subtitle: 'स्मृति और क्रमबद्धता व्यायाम',
      instructions: 'फूलों के खिलने का क्रम ध्यान से देखें और उसी क्रम में उन पर टैप करें।',
      voicePrompt: 'फूलों के खिलने का क्रम देखें और दोहराएं।',
    },
  },

  // 2. Quick Harvest (Processing Speed)
  quick_harvest: {
    EN: {
      title: 'Quick Harvest',
      subtitle: 'Processing Speed & Motor Reaction',
      instructions: 'Tap the ripe golden fruits as soon as they appear before they fall from the tree.',
      voicePrompt: 'Tap the ripe fruits as quickly as you can.',
    },
    HI: {
      title: 'क्विक हार्वेस्ट (फलों की कटाई)',
      subtitle: 'प्रतिक्रिया समय और गति व्यायाम',
      instructions: 'पेड़ से फल गिरते ही पके हुए सुनहरे फलों पर तुरंत टैप करें।',
      voicePrompt: 'पके फलों पर जितनी जल्दी हो सके टैप करें।',
    },
  },

  // 3. Golden Memories (Reminiscence)
  golden_memories: {
    EN: {
      title: 'Golden Memories',
      subtitle: 'Reminiscence & Cultural Recall',
      instructions: 'Reflect on classic Indian cultural memories, heritage questions, and joyful melodies.',
      voicePrompt: 'Answer questions about familiar heritage and traditions.',
    },
    HI: {
      title: 'गोल्डन मेमोरीज़ (सुहरी यादें)',
      subtitle: 'सांस्कृतिक स्मृति और संस्मरण',
      instructions: 'भारतीय संस्कृति, पुराने गीतों और धरोहर से जुड़े सवालों के उत्तर दें।',
      voicePrompt: 'भारतीय परंपरा और पुरानी यादों के सवालों के जवाब दें।',
    },
  },

  // 4. Pattern Path (Attention)
  pattern_path: {
    EN: {
      title: 'Pattern Path',
      subtitle: 'Attention & Visual Sequencing',
      instructions: 'Observe the glowing path across familiar locations and retrace the journey in order.',
      voicePrompt: 'Observe the highlighted path and follow the exact trail.',
    },
    HI: {
      title: 'पैटर्न पाथ (रास्ते की खोज)',
      subtitle: 'एकाग्रता और दृश्य अनुक्रम',
      instructions: 'स्थानों के बीच चमकते हुए रास्ते को देखें और उसी क्रम में यात्रा को दोहराएं।',
      voicePrompt: 'चमकते रास्ते को देखें और उसी क्रम में चलें।',
    },
  },

  // 5. Match Pairs (Working Memory)
  match_pairs: {
    EN: {
      title: 'Match Pairs',
      subtitle: 'Visual Recognition & Working Memory',
      instructions: 'Flip two cards at a time to uncover and match the identical cultural symbols.',
      voicePrompt: 'Find matching pairs of cards.',
    },
    HI: {
      title: 'मैच पेयर्स (जोड़ी मिलाओ)',
      subtitle: 'दृश्य पहचान और स्मृति',
      instructions: 'दो पत्ते पलटें और एक जैसे प्रतीकों के जोड़े खोजें।',
      voicePrompt: 'दो पत्ते पलटकर एक जैसे जोड़े बनाएं।',
    },
  },

  // 6. Sort & Remember (Executive Flexibility)
  sort_remember: {
    EN: {
      title: 'Sort & Remember',
      subtitle: 'Executive Function & Category Flexibility',
      instructions: 'Examine each item and tap the matching basket to categorize it accurately.',
      voicePrompt: 'Sort the item into the correct basket.',
    },
    HI: {
      title: 'सॉर्ट एंड रिमेम्बर (वर्गीकरण खेल)',
      subtitle: 'निर्णय क्षमता और लचीलापन',
      instructions: 'हर वस्तु को देखें और उसे सही टोकरी (फल, फूल या मसाला) में डालें।',
      voicePrompt: 'चीजों को सही टोकरी में रखें।',
    },
  },

  // 7. Sequence Stories (Reminiscence)
  sequence_stories: {
    EN: {
      title: 'Sequence Stories',
      subtitle: 'Chronological Reminiscence & Event Recall',
      instructions: 'Arrange the daily routines and festival memories in order from start to finish.',
      voicePrompt: 'Put the story events into the correct chronological order.',
    },
    HI: {
      title: 'सीक्वेंस स्टोरीज़ (कहानी का क्रम)',
      subtitle: 'घटनाक्रम और जीवन की स्मृतियां',
      instructions: 'दिनचर्या और त्योहारों की घटनाओं को शुरुआत से अंत तक सही क्रम में लगाएं।',
      voicePrompt: 'कहानी की घटनाओं को सही क्रम में व्यवस्थित करें।',
    },
  },
};

/**
 * Retrieve localized instructions for a game with graceful language fallback
 */
export function getGameInstruction(gameId: string, langId?: string): LocalizedGameContent {
  const effectiveLang = (langId || getSavedLanguageId()).toUpperCase();
  const gameMap = GAME_INSTRUCTIONS[gameId];

  if (!gameMap) {
    return {
      title: 'Cognitive Activity',
      subtitle: 'Cognitive Engagement Exercise',
      instructions: 'Complete the activity at a calm, comfortable pace.',
      voicePrompt: 'Begin your activity when you are ready.',
    };
  }

  // 1. Exact language match
  if (gameMap[effectiveLang]) {
    return gameMap[effectiveLang];
  }

  // 2. Hindi fallback for Indian languages with North/Central affinity
  if (['HI', 'MR', 'GU', 'PA', 'BN', 'UR'].includes(effectiveLang) && gameMap['HI']) {
    return gameMap['HI'];
  }

  // 3. English default fallback
  return gameMap['EN'] || Object.values(gameMap)[0];
}
