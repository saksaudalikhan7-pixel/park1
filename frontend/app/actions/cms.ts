"use server";

import { fetchAPI } from "../lib/server-api";
import { requirePermission } from "../lib/admin-auth";
import { logActivity } from "../lib/audit-log";
import { revalidatePath } from "next/cache";
import { transformCmsItem } from "../lib/transformers";

// ========== FREE ENTRIES ==========

export async function getFreeEntries(status?: string): Promise<any[]> {
    await requirePermission('entries', 'read');

    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const res = await fetchAPI(`/cms/free-entries/?${params.toString()}`);
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function createFreeEntry(data: {
    name: string;
    email: string;
    phone?: string;
    reason: string;
}) {
    const payload = {
        ...data,
        status: "PENDING"
    };

    const res = await fetchAPI("/cms/free-entries/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    const entry = await res.json();
    return { success: true, entry: transformCmsItem(entry) };
}

export async function updateFreeEntryStatus(id: string, status: string, notes?: string) {
    await requirePermission('entries', 'write');

    const res = await fetchAPI(`/cms/free-entries/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes })
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'FREE_ENTRY',
        entityId: id,
        details: { status, notes }
    });

    revalidatePath('/admin/free-entries');
    return { success: true };
}

export async function deleteFreeEntry(id: string) {
    await requirePermission('entries', 'delete');

    const res = await fetchAPI(`/cms/free-entries/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'FREE_ENTRY',
        entityId: id
    });

    revalidatePath('/admin/free-entries');
    return { success: true };
}

// ========== STATIC PAGES ==========

export async function getStaticPages(): Promise<any[]> {
    await requirePermission('cms', 'read');
    const res = await fetchAPI("/cms/pages/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getStaticPage(id: string) {
    await requirePermission('cms', 'read');
    const res = await fetchAPI(`/cms/pages/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createStaticPage(data: {
    slug: string;
    title: string;
    content: string;
    published?: boolean;
    metaTitle?: string;
    metaDesc?: string;
}) {
    await requirePermission('cms', 'write');

    const payload: any = { ...data };
    if (data.metaTitle) {
        payload.meta_title = data.metaTitle;
        delete payload.metaTitle;
    }
    if (data.metaDesc) {
        payload.meta_desc = data.metaDesc;
        delete payload.metaDesc;
    }

    const res = await fetchAPI("/cms/pages/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    const page = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'STATIC_PAGE',
        entityId: page.id.toString(),
        details: { title: page.title, slug: page.slug }
    });

    revalidatePath('/admin/static-pages');
    return { success: true, page: transformCmsItem(page) };
}

export async function updateStaticPage(id: string, data: {
    slug?: string;
    title?: string;
    content?: string;
    published?: boolean;
    metaTitle?: string;
    metaDesc?: string;
}) {
    await requirePermission('cms', 'write');

    const payload: any = { ...data };
    if (data.metaTitle) {
        payload.meta_title = data.metaTitle;
        delete payload.metaTitle;
    }
    if (data.metaDesc) {
        payload.meta_desc = data.metaDesc;
        delete payload.metaDesc;
    }

    const res = await fetchAPI(`/cms/pages/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'STATIC_PAGE',
        entityId: id,
        details: { title: data.title }
    });

    revalidatePath('/admin/static-pages');
    return { success: true };
}

export async function deleteStaticPage(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/pages/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'STATIC_PAGE',
        entityId: id
    });

    revalidatePath('/admin/static-pages');
    return { success: true };
}

// ========== SOCIAL LINKS ==========

export async function getSocialLinks(): Promise<any[]> {
    await requirePermission('cms', 'read');
    const res = await fetchAPI("/cms/social-links/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function createSocialLink(data: {
    platform: string;
    url: string;
    icon?: string;
    order?: number;
}) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI("/cms/social-links/", {
        method: "POST",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    const link = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'SOCIAL_LINK',
        entityId: link.id.toString(),
        details: { platform: link.platform }
    });

    revalidatePath('/admin/social-media');
    return { success: true, link: transformCmsItem(link) };
}

export async function updateSocialLink(id: string, data: {
    platform?: string;
    url?: string;
    icon?: string;
    order?: number;
    active?: boolean;
}) {
    await requirePermission('cms', 'write');

    const res = await fetchAPI(`/cms/social-links/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'SOCIAL_LINK',
        entityId: id
    });

    revalidatePath('/admin/social-media');
    return { success: true };
}

export async function deleteSocialLink(id: string) {
    await requirePermission('cms', 'delete');

    const res = await fetchAPI(`/cms/social-links/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'SOCIAL_LINK',
        entityId: id
    });

    revalidatePath('/admin/social-media');
    return { success: true };
}

// ========== PRODUCTS ==========

export async function getProducts(): Promise<any[]> {
    await requirePermission('shop', 'read');
    const res = await fetchAPI("/shop/products/");
    if (!res || !res.ok) return [];
    const data = await res.json();
    return data.map(transformCmsItem);
}

export async function getProduct(id: string) {
    await requirePermission('shop', 'read');
    const res = await fetchAPI(`/shop/products/${id}/`);
    if (!res || !res.ok) return null;
    const data = await res.json();
    return transformCmsItem(data);
}

export async function createProduct(data: {
    name: string;
    description: string;
    price: number;
    stock?: number;
    imageUrl?: string;
    category?: string;
}) {
    await requirePermission('shop', 'write');

    const payload: any = { ...data };
    if (data.imageUrl) {
        payload.image_url = data.imageUrl;
        delete payload.imageUrl;
    }

    const res = await fetchAPI("/shop/products/", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    const product = await res.json();

    await logActivity({
        action: 'CREATE',
        entity: 'PRODUCT',
        entityId: product.id.toString(),
        details: { name: product.name, price: product.price }
    });

    revalidatePath('/admin/shop');
    return { success: true, product: transformCmsItem(product) };
}

export async function updateProduct(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
    category?: string;
    active?: boolean;
}) {
    await requirePermission('shop', 'write');

    const payload: any = { ...data };
    if (data.imageUrl) {
        payload.image_url = data.imageUrl;
        delete payload.imageUrl;
    }

    const res = await fetchAPI(`/shop/products/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'UPDATE',
        entity: 'PRODUCT',
        entityId: id
    });

    revalidatePath('/admin/shop');
    return { success: true };
}

export async function deleteProduct(id: string) {
    await requirePermission('shop', 'delete');

    const res = await fetchAPI(`/shop/products/${id}/`, {
        method: "DELETE"
    });

    if (!res || !res.ok) return { success: false };

    await logActivity({
        action: 'DELETE',
        entity: 'PRODUCT',
        entityId: id
    });

    revalidatePath('/admin/shop');
    return { success: true };
}
