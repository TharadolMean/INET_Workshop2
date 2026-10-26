# Development, tests and operations

## Local Node development

Use Node.js 22 and a local MongoDB replica set. Preserve any existing database; tests use separate database names and do not target the development database.

1. Install backend and frontend dependencies with `npm ci` in each directory.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGO_URI`, a random `JWT_SECRET` with at least 32 characters, and a unique 12–72 character `ADMIN_PASSWORD`.
3. Start a local MongoDB replica set and include `?replicaSet=rs0` in `MONGO_URI` for checkout, cancellation and stock adjustment.
4. Start the backend with `npm run dev` from `backend`; start the frontend with `npm run serve` from `frontend`.

## Docker Compose

1. Copy `docker.env.example` to `.env` at the project root. Replace the secret/password placeholders with unique local values; the placeholders are intentionally rejected by the app.
2. Run `docker compose up --build` and open `http://localhost:8080`. The Compose healthcheck initializes a single-node replica set. The first backend start creates an Admin only if that email is not already present.
3. Uploaded product images and MongoDB records persist in named volumes. `docker compose down` stops containers and preserves both. `docker compose down -v` deletes those local volumes and all data stored in them; do not use it when the data is needed.

The compose MongoDB database is `electrohub_v2`; it is separate from the workshop's existing local database. The MongoDB port is bound to `127.0.0.1` only.

## Development-only demo accounts

There are no built-in demo passwords. To create an approved demo customer (and ensure a development Admin exists), set distinct `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_CUSTOMER_EMAIL`, and `DEMO_CUSTOMER_PASSWORD` values, and explicitly set `DEMO_SEED_CONFIRM=local-demo-only`. Passwords must be unique, non-placeholder values 12–72 characters long.

Run `npm run db:seed:demo` from `backend`, or `docker compose exec backend npm run db:seed:demo`. The command refuses `NODE_ENV=production`, validates the confirmation string before connecting, does not overwrite existing passwords, and refuses role conflicts. Keep the confirmation and demo credentials out of production environments.

## Automated checks

Backend unit tests:

```bash
cd backend
npm ci
npm test
```

API integration and concurrency tests run only when `MONGO_TEST_URI` points to a disposable local MongoDB replica-set database with `test` in its database name. Each suite connects to a separately suffixed database and cleans its own fixtures. Example:

```powershell
$env:MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/electrohub_test?replicaSet=rs0'
npm test
Remove-Item Env:MONGO_TEST_URI
```

Do not set `MONGO_TEST_URI` to a database containing user data. Without it, API integration tests are reported as skipped; unit tests still run.

Frontend component tests and production build:

```bash
cd frontend
npm ci
npm run test:unit -- --ci
npm run build
```

GitHub Actions runs the backend suite against an ephemeral MongoDB replica set, then runs Vue component tests and the production build. It does not require repository secrets, create demo users, or deploy/publish the site.

The existing Vue 2.7 stack is retained. `npm audit --omit=dev` currently reports the Vue 2.7.16 ReDoS advisory; resolving that finding requires a framework upgrade and remains an accepted project risk under the current stack constraint. Full audit output also includes legacy Vue CLI/Jest development-tool advisories. Do not run `npm audit fix --force` as it proposes breaking framework/toolchain changes.

## Migrations and rollback

- Phase 0's optional `npm run db:migrate:archive` is repeatable and only adds archive defaults to Product documents that lack them. It does not delete or unarchive products. Back up the database first if running it on important data.
- Later model additions are optional fields or new collections and do not require an automatic migration. Existing Orders are not rewritten.
- Phase 5 starts `InventoryAdjustment` history at deployment; old manual stock changes have no reconstructable audit events.
- Roll back application code by redeploying the previous version. Leave additive fields and collections in place unless a separate reviewed data-retention plan says otherwise. Do not reset the database to roll back code.

## Manual checks

Use the manual verification checklists in `V2_ROADMAP.md` after the automated suite. At minimum verify customer/admin permissions, checkout and cancel transaction behavior, coupon limits, product comparison/pagination, inventory adjustment history, CSV output and a responsive frontend layout.
