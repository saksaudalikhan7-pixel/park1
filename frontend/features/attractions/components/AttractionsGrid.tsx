"use client";

import { useState } from "react";
import { AttractionCard, ScrollReveal, BouncyButton } from "@repo/ui";
import { motion } from "framer-motion";
import { staggerContainer } from "@repo/animations";
import { getMediaUrl } from "@/lib/media-utils";

interface Activity {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    active: boolean;
    order: number;
}

interface AttractionsGridProps {
    activities: Activity[];
}

export const AttractionsGrid = ({ activities }: AttractionsGridProps) => {
    const [showAll, setShowAll] = useState(false);

    // Show only 6 initially, or all if showAll is true
    const displayedActivities = showAll ? activities : activities.slice(0, 6);
    const hasMore = activities.length > 6;

    return (
        <div className="py-20 px-4 md:px-8 bg-background">
            {/* Grid */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
                {displayedActivities.length > 0 ? (
                    displayedActivities.map((activity, index) => (
                        <ScrollReveal
                            key={activity.id}
                            animation="slideUp"
                            delay={index * 0.1}
                        >
                            <AttractionCard
                                title={activity.name}
                                description={activity.description}
                                image={getMediaUrl(activity.imageUrl)}
                                category="attraction"
                                intensity="medium"
                            />
                        </ScrollReveal>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20">
                        <p className="text-white/60 text-xl">No attractions available yet.</p>
                    </div>
                )}
            </motion.div>

            {/* Show All / Show Less Button */}
            {hasMore && (
                <div className="flex justify-center mt-12">
                    <BouncyButton
                        onClick={() => setShowAll(!showAll)}
                        className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary via-secondary to-accent text-black font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-primary/50 transition-all"
                    >
                        {showAll ? 'Show Less' : `Show All ${activities.length} Attractions`}
                        <svg
                            className={`w-5 h-5 transition-transform ${showAll ? 'rotate-180' : 'group-hover:translate-y-1'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </BouncyButton>
                </div>
            )}
        </div>
    );
};
