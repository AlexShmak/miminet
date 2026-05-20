import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        // Pure-logic tests in tests/unit/, component tests in tests/component/.
        include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/**/*.ts", "src/**/*.tsx"],
            exclude: ["src/**/*.test.{ts,tsx}", "src/main.ts", "src/globals.d.ts"],
        },
    },
});
