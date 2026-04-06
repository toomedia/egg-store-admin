"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { supabase } from "../../../utils/supabaseClient";
import { getAutoGenerateApiOrigin } from "../../../utils/autoGenerateApi";
import {
  ArrowLeft, PlusCircle, Image as ImageIcon, Calendar,
  Edit, Trash2, X, CheckCircle, XCircle, Clock,
  Loader2, Sparkles, RefreshCw, ChevronLeft, ChevronRight, Upload,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PresetName { en_name: string; de_name: string; }
interface PresetDesc { en_desc: string; de_desc: string; }
interface PresetSize { value: string | number; price: number; }
interface PresetImage {
  fileObject: File | null; previewUrl: string;
  isExisting?: boolean; originalUrl?: string; markedForDeletion?: boolean;
}
interface Preset {
  id: string; preset_name: PresetName; preset_desc: PresetDesc;
  preset_size_json: PresetSize; preset_price: string; preset_images: string[];
  created_at: string; created_by: string;
  preset_status?: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  admin_notes?: string; approved_at?: string;
  owned_by?: string;
  owner?: { name?: string } | null;
  concept?: string;
  egg_prompts?: string[];
}
interface FormData {
  titleEn: string; descEn: string; size: PresetSize; price: string; images: PresetImage[];
}

// ─── IndexedDB ────────────────────────────────────────────────────────────────
const DB_NAME = 'PresetsDB'; const STORE_NAME = 'presets'; const ALL_PRESETS_KEY = 'allPresets';
const openDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const r = indexedDB.open(DB_NAME, 2);
  r.onerror = () => reject(r.error); r.onsuccess = () => resolve(r.result);
  r.onupgradeneeded = (e) => { const db = (e.target as IDBOpenDBRequest).result; if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME); };
});
const setItem = async (key: string, value: any): Promise<void> => {
  const db = await openDB(); const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(value, key);
  return new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
};

