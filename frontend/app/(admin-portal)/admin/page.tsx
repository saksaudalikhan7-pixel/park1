import { getDashboardStats } from "@/app/actions/admin";
import { getAdminSession, requirePermission } from "../../lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Users,
    CalendarCheck,
    DollarSign,
    FileSignature,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle,
    ArrowRight,
    PartyPopper,
    ShoppingBag,
    MessageSquare,
    HelpCircle,
    Image,
    Ticket,
    UserCheck,
    Repeat
} from "lucide-react";

export default async function AdminDashboard() {
    const session = await getAdminSession() as { email: string; role: string } | null;
    if (!session) {
        redirect("/admin/login");
    }

    try {
        await requirePermission('dashboard', 'read');
    } catch (e) {
        redirect("/admin/cms"); // Fallback for Content Managers
    }

    const stats = await getDashboardStats();

    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...stats.monthlyRevenue.map((d: any) => d.total), 1000);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {session.email}</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg px-3 py-2">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings.toString()}
                    icon={<CalendarCheck className="text-blue-600" />}
                    trend="All Time"
                    trendUp={true}
                    color="blue"
                />
                <StatCard
                    title="Avg Booking Value"
                    value={`₹${stats.avgBookingValue.toLocaleString()}`}
                    icon={<DollarSign className="text-emerald-600" />}
                    trend="Per Booking"
                    trendUp={true}
                    color="emerald"
                />
                <Link href="/admin/contact-messages" className="block">
                    <StatCard
                        title="Unread Messages"
                        value={stats.unreadMessages.toString()}
                        icon={<MessageSquare className="text-purple-600" />}
                        trend={stats.latestMessagePreview || "No new messages"}
                        trendUp={stats.unreadMessages > 0}
                        color="purple"
                        alert={stats.unreadMessages > 5}
                    />
                </Link>
                <StatCard
                    title="Waiver Completion"
                    value={`${stats.waiverCompletionRate}%`}
                    icon={<FileSignature className="text-amber-600" />}
                    trend={stats.pendingWaivers > 0 ? "Action Needed" : "All Clear"}
                    trendUp={stats.pendingWaivers === 0}
                    color="amber"
                    alert={stats.pendingWaivers > 0}
                />
            </div>

            {/* New Revenue & Trends Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Today's Revenue"
                    value={`₹${stats.todayRevenue.toLocaleString()}`}
                    icon={<TrendingUp className="text-emerald-600" />}
                    trend={`${stats.bookingsToday} bookings today`}
                    trendUp={stats.todayRevenue >= stats.yesterdayRevenue}
                    color="emerald"
                />
                <StatCard
                    title="Booking Trend"
                    value={`${stats.bookingGrowth > 0 ? '+' : ''}${stats.bookingGrowth}%`}
                    icon={<Repeat className="text-indigo-600" />}
                    trend={`${stats.thisWeekBookings} this week vs ${stats.lastWeekBookings} last week`}
                    trendUp={stats.bookingGrowth > 0}
                    color="indigo"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    icon={<DollarSign className="text-teal-600" />}
                    trend="All Time"
                    trendUp={true}
                    color="teal"
                />
            </div>

            {/* Website Summary Section */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Website Summary</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Booking Stats */}
                    <SummaryCard category="Bookings Breakdown" icon={<CalendarCheck size={16} />} items={[
                        { label: "Session Bookings", value: stats.sessionBookings },
                        { label: "Party Bookings", value: stats.partyBookings },
                        { label: "Avg Booking Value", value: `₹${stats.avgBookingValue}` }
                    ]} />

                    {/* Customer Stats */}
                    <SummaryCard category="Customer Insights" icon={<Users size={16} />} items={[
                        { label: "Total Customers", value: stats.totalCustomers },
                        { label: "New This Month", value: stats.newCustomersMonth },
                        { label: "Repeat Customers", value: stats.repeatCustomers }
                    ]} />

                    {/* Content Stats */}
                    <SummaryCard category="Content Overview" icon={<Image size={16} />} items={[
                        { label: "Activities", value: stats.totalActivities },

                        { label: "FAQs", value: stats.totalFaqs },
                        { label: "Banners", value: stats.totalBanners }
                    ]} />

                    {/* Promotions & System */}
                    <SummaryCard category="System Health" icon={<Ticket size={16} />} items={[
                        { label: "Active Vouchers", value: stats.activeVouchers },
                        { label: "Redeemed", value: stats.redeemedVouchers },
                        { label: "Waiver Completion", value: `${stats.waiverCompletionRate}%` }
                    ]} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 mb-8">
                {/* System Status - Full Width */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle size={20} className="text-slate-400" />
                        System Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.pendingWaivers > 0 ? (
                            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-2.5 bg-amber-100 rounded-lg shrink-0 shadow-sm">
                                    <FileSignature size={18} className="text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-900">{stats.pendingWaivers} Waivers Pending</p>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">Guests arriving soon need to sign waivers.</p>
                                    <Link href="/admin/waivers" className="text-xs font-bold text-amber-800 mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all hover:underline">
                                        Review Waivers →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-3 shadow-sm">
                                <div className="p-2.5 bg-emerald-100 rounded-lg shrink-0 shadow-sm">
                                    <CheckCircle size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-emerald-900">All Waivers Signed</p>
                                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">No pending actions required.</p>
                                </div>
                            </div>
                        )}

                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3 shadow-sm">
                            <div className="p-2.5 bg-blue-100 rounded-lg shrink-0 shadow-sm">
                                <CalendarCheck size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900">{stats.bookingsToday} Bookings Today</p>
                                <p className="text-xs text-blue-700 mt-1 leading-relaxed">Check staff availability for peak hours.</p>
                            </div>
                        </div>

                        {stats.unreadMessages > 0 && (
                            <Link href="/admin/contact-messages">
                                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="p-2.5 bg-purple-100 rounded-lg shrink-0 shadow-sm">
                                        <MessageSquare size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-purple-900">{stats.unreadMessages} Unread Messages</p>
                                        <p className="text-xs text-purple-700 mt-1 leading-relaxed">Customer inquiries need response.</p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                    <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
                    <Link href="/admin/bookings" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors hover:gap-2">
                        View All Bookings <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 border-b-2 border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.recentBookings.length > 0 ? (
                                stats.recentBookings.map((booking: any) => (
                                    <tr key={booking.id} className="hover:bg-blue-50/50 transition-all duration-200 group border-b border-slate-100 last:border-b-0">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                    {booking.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{booking.name}</p>
                                                    <p className="text-xs text-slate-500">{booking.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${booking.type === 'PARTY'
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}>
                                                {booking.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Clock size={14} className="text-slate-400" />
                                                {booking.date} • {booking.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                            ₹{booking.amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={booking.type === 'PARTY' ? `/admin/party-bookings/${booking.id}` : `/admin/bookings/${booking.id}`} className="text-slate-400 hover:text-blue-600 transition-all duration-200 inline-block hover:translate-x-1">
                                                <ArrowRight size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No recent bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendUp, color, alert }: { title: string; value: string; icon: React.ReactNode; trend: string; trendUp: boolean; color: string; alert?: boolean }) {
    return (
        <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${alert ? 'border-amber-200 ring-2 ring-amber-100' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${color}-50 shadow-sm`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-300",
        PENDING: "bg-amber-100 text-amber-700 border-amber-300",
        CANCELLED: "bg-red-100 text-red-700 border-red-300",
        COMPLETED: "bg-blue-100 text-blue-700 border-blue-300",
    };

    const defaultStyle = "bg-slate-100 text-slate-700 border-slate-300";

    return (
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${styles[status] || defaultStyle} inline-flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${status === 'CONFIRMED' ? 'bg-emerald-500' : status === 'PENDING' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {status}
        </span>
    );
}

function SummaryCard({ category, icon, items }: {
    category: string;
    icon: React.ReactNode;
    items: { label: string; value: string | number }[]
}) {
    return (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4 text-slate-500">
                {icon}
                <h3 className="text-xs font-bold uppercase tracking-wider">
                    {category}
                </h3>
            </div>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-sm text-slate-600">{item.label}</span>
                        <span className="text-sm font-bold text-slate-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
