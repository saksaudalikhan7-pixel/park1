'use server';

import { revalidatePath } from 'next/cache';
import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from '@/lib/api';

const ENDPOINT = API_ENDPOINTS.cms.menu_sections;

export async function getMenuSections() {
    try {
        return await fetchAPI(ENDPOINT, { cache: 'no-store' });
    } catch (error) {
        return [];
    }
}

export async function getMenuSection(id: string) {
    try {
        return await fetchAPI(`${ENDPOINT}${id}/`, { cache: 'no-store' });
    } catch (error) {
        return null;
    }
}

export async function createMenuSection(data: any) {
    try {
        const result = await postAPI(ENDPOINT, data);
        revalidatePath('/admin/cms/menu');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: 'Failed to create menu section' };
    }
}

export async function updateMenuSection(id: string, data: any) {
    try {
        const result = await putAPI(`${ENDPOINT}${id}/`, data);
        revalidatePath('/admin/cms/menu');
        return { success: true, item: result };
    } catch (error) {
        return { success: false, error: 'Failed to update menu section' };
    }
}

export async function deleteMenuSection(id: string) {
    try {
        await deleteAPI(`${ENDPOINT}${id}/`);
        revalidatePath('/admin/cms/menu');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete menu section' };
    }
}
