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
                source: '/contact-us',
                destination: '/contact',
                permanent: true,
            },
            {
                source: '/information/about-us',
                destination: '/about',
                permanent: true,
            },
            {
                source: '/information/facilities',
                destination: '/facilities',
                permanent: true,
            },
            // FAQs & Help
            {
                source: '/faqs',
                destination: '/faq',
                permanent: true,
            },
            {
                source: '/information/faqs',
                destination: '/faq',
                permanent: true,
            },
            // Terms, Privacy & Safety
            {
                source: '/information/terms',
                destination: '/terms',
                permanent: true,
            },
            {
                source: '/information/privacy-policy',
                destination: '/privacy',
                permanent: true,
            },
            {
                source: '/information/cookies',
                destination: '/privacy',
                permanent: true,
            },
            {
                source: '/information/your-rights',
                destination: '/privacy',
                permanent: true,
            },
            {
                source: '/information/disclaimer',
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
                destination: '/safety',
                permanent: true,
            },
            // Booking Flows
            {
                source: '/step-1',
                destination: '/book',
                permanent: true,
            },
            {
                source: '/information/session-booking',
                destination: '/pricing',
                permanent: true,
            },
            {
                source: '/session-booking/information',
                destination: '/pricing',
                permanent: true,
            },
            {
                source: '/session-booking',
                destination: '/pricing',
                permanent: true,
            },
            {
                source: '/information/party-booking',
                destination: '/parties',
                permanent: true,
            },
            {
                source: '/party-booking/information',
                destination: '/parties',
                permanent: true,
            },
            {
                source: '/party-booking',
                destination: '/parties',
                permanent: true,
            },
            // General Information Catch-all
            {
                source: '/information',
                destination: '/faq',
                permanent: true,
            },
            // Legacy Attractions
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
            // Legacy Waiver Links
            {
                source: '/information/waiver',
                destination: '/waiver',
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;
