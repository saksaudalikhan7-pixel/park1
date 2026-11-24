'use client';

import React, { useState } from 'react';
import { createGalleryItem, deleteGalleryItem, updateGalleryItem } from '@/app/actions/gallery';
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Trash2, Upload, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/media-utils';

export const PROMOTIONS_CATEGORY = 'home_promotions';
const MAX_FILE_MB = 10;

interface PromotionsManagerProps {
    items: any[];
}

const byOrder = (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0) || Number(a.id) - Number(b.id);

/**
 * Manages the "Offers & Promotions" slider on the home page.
 * Images are stored as gallery items with category "home_promotions".
 * The slider only appears on the website when at least one image is visible.
 */
export function PromotionsManager({ items: initialItems }: PromotionsManagerProps) {
    const [items, setItems] = useState<any[]>([...initialItems].sort(byOrder));
    const [uploading, setUploading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const visibleCount = items.filter((i) => i.active).length;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        let added = 0;
        let nextOrder = items.reduce((max, i) => Math.max(max, i.order ?? 0), 0) + 1;

        try {
            for (const file of Array.from(files)) {
                if (!file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image`);
                    continue;
                }
                if (file.size > MAX_FILE_MB * 1024 * 1024) {
                    toast.error(`${file.name} is larger than ${MAX_FILE_MB} MB`);
                    continue;
                }

                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/cms/video-upload', { method: 'POST', body: formData });
                const result = await res.json().catch(() => ({}));

                if (!res.ok || !result.success || !result.url) {
                    toast.error(`Upload failed: ${result.error || 'Unknown error'}`);
                    continue;
                }

                const createRes = await createGalleryItem({
                    title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
                    imageUrl: result.url,
                    category: PROMOTIONS_CATEGORY,
                    active: true,
                    order: nextOrder++,
                });

                if (createRes.success && createRes.item) {
                    setItems((prev) => [...prev, createRes.item].sort(byOrder));
                    added++;
                } else {
                    toast.error(`Could not save ${file.name}`);
                }
            }
            if (added > 0) toast.success(`Added ${added} promotion image${added > 1 ? 's' : ''}`);
        } catch (error) {
            console.error('Promotion upload error:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const toggleActive = async (item: any) => {
        setBusyId(String(item.id));
        const result = await updateGalleryItem(String(item.id), { active: !item.active });
        setBusyId(null);
        if (!result.success) return toast.error('Failed to update image');
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, active: !item.active } : i)));
        toast.success(item.active ? 'Hidden from website' : 'Shown on website');
    };

    const saveTitle = async (item: any, title: string) => {
        if ((item.title || '') === title) return;
        const result = await updateGalleryItem(String(item.id), { title });
        if (!result.success) return toast.error('Failed to save description');
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, title } : i)));
        toast.success('Description saved');
    };

    const move = async (index: number, delta: -1 | 1) => {
        const target = index + delta;
        if (target < 0 || target >= items.length) return;
        // Re-number every item so the order is always clean (1, 2, 3...)
        const reordered = [...items];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        const renumbered = reordered.map((item, i) => ({ ...item, order: i + 1 }));
        setItems(renumbered);
        setBusyId('order');
        const changed = renumbered.filter((item, i) => (items.find((o) => o.id === item.id)?.order ?? -1) !== i + 1);
        const results = await Promise.all(
            changed.map((item) => updateGalleryItem(String(item.id), { order: item.order }))
        );
        setBusyId(null);
        if (results.some((r) => !r.success)) toast.error('Some changes to the order were not saved. Please refresh.');
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Delete this promotion image? This cannot be undone.')) return;
        setBusyId(String(item.id));
        const result = await deleteGalleryItem(String(item.id));
        setBusyId(null);
        if (!result.success) return toast.error('Failed to delete image');
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        toast.success('Image deleted');
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-pink-500" /> Offers &amp; Promotions Slider
                    </h2>
                    <p className="text-sm text-slate-500">
                        Shown on the home page right below the hero. Hidden automatically when no image is visible.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Best size: <strong>1920 × 800 px</strong> (12:5 banner). Keep text away from the edges. Max {MAX_FILE_MB} MB.
                    </p>
                </div>

                <div className="relative shrink-0">
                    <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Upload promotion images"
                    />
                    <button
                        type="button"
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload Images'}
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <p className={`text-sm font-medium ${visibleCount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {visibleCount > 0
                        ? `Slider is LIVE on the home page with ${visibleCount} image${visibleCount > 1 ? 's' : ''}.`
                        : 'Slider is hidden on the home page (no visible images).'}
                </p>

                {items.length === 0 && (
                    <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                        No promotion images yet. Upload a banner (e.g. your voucher offer) to show the slider.
                    </div>
                )}

                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className={`flex flex-col md:flex-row gap-4 p-3 rounded-xl border ${item.active ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}
                    >
                        <div className="relative w-full md:w-80 aspect-[12/5] rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <img src={getMediaUrl(item.image_url)} alt={item.title || ''} className={`w-full h-full object-cover ${item.active ? '' : 'opacity-50'}`} />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-black/60 text-white">
                                #{index + 1}
                            </span>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Description (for screen readers &amp; SEO)</label>
                            <input
                                defaultValue={item.title || ''}
                                onBlur={(e) => saveTitle(item, e.target.value.trim())}
                                placeholder="e.g. Buy 2 Get 1 Free — use code BUY2GET1"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className={`text-xs font-bold ${item.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {item.active ? 'Visible on website' : 'Hidden'}
                            </span>
                        </div>

                        <div className="flex md:flex-col gap-2 justify-end">
                            <button type="button" title="Move up" disabled={index === 0 || busyId !== null}
                                onClick={() => move(index, -1)}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <button type="button" title="Move down" disabled={index === items.length - 1 || busyId !== null}
                                onClick={() => move(index, 1)}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                                <ArrowDown className="w-4 h-4" />
                            </button>
                            <button type="button" title={item.active ? 'Hide from website' : 'Show on website'}
                                disabled={busyId !== null} onClick={() => toggleActive(item)}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30">
                                {busyId === String(item.id) ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : item.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button type="button" title="Delete" disabled={busyId !== null} onClick={() => handleDelete(item)}
                                className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-30">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
