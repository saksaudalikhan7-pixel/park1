/**
 * Utility functions for handling media URLs from the backend
 */

/**
 * Converts a relative backend media URL to an absolute URL
 * Also rewrites old port 8000 URLs to use the current API port
 * @param url - The URL from the backend (could be relative or absolute)
 * @returns Absolute URL pointing to the backend server
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';

    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

    // If it's an absolute URL with localhost:8000, rewrite it to use the current API port
    if (url.includes('localhost:8000')) {
        return url.replace('http://localhost:8000', API_BASE);
    }

    // If it's already an absolute URL (http/https), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it's a relative media URL, convert to absolute
    if (url.startsWith('/media/') || url.startsWith('media/')) {
        return `${API_BASE}${url.startsWith('/') ? url : '/' + url}`;
    }

    // specific handling for uploads and logos folders
    if (url.startsWith('uploads/') || url.startsWith('/uploads/') ||
        url.startsWith('logos/') || url.startsWith('/logos/')) {
        return `${API_BASE}/media${url.startsWith('/') ? url : '/' + url}`;
    }

    // For other relative URLs, return as is (might be data URLs, blob URLs, or frontend static images)
    return url;
}
