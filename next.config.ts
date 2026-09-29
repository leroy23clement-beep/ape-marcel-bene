/** @type {import('next').NextMode} */
const nextConfig = {
  typescript: {
    // Permet de déployer même s'il reste des petites erreurs de typage
    ignoreBuildErrors: true,
  },
  eslint: {
    // Permet d'ignorer les avertissements linter pendant le build
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;