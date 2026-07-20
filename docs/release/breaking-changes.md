# Breaking Changes — v1.0.0-rc1

**None.** This is the first release candidate; there is no prior published version to break from.

From `v1.0.0-rc1` onward the public APIs listed in [docs/api/public-api.md](../api/public-api.md) and the protected areas of [ADR-010](../adr/ADR-010.md) are **frozen**. Any future breaking change must:

1. Be justified in a new ADR.
2. Ship a migration path (data + code).
3. Be recorded here with a before/after and an upgrade note.

## Versioning

Semantic versioning starts here:

- `v1.0.0-rc1` → release candidate (frozen baseline).
- `v1.0.0` → first stable release.
- `v1.x` → additive, backward-compatible.
- `v2.0` → reserved for a deliberate breaking evolution (with ADR + migrations).
