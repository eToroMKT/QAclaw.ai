import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/**/*.spec.*", "node_modules"],
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 40,
        lines: 50
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
