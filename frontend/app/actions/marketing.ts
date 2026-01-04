"use server";

import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from "@/lib/api";
import { revalidatePath } from "next/cache";

// Campaigns

export async function getCampaigns() {
    return await fetchAPI<any[]>(API_ENDPOINTS.marketing.campaigns);
}

export async function createCampaign(data: any) {
    await postAPI(API_ENDPOINTS.marketing.campaigns, data);
    revalidatePath('/admin/marketing');
}

export async function updateCampaign(id: number, data: any) {
    await putAPI(`${API_ENDPOINTS.marketing.campaigns}${id}/`, data);
    revalidatePath('/admin/marketing');
}

export async function deleteCampaign(id: number) {
    await deleteAPI(`${API_ENDPOINTS.marketing.campaigns}${id}/`);
    revalidatePath('/admin/marketing');
}

export async function sendCampaign(id: number) {
    await postAPI(`${API_ENDPOINTS.marketing.campaigns}${id}/send/`, {});
    revalidatePath('/admin/marketing');
}

// Templates

export async function getTemplates() {
    return await fetchAPI<any[]>(API_ENDPOINTS.marketing.templates);
}

export async function createTemplate(data: any) {
    await postAPI(API_ENDPOINTS.marketing.templates, data);
    revalidatePath('/admin/marketing/templates');
}

export async function updateTemplate(id: number, data: any) {
    await putAPI(`${API_ENDPOINTS.marketing.templates}${id}/`, data);
    revalidatePath('/admin/marketing/templates');
}

export async function deleteTemplate(id: number) {
    await deleteAPI(`${API_ENDPOINTS.marketing.templates}${id}/`);
    revalidatePath('/admin/marketing/templates');
}
