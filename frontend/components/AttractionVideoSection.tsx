'use client';

import React from 'react';

import { ScrollReveal } from "@repo/ui";

interface VideoData {
    title: string | null;
    video: string;
    thumbnail?: string | null;
}

interface AttractionVideoSectionProps {
    videoData?: VideoData | null;
}

export default function AttractionVideoSection({ videoData }: AttractionVideoSectionProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoElement.play().catch((e) => console.warn("Auto-play blocked:", e));
                    } else {
                        videoElement.pause();
                    }
                });
            },
            { threshold: 0.5 } // Play when 50% visible
        );

        observer.observe(videoElement);

        return () => {
            if (videoElement) observer.unobserve(videoElement);
        };
    }, []);

    // If no video, show placeholder with Dark Theme styling
    if (!videoData || !videoData.video) {
        return (
            <section className="w-full py-12 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-sm mx-auto aspect-[9/16] border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center text-white/40 bg-white/5 backdrop-blur-sm">
                        <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-bold mb-2 text-white/80">Vertical Video</h3>
                        <p className="text-sm text-center px-4">Upload a video via the Admin Portal</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-16 md:py-24 relative z-10">
            <div className="container mx-auto px-4">
                {videoData.title && (
                    <div className="text-center mb-12">
                        <ScrollReveal animation="fade">
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-primary font-bold text-xs md:text-sm mb-4 tracking-wider uppercase backdrop-blur-md border border-white/10">
                                Featured Video
                            </span>
                        </ScrollReveal>
                        <ScrollReveal animation="slideUp" delay={0.1}>
                            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-4 uppercase tracking-tight">
                                {videoData.title}
                            </h2>
                        </ScrollReveal>
                        <ScrollReveal animation="slideUp" delay={0.2}>
                            <div className="w-24 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full" />
                        </ScrollReveal>
                    </div>
                )}

                <ScrollReveal animation="scale" delay={0.2}>
                    <div className="flex justify-center w-full">
                        {/* Phone-like container: Vertical aspect ratio, rounded corners, shadow */}
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/20 border-[6px] border-white/10 bg-surface-900/50 backdrop-blur-sm inline-block w-full max-w-sm aspect-[9/16]">

                            {/* Reflection/Glare effect */}
                            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-20" />

                            <video
                                ref={videoRef}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                poster={videoData.thumbnail || undefined}
                                className="absolute inset-0 w-full h-full object-cover bg-black"
                                src={videoData.video}
                            >
                                Your browser does not support the video tag.
                            </video>

                            {/* Optional: Unmute button overlay if needed, currently pure background style */}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
