---
title: Inventory & stock
description: How Ambikly tracks stock — managed and unmanaged products, stock status, thresholds, the atomic decrement that prevents overselling, and the low-stock alerts.
prev:
  text: Categories, tags & brands
  link: /categories
next:
  text: Import & export (CSV)
  link: /import-export
---

# Inventory & stock

Ambikly tracks stock per product and, for variable products, per variation. Stock moves when an order is **created**, not when it is paid, and comes back when an order is cancelled, fails or is fully refunded. This page covers every rule.

## Managed versus unmanaged stock

Each product row carries `manage_stock`, `stock_quantity` and `stock_status`.

| `manage_stock` | What decides availability | What happens on an order |
|---|---|---|
| On (default) | `stock_quantity > 0` | The quantity is decremented |
| Off | `stock_status` must be exactly `instock` | Nothing — the quantity is never touched |

Turn tracking off for anything you never run out of: a service, a made-to-order item, a print-on-demand product. Then set the stock status by hand when you do need to close sales.

A product is purchasable only when its status is `published` **and** it is in stock by the rule above.

### Digital products never track stock

The digital product editor sends `manage_stock = 0`, `stock_quantity = null` and `stock_status = instock` on every save. The stock service also skips any order line flagged `is_downloadable`, so a digital sale never moves a number. There is nothing to configure.

## Setting stock on a product

<ol class="step-list">
  <li>Open a physical product in <span class="screen-path">Ambikly → Products</span>.</li>
  <li>Click the <strong>Inventory &amp; stock</strong> row to open its drawer.</li>
  <li>Set <strong>Track stock levels</strong>, the quantity, and a low-stock threshold if you want one.</li>
  <li>Click <strong>Save</strong> in the drawer, then <strong>Save changes</strong> on the product.</li>
</ol>

| Field | Stored as | Notes |
|---|---|---|
| Track stock levels | `manage_stock` | On by default for new products. |
| Quantity in stock | `stock_quantity`, int | Only shown when tracking is on. |
| Low stock alert | Product meta `low_stock_threshold` | Per-product override. Clearing the field deletes the meta row and falls back to the global value. |
| Stock status | `stock_status` | `instock`, `outofstock` or `onbackorder`. |
| When sold out | *nothing* | See the backorders section below. |

Variations carry their own `manage_stock`, `stock_quantity` and `stock_status`. See [Variations](/variations).

## Stock status values

| Value | Meaning with tracking on | Meaning with tracking off |
|---|---|---|
| `instock` | Maintained automatically — set whenever the quantity is above 0 | Product is purchasable |
| `outofstock` | Maintained automatically — set whenever the quantity reaches 0 | Product is not purchasable |
| `onbackorder` | Overwritten by the next stock movement | Product is **not** purchasable |

With tracking on, you rarely set the status yourself: every decrement and restore recalculates it in the same SQL statement.

## Thresholds

| Setting | Where | Default |
|---|---|---|
| Global low-stock threshold | <span class="screen-path">Ambikly → Settings → Store</span> → Low Stock Threshold | `5` |
| Per-product threshold | Product editor → Inventory & stock → Low stock alert | Falls back to the global value |

The threshold drives the low-stock **email alert** only. It does not gate purchases, and it is not what the Products list's "Low" badge uses — that badge is hard-coded to highlight anything below 10.

<div class="ui-warn"><strong>Careful:</strong> three other fields in the same Settings panel are stored but never read by anything: <strong>Enable Stock Management</strong>, <strong>Out of Stock Threshold</strong> and <strong>Hold Stock (minutes)</strong>. Turning Enable Stock Management off does not disable per-product tracking, no out-of-stock threshold other than zero is honored, and there is no stock-holding or reservation window at checkout. Only Low Stock Threshold has a reader.</div>

## When stock moves

| Event | What happens |
|---|---|
| `ambikly_order_created` | Stock is decremented for every non-downloadable line item |
| Status changes from `pending`, `processing`, `on-hold` or `completed` to `cancelled` or `failed` | Stock is restored, once |
| `ambikly_order_refunded` with payment status `refunded` | Stock is restored, once |

Stock leaves your inventory the moment the order row exists, before payment clears. A customer who abandons a redirect gateway has already taken the stock until the order is moved to `failed` or `cancelled`.

Partial refunds do **not** restore stock. Only a full refund does.

### What is skipped

Both the decrement and the restore skip a line item when:

