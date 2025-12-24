/**
 * Centralized API configuration for Ninja Inflatable Park
 * All backend API endpoints are defined here
 */

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
 * Helper to get CSRF token from cookies
 */
function getCSRFToken(): string | null {
    if (typeof document === 'undefined') return null;
    const name = 'csrftoken';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

/**
 * Common headers for all requests
 */
function getHeaders(options?: RequestInit): HeadersInit {
    const headers: any = {
        'Content-Type': 'application/json',
        ...options?.headers,
    };

    // Auto-attach CSRF Token for browser requests
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
    }

    return headers;
}

/**
 * Helper function to fetch data from API
 */
export async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: getHeaders(options),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Helper function to post data to API
 */
export async function postAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        ...options,
        headers: getHeaders(options),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Helper function to update data via API
 */
export async function putAPI<T>(url: string, data: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        method: 'PUT',
        ...options,
        headers: getHeaders(options),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Helper function to delete data via API
 */
export async function deleteAPI(url: string, options?: RequestInit): Promise<void> {
    const response = await fetch(url, {
        method: 'DELETE',
        ...options,
        headers: getHeaders(options),
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
}

export default API_ENDPOINTS;
