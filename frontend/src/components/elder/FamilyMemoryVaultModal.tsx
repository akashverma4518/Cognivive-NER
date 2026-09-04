import React, { useState, useEffect } from 'react';
import { HeartHandshake, X, Plus, Sparkles, MapPin, Calendar, Trash2 } from 'lucide-react';
import api from '../../services/api';

interface FamilyMemoryItem {
  id: string;
  member_name: string;
  relationship: string;
  photo_url?: string;
  important_place?: string;
  important_event?: string;
  memory_text: string;
}

interface FamilyMemoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  targetPatientId?: string;
}

export const FamilyMemoryVaultModal: React.FC<FamilyMemoryVaultModalProps> = ({
  isOpen,
  onClose,
  canEdit = false,
  targetPatientId
}) => {
  const [memories, setMemories] = useState<FamilyMemoryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [place, setPlace] = useState('');
  const [event, setEvent] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, targetPatientId]);

  const loadMemories = async () => {
    try {
      const url = targetPatientId ? `/care/family-memories?patientId=${targetPatientId}` : '/care/family-memories';
      const res = await api.get(url);
      if (res.data.success) {
        setMemories(res.data.memories);
      }
    } catch (e) {
      console.warn('Could not load family memories:', e);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/care/family-memories', {
        patientId: targetPatientId,
        memberName: name.trim(),
        relationship: relationship.trim(),
        importantPlace: place.trim() || undefined,
        importantEvent: event.trim() || undefined,
        memoryText: text.trim()
      });

      if (res.data.success) {
        setName('');
        setRelationship('');
        setPlace('');
        setEvent('');
        setText('');
        setShowAddForm(false);
        loadMemories();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm('Remove this family memory item?')) return;
    try {
      await api.delete(`/care/family-memories/${id}`);
      setMemories(memories.filter(m => m.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border-2 border-purple-200 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Family Memory Vault"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-700 via-[#6C3EDC] to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">Family Memory Vault</h2>
              <p className="text-xs text-purple-200">Personalized Memory Assistance & Family Connections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {memories.length} Beloved Family Members & Memories
            </p>
            {canEdit && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-xl bg-[#6C3EDC] text-white text-xs font-bold flex items-center gap-1 hover:bg-purple-700 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Memory</span>
              </button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAddMemory} className="p-4 bg-purple-50/70 border-2 border-purple-200 rounded-2xl space-y-3">
              <h3 className="text-sm font-black text-purple-900">Add New Family Memory</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Family Member Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Relationship (e.g., Daughter) *"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Important Place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  placeholder="Important Event / Festival"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <textarea
                required
                rows={2}
                placeholder="Cherished memory story or favorite moments..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-sm"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#6C3EDC] text-white rounded-lg hover:bg-purple-700 shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </form>
          )}

          {/* Cards List */}
          {memories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-medium">
              No family memory items added yet. Click Add Memory to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {memories.map((m) => (
                <div 
                  key={m.id}
                  className="p-4 rounded-2xl bg-white border-2 border-purple-100 hover:border-purple-300 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#DDD6FE] text-purple-700 flex items-center justify-center text-xl font-bold">
                          {m.member_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-tight">{m.member_name}</h4>
                          <span className="text-xs font-bold text-[#6C3EDC]">{m.relationship}</span>
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Delete memory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 font-medium mt-3 leading-relaxed bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/60">
                      "{m.memory_text}"
                    </p>
                  </div>

                  {(m.important_place || m.important_event) && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-500 font-semibold">
                      {m.important_place && (
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-purple-600" /> {m.important_place}
                        </span>
                      )}
                      {m.important_event && (
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-purple-600" /> {m.important_event}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
