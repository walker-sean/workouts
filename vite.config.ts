import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: "prompt",
    includeAssets: ["icon-192.png", "icon-512.png", "icon-maskable.png"],
    manifest: {
      name: "Workouts",
      short_name: "Workouts",
      description: "Personal workout tracker",
      theme_color: "#0e0e10",
      background_color: "#0e0e10",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      icons: [
        { src: "icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
  }), cloudflare()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
})