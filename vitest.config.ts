import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true,
    setupFiles: ["./src/test/setup.ts"],
    environmentMatchGlobs: [["src/components/**/*.test.tsx", "jsdom"]],
  },
});
