import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const configDir = dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, configDir, "VITE_");

  if (mode !== "development" && !env.VITE_API_BASE_URL?.trim()) {
    throw new Error("VITE_API_BASE_URL is required for non-development builds");
  }

  return {
    plugins: [tailwindcss(), react()],
  };
});
