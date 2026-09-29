import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default creativeConfig // (ou garde export default nextConfig selon ton fichier d'origine)