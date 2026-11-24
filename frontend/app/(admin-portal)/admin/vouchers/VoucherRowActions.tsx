"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVoucher, setVoucherActive } from "@/app/actions/vouchers";

export default function VoucherRowActions({
    id,
    code,
    isActive,
    usedCount,
}: {
    id: string;
    code: string;
    isActive: boolean;
    usedCount: number;
}) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function toggle() {
        setBusy(true);
        const result = await setVoucherActive(id, !isActive);
        setBusy(false);
        if (!result.success) return toast.error(result.error || "Failed to update voucher");
        toast.success(`${code} ${isActive ? "deactivated" : "activated"}`);
        router.refresh();
    }

    async function remove() {
        const warning = usedCount > 0
            ? `${code} has been used in ${usedCount} paid booking(s). Deleting it removes the link from those bookings (their discount stays). Usually it is better to Deactivate it instead.\n\nDelete anyway?`
            : `Delete voucher ${code}? This cannot be undone.`;
        if (!window.confirm(warning)) return;
        setBusy(true);
        const result = await deleteVoucher(id);
        setBusy(false);
        if (!result.success) return toast.error(result.error || "Failed to delete voucher");
        toast.success(`${code} deleted`);
        router.refresh();
    }

    return (
        <div className="flex justify-end gap-1">
            <button onClick={toggle} disabled={busy} title={isActive ? "Deactivate" : "Activate"}
                className={`p-2 transition-colors ${isActive ? "text-emerald-500 hover:text-slate-500" : "text-slate-400 hover:text-emerald-600"}`}>
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Power size={18} />}
            </button>
            <Link href={`/admin/vouchers/${id}`} title="Edit" className="p-2 text-slate-400 hover:text-neon-blue transition-colors">
                <Edit size={18} />
            </Link>
            <button onClick={remove} disabled={busy} title="Delete" className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                <Trash2 size={18} />
            </button>
        </div>
    );
}
