/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Enable static HTML export for Azure Static Web Apps
    transpilePackages: ["@repo/ui", "@@repo/config"],
    images: {
        unoptimized: true, // Required for static export
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
};

module.exports = nextConfig;
