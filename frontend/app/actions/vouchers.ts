"use server";

import { fetchAPI } from "../lib/server-api";
import { getAdminSession } from "../lib/admin-auth";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

export type VoucherDiscountType = "PERCENTAGE" | "FLAT" | "BUY_X_GET_Y";
export type VoucherAppliesTo = "ALL_JUMPERS" | "ADULTS" | "KIDS";

export interface VoucherInput {
    code: string;
    discountType: VoucherDiscountType;
    discountValue?: number | null;
    buyQuantity?: number | null;
    freeQuantity?: number | null;
    appliesTo?: VoucherAppliesTo;
    minOrderAmount?: number | null;   // null = no minimum
    expiryDate?: string | null;       // "YYYY-MM-DD" (valid until end of that day, IST); null = never expires
    usageLimit?: number | null;       // null = unlimited
    description?: string | null;
    minHoursBeforeSlot?: number | null;
    isActive?: boolean;
}

/** "2026-12-31" → end of that day in India time, as ISO string. */
function endOfDayIST(date: string): string {
    return new Date(`${date}T23:59:59+05:30`).toISOString();
}

function toPayload(data: Partial<VoucherInput>) {
    const payload: Record<string, any> = {};
    if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
    if (data.discountType !== undefined) payload.discount_type = data.discountType;
    if (data.discountValue !== undefined) payload.discount_value = data.discountValue === null ? 0 : Number(Number(data.discountValue).toFixed(2));
    if (data.buyQuantity !== undefined) payload.buy_quantity = data.buyQuantity;
    if (data.freeQuantity !== undefined) payload.free_quantity = data.freeQuantity;
    if (data.appliesTo !== undefined) payload.applies_to = data.appliesTo;
    if (data.minOrderAmount !== undefined) payload.min_order_amount = data.minOrderAmount === null ? null : Number(Number(data.minOrderAmount).toFixed(2));
    if (data.expiryDate !== undefined) payload.expiry_date = data.expiryDate ? endOfDayIST(data.expiryDate) : null;
    if (data.usageLimit !== undefined) payload.usage_limit = data.usageLimit;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.minHoursBeforeSlot !== undefined) payload.min_hours_before_slot = data.minHoursBeforeSlot || 0;
    if (data.isActive !== undefined) payload.is_active = data.isActive;
    return payload;
}

/** Turn a DRF error body ({field: ["msg"]}, {detail: "msg"}) into one readable line. */
async function readError(res: Response | null | undefined, fallback: string): Promise<string> {
    if (!res) return fallback;
    try {
        const text = await res.text();
        try {
            const body = JSON.parse(text);
            if (body?.detail) return String(body.detail);
            if (body && typeof body === "object") {
                const parts = Object.entries(body).map(([field, value]) => {
                    const msg = Array.isArray(value) ? value.join(" ") : String(value);
                    return field === "non_field_errors" ? msg : `${field.replace(/_/g, " ")}: ${msg}`;
                });
                if (parts.length) return parts.join(" · ");
            }
        } catch {
            if (text) return `Error: ${text.substring(0, 100)}`;
        }
    } catch (e) {
        console.error("Error reading API error response:", e);
    }
    return fallback;
}

export async function getVouchers(): Promise<any[]> {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const res = await fetchAPI("/shop/vouchers/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getVoucher(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const res = await fetchAPI(`/shop/vouchers/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createVoucher(data: VoucherInput): Promise<{ success: boolean; error?: string }> {
    const session = await getAdminSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const res = await fetchAPI("/shop/vouchers/", {
        method: "POST",
        body: JSON.stringify({ is_active: true, ...toPayload(data) })
    });

    if (!res || !res.ok) {
        return { success: false, error: await readError(res, "Failed to create voucher") };
    }

    revalidatePath("/admin/vouchers");
    return { success: true };
}

export async function updateVoucher(id: string, data: Partial<VoucherInput>): Promise<{ success: boolean; error?: string }> {
    const session = await getAdminSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const res = await fetchAPI(`/shop/vouchers/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(toPayload(data))
    });

    if (!res || !res.ok) {
        return { success: false, error: await readError(res, "Failed to update voucher") };
    }

    revalidatePath("/admin/vouchers");
    revalidatePath(`/admin/vouchers/${id}`);
    return { success: true };
}

export async function setVoucherActive(id: string, isActive: boolean) {
    return updateVoucher(id, { isActive });
}

export async function deleteVoucher(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await getAdminSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const res = await fetchAPI(`/shop/vouchers/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) {
        return { success: false, error: await readError(res, "Failed to delete voucher") };
    }

    revalidatePath("/admin/vouchers");
    return { success: true };
}

export async function validateVoucher(code: string, orderAmount: number) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/shop/vouchers/validate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), order_amount: orderAmount })
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        return { valid: false, error: error.error || "Failed to validate voucher" };
    }

    return await res.json();
}
