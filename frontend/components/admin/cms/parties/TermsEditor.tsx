'use client';

import React, { useState } from 'react';
import { updatePageSection, createPageSection } from '@/app/actions/page-sections';
import { CMSField } from '@/components/admin/cms/CMSField';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface TermsEditorProps {
    section: any;
    pageSlug: string;
}

export function TermsEditor({ section: initialSection, pageSlug }: TermsEditorProps) {
    const [section, setSection] = useState(initialSection || {
        page: pageSlug,
        section_key: 'terms',
        title: 'Parties Terms & Conditions',
        content: '',
        active: true,
        order: 1
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (name: string, value: any) => {
        setSection((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let result;
            if (section.id) {
                result = await updatePageSection(section.id, section);
            } else {
                result = await createPageSection(section);
            }

            if (result.success) {
                toast.success('Terms section saved');
                if (result.item) setSection(result.item);
            } else {
                toast.error('Failed to save terms section');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-slate-900">Terms & Conditions</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Page: {pageSlug}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="p-6 space-y-6">
                <CMSField
                    field={{ name: 'title', label: 'Section Title', type: 'text', required: true }}
                    value={section.title}
                    onChange={(v: any) => handleChange('title', v)}
                />

                <CMSField
                    field={{ name: 'content', label: 'Terms Content (HTML supported)', type: 'rich_text', required: true }}
                    value={section.content}
                    onChange={(v: any) => handleChange('content', v)}
                />
            </div>
        </div>
    );
}
