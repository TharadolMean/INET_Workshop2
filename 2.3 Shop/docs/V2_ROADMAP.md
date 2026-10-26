# ElectroHub Shop V2 — Audit and Roadmap

## Repository audit

### Current architecture

- Backend: Express 5 with Mongoose models and controller-based REST routes under `/api/v1`; JWT authentication and role checks live in middleware. Responses use `{ status, message, data }`.
- Data: `User`, `Product`, `Category`, and `Order` models. Orders support both Workshop 01 legacy single-product fields and newer multi-item snapshot records.
- Checkout: both multi-item and legacy single-item checkout now use MongoDB transactions for stock, Order and movement consistency. Cancellation also restores stock and writes audit records in a transaction.
- Frontend: Vue 2.7, Vuetify 2, Vue Router 3, Vuex 3 and Axios. Reusable product, cart, layout and service modules already exist. Product image uploads use Multer and local disk storage.
- Development: local `.env` files are ignored. The README already documents the local MongoDB replica-set requirement for multi-item transactions.

### Existing behavior to preserve

- Registration creates an unapproved customer; an admin must approve the account before login.
- Existing customer/admin role checks and the `{ status, message, data }` API envelope.
- Product/category management, image upload, single-item legacy orders, multi-item checkout, and existing order price/name snapshots.
- Existing local MongoDB database contents. No reset or destructive schema migration is required.

### Findings and risks

1. **Historical order loss (critical):** product deletion physically removed the product and every order referencing it. This is replaced in Phase 0 by archival; order documents and product image files remain.
2. **Cart cross-account leakage (high):** every browser account used `shop_cart`. The frontend now stores carts under `shop_cart_<userId>` and loads the correct cart after login.
3. **Weak bootstrap configuration (high):** startup seeded a predictable `admin1234` account and accepted a placeholder JWT secret. Startup now rejects missing/short/known-placeholder JWT secrets, and initial admin creation requires explicit `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. **Stock and checkout:** conditional atomic decrements and multi-item transactions already exist. Checkout now also excludes archived products. A replica set or mongos remains required for multi-item checkout.
5. **Authorization:** routes require an approved authenticated user and admin routes check the current database role. JWT subject validation and exact Bearer-header parsing are tightened. Registration validates email/password bounds and handles concurrent duplicate registrations; the approval endpoint only approves customer accounts.
6. **Images:** Multer already supports JPG, PNG and WebP with a 5 MB limit and random filenames. MIME type is checked from the request metadata, not file contents; content sniffing remains a security improvement for a later phase.
7. **Migration compatibility:** missing `isArchived` fields on old MongoDB documents are treated as active (`$ne: true` queries); Mongoose also defaults the field to `false`. No migration is required to keep old data readable. An optional idempotent script sets `isArchived:false` and `archivedAt:null` only on documents missing `isArchived`; it never deletes documents or changes archived records. No destructive rollback is needed for this additive default.
8. **Testing debt:** there was no test script or automated test suite. Phase 0 adds Node's built-in test runner; Phases 1–2 add transaction and dashboard aggregation integration coverage. Broader API, UI component and stress/concurrency coverage remains planned for Phase 6.
9. **Branch/worktree:** the checkout started on `mean`, tracking `origin/mean`; Phase 0 is now on `electrohub-v2-phase0`. A pre-existing edit in the repository-root `.gitignore` ignores uploaded product images and is retained. It was not overwritten.

### Reusable code and architecture improvements

- Keep the current controllers, response helper, Mongoose models, service modules and Vuex modules. Extend them incrementally instead of introducing a new framework or API envelope.
- Keep server-side ownership, permissions, price calculation and stock changes authoritative. Add dedicated services only when order status, inventory history and coupon flows make controller responsibilities too large.
- Keep development uploads local. A later phase can add content-based image validation and cleanup policies without requiring a paid storage provider.

## Phase 0 — Foundation and data integrity (implemented in this pass)

### Changes

- Add additive `Product.isArchived` and `Product.archivedAt` fields.
- Change product DELETE semantics to archive the product. Add an admin-only restore endpoint. Archived products are hidden from normal reads, while admins can request `includeArchived=true`.
- Preserve orders and uploaded images when a product is archived. Block reads and checkout for archived products; checkout still validates stock atomically.
- Partition browser cart storage by authenticated user ID and switch the Vuex cart when the account changes.
- Require a non-placeholder JWT secret at startup. Remove the predictable bootstrap admin password; require explicit admin credentials only when creating the first admin.
- Add an explicit development-only CLI for rotating an existing admin password without changing it during startup.
- Tighten token subject/header checks, registration validation and duplicate-email handling; limit approval to customer accounts.
- Add baseline `node:test` config and model compatibility checks.

### API and data changes

- `DELETE /api/v1/products/:id` now archives and returns the archived product with message `archived`.
- `POST /api/v1/products/:id/restore` restores an archived product (admin only).
- `GET /api/v1/products?includeArchived=true` includes archived rows only for an admin; all other reads omit archived products.
- New product fields are additive. Legacy documents without these fields remain active. No automatic data rewrite runs at server startup.

### Local database and admin setup

1. Keep the current database and take a normal backup before any later production migration.
2. Set `MONGO_URI`, a random `JWT_SECRET` of at least 32 characters, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` in the ignored `backend/.env` file.
3. Existing admin accounts are not changed by this update. The admin variables are used only if a new bootstrap account must be created. The current ignored local `.env` was inspected without printing values: its JWT secret is non-placeholder and 64 characters, but its admin password is the old `admin1234` default. Rotate that account manually with the documented `npm run admin:reset-password` command; this pass does not connect to or change the local database.
4. Multi-item checkout continues to require MongoDB configured as a replica set or mongos. No Phase 0 migration is necessary. If desired, backfill `isArchived:false` only for rows where the field is absent; this is repeatable and non-destructive. There is no destructive rollback.

