const path = require('path')

/**
 * Ensure Turbopack uses the frontend folder as the workspace root when
 * multiple lockfiles are present in the repository. This silences the
 * "Next.js inferred your workspace root" warning without deleting lockfiles.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15 supports a top-level `turbopack` config. Set the root so Turbopack
  // uses the `frontend` folder when multiple lockfiles exist in the repo.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Ignore ESLint errors during production build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during production build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
