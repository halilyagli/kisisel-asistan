import React, { useState } from 'react';
import { ShieldCheck, Check, Sparkles, Zap, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { user, updateTier } = useAuth();
  const [updating, setUpdating] = useState(false);

  const plans = [
    {
      id: 'FREE',
      name: 'Başlangıç (Free)',
      price: '₺0',
      period: '/ömür boyu',
      description: 'Temel kişisel bütçe ve not takibi için',
      features: [
        'Manuel Gelir & Gider Girişi',
        '2 Adet Hesap Tanımlama',
        'Standart Takvim Görünümü',
        'Sınırlı Not Kaydı (Maksimum 20)',
        'E-posta Desteği',
      ],
      icon: Sparkles,
      color: 'slate',
    },
    {
      id: 'PRO',
      name: 'Profesyonel (Pro)',
      price: '₺199',
      period: '/aylık',
      description: 'Kapsamlı finans yönetimi ve otomatik vadeler',
      features: [
        'Açık Bankacılık Entegrasyonu (Sınırsız)',
        'Gelişmiş Taksitlendirme & Amortisman Motoru',
        'Finans & Takvim Çift Yönlü Otomatik Senkron',
        'Sınırsız Hesap ve Kategori',
        'Sınırsız Not Defteri & Etiketleme',
        'Öncelikli Müşteri Desteği',
      ],
      popular: true,
      icon: Zap,
      color: 'indigo',
    },
    {
      id: 'ENTERPRISE',
      name: 'Kurumsal & Aile',
      price: '₺499',
      period: '/aylık',
      description: 'Yatırımcılar, ekipler ve çoklu portföy yönetimi',
      features: [
        'Tüm Pro Özellikleri',
        'Çoklu Para Birimi (Döviz & Altın Portföyü)',
        'Özel Banka API Webhook Bağlantıları',
        'Gelişmiş AI Finansal Öneri Asistanı',
        'Yedekleme ve Özel Veri İhracı (CSV/Excel)',
        '7/24 Özel Portföy Yöneticisi',
      ],
      icon: Building,
      color: 'sky',
    },
  ];

  const handlePlanChange = async (tier: 'FREE' | 'PRO' | 'ENTERPRISE') => {
    try {
      setUpdating(true);
      await updateTier(tier);
      alert(`Abonelik planınız başarıyla ${tier} olarak güncellendi.`);
    } catch (err: any) {
      alert(err.message || 'Plan güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 space-y-10 max-w-6xl mx-auto">
      {/* Profil Özeti */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xl flex items-center justify-center">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.fullName}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                {user?.subscriptionStatus || 'ACTIVE'}
              </span>
              <span className="text-xs text-slate-500">
                Mevcut Paket: <strong className="text-slate-300">{user?.subscriptionTier}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Yenilenme Tarihi</div>
          <div className="text-sm font-semibold text-slate-200">
            {user?.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toLocaleDateString('tr-TR') : 'Süresiz'}
          </div>
        </div>
      </div>

      {/* Abonelik Planları (SaaS Pricing Cards) */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Abonelik & Fiyatlandırma Modeli</h2>
          <p className="text-xs text-slate-400 mt-1">
            İhtiyacınıza en uygun planı seçebilir, tek tıkla planınızı değiştirebilirsiniz. (SaaS Mock Test Entegrasyonu)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = user?.subscriptionTier === plan.id;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl flex flex-col justify-between relative transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/10'
                    : 'bg-slate-900 border border-slate-800'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    En Çok Tercih Edilen
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-base">{plan.name}</h3>
                    <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 min-h-[32px]">{plan.description}</p>

                  <div className="my-6">
                    <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-xs text-slate-500 ml-1">{plan.period}</span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-800">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold text-center flex items-center justify-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Kullanılan Aktif Plan</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePlanChange(plan.id as any)}
                      disabled={updating}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {updating ? 'İşleniyor...' : 'Bu Plana Geçiş Yap'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