- the item is flagged `is_downloadable`, or
- the item has no `product_id`.

### Variations

When a line item carries a `variation_id`, the variation row is adjusted first and then the parent product row, both by the same quantity. A variable product therefore holds a parent-level total alongside its per-variation counts.

## The atomic update

Each adjustment is a single conditional `UPDATE`, with no read-then-write gap:

```sql
UPDATE wp_ambikly_products
   SET stock_quantity = stock_quantity - 3,
       stock_status = CASE WHEN stock_quantity <= 0 THEN 'outofstock' ELSE 'instock' END
 WHERE id = 42 AND manage_stock = 1 AND stock_quantity >= 3
```

Three things fall out of that statement:

1. **`manage_stock = 1` is part of the WHERE clause.** An unmanaged product is never touched, whatever the order says.
2. **`stock_quantity >= 3` is part of the WHERE clause.** If concurrent checkouts have already taken the stock, the row does not match and nothing is written. MySQL's own row lock serializes concurrent decrements, so two simultaneous orders cannot both read the same starting quantity and clobber each other.
3. **The status is recalculated in the same statement.** MySQL evaluates multi-column assignments left to right, so the `CASE` sees the already-decremented quantity.

When the conditional update matches nothing, Ambikly re-reads the row. If the product does not manage stock, that is the normal early-out. If it does manage stock but the quantity is insufficient, the row is clamped to `0` / `outofstock` and the shortfall is reported back.

Because this path bypasses the model layer, the product's cached model is explicitly invalidated afterwards, so nothing later in the same request serves a stale quantity.

### Overselling is recorded, not hidden

If any line on an order had to be clamped, Ambikly writes an order note:

> Stock warning: this order oversold on **Blue Hoodie** (concurrent orders exceeded available stock). Verify inventory before fulfilling.

The order is not blocked — the decrement still applies, floored at zero. The note exists so you find out before you ship. A clean decrement instead logs `Stock decremented for order #1024.`

### Restores run once per order

The first restore sets `stock_restored` in the order's meta. Any later status transition that would restore again returns immediately. Without that flag, a `processing → cancelled → processing → cancelled` cycle, a double-click or a retried request would each add the quantity back a second time and inflate on-hand stock.

A restore also logs `Stock restored for order #1024.`

## Backorders

<div class="ui-warn"><strong>Careful:</strong> backorders are not implemented in the free core.
<br><br>
The product editor's <strong>When sold out</strong> dropdown (Block purchase / Allow, warn customer / Allow silently) is sent on save as <code>backorders</code>, but there is no such column and nothing reads the value.
<br><br>
The <strong>Enable Backorders</strong> toggle in <span class="screen-path">Ambikly → Settings → Store</span> is stored and never read.
<br><br>
The <code>onbackorder</code> stock status saves and round-trips, but it does not make a product purchasable — with tracking off, only <code>instock</code> is purchasable, and with tracking on the quantity decides. With tracking on, the next stock movement overwrites <code>onbackorder</code> anyway.</div>

If you need to keep selling past zero today, turn **Track stock levels** off for that product and set the status by hand.

## Low-stock and out-of-stock alerts

Alerts fire on `ambikly_order_paid`, after the decrement has already happened on order creation. For each line item on the paid order Ambikly:

<ol class="step-list">
  <li>Skips the item if it is downloadable or has no product.</li>
  <li>Loads the product and skips it if <strong>Track stock levels</strong> is off.</li>
  <li>Resolves the threshold: the product's own <code>low_stock_threshold</code> meta if set, otherwise the global Settings value.</li>
  <li>Sends an <strong>out of stock</strong> alert when the quantity is 0 or below, or a <strong>low stock</strong> alert when the quantity is above 0 and at or below the threshold.</li>
</ol>

### The emails

| Level | Subject |
|---|---|
| Out of stock | `[Your Store] Out of stock: Blue Hoodie` |
| Low stock | `[Your Store] Low stock: Blue Hoodie (3 left)` |

The body reads *Stock level for "Blue Hoodie" (SKU AK-1042) is now 3.* followed by a **Manage product** link straight into the product editor. Both are sent as HTML from the store's configured From name and address.

<div class="ui-warn"><strong>Careful:</strong> these two alerts are hard-coded. They are not among the four editable transactional templates in <span class="screen-path">Ambikly → Emails</span> and cannot be re-worded or re-designed there. See <a href="/emails">Emails</a>.</div>

### The throttle

