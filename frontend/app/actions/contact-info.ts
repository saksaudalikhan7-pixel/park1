'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/cms/contact-info/`;

export async function getContactInfos() {
    try {
        return await fetchAPI(ENDPOINT, { cache: 'no-store' });
    } catch (error) {
        return [];
    }
}

export async function updateContactInfo(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/contact');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: 'Failed to update contact info' };
    }
}
