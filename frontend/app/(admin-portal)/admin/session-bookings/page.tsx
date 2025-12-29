"use client";

import { BookingTable } from "../components/BookingTable";
import { getSessionBookings } from "@/app/actions/admin";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SessionBookingsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await getSessionBookings();
                setBookings(data as any[]);
                setError(null);
            } catch (error: any) {
                console.error('[Session Bookings] Error:', error);
                const errorMsg = error.message || 'Failed to load bookings';
                setError(errorMsg);
                toast.error(errorMsg);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Error loading bookings</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            <BookingTable
                bookings={bookings}
                title="Session Bookings"
                type="session"
            />
        </div>
    );
}
