import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next croyait que la racine du projet était `C:\Site` (dossier parent) et
  // ignorait le `package-lock.json` du projet : le rafraîchissement à chaud
  // s'en trouvait ralenti. On fixe explicitement la racine.
  turbopack: {
    root: import.meta.dirname,
  },
  // `ignoreBuildErrors: true` masquait la totalité des erreurs de type, dont
  // celle qui cassait le build (components/TeamForm.tsx). Les erreurs de type
  // ne sont plus ignorées ; `tsc --noEmit` doit rester vert avant de merger.
  typescript: {
    ignoreBuildErrors: false,
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

export default nextConfig
