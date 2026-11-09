import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/coverageSetup.js"],
    isolate: true
  }
});