Before sending, Ambikly checks a transient named `ambikly_low_stock_sent_{level}_{productId}` and skips the send if it exists. After sending, it sets that transient for **6 hours**.

The key includes the level, so one product can emit at most one low-stock email and one out-of-stock email per 6 hours. A flurry of orders on the same product produces one alert, not one per order.

A successful send fires `do_action('ambikly_inventory_alert_sent', $level, $product, $qty)`.

### Who receives them

Resolution order:

1. `ambikly_settings_inventory` → `recipient`
2. `ambikly_settings_emails` → `admin_email`
3. WordPress's own `admin_email` option

<div class="ui-warn"><strong>Careful:</strong> the <code>inventory</code> settings group has no admin screen at all. Its <code>recipient</code>, <code>send_low_stock</code> and <code>send_out_of_stock</code> values can only be written directly to the database. Left alone, both alert types are on and mail goes to the address from <span class="screen-path">Ambikly → Settings → Emails</span>, or failing that WordPress's admin email.</div>

If no recipient resolves at all, the scan exits without sending. Any error inside the scan is logged and swallowed, so a mail failure never breaks an order.

## Editing stock in bulk

There is no bulk stock editor on the Products screen — its bulk actions are limited to status changes, export and delete.

Two practical routes:

- **CSV round-trip.** Export the catalog, edit `stock_quantity`, `stock_status` and `manage_stock` in a spreadsheet, and re-import. Rows match by SKU. See [Import & export (CSV)](/import-export).
- **The API.** `PUT /ambikly/v1/products/{id}` accepts `stock_quantity`, `stock_status`, `manage_stock` and `low_stock_threshold`. For variations, `PUT /ambikly/v1/products/{product_id}/variations/{id}`.

<div class="ui-warn"><strong>Careful:</strong> a CSV import or a <code>PUT</code> writes the quantity directly. Neither goes through the atomic adjust path, so an import that lands at the same moment as a checkout can overwrite a decrement. Import stock changes when the store is quiet.</div>

## Reading stock

| Where | What it shows |
|---|---|
| Products list, Stock column | In Stock / Out of Stock / Low (n) / In Stock (n) — the "Low" cut-off is hard-coded at 10 |
| Product editor, Inventory row summary | "N units in stock", "Stock tracking on", or "Not tracking stock", plus an **Out of stock** badge at zero |
| `GET /ambikly/v1/products` | `stock_quantity`, `stock_status`, `manage_stock` and the resolved `low_stock_threshold` |
| Storefront product card | Add to Cart is disabled and relabelled **Out of stock** |
| Storefront product page | Same, plus `schema.org` availability of `InStock` or `OutOfStock` |

## For developers

`Ambikly\Services\StockService::adjust($productId, $delta, $variationId = 0)` is public so add-ons can use the same oversell-safe path instead of writing their own quantity updates. A negative delta decrements, a positive one restores. It returns `false` only when a decrement had to be clamped short.

The Bundles Pro add-on uses it to move stock on a bundle's component products rather than on the bundle wrapper row.

See [Hooks & filters](/developers/hooks) for `ambikly_order_created`, `ambikly_order_paid`, `ambikly_order_status_changed`, `ambikly_order_refunded` and `ambikly_inventory_alert_sent`.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Stock dropped before the customer paid | By design. The decrement runs on order creation. Move abandoned orders to `failed` or `cancelled` to get the stock back. |
| Stock did not come back after a cancellation | The transition must come **from** `pending`, `processing`, `on-hold` or `completed`. Cancelling an already-cancelled or already-failed order does nothing. |
| Stock did not come back after a refund | Only a full refund restores. Partial refunds do not. |
| Restore ran only once across several cancel cycles | Correct. The `stock_restored` order-meta flag guarantees one restore per order. |
| Quantity went negative | It cannot. A decrement past zero is clamped to zero and an oversold order note is written. |
| Low-stock email never arrived | Tracking is off for that product, the quantity is above the threshold, the 6-hour throttle is still live, no recipient resolved, or the order never reached `paid`. |
| Changing the global threshold changed nothing | Check for a per-product **Low stock alert** value — it wins over the global. |
| A product shows Low in the list but sends no alert | The list badge uses a fixed cut-off of 10; alerts use the threshold. |

## Next

- [Import & export (CSV)](/import-export) — bulk stock edits through a spreadsheet.
- [Orders](/orders) — the statuses that move stock.
- [Refunds & cancellations](/refunds) — when a refund restores stock.
