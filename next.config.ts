/** @type {import('Next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore les erreurs de type pendant le build Vercel
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig