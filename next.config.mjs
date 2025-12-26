/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            encoding: false,
            path: false, // face-api.js might use path too
            crypto: false, // often needed
        };
        return config;
    },
};

export default nextConfig;
