# My OS Documentation

The documentation set produced at the **Phase 4.5 Architecture Freeze**. My OS is a single-user,
self-hosted, fully deterministic personal life operating system. This set certifies the system is
stable, documented, and ready for the Phase 5 AI layer.

## Start here

- [Architecture Overview](./architecture/overview.md) — layers, module pattern, invariants.
- [Developer Handbook](./handbook.md) — how to build in this codebase, gates, pitfalls.

## Architecture

- [Domains & Ownership](./architecture/domains.md) — the 23 domains, one owner each.
- [Integration Seams](./architecture/integrations.md) — the only places domains meet.
- [Data Flow](./architecture/data-flow.md) — request/read-model lifecycle & boundaries.
- [Dependency Graph](./architecture/dependency-graph.md) — *generated*: 0 cross-domain imports, 0 cycles.

## API & Database

- [Public API Surface](./api/public-api.md) — *generated*: the frozen contract.
- [Database Schema](./database/schema.md) — *generated*: tables, indexes, knowledge links.

## Performance

- [Core Derivation Baseline](./performance/baseline.md) — *generated*: µs per read model.
- [Bundle Report](./performance/bundle.md) — *generated*: first-load JS per route.

## Security

- [Data Classification](./security/data-classification.md) — *generated*: every domain classified + AI-safe boundary.

## AI Readiness (Phase 5)

- [Extension Guidelines](./ai-readiness/extension-guidelines.md) — rules the AI layer must follow.
- [AI Readiness Certification](./ai-readiness/certification.md) — the freeze report.

## Regenerating the generated docs

```bash
node scripts/api-audit.mjs --write
node scripts/dependency-graph.mjs --write
node scripts/schema-audit.mjs --write
node scripts/security-audit.mjs --write
node scripts/benchmark.mjs --write
node scripts/bundle-report.mjs --write   # after a production build
```
