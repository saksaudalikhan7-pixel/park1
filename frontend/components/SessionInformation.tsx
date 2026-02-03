"use client";

import { useEffect, useState } from "react";
import { Clock, Info, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SessionInformationData {
    id: number;
    title: string;
    subtitle: string;
    session_information_title: string;
    session_information: string;
    session_rules_title: string;
    session_rules: string;
    is_active: boolean;
}

export function SessionInformation() {
    const [data, setData] = useState<SessionInformationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/session-information/active/`);

                if (!response.ok) {
                    setError(true);
                    return;
                }

                const result = await response.json();

                if (result.fallback) {
                    setError(true);
                    return;
                }

                setData(result);
            } catch (err) {
                console.error("Failed to fetch session information:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Don't render anything while loading or if there's an error
    if (loading || error || !data) {
        return null;
    }

    // Don't render if not active
    if (!data.is_active) {
        return null;
    }

    // Parse the information and rules into bullet points
    const parseContent = (content: string) => {
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    };

    const informationPoints = parseContent(data.session_information);
    const rulesPoints = parseContent(data.session_rules);

    return (
        <div className="w-full mt-16 mb-8">
            {/* Section Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-display font-black mb-3">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                        {data.title || "Session Information"}
                    </span>
                </h2>
                {data.subtitle && (
                    <p className="text-base md:text-lg text-white/60 font-medium">
                        {data.subtitle}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Information Card */}
                <div className="group relative">
                    {/* Gradient border effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur"></div>

                    <div className="relative bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/50">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-display font-bold text-white">
                                {data.session_information_title}
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            {informationPoints.map((point, index) => (
                                <div key={index} className="flex items-start gap-3 group/item">
                                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                                    <p className="text-white/90 text-sm md:text-base leading-relaxed font-medium">
                                        {point}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Session Rules Card */}
                <div className="group relative">
                    {/* Gradient border effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur"></div>

                    <div className="relative bg-gradient-to-br from-pink-900/90 to-purple-900/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg shadow-pink-500/50">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl md:text-2xl font-display font-bold text-white">
                                {data.session_rules_title}
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            {rulesPoints.map((rule, index) => (
                                <div key={index} className="flex items-start gap-3 group/item">
                                    <AlertTriangle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                                    <p className="text-white/90 text-sm md:text-base leading-relaxed font-medium">
                                        {rule}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Notice Banner */}
            <div className="mt-8 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-300 blur"></div>

                <div className="relative bg-gradient-to-r from-yellow-900/90 to-orange-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-yellow-500/20 rounded-lg flex-shrink-0">
                            <Clock className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-display font-bold text-white text-lg mb-2">
                                Important Notice
                            </h4>
                            <p className="text-white/80 text-sm md:text-base leading-relaxed">
                                By proceeding with your booking, you acknowledge that you have read and agree to follow all session information and rules outlined above. Please arrive at least <span className="font-bold text-yellow-400">15 minutes early</span> to complete check-in and safety briefing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