### Phase 0 manual verification

1. Start the existing local MongoDB database and backend with a valid JWT secret; verify a current admin can sign in.
2. As admin, archive a product that appears in an old order. Confirm it disappears from the customer product list, remains in admin results with `includeArchived=true`, and the customer/admin order history still shows its stored item name and price.
3. Attempt checkout with an archived product ID directly; confirm the API rejects it and does not decrement stock. Restore the product and confirm it becomes visible again.
4. Sign in as customer A, add an item, sign out and sign in as customer B in the same browser. Confirm B sees a separate cart; sign back in as A and confirm A's cart remains.
5. If the current local admin still uses the old workshop password, rotate it with the documented development CLI before sharing the environment.
6. Optionally run `npm run db:migrate:archive` twice and confirm the second run reports zero updated documents.

## Phase 1 — Order and inventory system (implemented in this pass)

- Add order statuses (`pending`, `confirmed`, `packing`, `shipped`, `delivered`, `cancelled`), backend-enforced forward transitions, actor/time history, customer cancellation, and admin status APIs.
- Permit customer cancellation from `pending` or `confirmed`. Use a transaction and `stockRestored` marker; a repeated cancellation returns the cancelled order without restoring stock again.
- Record checkout and cancellation stock movements with quantity delta, before/after stock, actor, order, reason and timestamp. Admins can read the movement history.
- Keep legacy single-product fields readable and cancellable only when their status permits it. Status-less legacy orders default to `delivered` to avoid restoring stock for an order that may already have shipped. Their earlier status history cannot be reconstructed.
- Multi-item checkout, legacy single-item checkout and cancellation now require MongoDB replica set or mongos so stock, order and movement records commit together.
- Add transition/legacy unit tests and opt-in integration tests for invalid transitions, packing cancellation, concurrent cancellation, oversell races and dashboard aggregation. Set `MONGO_TEST_URI` to a disposable database whose name includes `test`; each suite uses a separate suffixed database and cleans up only its records.

### Phase 1 manual verification

1. Use a disposable MongoDB replica-set database. Place both legacy single-product and multi-item orders and verify each starts as `pending` with an initial history event.
2. As admin, try to jump from `pending` to `shipped` (expect `409`), then advance through `confirmed`, `packing`, `shipped` and `delivered`.
3. As a customer, cancel an order in `pending` and another in `confirmed`; verify stock is restored once, then retry the cancel request and confirm stock does not change again.
4. Try customer cancellation at `packing` and confirm it is rejected without changing status or stock. Confirm another customer cannot cancel the order.
5. As admin, cancel a `pending` or `confirmed` order and verify the status timeline and stock movement audit include the actor and before/after counts.
6. Inspect `GET /api/v1/inventory/movements` as admin and confirm customer requests receive `403`.
7. Read an existing status-less Order; confirm it appears as `delivered` with a note that no earlier history is available and cannot be cancelled.

