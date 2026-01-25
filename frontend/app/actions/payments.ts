"use server";

import { fetchAPI, postAPI, API_ENDPOINTS } from "@/lib/api";

export interface Payment {
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

export interface PaymentsResponse {
    count: number;
    results: Payment[];
}

/**
 * Fetch all payments with optional filtering
 */
export async function getPayments(params?: {
    status?: string;
    provider?: string;
    limit?: number;
    offset?: number;
}): Promise<PaymentsResponse> {
    try {
        const queryParams = new URLSearchParams();

        if (params?.status) queryParams.append('status', params.status);
        if (params?.provider) queryParams.append('provider', params.provider);
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset) queryParams.append('offset', params.offset.toString());

        const queryString = queryParams.toString();
        const endpoint = `/payments/${queryString ? `?${queryString}` : ''}`;

        const data = await fetchAPI<PaymentsResponse>(endpoint);
        return data;
    } catch (error) {
        console.error('Error fetching payments:', error);
        return { count: 0, results: [] };
    }
}

/**
 * Get payment statistics
 */
export async function getPaymentStats() {
    try {
        const data = await fetchAPI<any>('/payments/stats/');
        return data;
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        return null;
    }
}

/**
 * Get payment details by ID
 */
export async function getPaymentById(id: string | number) {
    try {
        const data = await fetchAPI<any>(`/admin/payments/${id}/`);
        return data;
    } catch (error) {
        console.error(`Error fetching payment ${id}:`, error);
        return null;
    }
}

/**
 * Process a refund
 */
export async function processRefund(paymentId: number, amount: number, reason?: string) {
    try {
        const data = await postAPI<any>('/payments/refund/', {
            payment_id: paymentId,
            amount,
            reason
        });
        return data;
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return { success: false, error: error.message || 'Failed to process refund' };
    }
}
