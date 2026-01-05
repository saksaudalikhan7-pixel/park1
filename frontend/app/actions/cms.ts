"use server";

import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Pricing Carousel Actions

export async function getPricingCarouselImages() {
    try {
        return await fetchAPI<any[]>(API_ENDPOINTS.cms.pricing_carousel_images);
    } catch (error) {
        console.error("Failed to fetch pricing carousel images:", error);
        return []; // Return empty array to prevent UI crash
    }
}

export async function updatePricingCarouselOrder(items: { id: number; order: number }[]) {
    // Assuming backend supports batch update or we do loop. 
    // Usually standard ModelViewSet doesn't support batch update on root.
    // For simplicity, we loop here since it's server-side and low volume.
    // Better: Helper endpoint on backend. But loop is fine for < 20 items.

    for (const item of items) {
        await putAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${item.id}/`, {
            order: item.order
        });
    }
    revalidatePath('/admin/cms/pricing');
}

export async function deletePricingCarouselImage(id: number) {
    await deleteAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${id}/`);
    revalidatePath('/admin/cms/pricing');
}



export async function createPricingCarouselImage(data: FormData) {
    try {
        const token = cookies().get('admin_token')?.value;
        if (!token) return { success: false, error: "Authentication required" };

        // 1. Extract file and other data
        const file = data.get('image') as File;
        const title = data.get('title') as string;
        const order = data.get('order') as string;
        const active = data.get('active') as string;

        if (!file) {
            return { success: false, error: "No image file provided" };
        }

        // 2. Upload image to /api/cms/upload/ using manual fetch with Blob (Node.js compatible)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const backendFormData = new FormData();
        const blob = new Blob([buffer], { type: file.type });
        backendFormData.append('file', blob, file.name);

        const targetUrl = `${API_URL}/cms/upload/`;
        const uploadResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: backendFormData,
        });

        const responseText = await uploadResponse.text();
        let uploadResult;

        try {
            uploadResult = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Response:", responseText.substring(0, 200));
            return {
                success: false,
                error: `Invalid JSON from ${targetUrl} (Status: ${uploadResponse.status}): ${responseText.substring(0, 50)}...`
            };
        }

        if (!uploadResponse.ok) {
            console.error("Upload failed details:", responseText);
            return { success: false, error: uploadResult.error || `Upload failed: ${uploadResponse.statusText}` };
        }

        if (!uploadResult || !uploadResult.url) {
            return { success: false, error: "Failed to get image URL from upload response" };
        }

        // 3. Create PricingCarouselImage record with the returned URL
        const payload = {
            title: title || 'Carousel Image',
            image_url: uploadResult.url,
            order: parseInt(order) || 0,
            active: active === 'true'
        };

        await postAPI(API_ENDPOINTS.cms.pricing_carousel_images, payload);
        revalidatePath('/admin/cms/pricing');
        return { success: true };
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { success: false, error: error.message || "Unknown server action error" };
    }
}
