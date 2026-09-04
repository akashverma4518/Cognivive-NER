export type LanguageStatus = 'SUPPORTED' | 'FALLBACK_AVAILABLE' | 'COMING_PROVIDER_REQUIRED';

export interface LanguageDefinition {
  id: string;                    // Short uppercase key e.g. 'EN', 'HI', 'AS'
  code: string;                  // BCP-47 tag e.g. 'en-IN', 'hi-IN', 'as-IN'
  name: string;                  // English name e.g. 'Assamese'
  nativeName: string;            // Native script e.g. 'অসমীয়া'
  status: LanguageStatus;
  providerRequired?: string;     // e.g. 'Bhashini / AI4Bharat'
  fallbackLanguageCode: string;  // e.g. 'hi-IN' or 'en-IN'
  ttsVoiceNames: string[];       // Preferred system TTS voice candidates
  sampleGreeting: string;        // Short elder greeting
}

export const LANGUAGE_REGISTRY: Record<string, LanguageDefinition> = {
  EN: {
    id: 'EN',
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English',
    status: 'SUPPORTED',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['Google UK English Female', 'Microsoft Heera', 'Google US English', 'en-IN'],
    sampleGreeting: 'Hello! How can I help you today?',
  },
  HI: {
    id: 'HI',
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    status: 'SUPPORTED',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google हिन्दी', 'Microsoft Hemant', 'Microsoft Kalpana', 'hi-IN'],
    sampleGreeting: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?',
  },
  AS: {
    id: 'AS',
    code: 'as-IN',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini / AI4Bharat (Assam region speech engine)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['Google অসমীয়া', 'as-IN', 'en-IN'],
    sampleGreeting: 'নমস্কাৰ! মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
  },
  BN: {
    id: 'BN',
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (Tripura & Barak Valley dialects)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google বাংলা', 'Microsoft Bashkar', 'bn-IN'],
    sampleGreeting: 'নমস্কার! আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  },
  BRX: {
    id: 'BRX',
    code: 'brx-IN',
    name: 'Bodo',
    nativeName: 'बर’',
    status: 'COMING_PROVIDER_REQUIRED',
    providerRequired: 'Bhashini / AI4Bharat (Bodoland Speech Pipeline)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['brx-IN', 'hi-IN'],
    sampleGreeting: 'खुलुमबाय! आं नोंखौ माबोरै हेफाजाब होनो हागौ?',
  },
  MNI: {
    id: 'MNI',
    code: 'mni-IN',
    name: 'Meitei / Manipuri',
    nativeName: 'ꯃꯩꯇꯩꯂꯣꯟ',
    status: 'COMING_PROVIDER_REQUIRED',
    providerRequired: 'Bhashini / AI4Bharat (Manipur Speech Pipeline)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['mni-IN', 'en-IN'],
    sampleGreeting: 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯑꯩꯅꯥ ꯅꯍꯥꯛꯄꯨ ꯀꯔꯝꯅꯥ ꯃꯇꯦꯡ ꯄꯥꯡꯒꯅꯤ?',
  },
  KHA: {
    id: 'KHA',
    code: 'kha-IN',
    name: 'Khasi',
    nativeName: 'Ka Ktien Khasi',
    status: 'COMING_PROVIDER_REQUIRED',
    providerRequired: 'Bhashini / AI4Bharat (Meghalaya Speech Pipeline)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['kha-IN', 'en-IN'],
    sampleGreeting: 'Khublei! Kumno nga lah ban iarap ia phi mynta?',
  },
  GRT: {
    id: 'GRT',
    code: 'grt-IN',
    name: 'Garo',
    nativeName: 'A·chik',
    status: 'COMING_PROVIDER_REQUIRED',
    providerRequired: 'Bhashini / AI4Bharat (Garo Hills Speech Pipeline)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['grt-IN', 'en-IN'],
    sampleGreeting: 'Mittam! Anga nang’na maidake dakchaktotgen?',
  },
  LUS: {
    id: 'LUS',
    code: 'lus-IN',
    name: 'Mizo',
    nativeName: 'Mizo ṭawng',
    status: 'COMING_PROVIDER_REQUIRED',
    providerRequired: 'Bhashini / AI4Bharat (Mizoram Speech Pipeline)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['lus-IN', 'en-IN'],
    sampleGreeting: 'Chibai! Vawiinah engtin nge ka puih theih ang che?',
  },
  NE: {
    id: 'NE',
    code: 'ne-NP',
    name: 'Nepali',
    nativeName: 'नेपाली',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (Sikkim dialect model)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google नेपाली', 'ne-NP', 'hi-IN'],
    sampleGreeting: 'नमस्ते! आज म तपाईंलाई कसरी मद्दत गर्न सक्छु?',
  },
  TRP: {
    id: 'TRP',
    code: 'trp-IN',
    name: 'Kokborok',
    nativeName: 'Kokborok',
    status: 'COMING_PROVIDER_REQUIRED',
    providerRequired: 'Bhashini / AI4Bharat (Tripura Speech Pipeline)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['trp-IN', 'en-IN'],
    sampleGreeting: 'Khulumkha! Ang nungno bahai chubachung?',
  },

  // Preserved for Phase 7 backward compatibility (Hidden from visible NER selector)
  TA: {
    id: 'TA',
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['Google தமிழ்', 'Microsoft Valluvar', 'ta-IN'],
    sampleGreeting: 'வணக்கம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  },
  TE: {
    id: 'TE',
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['Google తెలుగు', 'Microsoft Mohan', 'te-IN'],
    sampleGreeting: 'నమస్కారం! ఈరోజు నేను మీకు ఎలా సహాయపడగలను?',
  },
  MR: {
    id: 'MR',
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google मराठी', 'Microsoft Aarohi', 'mr-IN'],
    sampleGreeting: 'नमस्कार! आज मी तुम्हाला कशी मदत करू शकतो?',
  },
  GU: {
    id: 'GU',
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google ગુજરાતી', 'Microsoft Dhwani', 'gu-IN'],
    sampleGreeting: 'નમસ્તે! આજે હું તમને કેવી રીતે મદદ કરી શકું?',
  },
  KN: {
    id: 'KN',
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['Google ಕನ್ನಡ', 'Microsoft Gagan', 'kn-IN'],
    sampleGreeting: 'ನಮಸ್ಕಾರ! ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
  },
  ML: {
    id: 'ML',
    code: 'ml-IN',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'en-IN',
    ttsVoiceNames: ['Google മലയാളം', 'Microsoft Midhun', 'ml-IN'],
    sampleGreeting: 'നമസ്കാരം! ഇന്ന് എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?',
  },
  PA: {
    id: 'PA',
    code: 'pa-IN',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google ਪੰਜਾਬੀ', 'pa-IN'],
    sampleGreeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
  },
  UR: {
    id: 'UR',
    code: 'ur-IN',
    name: 'Urdu',
    nativeName: 'اردو',
    status: 'FALLBACK_AVAILABLE',
    providerRequired: 'Bhashini (recommended for local dialects)',
    fallbackLanguageCode: 'hi-IN',
    ttsVoiceNames: ['Google اردو', 'Microsoft Salman', 'ur-IN'],
    sampleGreeting: 'السلام علیکم! آج میں آپ کی کس طرح مدد کر سکتا ہوں؟',
  }
};

export const ALL_LANGUAGES: LanguageDefinition[] = Object.values(LANGUAGE_REGISTRY);

// 11 NER-Focused Languages for the visible language selector
export const NER_LANGUAGE_IDS = [
  'EN',   // English
  'HI',   // Hindi
  'AS',   // Assamese (Assam)
  'BN',   // Bengali (Tripura, Assam Barak Valley)
  'BRX',  // Bodo (Bodoland, Assam)
  'MNI',  // Meitei / Manipuri (Manipur)
  'KHA',  // Khasi (Meghalaya)
  'GRT',  // Garo (Meghalaya)
  'LUS',  // Mizo (Mizoram)
  'NE',   // Nepali (Sikkim, Assam)
  'TRP'   // Kokborok (Tripura)
];

export const NER_LANGUAGES: LanguageDefinition[] = NER_LANGUAGE_IDS
  .map(id => LANGUAGE_REGISTRY[id])
  .filter(Boolean);

export function getLanguageById(id: string): LanguageDefinition {
  const normalized = (id || 'EN').toUpperCase();
  return LANGUAGE_REGISTRY[normalized] || LANGUAGE_REGISTRY['EN'];
}

export function getLanguageByCode(code: string): LanguageDefinition {
  const match = ALL_LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase() || l.id.toLowerCase() === code.toLowerCase());
  return match || LANGUAGE_REGISTRY['EN'];
}

export function getSavedLanguageId(): string {
  try {
    const saved = localStorage.getItem('cognivive_selected_language');
    if (saved && LANGUAGE_REGISTRY[saved.toUpperCase()]) {
      return saved.toUpperCase();
    }
  } catch {
    // Ignore storage issues
  }
  return 'EN';
}

export function saveLanguageId(id: string): void {
  try {
    localStorage.setItem('cognivive_selected_language', id.toUpperCase());
  } catch {
    // Ignore storage issues
  }
}
