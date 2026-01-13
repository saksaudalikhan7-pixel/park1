// API Configuration - Production URLs
// This ensures the frontend always connects to the production backend
export const PRODUCTION_API_URL = 'https://ninjainflablepark-gbhwbbdna5hjgvf9.centralindia-01.azurewebsites.net/api/v1';

// Use environment variable if set, otherwise use production URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || PRODUCTION_API_URL;

export default API_URL;
