import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/modern-finds-guide/",
  test: { include: ["src/**/*.test.js"] },
});
