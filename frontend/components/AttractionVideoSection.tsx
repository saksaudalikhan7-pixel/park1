'use client';

import { ScrollReveal } from "@repo/ui";
// Removed: import { useEffect, useState } from 'react';

interface VideoData {
    title: string | null;
    video: string;
}

interface AttractionVideoSectionProps {
    videoData?: VideoData | null;
}

export default function AttractionVideoSection({ videoData }: AttractionVideoSectionProps) {
    // If no video, show placeholder with Dark Theme styling
    if (!videoData || !videoData.video) {
        return (
            <section className="w-full py-12 relative z-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto h-[400px] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center text-white/40 bg-white/5 backdrop-blur-sm">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-xl font-bold mb-2 text-white/80">Attraction Video Space</h3>
                        <p>Upload a video via the Admin Portal to activate this section.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-16 md:py-24 relative z-10">
            <div className="container mx-auto px-4">
                {videoData.title && (
                    <div className="text-center mb-10">
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
                    <div className="max-w-6xl mx-auto">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/10 bg-surface-900/50 backdrop-blur-sm">
                            {/* Decorative gradients */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/0 via-black/0 to-black/40 pointer-events-none z-10" />

                            <video
                                controls
                                preload="metadata"
                                className="w-full h-auto max-h-[75vh] mx-auto object-contain bg-black/40"
                                src={videoData.video}
                                poster={videoData.video + '#t=0.5'} // Try to use first frame as poster
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
}
