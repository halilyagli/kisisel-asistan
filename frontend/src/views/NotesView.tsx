import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Search, Tag, Pin, Trash2 } from 'lucide-react';
import { ApiClient } from '../services/api';

interface NotesViewProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ isModalOpen, setIsModalOpen }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const [notesData, tagsData] = await Promise.all([
        ApiClient.notes.getNotes(),
        ApiClient.notes.getTags(),
      ]);
      setNotes(notesData);
      setTags(tagsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.notes.createNote({
        title,
        content,
        tags: tagInput,
        isPinned,
      });
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setTagInput('');
      setIsPinned(false);
      await loadNotes();
    } catch (err: any) {
      alert(err.message || 'Not kaydedilemedi');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Notu silmek istediğinize emin misiniz?')) return;
    try {
      await ApiClient.notes.deleteNote(id);
      await loadNotes();
    } catch (err: any) {
      alert(err.message || 'Silinemedi');
    }
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Not Defteri & Fikirler</h1>
          <p className="text-xs text-slate-400">
            Etiketlenebilir, aranabilir ve diğer modüllere referans verebilen hafif not panosu
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Not Ekle</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedTag === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tüm Notlar
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                selectedTag === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Tag className="h-3 w-3" />
              <span>#{t}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Notlarda ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
            Aramanıza uygun not bulunamadı.
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`p-5 rounded-2xl bg-slate-900 border transition flex flex-col justify-between ${
                note.isPinned 
                  ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white leading-snug">{note.title}</h3>
                  {note.isPinned && (
                    <Pin className="h-3.5 w-3.5 text-indigo-400 shrink-0 fill-indigo-400/20" />
                  )}
                </div>

                <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed mb-4">
                  {note.content}
                </p>
              </div>

              <div>
                {note.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {note.tags.split(',').map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-500">
                  <span>{new Date(note.updatedAt).toLocaleDateString('tr-TR')}</span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="hover:text-rose-400 p-1 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Not Oluştur</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Not Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Başlık..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">İçerik</label>
                <textarea
                  rows={4}
                  placeholder="Not içeriğinizi buraya yazın..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Etiketler (Virgülle ayırın)</label>
                <input
                  type="text"
                  placeholder="pazarlama, onemli, fikir"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300 font-medium">Bu notu en üste sabitle (Pin)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
