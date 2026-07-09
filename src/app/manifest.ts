import type { MetadataRoute } from "next";

// Kopitiam Modern tokens as hex (manifests can't read CSS variables):
// background/theme = --background (light), matching the icon backdrop.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ask Ah Mah",
    short_name: "Ah Mah",
    description:
      "Ah Mah remembers what's in your kitchen and cooks alongside you. No forms, no spreadsheets — just chat.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7ebdc",
    theme_color: "#f7ebdc",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
