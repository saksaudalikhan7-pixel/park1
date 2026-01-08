'use client';

import React, { useState, useEffect } from 'react';
import { updateAttractionVideo } from '@/app/actions/attraction-video';
import { getMediaUrl } from '@/lib/media-utils';
import { toast } from 'sonner';
import { Loader2, Save, Upload, Video, X, Link as LinkIcon } from 'lucide-react';

interface AttractionVideoManagerProps {
    initialData: any;
}

export function AttractionVideoManager({ initialData }: AttractionVideoManagerProps) {
    const [data, setData] = useState({
        title: '',
        video: '', // This will hold the YouTube/Vimeo URL
        thumbnail: '', // Thumbnail URL/Path
        is_active: true,
        ...initialData
    });
    const [loading, setLoading] = useState(false);
    const [thumbnailUploading, setThumbnailUploading] = useState(false);

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

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB for images
        if (file.size > MAX_SIZE) {
            toast.error(`Image too large. Max size: 10MB.`);
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type. Please upload an image.');
            return;
        }

        setThumbnailUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/cms/video-upload', { // We can reuse the same endpoint if it handles images broadly or specific logic
                method: 'POST',
                body: formData,
            });

            const result = await res.json();

            if (res.ok && result.success && result.url) {
                handleChange('thumbnail', result.url);
                toast.success('Thumbnail uploaded successfully!');
            } else {
                toast.error(result.error || 'Upload failed');
            }
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setThumbnailUploading(false);
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
                video_url: data.video, // Send as video_url for backend to process
                thumbnail_url: data.thumbnail
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
    const thumbnailUrl = getMediaUrl(data.thumbnail);

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
                    disabled={loading || thumbnailUploading}
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

                {/* YouTube URL Input */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Video URL</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="url"
                                value={data.video || ''}
                                onChange={(e) => handleChange('video', e.target.value)}
                                placeholder="https://youtube.com/shorts/TKflY2nTraQ"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">
                        Paste a YouTube, Vimeo, or other video URL
                    </p>

                    {videoUrl && (
                        <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video mt-4">
                            {/* YouTube embed preview */}
                            {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                                <iframe
                                    src={getYouTubeEmbedUrl(videoUrl)}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <video
                                    src={videoUrl}
                                    controls
                                    poster={thumbnailUrl || undefined}
                                    className="w-full h-full object-contain"
                                />
                            )}
                            <button
                                onClick={() => handleChange('video', '')}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                title="Remove video"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Thumbnail Upload Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Thumbnail Image (Poster)</label>

                    {thumbnailUrl ? (
                        <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video border border-slate-200 w-64">
                            <img
                                src={thumbnailUrl}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => handleChange('thumbnail', '')}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                                title="Remove thumbnail"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="w-64 aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <Upload className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-xs">No thumbnail</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                        <div className="relative w-64">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailUpload}
                                disabled={thumbnailUploading}
                                id="thumbnail-upload-input"
                                className="hidden"
                            />
                            <label
                                htmlFor="thumbnail-upload-input"
                                className={`flex items-center justify-center gap-2 w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer ${thumbnailUploading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <Upload className="w-4 h-4" />
                                {thumbnailUploading ? 'Uploading...' : (thumbnailUrl ? 'Replace Image' : 'Upload Image')}
                            </label>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">
                        Recommended: 1080x1920 (Vertical) or 1920x1080 (Horizontal) • Max 10MB
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper function to convert YouTube URLs to embed URLs
function getYouTubeEmbedUrl(url: string): string {
    // Handle youtube.com/watch?v=VIDEO_ID
    if (url.includes('youtube.com/watch')) {
        const videoId = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtu.be/VIDEO_ID
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtube.com/shorts/VIDEO_ID
    if (url.includes('youtube.com/shorts/')) {
        const videoId = url.split('/shorts/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Return original URL if not recognized
    return url;
}
