"use client";

import { useMemo, useState } from "react";
import { Loader2, Save, Percent, IndianRupee, Gift, Info } from "lucide-react";
import type { VoucherAppliesTo, VoucherDiscountType, VoucherInput } from "@/app/actions/vouchers";

export interface VoucherFormValues {
    code: string;
    discountType: VoucherDiscountType;
    discountValue: string;
    buyQuantity: string;
    freeQuantity: string;
    appliesTo: VoucherAppliesTo;
    minOrderAmount: string;
    usageLimit: string;
    expiryDate: string; // YYYY-MM-DD
    minHoursBeforeSlot: string;
    description: string;
    isActive: boolean;
}

export const emptyVoucherForm: VoucherFormValues = {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    buyQuantity: "2",
    freeQuantity: "1",
    appliesTo: "ALL_JUMPERS",
    minOrderAmount: "",
    usageLimit: "",
    expiryDate: "",
    minHoursBeforeSlot: "0",
    description: "",
    isActive: true,
};

/** API voucher (snake_case) → form values. */
export function voucherToForm(v: any): VoucherFormValues {
    const expiry = v.expiry_date
        // show the date in India time (vouchers expire at the end of that day IST)
        ? new Date(v.expiry_date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        : "";
    return {
        code: v.code || "",
        discountType: v.discount_type || "PERCENTAGE",
        discountValue: v.discount_type === "BUY_X_GET_Y" ? "" : String(Number(v.discount_value ?? "") || ""),
        buyQuantity: v.buy_quantity ? String(v.buy_quantity) : "2",
        freeQuantity: v.free_quantity ? String(v.free_quantity) : "1",
        appliesTo: v.applies_to || "ALL_JUMPERS",
        minOrderAmount: v.min_order_amount ? String(Number(v.min_order_amount)) : "",
        usageLimit: v.usage_limit ? String(v.usage_limit) : "",
        expiryDate: expiry,
        minHoursBeforeSlot: String(v.min_hours_before_slot ?? 0),
        description: v.description || "",
        isActive: v.is_active !== false,
    };
}

const num = (value: string) => (value.trim() === "" ? null : Number(value));

export function formToInput(f: VoucherFormValues): VoucherInput {
    const isBogo = f.discountType === "BUY_X_GET_Y";
    return {
        code: f.code,
        discountType: f.discountType,
        discountValue: isBogo ? 0 : num(f.discountValue),
        buyQuantity: isBogo ? num(f.buyQuantity) : null,
        freeQuantity: isBogo ? num(f.freeQuantity) : null,
        appliesTo: f.appliesTo,
        minOrderAmount: num(f.minOrderAmount),
        usageLimit: num(f.usageLimit),
        expiryDate: f.expiryDate || null,
        minHoursBeforeSlot: num(f.minHoursBeforeSlot) ?? 0,
        description: f.description.trim() || null,
        isActive: f.isActive,
    };
}

const WHO: Record<VoucherAppliesTo, string> = {
    ALL_JUMPERS: "jumpers",
    ADULTS: "Ninja Warriors",
    KIDS: "Little Ninjas",
};

/** Plain-language preview of a Buy X Get Y offer. */
function bogoExamples(buy: number, free: number, who: string) {
    const group = buy + free;
    return [group, group * 2, group * 2 + 1].map((n) => {
        const freeCount = Math.floor(n / group) * free;
        return `${n} ${who} → ${n - freeCount} pay, ${freeCount} free`;
    });
}

const inputClass =
    "w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neon-blue focus:border-transparent outline-none text-slate-900";
const labelClass = "block text-sm font-bold text-slate-700 mb-2";

export default function VoucherForm({
    initial,
    submitLabel,
    onSubmit,
    showActiveToggle = false,
}: {
    initial: VoucherFormValues;
    submitLabel: string;
    onSubmit: (values: VoucherFormValues) => Promise<void>;
    showActiveToggle?: boolean;
}) {
    const [f, setF] = useState<VoucherFormValues>(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = <K extends keyof VoucherFormValues>(key: K, value: VoucherFormValues[K]) =>
        setF((prev) => ({ ...prev, [key]: value }));

    const isBogo = f.discountType === "BUY_X_GET_Y";
    const buy = parseInt(f.buyQuantity, 10);
    const free = parseInt(f.freeQuantity, 10);

    const examples = useMemo(
        () => (isBogo && buy >= 1 && free >= 1 ? bogoExamples(buy, free, WHO[f.appliesTo]) : []),
        [isBogo, buy, free, f.appliesTo]
    );

    function validate(): string | null {
        if (!f.code.trim()) return "Enter a voucher code.";
        if (!/^[A-Za-z0-9_-]+$/.test(f.code.trim())) return "Use only letters, numbers, - and _ in the code.";
        if (isBogo) {
            if (!(buy >= 1)) return "Enter how many jumpers must pay (Buy).";
            if (!(free >= 1)) return "Enter how many jumpers go free (Get).";
            if (buy + free > 50) return "Buy + Get must be 50 or less.";
        } else {
            const value = Number(f.discountValue);
            if (!(value > 0)) return "Enter a discount value greater than 0.";
            if (f.discountType === "PERCENTAGE" && value > 100) return "A percentage cannot be more than 100.";
        }
        if (f.usageLimit && !(Number(f.usageLimit) >= 1)) return "Usage limit must be 1 or more (or leave it empty).";
        if (f.minOrderAmount && !(Number(f.minOrderAmount) >= 0)) return "Minimum order cannot be negative.";
        if (f.minHoursBeforeSlot && !(Number(f.minHoursBeforeSlot) >= 0)) return "Minimum hours cannot be negative.";
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const problem = validate();
        setError(problem);
        if (problem) return;
        setSaving(true);
        try {
            await onSubmit(f);
        } catch (err: any) {
            setError(err?.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    }

    const typeCard = (type: VoucherDiscountType, title: string, subtitle: string, Icon: any) => (
        <button
            type="button"
            onClick={() => set("discountType", type)}
            className={`text-left p-4 rounded-xl border-2 transition-colors ${f.discountType === type
                ? "border-neon-blue bg-blue-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
        >
            <Icon size={20} className={f.discountType === type ? "text-neon-blue" : "text-slate-400"} />
            <p className="font-bold text-slate-900 mt-2">{title}</p>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </button>
    );

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
                <label className={labelClass}>Voucher Code</label>
                <input
                    value={f.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                    required
                    placeholder="e.g. BUY2GET1"
                    className={`${inputClass} uppercase`}
                />
                <p className="text-xs text-slate-500 mt-1">Customers type this code in the booking summary. Not case-sensitive.</p>
            </div>

            <div>
                <label className={labelClass}>Offer Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {typeCard("PERCENTAGE", "Percentage off", "e.g. 20% off the booking", Percent)}
                    {typeCard("FLAT", "Flat amount off", "e.g. ₹200 off the booking", IndianRupee)}
                    {typeCard("BUY_X_GET_Y", "Buy X Get Y Free", "e.g. Buy 2 Get 1 Free", Gift)}
                </div>
            </div>

            {isBogo ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Buy (paid jumpers)</label>
                            <input type="number" min={1} max={49} step={1} value={f.buyQuantity}
                                onChange={(e) => set("buyQuantity", e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Get (free jumpers)</label>
                            <input type="number" min={1} max={49} step={1} value={f.freeQuantity}
                                onChange={(e) => set("freeQuantity", e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Counts towards the offer</label>
                        <select value={f.appliesTo} onChange={(e) => set("appliesTo", e.target.value as VoucherAppliesTo)} className={inputClass}>
                            <option value="ALL_JUMPERS">All jumpers (Ninja Warriors + Little Ninjas)</option>
                            <option value="ADULTS">Ninja Warriors only</option>
                            <option value="KIDS">Little Ninjas only</option>
                        </select>
                    </div>
                    {examples.length > 0 && (
                        <div className="text-sm text-violet-900">
                            <p className="font-bold">Buy {buy} Get {free} Free — how it applies:</p>
                            <ul className="list-disc ml-5 mt-1 space-y-0.5">
                                {examples.map((line) => <li key={line}>{line}</li>)}
                            </ul>
                            <p className="mt-2 text-xs text-violet-700">
                                The offer repeats for every full group of {buy + free}. If jumpers have different prices,
                                the cheapest go free. Free jumpers&apos; ticket (and extra hour on 2-hour sessions) is free;
                                grip socks are still charged and spectators don&apos;t count.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <label className={labelClass}>
                        {f.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount amount (₹)"}
                    </label>
                    <input type="number" min={0} step="0.01" value={f.discountValue}
                        onChange={(e) => set("discountValue", e.target.value)}
                        placeholder={f.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 200"} className={inputClass} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Min Order Amount (Optional)</label>
                    <input type="number" min={0} step="0.01" value={f.minOrderAmount}
                        onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="No minimum" className={inputClass} />
                    <p className="text-xs text-slate-500 mt-1">Before GST. Leave empty for no minimum.</p>
                </div>
                <div>
                    <label className={labelClass}>Usage Limit (Optional)</label>
                    <input type="number" min={1} step={1} value={f.usageLimit}
                        onChange={(e) => set("usageLimit", e.target.value)} placeholder="Unlimited" className={inputClass} />
                    <p className="text-xs text-slate-500 mt-1">Counts paid bookings only. Leave empty for unlimited.</p>
                </div>
                <div>
                    <label className={labelClass}>Expiry Date (Optional)</label>
                    <input type="date" value={f.expiryDate}
                        onChange={(e) => set("expiryDate", e.target.value)} className={inputClass} />
                    <p className="text-xs text-slate-500 mt-1">
                        {f.expiryDate ? "Valid until 11:59 PM on this day." : "Never expires."}
                        {f.expiryDate && (
                            <button type="button" onClick={() => set("expiryDate", "")} className="ml-2 text-neon-blue hover:underline">
                                Remove expiry
                            </button>
                        )}
                    </p>
                </div>
                <div>
                    <label className={labelClass}>Min Hours Before Booking (Optional)</label>
                    <input type="number" min={0} step={1} value={f.minHoursBeforeSlot}
                        onChange={(e) => set("minHoursBeforeSlot", e.target.value)} className={inputClass} />
                    <p className="text-xs text-slate-500 mt-1">0 = no restriction.</p>
                </div>
            </div>

            <div>
                <label className={labelClass}>Description (Optional)</label>
                <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3}
                    placeholder="Internal note about this voucher..." className={inputClass} />
            </div>

            {showActiveToggle && (
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)}
                        className="w-4 h-4" />
                    Active (customers can use this voucher)
                </label>
            )}

            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>All discounts are taken off before GST, and GST is charged only on the amount the customer pays.</span>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <div className="pt-2 flex justify-end">
                <button type="submit" disabled={saving}
                    className="bg-neon-blue hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
