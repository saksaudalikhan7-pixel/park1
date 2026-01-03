"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, X, Plus, Trash2, GripVertical, Eye, FileText, Palette } from "lucide-react";

interface MenuSectionEditorProps {
    initialData?: {
        id?: string;
        category?: string;
        description?: string;
        items: string[];
        color?: string;
        order?: number;
        active?: boolean;
    };
    onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
    onCancel: () => void;
}

export function MenuSectionEditor({ initialData, onSave, onCancel }: MenuSectionEditorProps) {
    const router = useRouter();
    const [category, setCategory] = useState(initialData?.category || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [items, setItems] = useState<string[]>(initialData?.items || [""]);
    const [color, setColor] = useState(initialData?.color || "secondary");
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
        if (!category.trim()) {
            setError("Category name is required");
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
            category: category.trim(),
            description: description.trim(),
            items: validItems,
            color,
            active: true
        });

        setIsSaving(false);

        if (result.success) {
            router.push("/admin/cms/menu-sections");
        } else {
            setError(result.error || "Failed to save menu section");
        }
    };

    const colorOptions = [
        { value: "primary", label: "Primary (Pink)", class: "bg-primary" },
        { value: "secondary", label: "Secondary (Yellow)", class: "bg-secondary" },
        { value: "accent", label: "Accent (Cyan)", class: "bg-accent" },
    ];

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Title */}
                    <div>
                        <label className="block text-sm font-bold text-white/70 mb-2 uppercase tracking-wide">
                            Category Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g., Pre Plated, Buffet"
                            className="w-full px-4 py-3 rounded-lg border-2 border-white/10 bg-surface-900 text-white outline-none focus:border-primary transition-all"
                        />
                        <p className="text-xs text-white/50 mt-1">
                            Main heading for this section
                        </p>
                    </div>

                    {/* Color Scheme */}
                    <div>
                        <label className="block text-sm font-bold text-white/70 mb-2 uppercase tracking-wide">
                            Color Scheme
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {colorOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setColor(opt.value)}
                                    className={`px-3 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${color === opt.value
                                            ? "border-white bg-white/10"
                                            : "border-white/10 hover:bg-white/5"
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full ${opt.class}`} />
                                    <span className="text-sm font-medium text-white">{opt.value}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-white/70 mb-2 uppercase tracking-wide">
                        Description / Subtitle
                    </label>
                    <div className="relative">
                        <FileText className="absolute left-4 top-3.5 w-5 h-5 text-white/30" />
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., For each participant"
                            className="w-full pl-12 pr-4 py-3 rounded-lg border border-white/10 bg-surface-900 text-white outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                        Optional subtitle text displayed below the category name
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
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center`}>
                                <Palette className={`w-5 h-5 text-${color}`} />
                            </div>
                            <div>
                                <h3 className={`text-xl font-display font-bold text-${color}`}>
                                    {category || "Category Name"}
                                </h3>
                                {description && (
                                    <p className="text-sm text-white/60">{description}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {items.filter(item => item.trim()).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 bg-surface-800/50 p-4 rounded-xl border border-white/10"
                                >
                                    <div className={`w-2 h-2 rounded-full bg-${color}`} />
                                    <span className="text-white/90 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        {items.filter(item => item.trim()).length === 0 && (
                            <div className="text-white/40 italic">No items added yet</div>
                        )}
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
