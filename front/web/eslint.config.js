import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    {
        ignores: ["dist/", "node_modules/", "../src/static/dist/"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                FormData: "readonly",
                jQuery: "readonly",
                $: "readonly",
            },
        },
        rules: {
            // The shadowing/redeclare class of bug that caused Phase 4's
            // regressions (let nodes = data.nodes shadowing the global) —
            // these rules would have caught it statically.
            "no-shadow": "off",
            "@typescript-eslint/no-shadow": "error",
            "no-redeclare": "off",
            "@typescript-eslint/no-redeclare": "error",
            "prefer-const": "error",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            // The codebase intentionally uses `any` where shapes are
            // dynamic; Phase 5 banned only implicit any. Tighten in later
            // phases as types mature.
            "@typescript-eslint/no-explicit-any": "off",
            // `declare` blocks in globals.d.ts use empty interfaces by
            // convention; allow them.
            "@typescript-eslint/no-empty-object-type": "off",
        },
    },
    prettier
);
