import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

/**
 * Flat ESLint config for the My OS monorepo.
 * Enforces the layering/import-direction rule from 08_Developer_Guidelines.md §1:
 *   ui -> (nothing app-specific) ; shared -> nothing ; core -> shared ;
 *   db -> shared ; ai -> core, db, shared ; apps -> everything.
 */
export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/migrations/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "import/resolver": {
        typescript: {
          project: ["packages/*/tsconfig.json", "apps/*/tsconfig.json"],
        },
      },
      "boundaries/elements": [
        { type: "shared", pattern: "packages/shared/**" },
        { type: "core", pattern: "packages/core/**" },
        { type: "db", pattern: "packages/db/**" },
        { type: "ai", pattern: "packages/ai/**" },
        { type: "ui", pattern: "packages/ui/**" },
        { type: "app", pattern: "apps/**" },
      ],
      "boundaries/ignore": ["**/*.config.{ts,js,mjs}", "**/*.test.{ts,tsx}"],
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "shared", allow: [] },
            { from: "ui", allow: [] },
            { from: "core", allow: ["shared"] },
            { from: "db", allow: ["shared"] },
            { from: "ai", allow: ["shared", "core", "db"] },
            { from: "app", allow: ["shared", "core", "db", "ai", "ui", "app"] },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  prettier,
);
