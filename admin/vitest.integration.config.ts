import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    include: ["Tests/integration/**/*.test.{ts,tsx}"],
    setupFiles: ["./Tests/integration/setup.ts"],
    globals: true,
  },
});
