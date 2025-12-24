"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function validateVoucher(code: string, orderAmount: number) {
    try {
        if (!code) {
            return { success: false, error: "Voucher code is required" };
        }

        // Fetch voucher by code
        const voucherRes = await fetch(`${API_URL}/shop/vouchers/?code=${encodeURIComponent(code)}`, {
            cache: "no-store"
        });

        if (!voucherRes.ok) {
            return { success: false, error: "Failed to validate voucher" };
        }

        const vouchers = await voucherRes.json();
        const voucher = vouchers[0]; // Get first match

        if (!voucher) {
            return { success: false, error: "Invalid voucher code" };
        }

        if (!voucher.is_active) {
            return { success: false, error: "This voucher is no longer active" };
        }

        if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
            return { success: false, error: "This voucher has expired" };
        }

        if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
            return { success: false, error: "This voucher has reached its usage limit" };
        }

        // Check min order amount
        // Use parseFloat to handle potential string types from API
        if (voucher.min_order_amount && orderAmount < parseFloat(voucher.min_order_amount)) {
            return {
                success: false,
                error: `Minimum order of ₹${parseFloat(voucher.min_order_amount).toLocaleString()} required to use this voucher`
            };
        }

        // Calculate discount
        let discountAmount = 0;
        if (voucher.discount_type === "PERCENTAGE") {
            discountAmount = (orderAmount * parseFloat(voucher.discount_value)) / 100;
        } else {
            discountAmount = parseFloat(voucher.discount_value);
        }

        // Ensure discount doesn't exceed order amount
        discountAmount = Math.min(discountAmount, orderAmount);

        // Ensure 2 decimal places strict
        discountAmount = Number(discountAmount.toFixed(2));

        return {
            success: true,
            discount: discountAmount,
            type: voucher.discount_type,
            value: parseFloat(voucher.discount_value),
            code: voucher.code,
            id: voucher.id
        };

    } catch (error) {
        console.error("Voucher validation error:", error);
        return { success: false, error: "Failed to validate voucher" };
    }
}
