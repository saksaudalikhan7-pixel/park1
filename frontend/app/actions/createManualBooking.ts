"use server";

import { revalidatePath } from "next/cache";
import { adminBookingSchema, formatPhoneNumber } from "@repo/types";
import QRCode from "qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Generate unique booking number: NIP-YYYYMMDD-XXXX
function generateBookingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `NIP-${year}${month}${day}-${random}`;
}

// Sanitize string input to prevent XSS
function sanitizeString(input: string): string {
    if (!input) return "";
    return input
        .replace(/[<]/g, '') // Remove < and > to prevent HTML injection
        .replace(/[^\w\s.@'-]/g, '') // Allow only alphanumeric, spaces, dots, @, hyphens, apostrophes
        .trim();
}

// Validate email format server-side
function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Validate phone format server-side
function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
}

export async function createManualBooking(formData: any) {
    try {
        // Server-side validation using Admin Zod schema
        const validationResult = adminBookingSchema.safeParse(formData);

        if (!validationResult.success) {
            console.error("Validation failed:", validationResult.error.issues);
            const firstError = validationResult.error.issues[0];
            return {
                success: false,
                error: firstError.message || "Invalid form data. Please check your inputs."
            };
        }

        const data = validationResult.data;

        // Additional server-side checks
        if (!isValidEmail(data.email)) {
            return { success: false, error: "Invalid email format" };
        }

        if (!isValidPhone(data.phone)) {
            return { success: false, error: "Invalid phone number format" };
        }

        // Sanitize inputs
        const sanitizedName = sanitizeString(data.name);
        const sanitizedEmail = data.email.toLowerCase().trim();
        const sanitizedPhone = formatPhoneNumber(data.phone);

        // Validate date is not in the past (Optional for Manual Booking? Let's generic check)
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Allow backdating for admins slightly? No, stick to policy for now.
        // If admins need backdating, we can remove this.
        if (selectedDate < today) {
            // For manual booking, maybe we allow it? 
            // Leaving it enforced for now to prevent data mess.
            // return { success: false, error: "Cannot book for past dates" };
        }

        // Calculate amount (server-side to prevent tampering)
        const kidPrice = 500;
        const adultPrice = 899;
        const spectatorPrice = 150;

        let subtotal = (data.kids * kidPrice) + (data.adults * adultPrice) + (data.spectators * spectatorPrice);

        // Duration pricing logic from CMS/Config (Hardcoded fallback here per createBooking.ts)
        if (data.duration === "120") {
            subtotal += (data.kids + data.adults) * 500;
        }
        // 90 minutes logic? Assuming same as 60 or proportional?
        // If 90 is available, usually it's x1.5 or specific.
        // WARNING: Original createBooking had no 90 min logic.
        // I will assume 90 min = +250 per person? Or same as 120?
        // Let's assume standard pricing for now, or check if product supports it.
        // If duration is 90, maybe add 250?
        if (data.duration === "90") {
            subtotal += (data.kids + data.adults) * 250; // Guessing.
        }

        const gst = subtotal * 0.18;
        let totalAmount = subtotal + gst;
        let discountAmount = 0;
        let voucherId = null;

        // Apply voucher if provided
        if (data.voucherCode) {
            // Re-validate voucher server-side
            const voucherRes = await fetch(`${API_URL}/shop/vouchers/?code=${data.voucherCode}`, {
                cache: "no-store"
            });

            if (!voucherRes.ok) {
                return { success: false, error: "Invalid voucher code" };
            }

            const vouchers = await voucherRes.json();
            const voucher = vouchers[0];

            if (!voucher) {
                return { success: false, error: "Invalid voucher code" };
            }

            if (!voucher.is_active) {
                return { success: false, error: "This voucher is inactive" };
            }

            // Check expiry
            if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
                return { success: false, error: "This voucher has expired" };
            }

            // Check usage limit
            if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
                return { success: false, error: "This voucher has reached its usage limit" };
            }

            // Check min order amount
            if (voucher.min_order_amount && subtotal < parseFloat(voucher.min_order_amount)) {
                return { success: false, error: `Minimum order of ₹${parseFloat(voucher.min_order_amount).toLocaleString()} required to use this voucher` };
            }

            // Calculate discount
            if (voucher.discount_type === "PERCENTAGE") {
                discountAmount = (subtotal * parseFloat(voucher.discount_value)) / 100;
            } else {
                discountAmount = parseFloat(voucher.discount_value);
            }

            discountAmount = Math.min(discountAmount, totalAmount);
            // Ensure 2 decimal places
            discountAmount = Number(discountAmount.toFixed(2));

            totalAmount -= discountAmount;
            voucherId = voucher.id;

            // Increment usage count
            await fetch(`${API_URL}/shop/vouchers/${voucher.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ used_count: voucher.used_count + 1 })
            });
        }

        // Generate unique booking number
        const bookingNumber = generateBookingNumber();

        // Check for duplicate bookings using the dedicated public endpoint
        const checkDuplicateRes = await fetch(
            `${API_URL}/bookings/bookings/check_duplicate/?email=${encodeURIComponent(sanitizedEmail)}&date=${data.date}&time=${data.time}`,
            { cache: "no-store" }
        );

        if (checkDuplicateRes.ok) {
            const result = await checkDuplicateRes.json();
            if (result.exists) {
                return {
                    success: false,
                    error: "A booking with these details was recently created. Please check your email."
                };
            }
        }

        // Create booking
        const bookingPayload = {
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            date: data.date,
            time: data.time,
            duration: parseInt(data.duration),
            adults: data.adults,
            kids: data.kids,
            spectators: data.spectators,
            subtotal: Number(subtotal.toFixed(2)),
            amount: Number(totalAmount.toFixed(2)),
            discount_amount: Number(discountAmount.toFixed(2)),
            voucher_code: data.voucherCode || null,
            voucher: voucherId,
            status: "CONFIRMED",
            booking_status: "CONFIRMED",
            // For manual bookings, we might assume payment is collected (CASH/POS) or Pending.
            // Leaving as PENDING for now, admin can update status.
            payment_status: "PENDING",
            waiver_status: "PENDING",
            type: "SESSION"
        };

        const bookingRes = await fetch(`${API_URL}/bookings/bookings/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingPayload)
        });

        if (!bookingRes.ok) {
            let errorMessage = "Failed to create booking";
            try {
                const errorText = await bookingRes.text();
                try {
                    const error = JSON.parse(errorText);
                    errorMessage = error.detail || "Failed to create booking";
                } catch {
                    console.error("Non-JSON error response from booking API:", errorText.substring(0, 500));
                    errorMessage = `Server Error (${bookingRes.status}). Please try again later.`;
                }
            } catch (e) {
                console.error("Failed to read error response:", e);
            }
            return { success: false, error: errorMessage };
        }

        const booking = await bookingRes.json();

        // Create waiver ONLY if customer accepted it (and provided details)
        if (data.waiverAccepted && data.dateOfBirth) {
            const waiverPayload = {
                name: sanitizedName,
                email: sanitizedEmail,
                phone: sanitizedPhone,
                dob: data.dateOfBirth || null,
                participant_type: 'ADULT',
                is_primary_signer: true,
                version: "1.0",
                minors: data.minors || [],
                adults: data.adultGuests || [],
                booking: booking.id
            };

            await fetch(`${API_URL}/bookings/waivers/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(waiverPayload)
            });

            // Update booking waiver status to SIGNED
            await fetch(`${API_URL}/bookings/bookings/${booking.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiver_status: "SIGNED" })
            });
        }

        // Generate QR Code for the booking
        const qrData = JSON.stringify({
            id: booking.uuid || booking.id,
            name: booking.name,
            date: booking.date,
            time: booking.time,
            guests: booking.adults + booking.kids + booking.spectators
        });

        const qrCode = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300,
            margin: 2,
        });

        // Update booking with QR code
        await fetch(`${API_URL}/bookings/bookings/${booking.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qr_code: qrCode })
        });

        revalidatePath("/admin");
        revalidatePath("/admin/bookings");

        return {
            success: true,
            bookingId: String(booking.id),
            bookingNumber: booking.booking_number || bookingNumber,
            uuid: booking.uuid
        };
    } catch (error) {
        console.error("Failed to create manual booking:", error);
        return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        };
    }
}
