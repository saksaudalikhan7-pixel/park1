"use client";

import { useState } from "react";
import { resetUserPassword, generateSecurePassword } from "@/app/actions/users";
import { X, RefreshCw, Copy, Check, Eye, EyeOff } from "lucide-react";

interface ResetPasswordModalProps {
    user: {
        id: string;
        name: string;
        email: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResetPasswordModal({ user, isOpen, onClose, onSuccess }: ResetPasswordModalProps) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        const generated = generateSecurePassword(12);
        setPassword(generated);
        setShowPassword(true);
    };

    const handleReset = async () => {
        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await resetUserPassword(user.id, password);
            setNewPassword(result.new_password);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(newPassword || password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        setPassword("");
        setShowPassword(false);
        setError("");
        setSuccess(false);
        setNewPassword("");
        setCopied(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
                    <p className="text-sm text-slate-600">
                        Reset password for <span className="font-semibold">{user.name}</span>
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                {!success ? (
                    <>
                        {/* Password Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password (min 8 characters)"
                                    className="w-full px-4 py-2 pr-20 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-medium"
                        >
                            <RefreshCw size={18} />
                            Generate Secure Password
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isLoading || !password}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        {/* Success Icon */}
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="text-emerald-600" size={32} />
                        </div>

                        {/* Success Message */}
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Password Reset Successfully!</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            The new password has been set. Make sure to save it securely.
                        </p>

                        {/* New Password Display */}
                        <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 mb-4">
                            <p className="text-xs text-slate-500 mb-1">New Password</p>
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-lg font-mono font-bold text-slate-900 break-all">
                                    {newPassword}
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="flex-shrink-0 p-2 hover:bg-slate-200 rounded-lg transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copied ? (
                                        <Check className="text-emerald-600" size={20} />
                                    ) : (
                                        <Copy className="text-slate-600" size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <p className="text-xs text-amber-600 font-medium">
                            ⚠️ This password will only be shown once. Copy it now!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
