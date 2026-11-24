"use client";

import { useState, useEffect } from "react";
import { getVoucher, updateVoucher } from "@/app/actions/vouchers";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import VoucherForm, { formToInput, voucherToForm, type VoucherFormValues } from "../VoucherForm";

export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams();
    const [voucher, setVoucher] = useState<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await getVoucher(params.id as string);
                if (!data) throw new Error("not found");
                setVoucher(data);
            } catch (error) {
                toast.error("Failed to load voucher");
                router.push("/admin/vouchers");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleSubmit(values: VoucherFormValues) {
        const result = await updateVoucher(params.id as string, formToInput(values));
        if (!result.success) {
            throw new Error(result.error || "Failed to update voucher");
        }
        toast.success("Voucher updated successfully");
        router.push("/admin/vouchers");
        router.refresh();
    }

    if (!voucher) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Vouchers
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Edit Voucher</h1>
                <p className="text-slate-500 mt-1">Update voucher details and settings</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase">Used (paid)</p>
                    <p className="text-2xl font-black text-slate-900">{voucher.used_count ?? 0}{voucher.usage_limit ? ` / ${voucher.usage_limit}` : ""}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase">Awaiting payment</p>
                    <p className="text-2xl font-black text-slate-900">{voucher.pending_count ?? 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold text-slate-500 uppercase">Discount given</p>
                    <p className="text-2xl font-black text-slate-900">₹{Math.round(voucher.total_discount_given ?? 0).toLocaleString("en-IN")}</p>
                </div>
            </div>

            <VoucherForm initial={voucherToForm(voucher)} submitLabel="Save Changes" onSubmit={handleSubmit} showActiveToggle />
        </div>
    );
}
