---
title: Endpoint reference
description: Every REST route in the ambikly/v1 and ambikly-pro/v1 namespaces, grouped by resource, with the permission each one requires and the publicly accessible routes listed separately.
prev:
  text: REST API
  link: /developers/rest-api
next:
  text: Hooks & filters
  link: /developers/hooks
---

# Endpoint reference

Every route Ambikly registers, grouped by resource. Read [REST API](/developers/rest-api) first for authentication, the response envelope and pagination.

Routes are relative to a namespace base URL:

- `ambikly/v1` → `https://example.com/wp-json/ambikly/v1`
- `ambikly-pro/v1` → `https://example.com/wp-json/ambikly-pro/v1`

The free core registers 117 route calls (123 at runtime); Pro registers 94 (99 at runtime).

## Reading the permission column

| Label | Permission callback | Passes for |
|---|---|---|
| **Manage** | `store_permission()` | `ambikly_manage_store` or `manage_options` — Administrator, Store Manager |
| **View** | `store_view_permission()` | `ambikly_view_store` or the above — adds Support Agent |
| **Admin** | `admin_permission()` / `check_permissions()` | `manage_options` only |
| **Logged in** | `customer_permission()` or `is_user_logged_in()` | Any authenticated user, no capability required |
| **Public** | `public_permission()` / `__return_true` | Anyone, including logged out |

