"use client";

import { ScrollReveal, BouncyButton, SectionDivider } from "@repo/ui";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Users, FileText, Check } from "lucide-react";
import { useState } from "react";

interface GuidelinesContentProps {
    hero?: {
        title: string;
        subtitle: string;
        image: string;
    };
    categories: any[];
    legalDocuments: any[];
}

export default function GuidelinesContent({ hero, categories, legalDocuments }: GuidelinesContentProps) {
    const [activeTab, setActiveTab] = useState("safety");

    // Default hero values
    const heroTitle = hero?.title || "Safety Guidelines";
    const heroSubtitle = hero?.subtitle || "Your safety is our top priority. Please review these important guidelines before your visit.";
    const heroImage = hero?.image || "/images/gallery-2.jpg";

    // Get icon component by name
    const getIcon = (iconName: string) => {
        const icons: any = {
            Shield: <Shield className="w-6 h-6" />,
            AlertTriangle: <AlertTriangle className="w-6 h-6" />,
            Users: <Users className="w-6 h-6" />,
            FileText: <FileText className="w-6 h-6" />,
        };
        return icons[iconName] || <Shield className="w-6 h-6" />;
    };

    // Filter legal documents
    const termsDoc = legalDocuments.find(doc => doc.document_type === 'TERMS' || doc.slug === 'terms-and-conditions');
    const waiverDoc = legalDocuments.find(doc => doc.document_type === 'WAIVER' || doc.slug === 'liability-waiver');
    const privacyDoc = legalDocuments.find(doc => doc.document_type === 'PRIVACY' || doc.slug === 'privacy-policy');

    return (
        <main className="bg-background text-white min-h-screen pt-24">
            {/* Header */}
            <section className="relative py-16 md:py-32 px-4 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt="Safety Guidelines"
                        className="w-full h-full object-cover opacity-30"
                        onError={(e) => {
                            e.currentTarget.src = "/hero-background.jpg";
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
                </div>
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <ScrollReveal animation="slideUp">
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-display font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                                {heroTitle}
                            </span>
                        </h1>
                        <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto">
                            {heroSubtitle}
                        </p>
                    </ScrollReveal>
                </div>
            </section>

            {/* Tabs */}
            <section className="relative px-4 pb-32 md:pb-40 pt-8">
                <div className="max-w-5xl mx-auto">
                    {/* Tab Navigation */}
                    <div className="flex flex-wrap gap-4 mb-16 justify-center relative z-10">
                        <button
                            onClick={() => setActiveTab("safety")}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "safety"
                                ? "bg-primary text-black"
                                : "bg-surface-800/50 text-white/70 hover:bg-surface-800"
                                }`}
                        >
                            <Shield className="w-5 h-5 inline mr-2" />
                            Safety Rules
                        </button>
                        {termsDoc && (
                            <button
                                onClick={() => setActiveTab("terms")}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "terms"
                                    ? "bg-primary text-black"
                                    : "bg-surface-800/50 text-white/70 hover:bg-surface-800"
                                    }`}
                            >
                                <FileText className="w-5 h-5 inline mr-2" />
                                Terms & Conditions
                            </button>
                        )}
                        {waiverDoc && (
                            <button
                                onClick={() => setActiveTab("waiver")}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "waiver"
                                    ? "bg-primary text-black"
                                    : "bg-surface-800/50 text-white/70 hover:bg-surface-800"
                                    }`}
                            >
                                <FileText className="w-5 h-5 inline mr-2" />
                                Waiver
                            </button>
                        )}
                        {privacyDoc && (
                            <button
                                onClick={() => setActiveTab("privacy")}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "privacy"
                                    ? "bg-primary text-black"
                                    : "bg-surface-800/50 text-white/70 hover:bg-surface-800"
                                    }`}
                            >
                                <Shield className="w-5 h-5 inline mr-2" />
                                Privacy Policy
                            </button>
                        )}
                    </div>

                    <div className="pt-12 mt-8 relative z-0">
                        {/* Tab Content */}
                        {activeTab === "safety" && (
                            <ScrollReveal animation="fade">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {categories.map((section, index) => (
                                        <motion.div
                                            key={section.id || index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-surface-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/10"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                                                {getIcon(section.icon)}
                                            </div>
                                            <h3 className="text-xl font-bold mb-4">{section.title}</h3>
                                            {section.description && (
                                                <p className="text-sm text-white/60 mb-4">{section.description}</p>
                                            )}
                                            <ul className="space-y-3">
                                                {(section.items || []).map((rule: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                                                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                        <span>{rule}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </motion.div>
                                    ))}
                                </div>
                            </ScrollReveal>
                        )}

                        {activeTab === "terms" && termsDoc && (
                            <ScrollReveal animation="fade">
                                <div className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                                    <h2 className="text-3xl font-bold mb-4">{termsDoc.title}</h2>
                                    {termsDoc.intro && (
                                        <p className="text-white/70 mb-8 text-lg">{termsDoc.intro}</p>
                                    )}
                                    <div className="space-y-8">
                                        {(termsDoc.sections || []).map((section: any, index: number) => (
                                            <div key={index} className="border-l-4 border-primary pl-6">
                                                <h3 className="text-xl font-bold mb-3 text-primary">{section.title}</h3>
                                                <p className="text-white/80 leading-relaxed">{section.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollReveal>
                        )}

                        {activeTab === "waiver" && waiverDoc && (
                            <ScrollReveal animation="fade">
                                <div className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                                    <h2 className="text-3xl font-bold mb-4">{waiverDoc.title}</h2>
                                    {waiverDoc.intro && (
                                        <p className="text-white/70 mb-8 text-lg">{waiverDoc.intro}</p>
                                    )}
                                    <div className="space-y-8">
                                        {(waiverDoc.sections || []).map((section: any, index: number) => (
                                            <div key={index} className="border-l-4 border-secondary pl-6">
                                                <h3 className="text-xl font-bold mb-3 text-secondary">{section.title}</h3>
                                                <p className="text-white/80 leading-relaxed">{section.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollReveal>
                        )}

                        {activeTab === "privacy" && privacyDoc && (
                            <ScrollReveal animation="fade">
                                <div className="bg-surface-800/50 backdrop-blur-md p-8 rounded-3xl border border-white/10">
                                    <h2 className="text-3xl font-bold mb-4">{privacyDoc.title}</h2>
                                    {privacyDoc.intro && (
                                        <p className="text-white/70 mb-8 text-lg">{privacyDoc.intro}</p>
                                    )}
                                    <div className="space-y-8">
                                        {(privacyDoc.sections || []).map((section: any, index: number) => (
                                            <div key={index} className="border-l-4 border-accent pl-6">
                                                <h3 className="text-xl font-bold mb-3 text-accent">{section.title}</h3>
                                                <p className="text-white/80 leading-relaxed">{section.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollReveal>
                        )}
                    </div>
                </div>
            </section>

            <SectionDivider position="bottom" variant="wave" color="fill-background" />
        </main>
    );
}
