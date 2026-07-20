# Package Standards

Every workspace package/app must contain — validated by `scripts/package-health.mjs`:

| Artifact | packages | apps |
|---|---|---|
| `package.json` | ✅ | ✅ |
| `README.md` (purpose/architecture/deps/API/examples/extension) | ✅ | ✅ |
| `typecheck` script | ✅ | ✅ |
| `src/index.ts` single barrel | ✅ | — |
| `exports` map (root `.` + declared subpaths) | ✅ | — |
| tests (or a `check` validation script) | ✅ | — |

## Rules

- **One public barrel per package.** Consumers import the package root or a **declared** subpath — never `@myos/x/src/...` (enforced by `scripts/export-validator.mjs`).
- **Dependency direction** must match the [layered graph](../diagrams/dependency-graph.md); no cycles, no forbidden edges (`core`→`ai`, `ai`→`db`, etc.).
- **Ownership** is documented in each README's "Extending" section.
- Adding a subpath export requires a real target file and an `exports` entry.
