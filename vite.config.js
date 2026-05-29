import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const configDir = dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, configDir, "VITE_");
  const hasApiBase = Boolean(env.VITE_API_BASE_URL?.trim());
  const useSameOriginApi = String(env.VITE_USE_SAME_ORIGIN_API || "").toLowerCase() === "true";

  if (mode !== "development" && !hasApiBase && !useSameOriginApi) {
    throw new Error(
      "Thiếu cấu hình API production: set VITE_API_BASE_URL hoặc VITE_USE_SAME_ORIGIN_API=true"
    );
  }

  return {
    plugins: [tailwindcss(), react()],
  };
});
