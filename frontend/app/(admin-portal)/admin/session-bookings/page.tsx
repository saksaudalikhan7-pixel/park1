"use server";

import { getSessionBookings } from "@/app/actions/admin";
import { SessionBookingsClient } from "./client";

export default async function SessionBookingsPage() {
    // Fetch data on the server where we can access httpOnly cookies
    const bookings = await getSessionBookings();

    // Pass data to client component
    return <SessionBookingsClient initialBookings={bookings} />;
}
