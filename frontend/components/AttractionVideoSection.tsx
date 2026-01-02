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

    if (loading || !videoData || !videoData.video) {
        return null;
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
