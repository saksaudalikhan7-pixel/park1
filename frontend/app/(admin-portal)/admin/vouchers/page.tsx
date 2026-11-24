import { getVouchers } from "@/app/actions/vouchers";
import Link from "next/link";
import { Plus, Ticket, Gift } from "lucide-react";
import VoucherRowActions from "./VoucherRowActions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
    INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-500" },
    EXPIRED: { label: "Expired", className: "bg-amber-100 text-amber-700" },
    USED_UP: { label: "Used up", className: "bg-red-100 text-red-700" },
};

function formatExpiry(value?: string | null) {
    if (!value) return "No expiry";
    return `Until ${new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}`;
}

export default async function VouchersPage() {
    const vouchers = await getVouchers();

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Vouchers</h1>
                    <p className="text-slate-500 mt-1">Manage discount codes and Buy X Get Y Free offers</p>
                </div>
                <Link href="/admin/vouchers/new" className="bg-neon-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                    <Plus size={20} />
                    Create Voucher
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Offer</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usage</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vouchers.length > 0 ? (
                            vouchers.map((voucher) => {
                                const status = STATUS_STYLE[voucher.status] || STATUS_STYLE[voucher.is_active ? "ACTIVE" : "INACTIVE"];
                                const isBogo = voucher.discount_type === "BUY_X_GET_Y";
                                return (
                                    <tr key={voucher.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isBogo ? "bg-pink-100 text-pink-600" : "bg-violet-100 text-violet-600"}`}>
                                                    {isBogo ? <Gift size={18} /> : <Ticket size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{voucher.code}</p>
                                                    <p className="text-xs text-slate-500">{voucher.description || "No description"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700">{voucher.offer_summary}</span>
                                            <div className="text-xs text-slate-500 space-x-2">
                                                {voucher.min_order_amount && <span>Min ₹{Number(voucher.min_order_amount).toLocaleString("en-IN")}</span>}
                                                {voucher.min_hours_before_slot > 0 && <span>Book {voucher.min_hours_before_slot}h+ ahead</span>}
                                                <span>{formatExpiry(voucher.expiry_date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <p><span className="font-bold text-slate-800">{voucher.used_count ?? 0}</span> / {voucher.usage_limit || "∞"} paid</p>
                                            {voucher.pending_count > 0 && <p className="text-xs text-amber-600">{voucher.pending_count} awaiting payment</p>}
                                            {voucher.total_discount_given > 0 && (
                                                <p className="text-xs text-slate-500">₹{Math.round(voucher.total_discount_given).toLocaleString("en-IN")} discount given</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${status.className}`}>{status.label}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <VoucherRowActions
                                                id={String(voucher.id)}
                                                code={voucher.code}
                                                isActive={!!voucher.is_active}
                                                usedCount={voucher.used_count ?? 0}
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No vouchers found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
