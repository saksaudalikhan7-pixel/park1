"use client";

/**
 * Payments List Page
 * 
 * Admin portal page for viewing and managing all payments
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Search, Filter, Download, RefreshCw, CheckCircle, XCircle, Clock, DollarSign, Wallet, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getPayments } from "@/app/actions/payments";

interface Payment {
    id: number;
    booking_id: number | null;
    party_booking_id: number | null;
    provider: string;
    order_id: string;
    payment_id: string | null;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    booking_number: string;
    booking_date: string;
}

export default function PaymentsListPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterProvider, setFilterProvider] = useState("all");

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const data = await getPayments();
            console.log("Payments data:", data);
            setPayments(data.results || []);
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter((payment) => {
        const matchesSearch =
            payment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.id.toString().includes(searchTerm);

        const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
        const matchesProvider = filterProvider === "all" || payment.provider === filterProvider;

        return matchesSearch && matchesStatus && matchesProvider;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return "text-green-400 bg-green-400/10 border-green-400/30";
            case "FAILED":
                return "text-red-400 bg-red-400/10 border-red-400/30";
            case "CREATED":
                return "text-blue-400 bg-blue-400/10 border-blue-400/30";
            case "REFUNDED":
                return "text-orange-400 bg-orange-400/10 border-orange-400/30";
            default:
                return "text-gray-400 bg-gray-400/10 border-gray-400/30";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return <CheckCircle className="w-4 h-4" />;
            case "FAILED":
                return <XCircle className="w-4 h-4" />;
            case "CREATED":
                return <Clock className="w-4 h-4" />;
            case "REFUNDED":
                return <DollarSign className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const stats = {
        total: payments.length,
        success: payments.filter((p) => p.status === "SUCCESS").length,
        failed: payments.filter((p) => p.status === "FAILED").length,
        refunded: payments.filter((p) => p.amount < 0).length,
        totalAmount: payments
            .filter((p) => p.status === "SUCCESS" && Number(p.amount) > 0)
            .reduce((sum, p) => sum + Number(p.amount), 0),
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-800 flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-primary" />
                        Payments
                    </h1>
                    <p className="text-slate-500 mt-1">Manage all payment transactions</p>
                </div>
                <button
                    onClick={fetchPayments}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-semibold">Total Payments</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-slate-100 rounded-lg">
                        <CreditCard className="w-5 h-5 text-slate-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-green-600 text-sm font-semibold">Successful</p>
                        <p className="text-2xl font-black text-green-700 mt-1">{stats.success}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-red-600 text-sm font-semibold">Failed</p>
                        <p className="text-2xl font-black text-red-700 mt-1">{stats.failed}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-orange-600 text-sm font-semibold">Refunds</p>
                        <p className="text-2xl font-black text-orange-700 mt-1">{stats.refunded}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <RotateCcw className="w-5 h-5 text-orange-600" />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-primary/20 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-primary text-sm font-semibold">Total Revenue</p>
                        <p className="text-2xl font-black text-primary mt-1">₹ {stats.totalAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Wallet className="w-5 h-5 text-primary" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, Payment ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:border-primary focus:outline-none transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILED">Failed</option>
                        <option value="CREATED">Created</option>
                        <option value="REFUNDED">Refunded</option>
                    </select>
                    <select
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:border-primary focus:outline-none transition-all"
                    >
                        <option value="all">All Providers</option>
                        <option value="MOCK">Mock</option>
                        <option value="RAZORPAY">Razorpay</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-slate-500">Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="p-12 text-center">
                        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No payments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Booking
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Provider
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPayments.map((payment) => (
                                    <motion.tr
                                        key={payment.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            #{payment.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col max-w-xs">
                                                <span className="text-slate-900 font-medium truncate">{payment.customer_name || 'N/A'}</span>
                                                <span className="text-slate-500 text-xs truncate" title={payment.customer_email}>{payment.customer_email || ''}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {payment.booking_id ? (
                                                <Link
                                                    href={`/admin/session-bookings/${payment.booking_id}`}
                                                    className="text-primary hover:text-primary/80 font-medium"
                                                >
                                                    {payment.booking_number || `#${payment.booking_id}`}
                                                </Link>
                                            ) : payment.party_booking_id ? (
                                                <Link
                                                    href={`/admin/party-bookings/${payment.party_booking_id}`}
                                                    className="text-primary hover:text-primary/80 font-medium"
                                                >
                                                    {payment.booking_number || `P#${payment.party_booking_id}`}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${payment.provider === "MOCK"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-purple-100 text-purple-700"
                                                }`}>
                                                {payment.provider}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                                            <span className={payment.amount < 0 ? "text-red-600" : "text-green-600"}>
                                                {payment.amount < 0 ? "-" : ""}₹{Math.abs(payment.amount).toLocaleString('en-IN')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${payment.status === "SUCCESS" ? "bg-green-100 text-green-700 border border-green-200" :
                                                    payment.status === "FAILED" ? "bg-red-100 text-red-700 border border-red-200" :
                                                        payment.status === "CREATED" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                                            payment.status === "REFUNDED" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                                                                "bg-slate-100 text-slate-700 border border-slate-200"
                                                }`}>
                                                {getStatusIcon(payment.status)}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <Link
                                                href={`/admin/payments/${payment.id}`}
                                                className="text-primary hover:text-primary/80 font-medium"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
