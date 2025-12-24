"use client";

import React from 'react';
import { createMenuSection } from '@/app/actions/menu-sections';
import { CMSForm } from '@/components/admin/cms/CMSForm';
import { schemas } from '@/lib/cms/schema';

export default function NewMenuSectionPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">New Menu Section</h1>
                <p className="text-slate-500">Add a new menu section</p>
            </div>

            <CMSForm
                schema={schemas.menu_section}
                onSubmit={createMenuSection}
                submitLabel="Create Menu Section"
                backUrl="/admin/cms/menu-sections"
            />
        </div>
    );
}

