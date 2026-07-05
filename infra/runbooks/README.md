# Runbooks

Operational runbooks (08_Developer_Guidelines.md §6). Each is a numbered,
tested command list. Populated as the relevant subsystems land:

- `deploy.md` — build images, run migrations, `docker compose up -d` (Stage 0/12)
- `restore.md` — restore from an encrypted backup snapshot (Stage 12)
- `password-reset.md` — server-side CLI password/recovery reset (Stage 1)
- `key-rotation.md` — VAPID / session / backup key rotation
- `vps-migration.md` — move the stack to a new host
- `benchmarks.md` — recorded NFR measurements (Stage 12)

## Sprint 1.1 — local bring-up

```bash
# 1. Start Postgres
docker compose -f infra/compose.dev.yml up -d

# 2. Prepare env + install
cp .env.example .env
pnpm install

# 3. Apply extensions + (empty) baseline migration, then verify connectivity
pnpm db:migrate
pnpm db:check

# 4. Run the app + worker
pnpm dev            # web on http://localhost:3000
pnpm worker:dev     # worker (separate terminal)
```