// ─── SafeImage ────────────────────────────────────────────────────────────────
const SafeImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [hasError, setHasError] = useState(false); const [loading, setLoading] = useState(true);
  if (hasError) return <div className={`${className} bg-gray-100 flex items-center justify-center`}><ImageIcon className="text-gray-400" size={18} /></div>;
  return (
    <div className={`${className} relative overflow-hidden`}>
      {loading && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      <Image src={src} alt={alt} fill className={`object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={() => { setHasError(true); setLoading(false); }} onLoad={() => setLoading(false)}
        loading="lazy" sizes="80px" />
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    approved: { label: 'Live', icon: <CheckCircle size={9} />, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    pending_approval: { label: 'Pending', icon: <Clock size={9} />, cls: 'bg-amber-50 text-amber-900 border-amber-200' },
    rejected: { label: 'Rejected', icon: <XCircle size={9} />, cls: 'bg-red-50 text-red-800 border-red-200' },
  };
  const c = map[status]; if (!c) return null;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${c.cls}`}>{c.icon}{c.label}</span>;
};

const ImageLightboxModal = ({
  isOpen,
  images,
  initialIndex,
  onClose,
}: {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const safe = Math.max(0, Math.min(initialIndex, Math.max(0, images.length - 1)));
      setIdx(safe);
    }
  }, [isOpen, initialIndex, images]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) {
        e.preventDefault();
        setIdx((i) => (i > 0 ? i - 1 : images.length - 1));
      }
      if (e.key === 'ArrowRight' && images.length > 1) {
        e.preventDefault();
        setIdx((i) => (i < images.length - 1 ? i + 1 : 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, images.length, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const src = images[idx];
  const showNav = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[70] rounded-full p-2.5 text-white/90 hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      {showNav && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i > 0 ? i - 1 : images.length - 1));
            }}
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-[70] rounded-full p-2 sm:p-3 text-white/90 hover:bg-white/10 flex"
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i < images.length - 1 ? i + 1 : 0));
            }}
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-[70] rounded-full p-2 sm:p-3 text-white/90 hover:bg-white/10 flex"
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}
      <div
        className="relative w-full max-w-5xl max-h-[min(85vh,900px)] aspect-[4/3] sm:aspect-auto sm:h-[min(85vh,900px)] sm:min-h-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={src} alt="" fill className="object-contain" sizes="(max-width: 1280px) 100vw, 1024px" priority />
      </div>
      {showNav && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70 tabular-nums">
          {idx + 1} / {images.length}
        </p>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Page = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [preset, setPreset] = useState<Preset[]>([]);
  const [filteredPreset, setFilteredPreset] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ concept: '', name: '' });
  const [genResult, setGenResult] = useState<{ success: boolean; message: string } | null>(null);
  const [backfillBusy, setBackfillBusy] = useState<string | null>(null);
  const [backfillRowFeedback, setBackfillRowFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [imageLightbox, setImageLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [formData, setFormData] = useState<FormData>({ titleEn: '', descEn: '', size: { value: '', price: 0 }, price: '', images: [] });

  const sizes = [{ value: 24, price: 2.99 }];


  const handleRegenerate = async (presetId: string, presetName: string) => {
    const apiOrigin = getAutoGenerateApiOrigin();
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
    if (!apiOrigin || !adminKey) { alert('Regeneration API not configured.'); return; }
    if (!confirm(`Regenerate a new version of "${presetName}"? This uses OpenAI credits and creates a new preset for review.`)) return;
    setRegeneratingId(presetId);
    try {
      const res = await fetch(`${apiOrigin}/api/regenerate-preset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ preset_id: presetId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) alert(data.error || 'Regeneration failed. Make sure this preset has saved prompts (run Backfill first).');
      else alert(`New version "${data.name}" created with ${data.imageCount} eggs. Check Preset Requests for review.`);
    } catch (e: any) { alert(e.message || 'Regeneration failed.'); }
    finally { setRegeneratingId(null); }
  };

  /**
   * Backfill vision prompts for a single preset via GPT-4o Vision.
   */
  const handleBackfill = async (opts: { presetId: string; presetName?: string }) => {
    const { presetId } = opts;
    const label = opts.presetName?.trim() || 'this preset';
    const apiOrigin = getAutoGenerateApiOrigin();
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

    if (!apiOrigin || !adminKey) {
      setBackfillRowFeedback({ id: presetId, success: false, message: 'API not configured.' });
      return;
    }
    if (!confirm(`Backfill vision prompts for “${label}”? Uses OpenAI credits.`)) return;

    setBackfillRowFeedback(null);
    setBackfillBusy(presetId);
    try {
      const res = await fetch(`${apiOrigin}/api/backfill-preset-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      const errMsg = data.error || 'Backfill failed.';
      if (!res.ok || !data.success) {
        setBackfillRowFeedback({ id: presetId, success: false, message: errMsg });
        return;
      }
      if (data.processed === 0) {
        setBackfillRowFeedback({ id: presetId, success: true, message: 'Already has prompts saved.' });
        return;
      }
      const ok = data.succeeded >= 1 || data.processed >= 1;
      setBackfillRowFeedback({
        id: presetId,
        success: ok,
        message: ok
          ? `Prompts updated for “${label}”.`
          : data.failed > 0
            ? `Could not complete (${data.failed} failed).`
            : errMsg,
      });
    } catch (e: any) {
      setBackfillRowFeedback({ id: presetId, success: false, message: e.message ?? 'Request failed' });
    } finally {
      setBackfillBusy(null);
    }
  };

  const handleAutoGenerate = async () => {
    const apiOrigin = getAutoGenerateApiOrigin();
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

    if (!apiOrigin || !adminKey) { setGenResult({ success: false, message: 'API not configured.' }); return; }
    setAutoGenerating(true); setGenResult(null);
    try {
      const res = await fetch(`${apiOrigin}/api/auto-generate-preset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ concept: genForm.concept || undefined, name: genForm.name || undefined, count: 12 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) setGenResult({ success: false, message: data.error || 'Failed' });
      else { setGenResult({ success: true, message: `"${data.name}" created with ${data.imageCount} eggs.` }); setGenForm({ concept: '', name: '' }); }
    } catch (e: any) { setGenResult({ success: false, message: e.message }); }
    finally { setAutoGenerating(false); }
  };

  useEffect(() => {
    const filtered = searchQuery
      ? preset.filter(p => p.preset_name?.en_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      : preset;
    // Sort: sold-out (needs regeneration) first, then by created_at desc
    const sorted = [...filtered].sort((a, b) => {
      const aOwned = a.owned_by ? 1 : 0;
      const bOwned = b.owned_by ? 1 : 0;
      if (aOwned !== bOwned) return bOwned - aOwned; // sold-out first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setFilteredPreset(sorted);
  }, [preset, searchQuery]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('presets').select('*, owner:users!owned_by(name)').or('preset_status.eq.approved,preset_status.is.null').order('created_at', { ascending: false });
      if (!error) { setPreset(data || []); try { await setItem(ALL_PRESETS_KEY, data || []); } catch {} }
    };
    fetch();
    const ch = supabase.channel('public:presets').on('postgres_changes', { event: '*', schema: 'public', table: 'presets' }, async () => {
      const { data } = await supabase.from('presets').select('*, owner:users!owned_by(name)').or('preset_status.eq.approved,preset_status.is.null').order('created_at', { ascending: false });
      setPreset(data || []);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentView]);

  const handleMakeLive = async (e: React.FormEvent) => {
    e.preventDefault();
    const active = formData.images.filter(i => !i.markedForDeletion);
    const req = Math.ceil(parseInt(String(formData.size.value)) / 2);
    if (!active.length) { alert("Upload at least one image."); return; }
    if (active.length !== req) { alert(`Need exactly ${req} images.`); return; }
    setIsLoading(true);
    try {
      const urls: string[] = [];
      for (const img of formData.images) {
        if (img.markedForDeletion) continue;
        if (img.isExisting && img.originalUrl) { urls.push(img.originalUrl); continue; }
        if (img.fileObject) {
          const ext = img.fileObject.name.split('.').pop();
          const path = `presets/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from('presets').upload(path, img.fileObject);
          if (error) { setIsLoading(false); return; }
          const { data: u } = supabase.storage.from('presets').getPublicUrl(path);
          urls.push(u.publicUrl);
        }
      }
      formData.images.forEach(i => { if (i.fileObject) URL.revokeObjectURL(i.previewUrl); });
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        preset_name: { en_name: formData.titleEn, de_name: formData.titleEn },
        preset_desc: { en_desc: formData.descEn, de_desc: formData.descEn },
        preset_size_json: formData.size, preset_price: formData.price, preset_images: urls,
        preset_status: 'approved', approved_at: new Date().toISOString(),
        approved_by: user?.id, created_at: new Date().toISOString(), created_by: user?.id,
      };
      if (editingId) {
        const { data, error } = await supabase.from('presets').update(payload).eq('id', editingId).select('*');
        if (error) { alert(error.message); setIsLoading(false); return; }
        setPreset(p => p.map(i => i.id === editingId ? data[0] : i));
      } else {
        const { data, error } = await supabase.from('presets').insert(payload).select('*');
        if (error) { alert(error.message); setIsLoading(false); return; }
        setPreset(p => [...p, data[0]]);
      }
      setCurrentView('list'); setEditingId(null);
      setFormData({ titleEn: '', descEn: '', size: { value: '', price: 0 }, price: '', images: [] });
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this preset?')) return;
    setDeletingId(id);
    try {
      const p = preset.find(i => i.id === id);
      if (p?.preset_images?.length) await supabase.storage.from('presets').remove(p.preset_images.map(u => `presets/${u.split('/').pop()}`));
      const { error } = await supabase.from('presets').delete().eq('id', id);
      if (!error) setPreset(p => p.filter(i => i.id !== id));
    } finally { setDeletingId(null); }
  };
  const handleEdit = (id: string) => {
    const p = preset.find(i => i.id === id); if (!p) return;
    setFormData({ titleEn: p.preset_name?.en_name || '', descEn: p.preset_desc?.en_desc || '', size: p.preset_size_json || { value: '', price: 0 }, price: p.preset_price || '', images: (p.preset_images || []).map(url => ({ fileObject: null, previewUrl: url, isExisting: true, originalUrl: url, markedForDeletion: false })) });
    setEditingId(id); setCurrentView('create');
  };

  const handleImageRemove = (i: number) => {
    const img = formData.images[i];
    if (img.isExisting) setFormData(p => ({ ...p, images: p.images.map((im, idx) => idx === i ? { ...im, markedForDeletion: true } : im) }));
    else { if (img.fileObject) URL.revokeObjectURL(img.previewUrl); setFormData(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) })); }
  };

  const resetForm = () => { setCurrentView('list'); setEditingId(null); setFormData({ titleEn: '', descEn: '', size: { value: '', price: 0 }, price: '', images: [] }); };

  // ── CREATE VIEW ─────────────────────────────────────────────────────────────
  if (currentView === 'create') {
    const active = formData.images.filter(i => !i.markedForDeletion);
    const req = formData.size.value ? Math.ceil(parseInt(String(formData.size.value)) / 2) : 0;
    const valid = req > 0 && active.length === req;

    return (
      <div className="pp">
        <div className="max-w-xl mx-auto px-6 py-12">
          <button onClick={resetForm} className="flex items-center gap-2 text-gray-600 hover:text-[#e6d281] transition-colors mb-10 text-sm">
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="serif text-4xl text-gray-900 mb-1">{editingId ? 'Edit Preset' : 'New Preset'}</h1>
          <p className="text-sm text-gray-600 mb-10">Complete the fields below and publish when ready.</p>

          <form onSubmit={handleMakeLive} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">Name</label>
              <input required name="titleEn" value={formData.titleEn} onChange={e => setFormData(p => ({ ...p, titleEn: e.target.value }))}
                placeholder="e.g. Tropical Birds" className="ifield" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                Images
                {req > 0 && <span className={`ml-2 normal-case ${active.length === req ? 'text-emerald-400' : 'text-amber-400'}`}>{active.length}/{req}</span>}
              </label>

              <label htmlFor="fup" className={`flex flex-col items-center justify-center h-28 border-dashed border-2 rounded-xl cursor-pointer transition-all ${!formData.size.value ? 'border-gray-200 opacity-30 cursor-not-allowed' : 'border-gray-200 hover:border-[#e6d281]/40'}`}>
                <ImageIcon size={20} className="text-gray-500 mb-1.5" />
                <span className="text-xs text-gray-600">Upload images</span>
                <input id="fup" type="file" className="sr-only" multiple disabled={!formData.size.value}
                  onChange={e => { if (e.target.files) setFormData(p => ({ ...p, images: [...p.images, ...Array.from(e.target.files!).map(f => ({ fileObject: f, previewUrl: URL.createObjectURL(f), isExisting: false, markedForDeletion: false }))] })); }} />
              </label>

              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {formData.images.map((img, i) => (
                    <div key={i} className={`relative group aspect-square rounded-lg overflow-hidden ${img.markedForDeletion ? 'opacity-20' : ''}`}>
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleImageRemove(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} className=" " />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={resetForm} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 transition-all text-sm">Cancel</button>
              <button type="submit" disabled={isLoading || !valid} className="flex-1 py-3 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-semibold text-sm hover:bg-[#f0dc8a] transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {isLoading ? <><Loader2 size={13} className="animate-spin" />Publishing…</> : editingId ? 'Update & Publish' : 'Make Live'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  const live = preset.filter(p => p.preset_status === 'approved' && !p.owned_by).length;
  const pending = preset.filter(p => p.preset_status === 'pending_approval').length;
  const soldOut = preset.filter(p => !!p.owned_by).length;

  return (
    <div className="pp">
      <ImageLightboxModal
        isOpen={imageLightbox !== null}
        images={imageLightbox?.images ?? []}
        initialIndex={imageLightbox?.index ?? 0}
        onClose={() => setImageLightbox(null)}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-12">

        {/* Header */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dashboard</p>
            <h1 className="serif text-5xl leading-none text-gray-900">Presets</h1>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => { setShowGenModal(true); setGenResult(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e1e1e] text-[#555] hover:text-[#e6d281] hover:border-[#e6d281]/20 transition-all text-sm">
              <Sparkles size={14} /> Generate
            </button>

            <button onClick={() => setCurrentView('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-medium text-sm hover:bg-[#f0dc8a] transition-all">
              <PlusCircle size={14} /> New Preset
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-8 pb-8 border-b border-gray-200">
          {[{ label: 'Total', value: preset.length }, { label: 'Live', value: live }, { label: 'Sold Out', value: soldOut }, { label: 'Pending', value: pending }].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-light  ">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
          {searchQuery && <div className="ml-auto flex items-center"><p className="text-sm text-gray-600">{filteredPreset.length} result{filteredPreset.length !== 1 ? 's' : ''} for <span className="text-[#e6d281]">"{searchQuery}"</span></p></div>}
        </div>

        {/* Regeneration alert */}
        {soldOut > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-orange-200 bg-orange-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <RefreshCw size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900">{soldOut} deck{soldOut > 1 ? 's' : ''} sold out — ready to regenerate</p>
              <p className="text-xs text-orange-700 mt-0.5">Sold presets are shown at the top. Click Regenerate to create a new version.</p>
            </div>
          </div>
        )}

        {/* List */}
        {filteredPreset.length > 0 ? (
          <div className="space-y-5 md:space-y-6">
            {filteredPreset.map((item, idx) => (
              <div
                key={item.id}
                className="card fu rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8">
                  {/* Thumbnails — grid + lightbox */}
                  <div className="shrink-0 lg:w-[min(100%,22rem)]">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2.5">Preview</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                      {(item.preset_images || []).slice(0, 12).map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          className="aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-100 cursor-zoom-in hover:ring-2 hover:ring-[#e6d281]/50 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6d281] text-left"
                          onClick={() =>
                            setImageLightbox({
                              images: (item.preset_images || []).slice(0, 12),
                              index: i,
                            })
                          }
                          aria-label={`Open image ${i + 1} in preview`}
                        >
                          <SafeImage src={url} alt="" className="w-full h-full pointer-events-none" />
                        </button>
                      ))}
                    </div>
                    {(item.preset_images?.length || 0) > 12 && (
                      <p className="text-xs text-gray-500 mt-2">+{item.preset_images!.length - 12} more images</p>
                    )}
                  </div>

                  {/* Title, meta, owner — full width middle column */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug break-words">
                        {item.preset_name?.en_name || 'Untitled'}
                      </h2>
                      <StatusBadge status={item.preset_status || ''} />
                      {item.owned_by && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-red-50 text-red-700 border border-red-200">
                          Sold out
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 shrink-0" aria-hidden />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ImageIcon size={16} className="text-gray-400 shrink-0" aria-hidden />
                        {item.preset_images?.length || 0} images
                      </span>
                      <span className="font-medium text-amber-900 tabular-nums">€{item.preset_price || '0.00'}</span>
                    </div>

                    {item.owned_by && (
                      <div className="rounded-xl border border-red-100 bg-red-50/80 px-3 py-2.5 text-sm text-red-900">
                        <span className="font-medium">Owned by</span>{' '}
                        <span className="font-semibold">@{item.owner?.name || 'Unknown'}</span>
                      </div>
                    )}

                    {backfillRowFeedback?.id === item.id && (
                      <p
                        className={`text-sm leading-snug ${backfillRowFeedback.success ? 'text-emerald-700' : 'text-red-700'}`}
                      >
                        {backfillRowFeedback.message}
                      </p>
                    )}
                  </div>

                  {/* Actions — right column on large screens */}
                  <div className="flex flex-col gap-2 shrink-0 w-full sm:flex-row sm:flex-wrap lg:flex-col lg:w-48">
                    {item.owned_by && (
                      <button
                        type="button"
                        onClick={() => handleRegenerate(item.id, item.preset_name?.en_name || 'Untitled')}
                        disabled={regeneratingId === item.id || backfillBusy !== null}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-orange-200 bg-orange-50 text-orange-900 hover:bg-orange-100 transition-colors disabled:opacity-40"
                      >
                        {regeneratingId === item.id ? <Loader2 size={16} className="animate-spin shrink-0" /> : <RefreshCw size={16} className="shrink-0" />}
                        Regenerate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBackfill({ presetId: item.id, presetName: item.preset_name?.en_name || undefined })}
                      disabled={backfillBusy !== null}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 transition-colors disabled:opacity-40"
                    >
                      {backfillBusy === item.id ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Upload size={16} className="shrink-0" />}
                      Backfill
                    </button>
                    <div className="flex gap-2 justify-stretch sm:justify-end lg:justify-stretch pt-1 border-t border-gray-100 lg:border-0 lg:pt-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(item.id)}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-40"
                      >
                        {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 border border-gray-200">
              <ImageIcon size={22} className="text-gray-400" />
            </div>
            <h3 className="  text-base mb-1">{searchQuery ? 'No results' : 'No presets yet'}</h3>
            <p className="text-xs text-gray-500 mb-7">{searchQuery ? `Nothing matches "${searchQuery}"` : 'Create your first preset to get started.'}</p>
            <button onClick={() => setCurrentView('create')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-medium text-sm hover:bg-[#f0dc8a] transition-all">
              <PlusCircle size={14} /> Create Preset
            </button>
          </div>
        )}
      </div>

      {/* Auto-Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/40 blur-back z-50 flex items-center justify-center p-4">
          <div className="fu bg-white border border-gray-200 shadow-xl rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2"><Sparkles size={15} className="text-[#e6d281]" /> Auto-Generate</h2>
                <p className="text-xs text-gray-500 mt-0.5">AI creates 12 egg images from your concept</p>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-gray-500 transition-colors mt-0.5"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Concept</label>
                <input value={genForm.concept} onChange={e => setGenForm(f => ({ ...f, concept: e.target.value }))} placeholder="e.g. precious gemstones" disabled={autoGenerating}
                  className="ifield text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Name <span className="normal-case text-gray-400">— optional</span></label>
                <input value={genForm.name} onChange={e => setGenForm(f => ({ ...f, name: e.target.value }))} placeholder="Leave blank to auto-generate" disabled={autoGenerating}
                  className="ifield text-sm" />
              </div>
              {genResult && (
                <div className={`text-xs rounded-xl px-4 py-3 border ${genResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {genResult.message}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowGenModal(false)} disabled={autoGenerating} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm">
                {genResult?.success ? 'Close' : 'Cancel'}
              </button>
              {!genResult?.success && (
                <button onClick={handleAutoGenerate} disabled={autoGenerating} className="flex-1 py-2.5 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-30 hover:bg-[#f0dc8a] transition-all">
                  {autoGenerating ? <><Loader2 size={13} className="animate-spin" /> Generating…</> : <><Sparkles size={13} /> Generate</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;

