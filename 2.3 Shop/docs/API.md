# API reference

Base path: `/api/v1`. Responses use `{ "status": number, "message": string, "data": any }`. Validation errors generally return HTTP 400, authorization errors 401/403, business conflicts 409, and unsupported MongoDB transactions 503. Protected endpoints require `Authorization: Bearer <JWT>`; `admin` indicates an approved admin account and `customer` an approved customer account.

## Authentication and catalog

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /register`, `POST /login` | Public | Create a pending customer or start a session. |
| `GET /products`, `GET /products/:id`, `GET /categories` | Public / optional JWT | Read active catalog and categories. Admin may include archived products with `includeArchived=true`. |
| `POST /products`, `PUT /products/:id`, `DELETE /products/:id`, `POST /products/:id/restore` | Admin | Manage, archive and restore products. Legacy `PUT` stock changes are audited. |
| `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id` | Admin | Manage categories. |

Catalog query supports `q`, `category`, `minPrice`, `maxPrice`, `inStock=true`, `sort`, and admin-only `stockStatus=all|normal|low|out`. Add `paged=true` or `page`/`limit` for `data: { items, pagination }`; `limit` is capped at 100. Without pagination parameters, `data` remains the legacy array response. Admin paginated responses also include aggregate `summary` counts.

## Orders and stock

| Method and path | Access | Purpose |
| --- | --- | --- |
| `POST /orders`, `POST /products/:id/orders` | Customer | Place multi-item or legacy single-item Order; server validates price and stock. |
| `GET /orders/mine`, `POST /orders/:id/cancel` | Customer | Read or cancel owned Orders before packing. |
| `GET /orders`, `PATCH /orders/:id/status`, `GET /products/:id/orders` | Admin | List all Orders, advance valid state, or inspect product order history. |
| `GET /inventory/movements` | Admin | Read order placement/restoration audit (`product`, `order`, `limit`). |
| `POST /inventory/adjustments` | Admin | Apply `{ product, delta, reason }`; `delta` is a nonzero integer and stock cannot go negative. |
| `GET /inventory/adjustments` | Admin | Paginated manual adjustment history (`product`, `page`, `limit`). |

Checkout, cancellation and stock adjustments require a MongoDB replica set or mongos for transaction atomicity.

## Customer resources and product feedback

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET/PATCH /customers/me` | Customer | Read or update own profile. Email and role are not editable. |
| `GET/POST /customers/me/addresses`, `PUT/DELETE /customers/me/addresses/:addressId` | Customer | Manage own shipping addresses. |
| `GET /wishlist`, `POST/DELETE /wishlist/:productId` | Customer | Read or change own wishlist. |
| `POST /coupons/validate` | Customer | Get a server-calculated coupon quote. |
| `GET /products/:id/reviews` | Public | Read review list and rating summary. |
| `POST /products/:id/reviews`, `PUT/DELETE /reviews/:id` | Verified customer | Create/update/delete an owned review after a delivered purchase. |
| `GET/POST /admin/coupons`, `PUT/DELETE /admin/coupons/:id` | Admin | Manage coupon rules. |

## Dashboard and reports

| Method and path | Access | Purpose |
| --- | --- | --- |
| `GET /admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD&interval=day\|month` | Admin | Aggregate dashboard and low-stock data. |
| `GET /admin/reports/orders.csv?from=YYYY-MM-DD&to=YYYY-MM-DD` | Admin | Stream a CSV report for at most 366 inclusive UTC dates. |
| `GET /users`, `PUT /users/:id/approve` | Admin | Review users and approve customer accounts. |

Order totals are simulated values, not payment revenue. The system does not connect to a payment provider.
