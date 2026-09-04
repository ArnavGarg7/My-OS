import type { MetadataRoute } from "next";
import { APP_NAME, APP_TAGLINE } from "@myos/shared/constants";

/**
 * Web App Manifest (Sprint 1.7). Makes My OS installable as a standalone
 * desktop/mobile app. Served by Next at /manifest.webmanifest and auto-linked.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_TAGLINE,
    start_url: "/command-center",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#0c0d0e",
    theme_color: "#0c0d0e",
    categories: ["productivity", "lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Command Center",
        short_name: "Command",
        description: "Understand your day at a glance",
        url: "/command-center",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Today",
        short_name: "Today",
        description: "Operate your day",
        url: "/today",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Inbox",
        short_name: "Inbox",
        description: "Open the inbox",
        url: "/inbox",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Settings",
        short_name: "Settings",
        description: "Open preferences",
        url: "/settings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "My OS on desktop",
      },
      {
        src: "/screenshots/mobile.png",
        sizes: "720x1280",
        type: "image/png",
        form_factor: "narrow",
        label: "My OS on mobile",
      },
    ],
  };
}
