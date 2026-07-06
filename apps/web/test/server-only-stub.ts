// Test stub for the `server-only` marker package. In tests there is no RSC
// boundary to enforce, so this resolves to an empty module (aliased in
// vitest.config.ts). Production/build still use the real `server-only`.
export {};
