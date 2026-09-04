import { LanguageDefinition, getLanguageByCode, getLanguageById, getSavedLanguageId } from './languageRegistry';

export interface SpeechListenOptions {
  langCode: string;
  onResult: (transcript: string, confidence: number) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}

export interface ISpeechProvider {
  name: string;
  isAvailable(): boolean;
  startListening(options: SpeechListenOptions): void;
  stopListening(): void;
  speak(text: string, langCode: string, onEnd?: () => void): Promise<void>;
  cancelSpeech(): void;
}

/**
 * Native Browser Web Speech API Provider (SpeechRecognition + SpeechSynthesis)
 */
export class BrowserSpeechProvider implements ISpeechProvider {
  name = 'Browser Web Speech API';
  private recognitionInstance: any = null;

  isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) &&
      ('speechSynthesis' in window)
    );
  }

  startListening(options: SpeechListenOptions): void {
    if (!this.isAvailable()) {
      options.onError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      this.stopListening();
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      this.recognitionInstance = recognition;

      recognition.lang = options.langCode || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        options.onStart?.();
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const item = event.results[0][0];
          const transcript = item.transcript || '';
          // Confidence is a float 0.0 - 1.0; default to 0.85 if not reported
          const confidence = typeof item.confidence === 'number' && item.confidence > 0 ? item.confidence : 0.85;
          options.onResult(transcript, confidence);
        } else {
          options.onError('No speech detected.');
        }
      };

      recognition.onerror = (event: any) => {
        const errorMsg = event.error || 'Speech recognition error';
        if (errorMsg === 'no-speech') {
          options.onError('No speech was detected. Please try again.');
        } else if (errorMsg === 'not-allowed') {
          options.onError('Microphone permission was denied. Please allow microphone access.');
        } else {
          options.onError(`Voice error: ${errorMsg}`);
        }
      };

      recognition.onend = () => {
        this.recognitionInstance = null;
        options.onEnd();
      };

      recognition.start();
    } catch (err: any) {
      options.onError(err.message || 'Failed to start microphone');
      options.onEnd();
    }
  }

  stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // Ignore stop on inactive instance
      }
      this.recognitionInstance = null;
    }
  }

  speak(text: string, langCode: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser.');
        onEnd?.();
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode || 'en-IN';
      utterance.rate = 0.9; // Elder-friendly pacing: slightly slower and clearer
      utterance.pitch = 1.0;

      // Select matching voice
      const voices = window.speechSynthesis.getVoices();
      const langDef = getLanguageByCode(langCode);

      if (voices && voices.length > 0) {
        // 1. Try matching preferred voice names
        let selectedVoice = voices.find(v => 
          langDef.ttsVoiceNames.some(pref => v.name.toLowerCase().includes(pref.toLowerCase()))
        );

        // 2. Try exact lang match
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-') === langCode.toLowerCase().replace('_', '-'));
        }

        // 3. Try language prefix match (e.g. 'hi')
        if (!selectedVoice && langCode.includes('-')) {
          const prefix = langCode.split('-')[0].toLowerCase();
          selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => {
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

/**
 * Bhashini (AI4Bharat) Dedicated Indian Language Provider Stub
 * Configured with graceful fallback to Browser Web Speech when external pipeline credentials are not supplied.
 */
export class BhashiniSpeechProvider implements ISpeechProvider {
  name = 'Bhashini AI4Bharat Gateway';
  private browserFallback = new BrowserSpeechProvider();

  isAvailable(): boolean {
    // In production with credentials, check import.meta.env.VITE_BHASHINI_API_KEY
    const apiKey = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BHASHINI_API_KEY;
    return Boolean(apiKey);
  }

  startListening(options: SpeechListenOptions): void {
    if (!this.isAvailable()) {
      console.info('[BhashiniSpeechProvider] External Bhashini pipeline key not configured. Gracefully routing to Browser Speech provider.');
      this.browserFallback.startListening(options);
      return;
    }
    // External pipeline call placeholder
    this.browserFallback.startListening(options);
  }

  stopListening(): void {
    this.browserFallback.stopListening();
  }

  speak(text: string, langCode: string, onEnd?: () => void): Promise<void> {
    return this.browserFallback.speak(text, langCode, onEnd);
  }

  cancelSpeech(): void {
    this.browserFallback.cancelSpeech();
  }
}

/**
 * Singleton SpeechManager managing active language, confidence scoring, and audio I/O
 */
export class SpeechManager {
  private static instance: SpeechManager;
  private currentLanguageDef: LanguageDefinition;
  private browserProvider = new BrowserSpeechProvider();
  private bhashiniProvider = new BhashiniSpeechProvider();

  private constructor() {
    const savedId = getSavedLanguageId();
    this.currentLanguageDef = getLanguageById(savedId);
  }

  public static getInstance(): SpeechManager {
    if (!SpeechManager.instance) {
      SpeechManager.instance = new SpeechManager();
    }
    return SpeechManager.instance;
  }

  public getLanguage(): LanguageDefinition {
    return this.currentLanguageDef;
  }

  public setLanguage(idOrCode: string): void {
    const lang = getLanguageById(idOrCode) || getLanguageByCode(idOrCode);
    this.currentLanguageDef = lang;
  }

  public getActiveProvider(): ISpeechProvider {
    if (this.currentLanguageDef.status === 'COMING_PROVIDER_REQUIRED' && this.bhashiniProvider.isAvailable()) {
      return this.bhashiniProvider;
    }
    return this.browserProvider;
  }

  public evaluateConfidence(confidence: number): { isConfident: boolean; confidenceScore: number } {
    const threshold = 0.70;
    return {
      isConfident: confidence >= threshold,
      confidenceScore: Math.round(confidence * 100) / 100,
    };
  }

  public speak(text: string, onEnd?: () => void): Promise<void> {
    const provider = this.getActiveProvider();
    return provider.speak(text, this.currentLanguageDef.code, onEnd);
  }

  public cancelSpeech(): void {
    this.getActiveProvider().cancelSpeech();
  }
}

export const speechManager = SpeechManager.getInstance();
