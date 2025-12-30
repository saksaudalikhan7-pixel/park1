/**
 * Centralized API configuration for Ninja Inflatable Park
 * All backend API endpoints are defined here
 * 
 * IMPORTANT: This file now uses server-side authentication from lib/server-api.ts
 * to properly handle httpOnly cookies for admin operations.
 */

import { fetchAPI as serverFetchAPI, postAPI as serverPostAPI, putAPI as serverPutAPI, deleteAPI as serverDeleteAPI } from '@/app/lib/server-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
    // CMS Endpoints
    cms: {
        banners: `${API_BASE_URL}/cms/banners/`,
        activities: `${API_BASE_URL}/cms/activities/`,
        faqs: `${API_BASE_URL}/cms/faqs/`,
        testimonials: `${API_BASE_URL}/cms/testimonials/`,
        pages: `${API_BASE_URL}/cms/pages/`,
        socialLinks: `${API_BASE_URL}/cms/social-links/`,
        gallery: `${API_BASE_URL}/cms/gallery/`,
        freeEntries: `${API_BASE_URL}/cms/free-entries/`,
        page_sections: `${API_BASE_URL}/cms/page-sections/`,
        stat_cards: `${API_BASE_URL}/cms/stat-cards/`,
        timeline_items: `${API_BASE_URL}/cms/timeline-items/`,
        value_items: `${API_BASE_URL}/cms/value-items/`,
        contact_info: `${API_BASE_URL}/cms/contact-info/`,
        party_packages: `${API_BASE_URL}/cms/party-packages/`,
        pricing_plans: `${API_BASE_URL}/cms/pricing-plans/`,
        facility_items: `${API_BASE_URL}/cms/facility-items/`,
        guideline_categories: `${API_BASE_URL}/cms/guideline-categories/`,
        legal_documents: `${API_BASE_URL}/cms/legal-documents/`,
        menu_sections: `${API_BASE_URL}/cms/menu-sections/`,
        group_packages: `${API_BASE_URL}/cms/group-packages/`,
        group_benefits: `${API_BASE_URL}/cms/group-benefits/`,
        contact_messages: `${API_BASE_URL}/cms/contact-messages/`,
    },

    // Core Endpoints
    core: {
        users: `${API_BASE_URL}/core/users/`,
        settings: `${API_BASE_URL}/core/settings/`,
        dashboard: `${API_BASE_URL}/core/dashboard/`,
    },

    // Bookings Endpoints
    bookings: {
        customers: `${API_BASE_URL}/bookings/customers/`,
        bookings: `${API_BASE_URL}/bookings/bookings/`,
        waivers: `${API_BASE_URL}/bookings/waivers/`,
        transactions: `${API_BASE_URL}/bookings/transactions/`,
        bookingBlocks: `${API_BASE_URL}/bookings/booking-blocks/`,
    },

    // Shop Endpoints
    shop: {
        products: `${API_BASE_URL}/shop/products/`,
    },

    // Auth Endpoints
    auth: {
        token: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/token/`,
        refresh: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/token/refresh/`,
    },
};

/**
 * Helper function to fetch data from API
 * Uses server-side authentication with httpOnly cookies
 */
export async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const response = await serverFetchAPI(endpoint, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

/**
 * Helper function to post data to API
 * Uses server-side authentication with httpOnly cookies
 */
export async function postAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const result = await serverPostAPI(endpoint, data);

    if (result === null) {
        throw new Error('Authentication failed');
    }

    return result as T;
}

/**
 * Helper function to update data via API
 * Uses server-side authentication with httpOnly cookies
 */
export async function putAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const result = await serverPutAPI(endpoint, data);

    if (result === null) {
        throw new Error('Authentication failed');
    }

    return result as T;
}

/**
 * Helper function to delete data via API
 * Uses server-side authentication with httpOnly cookies
 */
export async function deleteAPI(url: string, options?: RequestInit): Promise<void> {
    // Extract just the endpoint path from the full URL
    const endpoint = url.replace(API_BASE_URL, '');
    const result = await serverDeleteAPI(endpoint);

    if (result === null || result === false) {
        throw new Error('Failed to delete resource');
    }
}

export default API_ENDPOINTS;
