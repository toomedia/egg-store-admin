"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { supabase } from "../../../utils/supabaseClient";
import {
  ArrowLeft, PlusCircle, Image as ImageIcon, Calendar,
  Edit, Trash2, X, CheckCircle, XCircle, Clock,
  Loader2, Sparkles, RefreshCw,
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
  /** `all` = page-wide scan; preset id = single preset backfill */
  const [backfillBusy, setBackfillBusy] = useState<'all' | string | null>(null);
  const [backfillResult, setBackfillResult] = useState<{ success: boolean; message: string } | null>(null);
  const [backfillRowFeedback, setBackfillRowFeedback] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ titleEn: '', descEn: '', size: { value: '', price: 0 }, price: '', images: [] });

  const sizes = [{ value: 24, price: 0.99 }];


  const handleRegenerate = async (presetId: string, presetName: string) => {
    const apiUrl = "https://all-about-eggs-git-feature-preset-minting-toomedias-projects.vercel.app";
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
    if (!apiUrl || !adminKey) { alert('Regeneration API not configured.'); return; }
    if (!confirm(`Regenerate a new version of "${presetName}"? This uses OpenAI credits and creates a new preset for review.`)) return;
    setRegeneratingId(presetId);
    try {
      const res = await fetch(`${apiUrl}/api/regenerate-preset`, {
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
   * Calls `POST /api/backfill-preset-prompts` on the auto-generate service.
   * - No args: body `{}` — server scans all presets missing prompts (bulk).
   * - `{ presetId }`: body `{ presetId }` — server should only process that preset.
   */
  const handleBackfill = async (opts?: { presetId?: string; presetName?: string }) => {
    const presetId = opts?.presetId;
    const label = opts?.presetName?.trim() || 'this preset';
    const env = (globalThis as any).process?.env ?? {};
    const apiUrl = process.env.NEXT_PUBLIC_AUTO_GENERATE_API_URL;
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

    if (!apiUrl || !adminKey) {
      const msg = 'API not configured.';
      if (presetId) setBackfillRowFeedback({ id: presetId, success: false, message: msg });
      else setBackfillResult({ success: false, message: msg });
      return;
    }
    if (!presetId) {
      if (!confirm('This will scan existing presets missing prompts and use GPT-4o Vision to reverse-engineer them. Uses OpenAI credits. Continue?')) return;
    } else {
      if (!confirm(`Backfill vision prompts for “${label}”? Uses OpenAI credits.`)) return;
    }
    if (presetId) setBackfillResult(null);
    else setBackfillRowFeedback(null);
    setBackfillBusy(presetId ?? 'all');
    try {
      const res = await fetch(`${apiUrl}/api/backfill-preset-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(presetId ? { presetId } : {}),
      });
      const data = await res.json();
      const errMsg = data.error || 'Backfill failed.';
      if (!res.ok || !data.success) {
        if (presetId) setBackfillRowFeedback({ id: presetId, success: false, message: errMsg });
        else setBackfillResult({ success: false, message: errMsg });
        return;
      }
      if (data.processed === 0) {
        if (presetId) {
          setBackfillRowFeedback({
            id: presetId,
            success: true,
            message: 'Already has prompts saved — nothing to backfill.',
          });
        } else {
          setBackfillResult({
            success: true,
            message: 'All presets already have prompts saved. Nothing to backfill.',
          });
        }
        return;
      }
      if (presetId) {
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
      } else {
        setBackfillResult({
          success: true,
          message: `Done. ${data.succeeded}/${data.processed} presets updated.${data.failed > 0 ? ` ${data.failed} failed.` : ''}`,
        });
      }
    } catch (e: any) {
      const msg = e.message ?? 'Request failed';
      if (presetId) setBackfillRowFeedback({ id: presetId, success: false, message: msg });
      else setBackfillResult({ success: false, message: msg });
    } finally {
      setBackfillBusy(null);
    }
  };

  const handleAutoGenerate = async () => {
    const env = (globalThis as any).process?.env ?? {};
    const apiUrl = env.NEXT_PUBLIC_AUTO_GENERATE_API_URL;
    const adminKey = env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

    if (!apiUrl || !adminKey) { setGenResult({ success: false, message: 'API not configured.' }); return; }
    setAutoGenerating(true); setGenResult(null);
    try {
      const res = await fetch(`${apiUrl}/api/auto-generate-preset`, {
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
    setFilteredPreset(searchQuery ? preset.filter(p => p.preset_name?.en_name?.toLowerCase().includes(searchQuery.toLowerCase())) : preset);
  }, [preset, searchQuery]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from('presets').select('*').or('preset_status.eq.approved,preset_status.is.null').order('created_at', { ascending: false });
      if (!error) { setPreset(data || []); try { await setItem(ALL_PRESETS_KEY, data || []); } catch {} }
    };
    fetch();
    const ch = supabase.channel('public:presets').on('postgres_changes', { event: '*', schema: 'public', table: 'presets' }, async () => {
      const { data } = await supabase.from('presets').select('*').or('preset_status.eq.approved,preset_status.is.null').order('created_at', { ascending: false });
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
  const live = preset.filter(p => p.preset_status === 'approved').length;
  const pending = preset.filter(p => p.preset_status === 'pending_approval').length;

  return (
    <div className="pp">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dashboard</p>
            <h1 className="serif text-5xl leading-none text-gray-900">Presets</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowGenModal(true); setGenResult(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e1e1e] text-[#555] hover:text-[#e6d281] hover:border-[#e6d281]/20 transition-all text-sm">
              <Sparkles size={14} /> Generate
            </button>
            <button
              type="button"
              onClick={() => handleBackfill()}
              disabled={backfillBusy !== null}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e1e1e] text-[#555] hover:text-purple-400 hover:border-purple-400/20 transition-all text-sm disabled:opacity-30"
              title="Scan presets missing prompts and reverse-engineer them via GPT-4o Vision"
            >
              {backfillBusy === 'all' ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {backfillBusy === 'all' ? 'Backfilling…' : 'Backfill Prompts'}
            </button>
            <button onClick={() => setCurrentView('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-medium text-sm hover:bg-[#f0dc8a] transition-all">
              <PlusCircle size={14} /> New Preset
            </button>
          </div>
          {backfillResult && (
              <p className={`text-xs ${backfillResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {backfillResult.message}
              </p>
            )}
        </div>

        {/* Stats */}
        <div className="flex gap-8 mb-8 pb-8 border-b border-gray-200">
          {[{ label: 'Total', value: preset.length }, { label: 'Live', value: live }, { label: 'Pending', value: pending }].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-light  ">{s.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
          {searchQuery && <div className="ml-auto flex items-center"><p className="text-sm text-gray-600">{filteredPreset.length} result{filteredPreset.length !== 1 ? 's' : ''} for <span className="text-[#e6d281]">"{searchQuery}"</span></p></div>}
        </div>

        {/* List */}
        {filteredPreset.length > 0 ? (
          <div className="space-y-2">
            {filteredPreset.map((item, idx) => (
              <div key={item.id} className="card fu p-4 flex items-center gap-5" style={{ animationDelay: `${idx * 30}ms` }}>
                {/* Image strip */}
                <div className="flex gap-1.5 shrink-0">
                  {(item.preset_images || []).slice(0, 12).map((url, i) => (
                    <div key={i} className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100">
                      <SafeImage src={url} alt="" className="w-full h-full" />
                    </div>
                  ))}
                  {(item.preset_images?.length || 0) > 12 && (
                    <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-[10px] text-gray-600">+{item.preset_images.length - 5}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-sm   font-medium truncate">{item.preset_name?.en_name || 'Untitled'}</h2>
                    <StatusBadge status={item.preset_status || ''} />
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><ImageIcon size={10} />{item.preset_images?.length || 0}</span>
                    <span className="text-[#e6d281]">€{item.preset_price || '0.00'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex gap-1">
                    {item.owned_by && (
                      <button
                        type="button"
                        onClick={() => handleRegenerate(item.id, item.preset_name?.en_name || 'Untitled')}
                        disabled={regeneratingId === item.id}
                        title="Sold out — regenerate a new version"
                        className="p-2 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-500/5 transition-all disabled:opacity-30"
                      >
                        {regeneratingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Regenerate new version
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleBackfill({ presetId: item.id, presetName: item.preset_name?.en_name || undefined })}
                      disabled={backfillBusy !== null}
                      title="Backfill vision prompts for this preset only"
                      className="p-2 rounded-lg text-gray-500 hover:text-purple-500 hover:bg-purple-500/5 transition-all disabled:opacity-30"
                    >
                      {backfillBusy === item.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Backfill Prompts
                    </button>
                    <button type="button" onClick={() => handleEdit(item.id)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all">
                      <Edit size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-30">
                      {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                  {backfillRowFeedback?.id === item.id && (
                    <p className={`max-w-[14rem] text-right text-[11px] leading-snug ${backfillRowFeedback.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {backfillRowFeedback.message}
                    </p>
                  )}
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

