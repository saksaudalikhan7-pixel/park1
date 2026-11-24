"use server";

import { revalidatePath } from "next/cache";
import { bookingSchema, formatPhoneNumber } from "@repo/types";
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
    return input
        .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
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

// Pull a readable message out of a DRF error response
// ({detail: "..."}, {voucher_code: ["..."]}, {non_field_errors: ["..."]}, ["..."])
function firstErrorMessage(error: any): string | null {
    if (!error) return null;
    if (typeof error === "string") return error;
    if (Array.isArray(error)) return firstErrorMessage(error[0]);
    if (typeof error === "object") {
        if (error.detail) return firstErrorMessage(error.detail);
        for (const value of Object.values(error)) {
            const message = firstErrorMessage(value);
            if (message) return message;
        }
    }
    return null;
}

export async function createBooking(formData: any) {
    try {
        // Server-side validation using Zod schema
        const validationResult = bookingSchema.safeParse(formData);

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

        // Validate date is not in the past
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return { success: false, error: "Cannot book for past dates" };
        }

        // Validate time is not in the past for today's bookings
        if (selectedDate.toDateString() === today.toDateString()) {
            const [hours, minutes] = data.time.split(':').map(Number);
            const bookingTime = new Date();
            bookingTime.setHours(hours, minutes || 0, 0, 0);

            if (bookingTime < new Date()) {
                return { success: false, error: "Selected time has passed. Please choose a future time slot." };
            }
        }

        // Price is calculated by the backend pricing engine (CMS prices + grip
        // socks + extra hour + voucher, GST after discount) so the saved booking
        // amount is exactly what the customer saw and will pay.
        const voucherCode = data.voucherCode ? String(data.voucherCode).trim().toUpperCase() : "";
        const quoteRes = await fetch(`${API_URL}/shop/vouchers/quote/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                adults: data.adults,
                kids: data.kids,
                spectators: data.spectators,
                duration: data.duration,
                code: voucherCode || undefined,
                booking_datetime: `${data.date}T${data.time}:00`,
            }),
            cache: "no-store"
        });

        if (!quoteRes.ok) {
            console.error("Quote request failed:", quoteRes.status);
            return { success: false, error: "Could not calculate the booking price. Please try again." };
        }

        const quoteBody = await quoteRes.json();
        if (!quoteBody.valid) {
            return { success: false, error: quoteBody.error || "Invalid voucher code" };
        }

        const quote = quoteBody.quote;
        const subtotal = Number(quote.subtotal);
        const discountAmount = Number(quote.discount);
        const totalAmount = Number(quote.payable);

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
                    error: "A booking with these details was recently created. Please check your email or contact support."
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
            // The backend re-checks the voucher and recalculates the amount itself
            voucher_code: voucherCode || null,
            status: "CONFIRMED",
            booking_status: "CONFIRMED",
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
                    errorMessage = firstErrorMessage(error) || "Failed to create booking";
                } catch {
                    // If parsing fails, it's likely HTML or plain text (e.g. 500 error page)
                    console.error("Non-JSON error response from booking API:", errorText.substring(0, 500));
                    errorMessage = `Server Error (${bookingRes.status}). Please try again later.`;
                }
            } catch (e) {
                console.error("Failed to read error response:", e);
            }
            return { success: false, error: errorMessage };
        }

        const booking = await bookingRes.json();

        // Create waiver ONLY if customer accepted it
        if (data.waiverAccepted) {
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

            // Update booking waiver status to SIGNED (since waiver was just created)
            await fetch(`${API_URL}/bookings/bookings/${booking.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ waiver_status: "SIGNED" })
            });
        }
        // If waiver not accepted, status stays PENDING (default)

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

        console.log("Booking created successfully:", {
            id: booking.id,
            uuid: booking.uuid,
            bookingNumber,
            email: sanitizedEmail,
            date: data.date,
            time: data.time
        });

        revalidatePath("/admin");
        revalidatePath("/admin/bookings");

        return {
            success: true,
            bookingId: String(booking.id), // Return numeric ID for payment processing
            bookingNumber: booking.booking_number || bookingNumber,
            uuid: booking.uuid, // Keep UUID for tickets/QR codes
            amount: Number(booking.amount) // Saved amount = amount to charge
        };
    } catch (error) {
        console.error("Failed to create booking:", error);

        // Don't expose internal errors to client
        return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        };
    }
}
