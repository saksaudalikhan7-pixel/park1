"use client";

import { createVoucher } from "@/app/actions/vouchers";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import VoucherForm, { emptyVoucherForm, formToInput, type VoucherFormValues } from "../VoucherForm";

export default function NewVoucherPage() {
    const router = useRouter();

    async function handleSubmit(values: VoucherFormValues) {
        const result = await createVoucher(formToInput(values));
        if (!result.success) {
            throw new Error(result.error || "Failed to create voucher");
        }
        toast.success("Voucher created successfully");
        router.push("/admin/vouchers");
        router.refresh();
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href="/admin/vouchers" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Vouchers
                </Link>
                <h1 className="text-3xl font-bold text-slate-900">Create New Voucher</h1>
                <p className="text-slate-500 mt-1">Add a discount code or a Buy X Get Y Free offer</p>
            </div>

            <VoucherForm initial={emptyVoucherForm} submitLabel="Create Voucher" onSubmit={handleSubmit} />
        </div>
    );
}
