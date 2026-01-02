'use client';

import { useEffect, useState } from 'react';

interface VideoData {
    title: string | null;
    video: string;
}

export default function AttractionVideoSection() {
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/cms/attraction-video/')
            .then(res => res.json())
            .then(data => {
                setVideoData(data);
                setLoading(false);
            })
            .catch(() => {
                setVideoData(null);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="w-full h-96 animate-pulse bg-gray-100" />;
    }

    if (!videoData || !videoData.video) {
        return (
            <section className="w-full py-12 bg-slate-50/50">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto h-[400px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-white/50 backdrop-blur">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-xl font-bold mb-2">Attraction Video Space</h3>
                        <p>Upload a video via the Admin Portal to activate this section.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-8">
            <div className="container mx-auto px-4">
                {videoData.title && (
                    <h2 className="text-2xl font-bold mb-4 text-center">
                        {videoData.title}
                    </h2>
                )}
                <div className="max-w-4xl mx-auto">
                    <video
                        controls
                        preload="metadata"
                        className="w-full rounded-lg shadow-lg"
                        src={videoData.video}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </section>
    );
}
