import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    include: ["Tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./Tests/unit/setup.ts"],
    globals: true,
  },
});
