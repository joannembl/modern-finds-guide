import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5273/modern-finds-guide/",
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {},
  },
  webServer: [
    {
      command: "npm start -- --port 5273 --strictPort",
      url: "http://127.0.0.1:5273/modern-finds-guide/",
      reuseExistingServer: !process.env.CI,
      env: { VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" },
    },
    {
      command: "npm start -- --port 5274 --strictPort",
      url: "http://127.0.0.1:5274/modern-finds-guide/",
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_SUPABASE_URL: "https://mfg-test.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      },
    },
  ],
});
