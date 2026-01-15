"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, Users, Mail, Phone, User, Download, ArrowLeft, CheckCircle } from "lucide-react";
import { BouncyButton } from "@repo/ui";
import QRCode from "react-qr-code";

interface BookingData {
    id: number;
    uuid: string;
    booking_number?: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    kids: number;
    adults: number;
    spectators?: number;
    birthday_child_name?: string;
    birthday_child_age?: number;
    amount: number;
    payment_status: string;
    booking_status: string;
    created_at: string;
}

export default function TicketPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<BookingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (bookingId) {
            fetchBooking();
        }
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/party-bookings/${bookingId}`);

            if (!response.ok) {
                throw new Error("Booking not found");
            }

            const data = await response.json();
            setBooking(data);
        } catch (err: any) {
            console.error("Error fetching booking:", err);
            setError(err.message || "Failed to load booking");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-background py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-white/70 mt-4">Loading ticket...</p>
                </div>
            </main>
        );
    }

    if (error || !booking) {
        return (
            <main className="min-h-screen bg-background py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Ticket Not Found</h1>
                        <p className="text-white/70 mb-6">{error || "The ticket you're looking for doesn't exist."}</p>
                        <BouncyButton onClick={() => router.push("/")} variant="primary">
                            Back to Home
                        </BouncyButton>
                    </div>
                </div>
            </main>
        );
    }

    const ticketUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tickets/${booking.uuid || booking.id}`;

    return (
        <main className="min-h-screen bg-background py-20">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        Download/Print
                    </button>
                </div>

                {/* Ticket Card */}
                <div className="bg-surface-800/50 backdrop-blur-md rounded-3xl border border-primary/30 overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-display font-black text-white mb-2">
                            Party Booking Ticket
                        </h1>
                        <p className="text-white/90 text-lg">
                            {booking.birthday_child_name ? `${booking.birthday_child_name}'s Birthday Party` : "Party Booking"}
                        </p>
                    </div>

                    {/* Booking Details */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="bg-background-dark rounded-xl p-4">
                                    <p className="text-sm text-white/50 mb-1">Booking ID</p>
                                    <p className="text-lg font-bold text-white">{booking.booking_number || booking.uuid}</p>
                                </div>

                                <div className="bg-background-dark rounded-xl p-4">
                                    <p className="text-sm text-white/50 mb-1">Contact Person</p>
                                    <div className="space-y-2">
                                        <p className="text-white flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            {booking.name}
                                        </p>
                                        <p className="text-white flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" />
                                            {booking.email}
                                        </p>
                                        <p className="text-white flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-primary" />
                                            {booking.phone}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-background-dark rounded-xl p-4">
                                    <p className="text-sm text-white/50 mb-1">Party Details</p>
                                    <div className="space-y-2">
                                        <p className="text-white flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {new Date(booking.date).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-white flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-primary" />
                                            {booking.time}
                                        </p>
                                        <p className="text-white flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            {booking.kids} Participants
                                            {booking.spectators ? ` + ${booking.spectators} Spectators` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* QR Code */}
                                <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
                                    <QRCode value={ticketUrl} size={200} />
                                    <p className="text-xs text-gray-600 mt-3 text-center">Scan to view ticket</p>
                                </div>

                                {/* Payment Info */}
                                <div className="bg-background-dark rounded-xl p-4">
                                    <p className="text-sm text-white/50 mb-3">Payment Information</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Total Amount:</span>
                                            <span className="text-white font-bold">₹{booking.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Payment Status:</span>
                                            <span className={`font-bold ${booking.payment_status === 'PAID' ? 'text-green-500' :
                                                    booking.payment_status === 'PENDING' ? 'text-yellow-500' :
                                                        'text-red-500'
                                                }`}>
                                                {booking.payment_status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/70">Booking Status:</span>
                                            <span className={`font-bold ${booking.booking_status === 'CONFIRMED' ? 'text-green-500' :
                                                    booking.booking_status === 'PENDING' ? 'text-yellow-500' :
                                                        'text-red-500'
                                                }`}>
                                                {booking.booking_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Information */}
                        <div className="bg-accent/10 border border-accent/30 rounded-xl p-6">
                            <h3 className="font-bold text-accent mb-3">Important Information</h3>
                            <ul className="space-y-2 text-sm text-white/70">
                                <li>• Please arrive 15 minutes before your scheduled time</li>
                                <li>• Bring a valid ID for verification</li>
                                <li>• All participants must sign a waiver before entry</li>
                                <li>• Socks are mandatory for all participants</li>
                                <li>• Outside food and beverages are not allowed</li>
                            </ul>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center text-sm text-white/50">
                            <p>Ninja Inflatable Park - India's Biggest Inflatable Park in Bangalore</p>
                            <p className="mt-1">For any queries, contact us at info@ninjapark.in</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 print:hidden">
                    <BouncyButton size="lg" variant="primary" onClick={() => router.push("/")}>
                        Back to Home
                    </BouncyButton>
                    {booking.payment_status !== 'PAID' && (
                        <BouncyButton size="lg" variant="secondary" onClick={() => alert("Payment functionality coming soon!")}>
                            Complete Payment
                        </BouncyButton>
                    )}
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </main>
    );
}
