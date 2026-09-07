import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/Procesos/" : "/",
  plugins: [react()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