Every **Public** route is also listed together in [Publicly accessible routes](#publicly-accessible-routes).

---

## Free core routes — `ambikly/v1`

Everything from here to the Pro section is registered by the free core.

### Products

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/products` | View | Paginated. `search`, `category_id`, `type`, `status`, `orderby`, `order`, `page`, `per_page` (default 50) |
| POST | `/products` | Manage | Rejects a sale price that is not lower than the regular price |
| GET | `/products/{id}` | View | Full product with attributes, variations and files |
| PUT | `/products/{id}` | Manage | Partial update |
| DELETE | `/products/{id}` | Manage | |
| GET | `/products/{id}/usage` | Manage | Where the product is referenced before you delete it |
| POST | `/products/bulk-delete` | Manage | Body: `{ "ids": [1,2,3] }` |
| POST | `/products/bulk-status` | Manage | Body: `{ "ids": [...], "status": "published" }` |
| GET | `/products/{id}/meta/{key}` | Manage | Key matches `[a-z0-9_-]+` |
| POST | `/products/{id}/meta/{key}` | Manage | Set one meta value |
| DELETE | `/products/{id}/meta/{key}` | Manage | |

### Product attributes

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/products/{product_id}/attributes` | View | |
| POST | `/products/{product_id}/attributes` | Manage | |
| GET | `/products/{product_id}/attributes/{id}` | View | |
| PUT | `/products/{product_id}/attributes/{id}` | Manage | |
| DELETE | `/products/{product_id}/attributes/{id}` | Manage | |
| GET | `/products/{product_id}/attributes/{attribute_id}/values` | View | |
| POST | `/products/{product_id}/attributes/{attribute_id}/values` | Manage | |
| PUT | `/products/{product_id}/attributes/{attribute_id}/values/{id}` | Manage | |
| DELETE | `/products/{product_id}/attributes/{attribute_id}/values/{id}` | Manage | |

### Product variations

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/products/{product_id}/variations` | View | |
| POST | `/products/{product_id}/variations` | Manage | Variation SKUs carry a UNIQUE key |
| GET | `/products/{product_id}/variations/{id}` | View | |
| PUT | `/products/{product_id}/variations/{id}` | Manage | |
| DELETE | `/products/{product_id}/variations/{id}` | Manage | |
| POST | `/products/{product_id}/variations/generate` | Manage | Builds the cartesian product of the attribute values |
| POST | `/products/{product_id}/variations/bulk-update` | Manage | |
| POST | `/products/{product_id}/variations/bulk-delete` | Manage | |

### Categories

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/categories` | View | Paginated, default `per_page` 100, default order `sort_order ASC` |
| POST | `/categories` | Manage | |
| GET | `/categories/{id}` | View | |
| PUT | `/categories/{id}` | Manage | |
| DELETE | `/categories/{id}` | Manage | |
| POST | `/categories/bulk-delete` | Manage | |
| POST | `/categories/bulk-status` | Manage | |

### Tags and brands

Both taxonomies are registered from the same loop, so the route shapes are identical.

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/tags` | **Public** | Storefront reads this for filtering |
| POST | `/tags` | Manage | |
| PUT | `/tags/{id}` | Manage | |
| DELETE | `/tags/{id}` | Manage | |
| GET | `/brands` | **Public** | |
| POST | `/brands` | Manage | Accepts `name`, `slug`, `description`, `logo`, `website` |
| PUT | `/brands/{id}` | Manage | |
| DELETE | `/brands/{id}` | Manage | |
| GET | `/products/{id}/terms` | **Public** | Tags and brands attached to a product |
| POST | `/products/{id}/terms` | Manage | Replaces the product's term assignments |

### Orders

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/orders` | View | Paginated, default 25. `search`, `status`, `payment_status`, `customer_id`, `date_from`, `date_to`, `orderby`, `order` |
| POST | `/orders` | Manage | Create an order from the admin |
| GET | `/orders/statuses` | View | The store's order and payment status vocabulary |
| GET | `/orders/{id}` | View | Order with items, addresses and transactions |
| PUT | `/orders/{id}` | Manage | |
| DELETE | `/orders/{id}` | Manage | |
| POST | `/orders/{id}/status` | Manage | Fires `ambikly_order_status_changed` |
| GET | `/orders/{id}/notes` | View | |
| POST | `/orders/{id}/notes` | Manage | Body accepts `is_customer_visible` |
| POST | `/orders/{id}/refund` | Manage | Fires `ambikly_order_refunded` |
| POST | `/orders/{id}/record-payment` | Manage | Records an off-platform net-terms payment. **Not** a refund — it releases company credit without marking the order refunded |

### Invoices and packing slips

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/orders/{id}/invoice` | **Public** | Owner, staff or `?token=` check runs inside the handler and returns an HTML 403 page. `?format=pdf` falls back to HTML unless a PDF renderer filter is installed |
| GET | `/orders/{id}/packing-slip` | **Public** | Same ownership check. Returns 404 when packing slips are disabled for the store |

Both return raw HTML and call `exit()`, so they are not wrapped in the JSON envelope.

### Customers

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/customers` | View | Paginated, default 25 |
| POST | `/customers` | Manage | |
| GET | `/customers/{id}` | View | |
| PUT | `/customers/{id}` | Manage | |
| DELETE | `/customers/{id}` | Manage | Fires `ambikly_customer_deleted` |
| GET | `/customers/{id}/orders` | View | Paginated, default and maximum `per_page` 100 |
| GET | `/customers/{id}/addresses` | View | |
| POST | `/customers/{id}/addresses` | Manage | |
| PUT | `/customers/{id}/addresses/{address_id}` | Manage | |
| DELETE | `/customers/{id}/addresses/{address_id}` | Manage | |

### B2B companies

These routes back the <span class="screen-path">Ambikly → Companies</span> admin screen, and the `/companies/me*` set backs company self-service on the storefront. See [B2B companies & Net Terms](/b2b-companies).

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/companies` | View | Paginated, default 25 |
| POST | `/companies` | Manage | |
| GET | `/companies/{id}` | View | |
| PUT | `/companies/{id}` | Manage | Credit limit, payment terms, `price_tier_discount` |
| DELETE | `/companies/{id}` | Manage | |
| GET | `/companies/{id}/orders` | View | |
| GET | `/companies/{id}/buyers` | View | |
| POST | `/companies/{id}/buyers` | Manage | Invites a buyer login |
| DELETE | `/companies/{id}/buyers/{buyer_id}` | Manage | |
| GET | `/companies/me` | Logged in | Self-service: the company the current user owns |
| GET | `/companies/me/buyers` | Logged in | |
| POST | `/companies/me/buyers` | Logged in | A company owner invites their own buyer |
| DELETE | `/companies/me/buyers/{buyer_id}` | Logged in | |

### Cart

Every cart route is public — a guest shopper has no WordPress account. The cart is resolved from the session, not from a parameter.

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/cart` | **Public** | Items, coupons and totals |
| POST | `/cart/items` | **Public** | Body: `product_id`, `quantity`, optional `variation_id` |
| PUT | `/cart/items/{line_key}` | **Public** | `line_key` is a 32-character hex line identifier |
| DELETE | `/cart/items/{line_key}` | **Public** | |
| POST | `/cart/clear` | **Public** | |
| POST | `/cart/coupons` | **Public** | Body: `{ "code": "SAVE10" }` |
| DELETE | `/cart/coupons/{code}` | **Public** | |
| POST | `/cart/shipping` | **Public** | Sets the shipping address and chosen method |
| POST | `/cart/billing` | **Public** | Sets the billing address |

### Checkout

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/checkout` | **Public** | Places the order. Fires `ambikly_order_created`, then `ambikly_checkout_completed` |
| GET | `/checkout/options` | **Public** | Available gateways for this cart and caller, filtered through `isAvailable($context)` |
| POST | `/checkout/shipping` | **Public** | Shipping rates for an address |

### Coupons

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/coupons` | View | Paginated, default 25 |
| POST | `/coupons` | Manage | |
| GET | `/coupons/{id}` | View | |
| PUT | `/coupons/{id}` | Manage | |
| DELETE | `/coupons/{id}` | Manage | |

### Reviews

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/reviews` | View | Admin moderation list. Paginated, default 25, maximum 100. `status`, `product_id`, `search` |
| POST | `/reviews` | **Public** | Shopper submission. Auto-approval decided by `ambikly_review_auto_approve`; fires `ambikly_review_submitted` |
| PUT | `/reviews/{id}` | Manage | Approve, unapprove or edit |
| DELETE | `/reviews/{id}` | Manage | |
| POST | `/reviews/bulk` | Manage | Body: `{ "ids": [...], "action": "approve" }` |
| GET | `/products/{id}/reviews` | **Public** | Approved reviews for one product |
| GET | `/products/{id}/reviews/summary` | **Public** | Average rating and per-star counts |

### Shipping

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/shipping/zones` | Manage | Returns every zone, unpaginated |
| POST | `/shipping/zones` | Manage | |
| PUT | `/shipping/zones/{id}` | Manage | |
| DELETE | `/shipping/zones/{id}` | Manage | |
| GET | `/shipping/zones/{id}/methods` | Manage | |
| POST | `/shipping/zones/{id}/methods` | Manage | |
| PUT | `/shipping/methods/{id}` | Manage | Editable fields are `title`, `cost`, `tax_status`, `enabled` |
| DELETE | `/shipping/methods/{id}` | Manage | |

### Tax

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/tax/rates` | Manage | Every rate, unpaginated |
| POST | `/tax/rates` | Manage | |
| PUT | `/tax/rates/{id}` | Manage | |
| DELETE | `/tax/rates/{id}` | Manage | |

The `city` column exists in the data model but has no admin column. Matching on `country`, `state` and `postcode` is plain equality plus the `*` wildcard — ranges and comma lists are not implemented.

### Payments

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/payments/gateways` | Admin | All registered gateways with their settings |
| POST | `/payments/gateways/{id}` | Admin | `{id}` matches `[a-z0-9_-]+`. Credentials are stored under a `credentials` sub-array |

### Gateway callbacks

These are called by the payment provider, not by you. All three are public by necessity and verify the caller inside the handler.

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/stripe/webhook` | **Public** | Verifies the Stripe signature header inside the handler |
| GET | `/paypal/return` | **Public** | Buyer redirect target after approving a PayPal payment |
| POST | `/paypal/webhook` | **Public** | PayPal IPN-style notifications |

### Downloads

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/downloads/{token}` | **Public** | `{token}` is 32–64 hex characters and is the access control. Applies `ambikly_download_file_url`, then fires `ambikly_download_served` |
| GET | `/orders/{id}/downloads` | View | Downloads granted by one order |
| GET | `/customers/{id}/downloads` | View | |
| GET | `/account/downloads` | Logged in | The current user's own downloads; also re-checks `get_current_user_id()` internally |

### Reports

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/reports/summary` | View | Headline totals |
| GET | `/reports/sales-by-day` | View | Time series |
| GET | `/reports/top-products` | View | |
| GET | `/reports/status-breakdown` | View | Order counts per status |

### Jobs

Operator visibility into the durable job queue.

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/jobs/status` | View | `{ pending, running, failed }` counts |
| GET | `/jobs/failed` | View | Most recent 200 exhausted jobs, newest first |
| POST | `/jobs/{id}/retry` | Manage | Resets `attempts` to 0 and requeues. Only works on a `failed` job |

### Settings

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/settings` | Admin | Every settings group |
| POST | `/settings` | Admin | |
| GET | `/settings/{group}` | Admin | `{group}` matches `[a-zA-Z0-9_-]+` |
| POST | `/settings/{group}` | Admin | |

### Setup wizard

Five routes registered from one loop, one per wizard step.

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/setup/store` | Admin | Store name, address, currency |
| POST | `/setup/payments` | Admin | Enables offline gateways: `cod`, `bank_transfer`, `cheque`, `manual` |
| POST | `/setup/shipping` | Admin | |
| POST | `/setup/tax` | Admin | |
| POST | `/setup/pages` | Admin | Creates the store pages |

The wizard cannot be relaunched from the admin UI — these routes are the only way to re-run a step.

### Email templates

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/email-templates` | Admin | The four editable templates |
| POST | `/email-templates` | Admin | Saves subject and content per event and audience |
| POST | `/email-templates/test` | Admin | Sends a test message |

### Import and export

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/export/products` | Admin | Streams CSV. `status`, `type`, `ids` (comma-separated) |
| GET | `/export/orders` | Admin | Streams CSV. `status`, `from`, `to` |
| POST | `/import/products` | Admin | CSV upload |
| GET | `/import/products/template` | Admin | Blank CSV with the expected header row |

### Webhooks

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/webhooks` | Admin | Secrets are masked except the last four characters |
| POST | `/webhooks` | Admin | Returns the real secret **once**. Requires an `http`/`https` URL |
| GET | `/webhooks/events` | Admin | The nine-event catalog, flat and grouped by prefix |
| GET | `/webhooks/{id}` | Admin | |
| PUT | `/webhooks/{id}` | Admin | A `secret` in the body is discarded — secrets cannot be rotated in place |
| DELETE | `/webhooks/{id}` | Admin | Also deletes that webhook's delivery log |
| POST | `/webhooks/{id}/activate` | Admin | |
| POST | `/webhooks/{id}/deactivate` | Admin | |
| POST | `/webhooks/{id}/test` | Admin | Sends synchronously and reports the real outcome. Body: optional `event` |
| GET | `/webhooks/{id}/deliveries` | Admin | Most recent 200 attempts |

### System

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/system/status` | Admin | Environment, versions and table checks |

---

## Ambikly Pro routes — `ambikly-pro/v1`

Pro routes register only when Ambikly Pro is active. Add-on routes register only when that add-on is enabled **and** the license is currently valid — an expired license stops every add-on's routes from registering, while leaving its settings intact.

### Add-ons

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/addons` | View | All 35 add-ons with metadata, settings and settings schema. Secrets are masked |
| GET | `/addons/{slug}` | View | |
| POST | `/addons/{slug}/enable` | Manage | Returns `license_required` (403) without a valid license |
| POST | `/addons/{slug}/disable` | Manage | |
| POST | `/addons/{slug}/settings` | Manage | Response carries an `adjusted` key naming any value that was clamped |

### License

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/license` | Admin | Stored key and cached status |
| POST | `/license` | Admin | Save the key |
| POST | `/license/activate` | Admin | Calls the EDD licensing API |
| POST | `/license/deactivate` | Admin | Clears cached details; the stored key stays in place |
| POST | `/license/check` | Admin | Revalidates now instead of waiting for the daily check |

### Add-on routes

#### Abandoned Cart — [/addons/abandoned-cart](/addons/abandoned-cart)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/admin/abandoned-carts` | View | |

#### Advanced Reports — [/addons/advanced-reports](/addons/advanced-reports)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/reports/cohort` | View | |
| GET | `/reports/rfm` | View | |
| GET | `/reports/top-customers` | View | |
| GET | `/reports/export` | View | |

#### Advanced Shipping — [/addons/advanced-shipping](/addons/advanced-shipping)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET, POST, DELETE | `/shipping-rules` | Manage | One registration serving all three methods |

#### Advanced Variations — [/addons/advanced-variations](/addons/advanced-variations)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/variation-swatches` | **Public** | The storefront renders swatches from this |
| POST | `/variation-swatches` | Manage | |

#### Affiliate — [/addons/affiliate](/addons/affiliate)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/affiliate/dashboard` | Logged in | The caller's own affiliate stats |
| POST | `/affiliate/register` | Logged in | |
| POST | `/affiliate/mark-paid` | Manage | |
| POST | `/affiliate/{id}` | Manage | Update one affiliate |

#### AI Descriptions — [/addons/ai-descriptions](/addons/ai-descriptions)

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/ai/describe` | Manage | |

#### AI Recommendations — [/addons/ai-recommendations](/addons/ai-recommendations)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/recommendations` | **Public** | Storefront recommendation strip |
| POST | `/recommendations/rebuild` | Manage | Rebuilds the similarity index |

#### AJAX Filters — [/addons/ajax-filters](/addons/ajax-filters)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/filtered-products` | **Public** | Backs the storefront filter widget |

#### Bundles — [/addons/bundles](/addons/bundles)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/products/{id}/bundle-items` | View | |
| PUT | `/products/{id}/bundle-items` | Manage | Replaces the bundle contents |
| POST | `/products/{id}/bundle-items` | Manage | Same handler as PUT |
| DELETE | `/products/{id}/bundle-items` | Manage | |

#### Checkout Field Editor — [/addons/checkout-field-editor](/addons/checkout-field-editor)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/checkout-fields` | View | |
| POST | `/checkout-fields` | Manage | Stores a field schema. The core checkout does not yet consume it |

#### Compare — [/addons/compare](/addons/compare)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/compare` | **Public** | Side-by-side product data |

#### CRM Sync — [/addons/crm-sync](/addons/crm-sync)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/crm-sync/status` | View | Sync log summary |

#### Download Analytics — [/addons/download-analytics](/addons/download-analytics)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/download-analytics` | View | |

#### Dynamic Pricing — [/addons/dynamic-pricing](/addons/dynamic-pricing)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/pricing-rules` | View | |
| POST | `/pricing-rules` | Manage | |
| GET | `/pricing-rules/meta` | View | Condition and discount-type vocabulary for the rule builder |
| GET | `/pricing-rules/{id}` | View | |
| PUT | `/pricing-rules/{id}` | Manage | |
| DELETE | `/pricing-rules/{id}` | Manage | |
| POST | `/pricing-rules/{id}/activate` | Manage | |
| POST | `/pricing-rules/{id}/deactivate` | Manage | |

#### Flash Sales — [/addons/flash-sales](/addons/flash-sales)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/flash-sales` | Manage | |
| POST | `/flash-sales` | Manage | |
| DELETE | `/flash-sales` | Manage | |

#### Gift Cards — [/addons/gift-cards](/addons/gift-cards)

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/cart/gift-cards` | **Public** | Redeem a code against the current cart |
| DELETE | `/cart/gift-cards/{code}` | **Public** | `{code}` matches `[A-Z0-9-]+` |
| POST | `/gift-cards/lookup` | **Public** | Balance check by code. See the note below |
| GET | `/gift-cards` | View | |
| POST | `/gift-cards` | Manage | Issue a card |
| GET | `/gift-cards/{id}` | View | |
| POST | `/gift-cards/{id}/adjust` | Manage | Credit or debit a balance |
| POST | `/gift-cards/{id}/cancel` | Manage | |
| POST | `/gift-cards/bulk` | Manage | Issue in bulk |

#### License Pro — [/addons/license-pro](/addons/license-pro)

This add-on turns your own store into a license server, so its activation routes are necessarily public — they are called by software running on your customers' sites.

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/licenses/activate` | **Public** | Called by a customer's installation |
| POST | `/licenses/deactivate` | **Public** | |
| POST | `/licenses/check` | **Public** | |
| GET | `/updates/{slug}` | **Public** | Update manifest for a licensed product |
| GET | `/admin/licenses` | View | |
| GET | `/admin/licenses/{id}` | View | |
| POST | `/admin/licenses/{id}/revoke` | Manage | |
| POST | `/admin/licenses/{id}/reinstate` | Manage | |
| POST | `/admin/licenses/{id}/clear-activations` | Manage | |
| POST | `/admin/licenses/bulk` | Manage | |

#### Loyalty Points — [/addons/loyalty-points](/addons/loyalty-points)

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/cart/loyalty` | Logged in | Redeem points against the cart |
| DELETE | `/cart/loyalty` | Logged in | |
| GET | `/loyalty/balance` | Logged in | |
| GET | `/loyalty/history` | Logged in | |
| POST | `/loyalty/adjust` | Manage | Staff credit or debit |

#### Multi-Vendor — [/addons/multi-vendor](/addons/multi-vendor)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/vendors/me` | Logged in | |
| POST | `/vendors/signup` | Logged in | |
| GET | `/vendors` | View | |
| POST | `/vendors/{id}` | Logged in | Permitted for any logged-in user at the route level; which fields a non-staff caller may change is narrowed inside the handler |
| POST | `/vendors/{id}/approve` | Manage | |
| POST | `/vendors/{id}/reject` | Manage | |
| POST | `/vendors/{id}/suspend` | Manage | |
| POST | `/vendors/{id}/mark-paid` | Manage | |
| POST | `/products/{id}/vendor` | Manage | Assigning a product to a vendor is a store decision |

#### Order Bumps — [/addons/order-bumps](/addons/order-bumps)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/order-bumps` | View | |
| POST | `/order-bumps` | Manage | |
| GET | `/order-bumps/{id}` | View | |
| PUT | `/order-bumps/{id}` | Manage | |
| DELETE | `/order-bumps/{id}` | Manage | |
| GET | `/checkout/order-bumps` | **Public** | Bumps eligible for the current cart |
| POST | `/checkout/order-bumps/{id}/accept` | **Public** | |
| DELETE | `/checkout/order-bumps/{id}/decline` | **Public** | |

#### Popup Campaigns — [/addons/popup-campaigns](/addons/popup-campaigns)

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/popup-leads` | **Public** | Lead capture from the storefront popup |

#### Post-Purchase Upsells — [/addons/post-purchase-upsells](/addons/post-purchase-upsells)

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/upsell/accept` | **Public** | Charges the stored payment method via `chargeAdditional()` |
| POST | `/upsell/decline` | **Public** | |

#### Product Badges — [/addons/product-badges](/addons/product-badges)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/badges` | **Public** | |

#### Quick View — [/addons/quick-view](/addons/quick-view)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/quick-view/{id}` | **Public** | Product summary for the modal |

#### Shipment Tracking — [/addons/shipment-tracking](/addons/shipment-tracking)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/shipments` | Logged in | ⚠️ See the warning below |
| POST | `/shipments` | Manage | Refuses an `order_id` that does not exist, and de-duplicates carrier plus tracking number |
| DELETE | `/shipments/{id}` | Manage | Reverts the order to unshipped only when no shipments remain |

::: warning `GET /ambikly-pro/v1/shipments` is open to any logged-in user
Its permission callback is `current_user_can('ambikly_view_store') || current_user_can('manage_options') || is_user_logged_in()` — the final clause makes the first two redundant, so the route admits every authenticated user including Subscribers. Row-level filtering does happen inside the handler: a caller without `ambikly_view_store` is resolved to their own `ambikly_customers.id` and can only see shipments for their own orders. The gate is therefore in the callback body rather than the permission callback. If you audit permission callbacks statically, this route will look more open than it behaves.
:::

#### Size Chart — [/addons/size-chart](/addons/size-chart)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/size-chart` | **Public** | |

#### Smart Search — [/addons/smart-search](/addons/smart-search)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/smart-search` | **Public** | Typeahead search results |

#### Store Credit — [/addons/store-credit](/addons/store-credit)

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/cart/store-credit` | Logged in | Apply credit to the cart |
| DELETE | `/cart/store-credit` | Logged in | |
| GET | `/store-credit` | Logged in | The caller's own balance |
| POST | `/store-credit/adjust` | Manage | Staff credit or debit |

#### Subscriptions — [/addons/subscriptions](/addons/subscriptions)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/subscriptions` | View | Staff list |
| GET | `/subscriptions/{id}` | View **or** owner | A customer may read their own subscription |
| POST | `/subscriptions/{id}/cancel` | Manage **or** owner | A read-only Support Agent cannot act on a customer's behalf |
| POST | `/subscriptions/{id}/pause` | Manage **or** owner | |
| POST | `/subscriptions/{id}/resume` | Manage **or** owner | |
| POST | `/subscriptions/{id}/charge` | Manage | Staff only — never the owner |

Ownership is matched on `ambikly_subscriptions.user_id` against `get_current_user_id()`, and a logged-out caller (user id 0) never matches.

#### Wishlist — [/addons/wishlist](/addons/wishlist)

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/wishlist` | **Public** | Guest wishlists are resolved by session key |
| POST | `/wishlist/items` | **Public** | |
| DELETE | `/wishlist/items/{id}` | **Public** | |

#### Add-ons with no REST routes

Five add-ons register no routes of their own. They hook the storefront, the admin or the job queue instead, and where they need an API they reuse the core `/cart` and `/checkout` endpoints.

| Add-on | How it works instead |
|---|---|
| [One-Page Checkout](/addons/one-page-checkout) | Re-renders the core cart and checkout on one page, calling `/cart` and `/checkout` |
| [PDF Stamping](/addons/pdf-stamping) | Filters the download file URL and stamps on delivery |
| [Recently Viewed](/addons/recently-viewed) | Browser-side history plus a storefront shortcode |
| [Social Login](/addons/social-login) | OAuth redirects, not REST |
| [Sticky Add to Cart](/addons/sticky-add-to-cart) | Front-end only; posts to `/cart/items` |

---

## Publicly accessible routes

Every route below has a permission callback of `public_permission()` or `__return_true`, meaning **no authentication and no capability check happens before the handler runs**. Most of them are public by design — a guest shopper has no account — and several perform their own access control inside the handler. Review this list when you audit the site, and note it when you put a WAF or an API gateway in front of WordPress.

### `ambikly/v1`

| Method | Route | Why it is public | Access control inside the handler |
|---|---|---|---|
| GET | `/cart` | Guest shopping | Session-scoped |
| POST | `/cart/items` | Guest shopping | Session-scoped |
| PUT | `/cart/items/{line_key}` | Guest shopping | Session-scoped |
| DELETE | `/cart/items/{line_key}` | Guest shopping | Session-scoped |
| POST | `/cart/clear` | Guest shopping | Session-scoped |
| POST | `/cart/coupons` | Guest shopping | Coupon validity rules |
| DELETE | `/cart/coupons/{code}` | Guest shopping | Session-scoped |
| POST | `/cart/shipping` | Guest shopping | Session-scoped |
| POST | `/cart/billing` | Guest shopping | Session-scoped |
| POST | `/checkout` | Guest checkout | Stock, coupon and payment validation |
| GET | `/checkout/options` | Guest checkout | Gateway `isAvailable($context)` |
| POST | `/checkout/shipping` | Guest checkout | None needed — rate quote only |
| POST | `/reviews` | Shopper submission | Auto-approval decided by `ambikly_review_auto_approve`; IP recorded |
| GET | `/products/{id}/reviews` | Storefront display | Approved reviews only |
| GET | `/products/{id}/reviews/summary` | Storefront display | Approved reviews only |
| GET | `/tags` | Storefront filtering | None |
| GET | `/brands` | Storefront filtering | None |
| GET | `/products/{id}/terms` | Storefront display | None |
| GET | `/orders/{id}/invoice` | Emailed link | Owner, staff or `?token=` check, then an HTML 403 |
| GET | `/orders/{id}/packing-slip` | Printable link | Owner, staff or `?token=` check, then an HTML 403 |
| GET | `/downloads/{token}` | Emailed link | The 32–64 character token is the credential; limits and expiry enforced |
| POST | `/stripe/webhook` | Called by Stripe | Stripe signature verification |
| GET | `/paypal/return` | Buyer redirect | PayPal order lookup |
| POST | `/paypal/webhook` | Called by PayPal | PayPal verification |

### `ambikly-pro/v1`

Each of these registers only while its add-on is enabled and the license is valid.

| Method | Route | Add-on |
|---|---|---|
| POST | `/cart/gift-cards` | Gift Cards |
| DELETE | `/cart/gift-cards/{code}` | Gift Cards |
| POST | `/gift-cards/lookup` | Gift Cards |
| GET | `/variation-swatches` | Advanced Variations |
| GET | `/recommendations` | AI Recommendations |
| GET | `/filtered-products` | AJAX Filters |
| GET | `/compare` | Compare |
| GET | `/checkout/order-bumps` | Order Bumps |
| POST | `/checkout/order-bumps/{id}/accept` | Order Bumps |
| DELETE | `/checkout/order-bumps/{id}/decline` | Order Bumps |
| POST | `/licenses/activate` | License Pro |
| POST | `/licenses/deactivate` | License Pro |
| POST | `/licenses/check` | License Pro |
| GET | `/updates/{slug}` | License Pro |
| POST | `/popup-leads` | Popup Campaigns |
| POST | `/upsell/accept` | Post-Purchase Upsells |
| POST | `/upsell/decline` | Post-Purchase Upsells |
| GET | `/badges` | Product Badges |
| GET | `/quick-view/{id}` | Quick View |
| GET | `/size-chart` | Size Chart |
| GET | `/smart-search` | Smart Search |
| GET | `/wishlist` | Wishlist |
| POST | `/wishlist/items` | Wishlist |
| DELETE | `/wishlist/items/{id}` | Wishlist |

### Notes on specific routes

**`POST /gift-cards/lookup`** takes a code and returns its balance with no authentication. Gift card codes are the credential; treat guessing as the threat model and keep codes long.

**`GET /downloads/{token}`** is the entire digital delivery mechanism. The token is matched against `[a-f0-9]{32,64}`, and download limits and expiry are enforced in the handler. Anyone with the token can download the file — that is how emailed download links work.

**`POST /upsell/accept`** charges the payment method already stored against an order. Ownership is established from the order's own state, not from the caller's session.

**`GET /orders/{id}/invoice`** and **`GET /orders/{id}/packing-slip`** accept a `token` query parameter that substitutes for being logged in. Both return an HTML error page rather than JSON on failure, so a monitoring check that only looks at the status code will see a correct 403 or 404.

## Next

[Hooks & filters](/developers/hooks) covers reacting to what these endpoints do from PHP.
