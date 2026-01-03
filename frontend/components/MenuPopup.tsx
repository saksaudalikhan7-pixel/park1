"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Utensils, ChefHat } from "lucide-react";

interface MenuPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MenuPopup({ isOpen, onClose }: MenuPopupProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-surface-800 to-surface-900 rounded-2xl border-2 border-primary/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-primary via-secondary to-accent p-6 rounded-t-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                                        <ChefHat className="w-6 h-6 text-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-display font-black text-black">
                                            Party Food Menu
                                        </h2>
                                        <p className="text-sm text-black/70 font-semibold">
                                            Delicious treats for your celebration
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X className="w-6 h-6 text-black" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Pre Plated Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Utensils className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-display font-bold text-primary">
                                                Pre Plated
                                            </h3>
                                            <p className="text-sm text-white/60">For each participant</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            "Chocolate & Jam Sandwiches",
                                            "Chicken Nuggets",
                                            "Chillie Garlic Potato Shots",
                                            "Hot Potato Chips"
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 bg-surface-800/50 p-4 rounded-xl border border-white/10"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                <span className="text-white/90 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Buffet Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                                            <Utensils className="w-5 h-5 text-secondary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-display font-bold text-secondary">
                                                Served as Buffet
                                            </h3>
                                            <p className="text-sm text-white/60">Unlimited servings</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            "Chicken or Veg Noodles",
                                            "Chicken or Veg Fried Rice"
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 bg-surface-800/50 p-4 rounded-xl border border-white/10"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-secondary" />
                                                <span className="text-white/90 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Snacks Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                            <Utensils className="w-5 h-5 text-accent" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-display font-bold text-accent">
                                                Snacks
                                            </h3>
                                            <p className="text-sm text-white/60">Treats and refreshments</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            "Pop corn tubs X 2",
                                            "Mini slush 1 per participant",
                                            "Unlimited squash drink"
                                        ].map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 bg-surface-800/50 p-4 rounded-xl border border-white/10"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-accent" />
                                                <span className="text-white/90 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                    <p className="text-sm text-white/70 text-center">
                                        <span className="font-bold text-primary">Note:</span> Menu items may vary based on availability.
                                        Please inform us of any dietary restrictions or allergies in advance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
