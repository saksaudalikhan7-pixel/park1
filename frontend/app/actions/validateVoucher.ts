"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface QuoteLine {
    key?: string;
    label: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface VoucherQuote {
    line_items: QuoteLine[];
    subtotal: number;
    discount: number;
    taxable_amount: number;
    gst_rate: number;
    gst: number;
    total: number;
    payable: number;
    voucher: null | {
        code: string;
        discount_type: "PERCENTAGE" | "FLAT" | "BUY_X_GET_Y";
        discount_value: number;
        buy_quantity: number | null;
        free_quantity: number | null;
        applies_to: string;
        description: string | null;
        offer: string;
        explanation: string;
        lines: QuoteLine[];
    };
}

export interface VoucherGuests {
    adults: number;
    kids: number;
    spectators: number;
    duration: string;
}

/**
 * Validate a voucher on the server.
 * When `guests` is given the server returns the full price breakdown (needed for
 * Buy X Get Y Free offers); otherwise only the legacy amount-based check runs.
 */
export async function validateVoucher(
    code: string,
    orderAmount: number,
    bookingDateTime?: string, // ISO format: "2026-01-12T15:30:00"
    guests?: VoucherGuests
) {
    try {
        if (!code || !code.trim()) {
            return { success: false, error: "Voucher code is required" };
        }

        const response = await fetch(`${API_URL}/shop/vouchers/validate/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code.trim().toUpperCase(),
                order_amount: orderAmount,
                booking_datetime: bookingDateTime,
                ...(guests ? {
                    adults: guests.adults,
                    kids: guests.kids,
                    spectators: guests.spectators,
                    duration: guests.duration,
                } : {}),
            }),
            cache: "no-store"
        });

        if (response.status === 403 || response.status === 429) {
            return { success: false, error: "Too many attempts. Please wait a minute and try again." };
        }

        const result = await response.json();

        if (!result.valid) {
            return {
                success: false,
                error: result.error || "Invalid voucher"
            };
        }

        return {
            success: true,
            discount: result.discount_amount as number,
            type: result.voucher.discount_type as string,
            value: result.voucher.discount_value as number,
            code: result.voucher.code as string,
            description: result.voucher.description as string | null,
            offer: (result.voucher.offer || "") as string,
            quote: (result.quote || null) as VoucherQuote | null,
        };

    } catch (error) {
        console.error("Voucher validation error:", error);
        return { success: false, error: "Failed to validate voucher" };
    }
}
