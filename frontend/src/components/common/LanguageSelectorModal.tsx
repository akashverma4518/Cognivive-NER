import React, { useState } from 'react';
import { X, Check, Volume2, Globe, Sparkles, AlertCircle } from 'lucide-react';
import { 
  ALL_LANGUAGES, 
  LanguageDefinition, 
  getLanguageById, 
  getSavedLanguageId, 
  saveLanguageId 
} from '../../services/voice/languageRegistry';
import { speechManager } from '../../services/voice/speechProviders';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage?: (lang: LanguageDefinition) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLanguage,
}) => {
  const [selectedId, setSelectedId] = useState<string>(getSavedLanguageId());
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (lang: LanguageDefinition) => {
    setSelectedId(lang.id);
    saveLanguageId(lang.id);
    speechManager.setLanguage(lang.id);
    onSelectLanguage?.(lang);
  };

  const handlePreviewAudio = async (lang: LanguageDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingPreview(true);
    speechManager.setLanguage(lang.id);
    await speechManager.speak(lang.sampleGreeting, () => {
      setIsPlayingPreview(false);
    });
  };

  const getStatusBadge = (status: LanguageDefinition['status']) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Fully Ready
          </span>
        );
      case 'FALLBACK_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Browser / Fallback
          </span>
        );
      case 'COMING_PROVIDER_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3 h-3" />
            External Provider
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Select Language"
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-purple-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-purple-700 via-[#6C3EDC] to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white border border-white/30 shadow-inner">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">Select Language / भाषा चुनें</h2>
              <p className="text-purple-100 text-sm font-medium">
                Multilingual Voice & Display Selection (11 Indian Languages)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white border border-white/20 transition-all active:scale-95"
            aria-label="Close language modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notice Info Banner */}
        <div className="px-6 py-3 bg-purple-50/80 border-b border-purple-100 flex items-center gap-3 text-sm text-purple-900">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
          <span>
            Hindi and Indian English are fully supported with direct voice prompts. Regional languages utilize browser speech synthesis or smart fallback.
          </span>
        </div>

        {/* Language Grid */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_LANGUAGES.map((lang) => {
            const isSelected = selectedId === lang.id;
            return (
              <div
                key={lang.id}
                onClick={() => handleSelect(lang)}
                className={`min-h-[72px] p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 text-left ${
                  isSelected
                    ? 'border-[#6C3EDC] bg-purple-50/90 shadow-md ring-2 ring-[#6C3EDC]/30'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isSelected
                        ? 'bg-[#6C3EDC] text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {lang.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-elder-navy leading-tight">
                        {lang.nativeName}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        ({lang.name})
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {getStatusBadge(lang.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handlePreviewAudio(lang, e)}
                    disabled={isPlayingPreview}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-purple-100 text-purple-700 flex items-center justify-center border border-slate-200 transition-colors"
                    title={`Hear sample greeting in ${lang.name}`}
                    aria-label={`Preview audio in ${lang.name}`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-[#6C3EDC] text-white flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Selected: <span className="font-bold text-purple-700">{getLanguageById(selectedId).name} ({getLanguageById(selectedId).nativeName})</span>
          </p>
          <button
            onClick={onClose}
            className="min-h-touch px-6 py-2.5 rounded-2xl bg-[#6C3EDC] hover:bg-purple-700 text-white font-bold text-base shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
