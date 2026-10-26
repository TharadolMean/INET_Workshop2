# Data model and compatibility

MongoDB collections are managed through Mongoose models in `backend/src/models`. ObjectId relationships below are references unless identified as snapshots.

| Collection | Main fields and relationships | Compatibility / integrity |
| --- | --- | --- |
| `User` | name, unique email, password hash, role, approval, phone, embedded addresses | New profile fields are optional/defaulted; email, role and approval are not customer-editable. Addresses belong to their embedded User record. |
| `Category` | unique slug, name, active state | Products may have no category; inactive categories are excluded from public browsing. |
| `Product` | name, description, structured specifications, price, stock, category, legacy `image`, gallery `images`, archive fields | Missing archive/spec/gallery fields remain readable; no existing field is renamed. Archive preserves Product and Order history. |
| `Order` | user, legacy single-product fields, multi-item lines, status/history, stock-restoration marker, coupon/address/price snapshots | Supports legacy single-product and status-less documents. New subtotal, discount and shipping snapshots are optional. Legacy totals are not rewritten. |
| `InventoryMovement` | product, order, movement type, delta, before/after, actor, reason | Existing checkout/cancellation audit remains intact. New manual adjustments are stored separately. |
| `InventoryAdjustment` | product, actor, signed quantity delta, before/after stock, reason, timestamps | Additive collection for admin adjustments. It starts recording from deployment; historical manual changes cannot be reconstructed. |
| `Wishlist` | unique user, product ID list | One document per user; API scopes queries from the authenticated user. |
| `Coupon` | unique normalized code, terms, dates, global/per-user usage limits | Usage counter changes with redemption writes in checkout/cancellation transactions. |
| `CouponRedemption` | coupon, user, order, discount snapshot | Order is unique; coupon/user index supports per-customer usage checks. |
| `ProductReview` | product, user, verified order, rating, comment | One review per user/product; writes require a delivered purchase. |

## Historical records

- Archived products remain in MongoDB so historical Order references and stored item names/prices remain available.
- New optional User/Order fields and new collections do not require a destructive migration.
- Order line price/name, coupon discount and shipping address values are snapshots. Product edits do not rewrite earlier Orders.
- No transaction history is backfilled. Older Orders keep the fields they originally stored.

## Backup and rollback

Back up the target database before applying application changes to a production dataset. Phase 6 adds no automatic migration. To roll back application code, deploy the prior application version; new additive fields/collections can remain unused. Do not drop `InventoryAdjustment`, customer, coupon or review collections as part of application rollback if their records must be retained. Docker volumes are persistent; `docker compose down` preserves them, while `docker compose down -v` deletes local MongoDB and upload data.
