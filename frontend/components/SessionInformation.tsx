"use client";

import { useEffect, useState } from "react";
import { FileText, Shield, AlertCircle } from "lucide-react";

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

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-8">
            {/* Header */}
            {(data.title || data.subtitle) && (
                <div className="text-center space-y-2">
                    {data.title && (
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                            {data.title}
                        </h1>
                    )}
                    {data.subtitle && (
                        <p className="text-lg text-slate-600">
                            {data.subtitle}
                        </p>
                    )}
                </div>
            )}

            {/* Session Information Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-6 h-6" />
                        {data.session_information_title}
                    </h2>
                </div>
                <div className="p-6 md:p-8">
                    <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                            {data.session_information}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Session Rules Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-6 h-6" />
                        {data.session_rules_title}
                    </h2>
                </div>
                <div className="p-6 md:p-8">
                    <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                            {data.session_rules}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-amber-900 mb-1">
                            Important Notice
                        </h3>
                        <p className="text-sm text-amber-800">
                            By proceeding with your booking, you acknowledge that you have read and agree to follow all session information and rules outlined above.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