## Phase 2 — Admin dashboard (implemented in this pass)

- Add admin-only `GET /api/v1/admin/dashboard` MongoDB aggregation for order totals/value, customers, products/stock, recent orders, best sellers, status distribution and filled daily/monthly trend buckets.
- Exclude cancelled orders from active order value, trends and best-selling quantities. Clearly label order value as simulated and not paid revenue.
- Validate UTC `from`/`to` dates, range ordering/size, and `day`/`month` interval. Default to the last 30 days; daily ranges max at 366 days and total ranges max at 10 years.
- Add low-stock summaries for active products, dashboard cards/charts/tables, date filters, and loading/empty/error states. Customer count includes all role `user` accounts; product inventory counts exclude archived products.

### Phase 2 manual verification

1. Sign in as Admin and open `/admin/dashboard`; confirm every card/table/chart loads from the API and that the simulated order value notice is visible.
2. Change the date range and interval. Compare Order count/value, status distribution, recent Orders, best sellers and new-customer count with the matching records in MongoDB.
3. Confirm cancelled Orders remain in status distribution and total order count but do not affect simulated order value, trend value or best-selling quantities.
4. Confirm legacy single-product Orders and status-less Orders appear in totals; status-less rows count as `delivered`.
5. Confirm archived products do not affect active product/stock summaries or low-stock alerts. Check zero, low, and normal stock cases.
6. Try an invalid date, reversed range, and daily range over 366 days; expect a validation response and an inline UI error.
7. Call `GET /api/v1/admin/dashboard` with a customer token; confirm `403`.

## Phase 3 — Storefront and admin UX

- Implemented responsive catalog discovery with name/description/category search, category selection, sorting, price range and in-stock filters; added keyboard-accessible category controls and live result counts.
- Product details show real uploaded gallery images, structured specifications and related products from the catalog. Legacy `image` remains the primary-image field while the additive `images` array supports up to eight new gallery uploads; existing records need no migration.
- Catalog and active category reads are public through optional JWT authentication. Archived products remain admin-only through the existing `includeArchived=true` behavior; basket, checkout, orders and admin operations remain protected by existing authentication and approval checks.
- Added persistent light/dark theme controls in storefront and admin shells, accessible image descriptions and controls, and retained existing loading/error/empty and cart/checkout feedback states.
- Product form and backend validation accept up to 30 structured `{ name, value }` specifications and up to eight gallery files. Existing single-image clients remain accepted through the legacy `image` upload field.
- Phase 3 manual verification: browse catalog while logged out; verify archived items do not appear; try catalog filters; open a multi-image product and cycle thumbnails; check specs/related products; switch theme on desktop/mobile and reload; log in as an approved customer and verify cart/checkout still require auth; try protected APIs while logged out and verify they remain unauthorized.

## Phase 4 — Customer features

- Implemented server-owned wishlist, customer profile and address book. Customer resources are scoped from the authenticated user; profile role/email cannot be changed, and saved addresses are capped at 10 with one default address.
- Added admin-managed fixed/percentage coupons with active dates, minimum subtotal, optional maximum discount, total and per-customer usage limits. Coupon previews use server product prices; checkout revalidates and reserves coupon usage in the same transaction as stock, Order and audit writes. Cancellation before packing restores coupon usage in that transaction.
- New Orders snapshot subtotal, discount, code, net simulated order value and optional shipping address. Existing Orders without snapshots remain readable and show their legacy total.
- Added public product ratings/reviews with one review per customer/product and delivered-order verification; only the owner can edit or remove a review.
- Phase 4 manual verification: use two approved customer accounts to verify profile/address and wishlist isolation; create coupon rules as admin and test date/minimum/caps/per-user/total limits; apply a coupon and compare quote to the Order snapshot; cancel an eligible Order and confirm stock and coupon usage are restored once; attempt review before delivery and as a non-buyer, then verify a delivered buyer review appears in the public average and only its owner can manage it.

## Phase 5 — Advanced shop features

