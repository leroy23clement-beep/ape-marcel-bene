import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "APE Marcel Béné",
    short_name: "APE Béné",
    description: "Portail des parents d'élèves de l'école Marcel Béné",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7e22ce", // Couleur violette APE
    icons: [
      {
        src: "/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
  }
}