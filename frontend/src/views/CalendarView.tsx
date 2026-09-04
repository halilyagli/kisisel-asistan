import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CreditCard, 
  Clock, 
  Trash2, 
  Bell, 
  CheckCircle2 
} from 'lucide-react';
import { ApiClient } from '../services/api';

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(60);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.calendar.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.calendar.createEvent({
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        reminderMinutes: Number(reminderMinutes),
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setStartTime('');
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Etkinlik oluşturulamadı');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    try {
      await ApiClient.calendar.deleteEvent(id);
      await loadEvents();
    } catch (err: any) {
      alert(err.message || 'Silinemedi');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Takvim & Anımsatıcılar</h1>
          <p className="text-xs text-slate-400">
            Finansal taksit vadeleri ile senkronize çalışan akıllı ajanda
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Etkinlik / Hatırlatıcı Ekle</span>
        </button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs">
            Ajandanızda henüz kayıtlı bir etkinlik veya vade bulunmuyor.
          </div>
        ) : (
          events.map((evt) => {
            const isFinance = evt.sourceModule === 'FINANCE';
            const dateObj = new Date(evt.startTime);
            const dateStr = dateObj.toLocaleDateString('tr-TR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={evt.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isFinance ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {isFinance ? <CreditCard className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-white">{evt.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isFinance 
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                      }`}>
                        {isFinance ? 'Finans Senkronu' : 'Kişisel Ajanda'}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{dateStr} {evt.isAllDay ? '(Tüm Gün)' : timeStr}</span>
                      </div>
                      {evt.reminderMinutes && (
                        <div className="flex items-center gap-1.5 text-amber-400/80">
                          <Bell className="h-3.5 w-3.5" />
                          <span>{evt.reminderMinutes / 60} saat önce bildirim</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  title="Sil"
                  className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Yeni Etkinlik / Hatırlatıcı</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Proje Teslim Toplantısı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Detaylar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tarih & Saat</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hatırlatıcı (Öncesi)</label>
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="15">15 dakika önce</option>
                    <option value="30">30 dakika önce</option>
                    <option value="60">1 saat önce</option>
                    <option value="1440">1 gün önce</option>
                  </select>
                </div>
              </div>

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
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
