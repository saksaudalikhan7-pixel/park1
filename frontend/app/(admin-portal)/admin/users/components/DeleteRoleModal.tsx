"use client";

import { useState } from "react";
import { removeUserRole } from "@/app/actions/users";
import { X, AlertTriangle, Trash2 } from "lucide-react";

interface DeleteRoleModalProps {
    user: {
        id: string;
        name: string;
        email: string;
        role?: { name: string };
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeleteRoleModal({ user, isOpen, onClose, onSuccess }: DeleteRoleModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRemoveRole = async () => {
        setIsLoading(true);
        setError("");

        try {
            await removeUserRole(user.id);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to remove role");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Warning Icon */}
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-amber-600" size={32} />
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Remove Role?</h2>
                    <p className="text-sm text-slate-600">
                        Are you sure you want to remove the role from <span className="font-semibold">{user.name}</span>?
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                </div>

                {/* Current Role */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Current Role</p>
                    <p className="text-lg font-bold text-slate-900">{user.role?.name || 'No Role'}</p>
                    <p className="text-xs text-slate-500 mt-2">↓ Will be changed to ↓</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">EMPLOYEE</p>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-amber-800">
                        <strong>Warning:</strong> This user will be demoted to EMPLOYEE role and will lose their current permissions.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRemoveRole}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        {isLoading ? "Removing..." : "Remove Role"}
                    </button>
                </div>
            </div>
        </div>
    );
}
