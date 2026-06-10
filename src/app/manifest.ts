import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Noor — Prières sur le Prophète",
    short_name: "Noor",
    description:
      "Dalail al-Khayrat, Dakhirat al-Muhtaj et autres recueils — lecteur arabe paramétrable.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf7ef",
    theme_color: "#0f3d33",
    lang: "fr",
    dir: "ltr",
    categories: ["books", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Dalail al-Khayrat",
        short_name: "Dalail",
        url: "/dalail",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Kitab Dakira",
        short_name: "Dakira",
        url: "/dakhira",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Recherche",
        short_name: "Rechercher",
        url: "/recherche",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
