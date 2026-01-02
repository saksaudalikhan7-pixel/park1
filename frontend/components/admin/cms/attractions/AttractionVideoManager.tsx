'use client';

import React, { useState, useEffect } from 'react';
import { updateAttractionVideo } from '@/app/actions/attraction-video';
import { getMediaUrl } from '@/lib/media-utils';
import { toast } from 'sonner';
import { Loader2, Save, Upload, Video, X } from 'lucide-react';

interface AttractionVideoManagerProps {
    initialData: any;
}

export function AttractionVideoManager({ initialData }: AttractionVideoManagerProps) {
    const [data, setData] = useState({
        title: '',
        video: '', // This will hold the URL/Path
        is_active: true,
        ...initialData
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Update state if initialData changes (e.g. after revalidation)
    useEffect(() => {
        if (initialData) {
            setData((prev: any) => ({
                ...prev,
                ...initialData
            }));
        }
    }, [initialData]);

    const handleChange = (name: string, value: any) => {
        setData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const MAX_SIZE = 500 * 1024 * 1024; // 500MB (matching server limit)
        if (file.size > MAX_SIZE) {
            toast.error(`File too large. Max size: 500MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            return;
        }

        if (!file.type.startsWith('video/')) {
            toast.error('Invalid file type. Please upload a video file (MP4, WebM).');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        // Simulated progress
        const interval = setInterval(() => {
            setUploadProgress(p => (p < 90 ? p + 5 : p));
        }, 300);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use streaming route handler
            const res = await fetch('/api/cms/video-upload', {
                method: 'POST',
                body: formData,
            });

            const result = await res.json();

            clearInterval(interval);
            setUploadProgress(100);

            if (res.ok && result.success && result.url) {
                // Update state with the new URL
                handleChange('video', result.url);
                toast.success('Video uploaded successfully! Click Save to apply.');
            } else {
                const errorMsg = result.error || 'Upload failed';
                toast.error(errorMsg);
                console.error('Upload Error:', errorMsg);
            }
        } catch (error: any) {
            clearInterval(interval);
            toast.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Prepare payload
            const payload = {
                title: data.title,
                is_active: data.is_active,
                video_url: data.video // Send as video_url for backend to process
            };

            const result = await updateAttractionVideo(payload);

            if (result.success) {
                toast.success('Video section updated');
                if (result.item) {
                    // Update local state with returned normalized data
                    setData(result.item);
                }
            } else {
                toast.error(result.error || 'Failed to update');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const videoUrl = getMediaUrl(data.video);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-slate-900">Attraction Video</h2>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${data.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                            {data.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">Manage the featured video on the Attractions page</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading || uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Active Toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="video-active"
                        checked={data.is_active}
                        onChange={(e) => handleChange('is_active', e.target.checked)}
                        className="rounded border-gray-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                    />
                    <label htmlFor="video-active" className="text-sm font-medium text-slate-700 select-none cursor-pointer">
                        Enable Video Section
                    </label>
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Section Title (Optional)</label>
                    <input
                        type="text"
                        value={data.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="e.g. Experience the Thrill"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900"
                    />
                </div>

                {/* Video Upload Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Video File</label>

                    {videoUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video">
                            <video
                                src={videoUrl}
                                controls
                                className="w-full h-full object-contain"
                            />
                            <button
                                onClick={() => handleChange('video', '')}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                title="Remove video"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <Video className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-sm">No video selected</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative flex-1">
                            <input
                                type="file"
                                accept="video/mp4,video/webm"
                                onChange={handleUpload}
                                disabled={uploading}
                                id="video-upload-input"
                                className="hidden"
                            />
                            <label
                                htmlFor="video-upload-input"
                                className={`flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? `Uploading... ${uploadProgress}%` : (videoUrl ? 'Replace Video' : 'Upload Video')}
                            </label>

                            {uploading && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-lg overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            Max 500MB • MP4/WebM
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
