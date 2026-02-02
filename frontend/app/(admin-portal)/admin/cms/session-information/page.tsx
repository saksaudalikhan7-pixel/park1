"use client";

import { useState, useEffect } from "react";
import { getSessionInformation, updateSessionInformation, createSessionInformation } from "@/app/actions/cms";
import { CMSBackLink } from "@/components/admin/cms/CMSBackLink";
import { Save, AlertCircle, CheckCircle2, FileText, Shield } from "lucide-react";

const DEFAULT_SESSION_INFO = `To make the most of your visit to Ninja Inflatable, please review the following session details:

1. Session Duration
Standard sessions last 60 minutes 

Your session begins at the scheduled start time. Please arrive at least 15 minutes early to complete check-in and safety briefing.

Extensions may be available subject to availability; please check with reception.

2. Booking & Entry
All participants must have a valid booking or entry ticket.

Entry may be refused if the session is full or rules are not followed.

Payments for sessions are required in advance via online booking or at reception.

3. Age & Height Guidelines
Certain attractions have age, height, or weight restrictions for safety.

Age-appropriate zones are provided to ensure a safe and fun experience for everyone.

4. Supervision
Adults must remain on the premises and supervise children under their care at all times.

Staff supervise activities but cannot replace parental supervision.

5. Safety & Rules
Safety gear, including socks, helmets, and pads where required, must be worn.

Follow all posted rules and staff instructions.

Rough play, climbing over barriers, or misuse of equipment is strictly prohibited.

6. Health & Participation
Participants should be in good health and free from conditions that could make participation unsafe.

Children or adults who are unwell, injured, or unable to follow safety instructions may be refused entry.

7. Arrival & Check-In
Arrive at least 15 minutes before your session for registration and safety briefing.

All participants must sign the waiver (or have a parent/guardian sign if under 18) before entering the play area.

8. Personal Belongings
Ninja Inflatable is not responsible for lost or damaged items.

Lockers and storage areas are provided for personal belongings.

9. Food & Drink
Food and drinks are only allowed in designated areas.

Eating, drinking, chewing gum, or bringing outside food into the inflatables is not permitted.

Enjoy your session at Ninja Inflatable — the ultimate inflatable adventure park in India`;

const DEFAULT_SESSION_RULES = `To ensure a safe, fun, and enjoyable experience for everyone, all participants (children and adults) must follow these session rules while at Ninja Inflatable:

1. Entry & Supervision
All participants must have a valid session booking or entry ticket.

Adults must remain on the premises and supervise their children at all times.

Only participants who have paid the entry fee are allowed in the play areas.

2. Session Duration
Play time is limited to the duration of the booked session.

Overstaying may require additional booking or payment.

3. Safety Guidelines
Follow all posted rules and staff instructions at all times.

Only one participant at a time on slides, climbing walls, or obstacle challenges unless specified.

No rough play, pushing, wrestling, or climbing over barriers.

Recommended safety gear (socks, helmets, pads where applicable) must be used.

Participants must be physically capable of safely participating in all activities.

4. Behavior & Conduct
Respect all staff and other participants. Aggressive or disruptive behavior is not tolerated.

Bullying, fighting, or unsafe actions may result in immediate removal from the park without refund.

5. Health & Hygiene
Participants who are unwell or have injuries may be refused entry to certain activities.

Socks must be worn on all inflatables and slides.

Food, drink, chewing gum, or sharp objects are not allowed in play areas.

Inform staff immediately of any accident, injury, or spill.

6. Personal Belongings
Ninja Inflatable is not responsible for lost or damaged items.

Keep personal belongings in designated lockers or areas provided.

7. Photo & Video Policy
Staff may take photos or videos for promotional purposes. By participating, you consent to this.

8. Compliance & Liability
Participants must follow all rules to ensure safety and fairness for everyone.

Ninja Inflatable reserves the right to remove any participant who fails to comply without refund.

By entering, participants agree to the Ninja Inflatable Waiver and Release of Liability.

Let's keep it safe, fun, and full of adventure! Enjoy your session at Ninja Inflatable.`;

export default function SessionInformationCMSPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        id: null as number | null,
        title: "Ninja Inflatable Park Session Booking",
        subtitle: "Booking Available from Thursday's to Sunday's",
        session_information_title: "Session Information",
        session_information: DEFAULT_SESSION_INFO,
        session_rules_title: "Session Rules",
        session_rules: DEFAULT_SESSION_RULES,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const data = await getSessionInformation();
            if (data && !data.fallback) {
                setFormData({
                    id: data.id,
                    title: data.title || formData.title,
                    subtitle: data.subtitle || formData.subtitle,
                    session_information_title: data.session_information_title || formData.session_information_title,
                    session_information: data.session_information || formData.session_information,
                    session_rules_title: data.session_rules_title || formData.session_rules_title,
                    session_rules: data.session_rules || formData.session_rules,
                    is_active: data.is_active ?? true
                });
            }
        } catch (error) {
            console.error("Failed to load session information:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);
            setMessage(null);

            const payload = {
                title: formData.title,
                subtitle: formData.subtitle,
                session_information_title: formData.session_information_title,
                session_information: formData.session_information,
                session_rules_title: formData.session_rules_title,
                session_rules: formData.session_rules,
                is_active: formData.is_active
            };

            if (formData.id) {
                await updateSessionInformation(formData.id, payload);
            } else {
                const result = await createSessionInformation(payload);
                if (result.data?.id) {
                    setFormData(prev => ({ ...prev, id: result.data.id }));
                }
            }

            setMessage({ type: 'success', text: 'Session information saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save session information' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <CMSBackLink />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Session Information & Rules</h1>
                    <p className="text-slate-500">Manage content displayed on the booking page</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Page Settings */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Page Settings
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Page Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Ninja Inflatable Park Session Booking"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Subtitle
                            </label>
                            <input
                                type="text"
                                value={formData.subtitle}
                                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Booking Available from Thursday's to Sunday's"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                Active (Display on booking page)
                            </label>
                        </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Session Information */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Session Information
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Section Title
                            </label>
                            <input
                                type="text"
                                value={formData.session_information_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, session_information_title: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Session Information"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Content
                            </label>
                            <textarea
                                value={formData.session_information}
                                onChange={(e) => setFormData(prev => ({ ...prev, session_information: e.target.value }))}
                                rows={20}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                                placeholder="Enter session information content..."
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Plain text format. Line breaks will be preserved.
                            </p>
                        </div>
                    </div>

                    <hr className="border-slate-200" />

                    {/* Session Rules */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-600" />
                            Session Rules
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Section Title
                            </label>
                            <input
                                type="text"
                                value={formData.session_rules_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, session_rules_title: e.target.value }))}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Session Rules"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Content
                            </label>
                            <textarea
                                value={formData.session_rules}
                                onChange={(e) => setFormData(prev => ({ ...prev, session_rules: e.target.value }))}
                                rows={25}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                                placeholder="Enter session rules content..."
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Plain text format. Line breaks will be preserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