- Existing structured product specifications and in-dashboard low-stock alerts are reused. Added customer-facing comparison for up to four products and server-side catalog/admin search, filters, sorting and bounded pagination.
- Added admin stock adjustments with a required reason, atomic stock change and actor/before/after history in a new additive `InventoryAdjustment` collection. The Admin UI directs stock edits through this action; legacy `PUT /products/:id` stock changes remain supported and are automatically recorded for API compatibility. Opening stock on product creation remains supported.
- Added Admin Dashboard export for date-filtered Orders as spreadsheet-safe CSV. CSV exports are restricted to a maximum 366-day date range.
- Added tests for product query validation, CSV formula escaping, product pagination, adjustment authorization/stock constraints and CSV output.
- No migration is required: product fields remain unchanged and inventory adjustment history uses a new collection. Stock adjustments require MongoDB replica set or mongos because product and audit writes commit in one transaction.

### Phase 5 manual verification

1. Browse the catalog while logged out; search specification values, select a category, filter by price/stock, change sort and move between pages. Verify the total count and page results match the filters.
2. Select two to four products for comparison and confirm price, category, stock, description and product-specific specifications display side by side; remove one and clear the selection.
3. As Admin, search and paginate the product table. Adjust stock with a valid reason, then verify the stock count and adjustment actor/reason/before-after history. Try a reduction below zero and verify it is rejected without a change.
4. Change an existing product's stock through the legacy `PUT /products/:id` API and confirm it remains compatible while writing an audit entry. In the Admin UI use the adjustment dialog and confirm the reason is recorded. Create a new product with opening stock as usual.
5. From the Dashboard, export an Order CSV for a date range. Open it in a spreadsheet, check cancelled Orders have zero simulated value, legacy Orders retain their stored total, and formula-like text is treated as text. Try a range over 366 days and confirm validation rejects it.
6. Select the Dashboard low-stock alert action and confirm Admin Products opens with the low-stock filter applied.

## Phase 6 — Testing, DevOps and documentation

- Add unit, API integration, frontend component and concurrency coverage appropriate to implemented behavior.
- Add local Docker Compose with MongoDB replica-set initialization, GitHub Actions build/test checks, and demo credentials restricted to development.
- Complete README, architecture/data-model/API docs, setup/migration/rollback instructions and manual test procedures.

## Files changed in Phase 0

- Backend: `src/models/Product.js`, `src/controllers/product.controller.js`, `src/controllers/order.controller.js`, `src/controllers/auth.controller.js`, `src/controllers/user.controller.js`, `src/routes/index.js`, `src/middlewares/auth.js`, `src/config.js`, `src/server.js`, `.env.example`, `package.json`, `scripts/reset-admin-password.js`, `scripts/migrations/001-product-archive.js`, `test/config.test.js`, `test/models.test.js`.
- Phase 1 additions: `backend/src/models/InventoryMovement.js`, `backend/src/utils/orderRules.js`, `backend/test/orderRules.test.js`, `backend/test/orderInventory.integration.test.js`, `frontend/src/components/orders/OrderStatus.vue`.
- Phase 1 updates: order API controller/routes/response helpers, `frontend/src/services/orderService.js`, `frontend/src/views/MyOrdersView.vue`, `frontend/src/views/AdminOrdersView.vue`, `README.md`.
- Phase 2 additions: `backend/src/controllers/dashboard.controller.js`, `backend/src/utils/dashboardQuery.js`, `backend/test/dashboardQuery.test.js`, `backend/test/dashboard.integration.test.js`, `frontend/src/services/dashboardService.js`, `frontend/src/views/AdminDashboardView.vue`.
- Phase 2 updates: route registration, admin router/layout navigation, `README.md`, and this roadmap.
- Phase 0 frontend: `src/store/modules/cart.js`, `src/store/modules/auth.js`, `src/store/modules/products.js`, `src/services/productService.js`, `src/views/AdminProductsView.vue`.
- Phase 5 additions: `backend/src/models/InventoryAdjustment.js`, `backend/src/controllers/inventory.controller.js`, `backend/src/controllers/reports.controller.js`, `backend/src/utils/productQuery.js`, `backend/src/utils/csv.js`, `backend/test/advanced.integration.test.js`, `backend/test/productQuery.test.js`, `frontend/src/services/inventoryService.js`, `frontend/src/services/reportService.js`.
- Phase 5 updates: product listing/controller/store, catalog and Admin Products views, product form/card, Dashboard, route registration, shared styles, `README.md`, and this roadmap.
- Docs: `README.md`, `docs/V2_ROADMAP.md`.
