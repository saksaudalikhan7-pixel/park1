"use server";

import { fetchAPI, postAPI, putAPI, deleteAPI, API_ENDPOINTS } from "@/lib/api";
import { revalidatePath } from "next/cache";

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

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function createPricingCarouselImage(data: FormData) {
    const token = cookies().get('admin_token')?.value;
    if (!token) throw new Error("Authentication required");

    // 1. Extract file and other data
    const file = data.get('image') as File;
    const title = data.get('title') as string;
    const order = data.get('order') as string;
    const active = data.get('active') as string;

    if (!file) {
        throw new Error("No image file provided");
    }

    // 2. Upload image to /api/cms/upload/ using manual fetch with Blob (Node.js compatible)
    // This matches the working implementation in upload-image.ts
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const backendFormData = new FormData();
    const blob = new Blob([buffer], { type: file.type });
    backendFormData.append('file', blob, file.name);

    const uploadResponse = await fetch(`${API_URL}/cms/upload/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            // Do NOT set Content-Type here, let fetch set boundary
        },
        body: backendFormData,
    });

    if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const uploadResult = await uploadResponse.json();

    if (!uploadResult || !uploadResult.url) {
        throw new Error("Failed to get image URL from upload response");
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
}
