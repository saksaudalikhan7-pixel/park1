"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getMediaUrl } from "@/lib/media-utils";

export interface PromotionSlide {
    id: string | number;
    src: string;
    title?: string;
}

const AUTOPLAY_MS = 5000;

/**
 * Home page promotions slider (offers, voucher codes...).
 * Images are managed in Admin → Website Content → Home → Promotions.
 * Slides keep a fixed 12:5 banner shape (recommended upload: 1920 × 800 px)
 * so text on promotional artwork is never cropped differently per device.
 */
export default function PromotionsSlider({ slides }: { slides: PromotionSlide[] }) {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [paused, setPaused] = useState(false);
    const reduceMotion = useReducedMotion();
    const count = slides.length;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dragged = useRef(false); // a swipe must not also open the link

    const go = useCallback((next: number, dir: number) => {
        setDirection(dir);
        setIndex(((next % count) + count) % count);
    }, [count]);

    const next = useCallback(() => go(index + 1, 1), [go, index]);
    const prev = useCallback(() => go(index - 1, -1), [go, index]);

    // Autoplay (only with 2+ slides, paused on hover/focus and for reduced motion)
    useEffect(() => {
        if (count < 2 || paused || reduceMotion) return;
        timer.current = setTimeout(next, AUTOPLAY_MS);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [count, paused, reduceMotion, next]);

    // Keep index valid if slides change
    useEffect(() => {
        if (index >= count) setIndex(0);
    }, [count, index]);

    if (count === 0) return null;

    const slide = slides[Math.min(index, count - 1)];
    const offset = reduceMotion ? 0 : 60;

    return (
        <section
            aria-label="Offers and promotions"
            className="relative px-4 pt-10 md:pt-16 pb-4 md:pb-6 bg-background-light"
        >
            <div className="max-w-6xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-4 md:mb-6">
                    <h2 className="text-2xl md:text-4xl font-display font-black">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-accent">
                            Offers &amp; Promotions
                        </span>
                    </h2>
                    <Link
                        href="/book"
                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-black font-bold hover:bg-primary-light transition-colors"
                    >
                        Book Now <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div
                    className="relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-white/10 shadow-2xl bg-background-dark group"
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                    role="region"
                    aria-roledescription="carousel"
                >
                    {/* Fixed banner shape: 12:5 */}
                    <div className="relative w-full aspect-[12/5]">
                        <AnimatePresence initial={false} custom={direction} mode="popLayout">
                            <motion.div
                                key={slide.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * offset }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -direction * offset }}
                                transition={{ duration: reduceMotion ? 0 : 0.45, ease: "easeOut" }}
                                className="absolute inset-0"
                                drag={count > 1 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onPointerDown={() => { dragged.current = false; }}
                                onDragStart={() => { dragged.current = true; }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x < -50) next();
                                    else if (info.offset.x > 50) prev();
                                }}
                            >
                                <Link href="/book" aria-label={`${slide.title || "Promotion"} — book now`} draggable={false}
                                    onClick={(e) => { if (dragged.current) { e.preventDefault(); dragged.current = false; } }}>
                                    <img
                                        src={getMediaUrl(slide.src)}
                                        alt={slide.title || "Ninja Inflatable Park offer"}
                                        className="w-full h-full object-cover select-none"
                                        draggable={false}
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />
                                </Link>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {count > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={prev}
                                aria-label="Previous offer"
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-primary hover:text-black transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <button
                                type="button"
                                onClick={next}
                                aria-label="Next offer"
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-primary hover:text-black transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </>
                    )}
                </div>

                {count > 1 && (
                    <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Choose offer">
                        {slides.map((s, i) => (
                            <button
                                key={s.id}
                                type="button"
                                role="tab"
                                aria-selected={i === index}
                                aria-label={`Show offer ${i + 1} of ${count}`}
                                onClick={() => go(i, i > index ? 1 : -1)}
                                className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
                            />
                        ))}
                    </div>
                )}

                <div className="sm:hidden flex justify-center mt-4">
                    <Link
                        href="/book"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-black font-bold"
                    >
                        Book Now <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
