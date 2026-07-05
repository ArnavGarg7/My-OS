import { defineConfig } from "tsup";

/**
 * Bundle the worker to a single ESM file. Workspace packages export TypeScript
 * source, so they must be inlined (noExternal); node dependencies stay external
 * and are resolved from node_modules at runtime.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  noExternal: [/^@myos\//],
});
