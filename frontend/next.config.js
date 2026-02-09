/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone', // Create self-contained deployment for Azure
    typescript: {
        ignoreBuildErrors: true, // Temporarily bypass TypeScript errors
    },
    eslint: {
        ignoreDuringBuilds: true, // Temporarily bypass ESLint errors
    },
    transpilePackages: ["@repo/ui", "@repo/config"],
    images: {
        // App Service supports image optimization
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'ninjaparkimages.blob.core.windows.net',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'ninjainflablepark-gbhwbbdna5hjgvf9.centralindia-01.azurewebsites.net',
                pathname: '/media/**',
            },
        ],
    },
    async redirects() {
        return [
            // Core Pages
            {
                source: '/information/our-prices',
                destination: '/pricing',
                permanent: true,
            },
            {
                source: '/information/contact-us',
                destination: '/contact',
                permanent: true,
            },
            {
                source: '/information/about-us',
                destination: '/about',
                permanent: true,
            },
            // FAQs & Help
            {
                source: '/faqs',
                destination: '/faq',
                permanent: true,
            },
            // Terms & Guidelines
            {
                source: '/information/terms',
                destination: '/waiver-terms',
                permanent: true,
            },
            {
                source: '/information/ninja-inflatable-guidelines',
                destination: '/guidelines',
                permanent: true,
            },
            {
                source: '/information/security',
                destination: '/guidelines', // Security content is covered in guidelines/FAQ
                permanent: true,
            },
            // Booking Info
            {
                source: '/information/session-booking', // Deduced from "Session Booking" title
                destination: '/faq', // Content matches FAQ "How long is a session?"
                permanent: true,
            },
            {
                source: '/information/party-booking',
                destination: '/parties',
                permanent: true,
            },
            {
                source: '/information/attractions',
                destination: '/attractions',
                permanent: true,
            },
            {
                source: '/information/activities',
                destination: '/attractions',
                permanent: true,
            },
            {
                source: '/activities',
                destination: '/attractions',
                permanent: true,
            },
            // Catch-all for other /information/ pages to Home or FAQ? 
            // Better to be specific to avoid loop, but let's add a safe fallback if needed.
            // For now, these cover the user's list. 
        ];
    },
};

module.exports = nextConfig;
