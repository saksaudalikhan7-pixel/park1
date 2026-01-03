"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, X, Plus, Trash2, GripVertical, Eye } from "lucide-react";

interface MenuSectionEditorProps {
    initialData?: {
        id?: string;
        title: string;
        items: string[];
        order?: number;
    };
    onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
    onCancel: () => void;
}

export function MenuSectionEditor({ initialData, onSave, onCancel }: MenuSectionEditorProps) {
    const router = useRouter();
    const [title, setTitle] = useState(initialData?.title || "");
    const [items, setItems] = useState<string[]>(initialData?.items || [""]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const addItem = () => {
        setItems([...items, ""]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleSave = async () => {
        // Validation
        if (!title.trim()) {
            setError("Section title is required");
            return;
        }

        const validItems = items.filter(item => item.trim() !== "");
        if (validItems.length === 0) {
            setError("At least one menu item is required");
            return;
        }

        setIsSaving(true);
        setError("");

        const result = await onSave({
            title: title.trim(),
            items: validItems
        });

        setIsSaving(false);

        if (result.success) {
            router.push("/admin/cms/menu-sections");
        } else {
            setError(result.error || "Failed to save menu section");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {initialData?.id ? "Edit Menu Section" : "New Menu Section"}
                    </h1>
                    <p className="text-white/60 mt-1">
                        Create or update a menu section for the party page
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="space-y-6">
                {/* Section Title */}
                <div>
                    <label className="block text-sm font-bold text-white/70 mb-2 uppercase tracking-wide">
                        Section Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Pre Plated, Buffet, Snacks"
                        className="w-full px-4 py-3 rounded-lg border-2 border-white/10 bg-surface-900 text-white outline-none focus:border-primary transition-all"
                    />
                    <p className="text-xs text-white/50 mt-1">
                        This will be the heading for this menu section
                    </p>
                </div>

                {/* Menu Items */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-bold text-white/70 uppercase tracking-wide">
                            Menu Items <span className="text-red-400">*</span>
                        </label>
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-black rounded-lg font-semibold text-sm hover:bg-primary/80 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex items-center gap-3"
                            >
                                <div className="flex-shrink-0 cursor-grab">
                                    <GripVertical className="w-5 h-5 text-white/30" />
                                </div>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => updateItem(index, e.target.value)}
                                    placeholder="Enter menu item"
                                    className="flex-1 px-4 py-3 rounded-lg border border-white/10 bg-surface-800 text-white outline-none focus:border-primary transition-all"
                                />
                                <button
                                    onClick={() => removeItem(index)}
                                    className="flex-shrink-0 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                    disabled={items.length === 1}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                    <p className="text-xs text-white/50 mt-2">
                        Add all items that belong to this section
                    </p>
                </div>

                {/* Preview */}
                <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-white">Preview</h3>
                    </div>
                    <div className="bg-surface-800/50 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                        <h3 className="text-xl font-display font-bold mb-4 text-primary">
                            {title || "Section Title"}
                        </h3>
                        <ul className="space-y-2 text-sm text-white/80">
                            {items.filter(item => item.trim()).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {item}
                                </li>
                            ))}
                            {items.filter(item => item.trim()).length === 0 && (
                                <li className="text-white/40 italic">No items added yet</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
                <button
                    onClick={onCancel}
                    className="px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors font-semibold"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 rounded-lg bg-primary text-black hover:bg-primary/80 transition-colors font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Saving..." : "Save Section"}
                </button>
            </div>
        </div>
    );
}
