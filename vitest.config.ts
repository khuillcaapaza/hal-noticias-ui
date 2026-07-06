import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
      provider: "istanbul",
      all: false,
      // api.ts es una capa cliente HTTP; se prueba indirectamente a través de los
      // tests de componentes (que mockean el módulo). types.ts es solo tipos.
      // No hay código de negocio en src/lib/ que requiera umbral de cobertura.
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/types.ts", "src/lib/api.ts"],
      reporter: ["text", "text-summary"],
    },
  },
});
