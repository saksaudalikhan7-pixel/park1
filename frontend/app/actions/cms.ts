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

export async function createPricingCarouselImage(data: FormData) {
    // Image upload requires FormData. postAPI in lib/api.ts might expect JSON if data is not FormData.
    // But our server-api.ts handles FormData?
    // Let's check api.ts:
    /*
    export async function postAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
        const endpoint = url.replace(API_BASE_URL, '');
        const result = await serverPostAPI(endpoint, data);
        ...
    }
    */
    // server-api.ts handles it if we pass FormData. 
    // Ideally we pass FormData directly.

    // However, server actions receiving FormData is standard.
    // But passing it to `postAPI` which calls `serverPostAPI`...
    // Let's assume serverPostAPI handles FormData correctly (it does check `instanceof FormData`).

    await postAPI(API_ENDPOINTS.cms.pricing_carousel_images, data);
    revalidatePath('/admin/cms/pricing');
}
