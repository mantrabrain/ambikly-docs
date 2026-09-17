---
title: Cart & checkout
description: How the Ambikly cart is stored and scoped, what checkout validates before payment, guest versus logged-in checkout, and the order that is created.
prev:
  text: Reviews
  link: /reviews
next:
  text: Payments overview
  link: /payments
---

# Cart & checkout

The cart and the checkout are the two storefront pages that turn a visitor into an order. This page covers how a cart is stored and scoped to a visitor, what happens at each step of checkout, every check that runs before a payment is attempted, and the order record that comes out the other end.

## How the cart is stored

Ambikly does not use PHP sessions or WordPress transients for carts. Every cart is a row in the `{prefix}ambikly_carts` table, created the first time a visitor touches the cart.

| Column | What it holds |
|---|---|
| `cart_key` | 32-character hex key, also written to the visitor's cookie |
| `user_id` | The WordPress user ID, stamped on every write when logged in |
| `contents` | JSON map of line key → line item |
| `coupons` | JSON map of coupon code → applied coupon snapshot |
| `shipping` | JSON: the chosen `method_key` and the destination address |
| `billing` | JSON billing address, once checkout or the cart page has collected one |
| `meta` | JSON extension slot for add-ons (gift cards, store credit) |
| `currency` | The store currency at the time the cart was created |
| `customer_email` | Billing email lifted out of the JSON so add-ons can query on it |
| `expires_at` | 14 days from the last write |

### Session scoping

A visitor is matched to a cart by the `ambikly_cart_key` cookie:

<ol class="step-list">
  <li>On the first cart request, Ambikly generates a 32-character hex key and sets the <code>ambikly_cart_key</code> cookie for 14 days. The cookie is HTTP-only, and secure when the site is served over HTTPS.</li>
  <li>A cookie value that is not exactly 32 hex characters is discarded and replaced, so a tampered or truncated cookie starts a fresh cart rather than erroring.</li>
  <li>Every write stamps the current user ID onto the row, and pushes <code>expires_at</code> another 14 days out.</li>
  <li>A daily cron event, <code>ambikly_prune_expired_carts</code>, deletes rows whose <code>expires_at</code> has passed.</li>
</ol>

### Carts and logging in

The cookie is the primary handle, so a logged-in customer on a new device would otherwise get an empty cart while their real one sat unreachable. On `wp_login`, Ambikly looks up that user's most recent *other* cart and folds it in:

- If the browser's current cart is empty, every line from the older cart is re-added, and any product that is no longer purchasable is skipped rather than failing the merge.
- If the browser's current cart already has items, nothing is merged — the items the visitor added in this session win.
- Either way the older row is deleted, so it does not resurface on the next login.

### Line keys

Each cart line is keyed by an MD5 of the product ID, variation ID, pricing plan ID and the chosen attributes. Two additions that produce the same key merge into one line and their quantities add together; anything that differs (a different size, a different pricing plan) becomes its own line. Add-ons that attach line metadata get that metadata mixed into the key too, so an order-bump copy of a product does not merge with the same product added normally.

The line key is what the REST API and the storefront use to update or remove a line, and it is always 32 hex characters.

### What is stored on a line

| Field | Notes |
|---|---|
| `line_key` | The MD5 described above |
| `product_id`, `variation_id`, `pricing_plan_id` | Identity of what was added |
| `name`, `sku`, `image` | Snapshot for display; a pricing plan appends its name to the product name |
| `price` | Re-resolved live on every totals calculation — see below |
| `quantity`, `max_quantity` | `max_quantity` is the current stock ceiling, or empty when stock is not managed |
| `attributes` | Chosen variation attributes |
| `product_type`, `is_downloadable`, `requires_shipping` | A line requires shipping unless it is digital or downloadable |
| `tax_class`, `tax_status`, `weight` | Copied from the product |
| `unavailable` | Set on every totals run when the product is missing or not published |

Quantities are capped at the real stock ceiling as they are added or edited. For a variation, the variation's own stock is the ceiling; otherwise the parent product's. Adding a product whose ceiling is zero throws `This product is out of stock.` rather than creating a zero-quantity line.

### Prices are re-resolved, not frozen

Because a cart lives for 14 days, a price captured at add-to-cart time can go stale. Every time totals are computed, each plain product line is re-priced against the product's current effective price, so a sale that ended is not still honored at checkout. Lines that carry a pricing plan, a variation, or line metadata are skipped — their price was computed from something other than the product's base price.

## What the cart totals contain

Totals are computed on demand and never written to the database. The response contains:

| Key | Meaning |
|---|---|
| `subtotal` | Sum of line price × quantity |
| `discount_total` | Sum of every valid coupon's discount, clamped to the subtotal |
| `shipping_total` | Cost of the resolved shipping method, or 0 when a coupon grants free shipping |
| `shipping_title` | Title of the resolved method |
| `shipping_resolved` | False when the stored method key no longer matches an available method |
| `tax_total` | See [Tax](/tax) |
| `total` | Subtotal − discount + shipping + tax |
| `total_items`, `total_quantity` | Line count and unit count |
| `coupons` | Per-coupon code, discount and free-shipping flag |
| `requires_shipping`, `is_digital_only`, `has_downloadable` | Derived from the lines |
| `adjustments` | Extension slot filled by Pro add-ons |
| `enable_coupons` | Mirrors the store-wide **Enable Coupons** setting so the cart page can hide the coupon form |

Every applied coupon is fully re-validated on each totals run, not only when it was applied. A coupon that has since expired, been deactivated, hit its usage limit, or no longer meets its minimum stops discounting — but stays listed, so the cart page can tell the customer it is no longer valid instead of silently dropping it.

## The checkout flow end to end

<ol class="step-list">
  <li>The checkout page loads the cart and <code>GET /checkout/options</code> together. The options response returns the payment methods actually available to this visitor, the store currency, and whether guest checkout is allowed.</li>
  <li>If the cart is empty, or guest checkout is off and the visitor is not signed in, the page shows a short message instead of a form. Both are also enforced server-side.</li>
  <li>The customer fills in billing details. Address fields and a shipping-method selector only appear when at least one line requires shipping; a fully digital cart shows a "no shipping required" note instead.</li>
  <li>As soon as a usable destination address is entered, the page posts it to <code>POST /checkout/shipping</code> and renders the matching methods with their costs. Choosing one stores the method key on the cart.</li>
  <li>The customer picks a payment method, optionally adds an order note, and submits.</li>
  <li><code>POST /checkout</code> runs every validation below, creates the order, and calls the gateway.</li>
  <li>If the gateway returned a redirect (Stripe, PayPal) the browser is sent to the gateway. Otherwise it goes straight to the thank-you page.</li>
</ol>

The submit button is disabled while the request is in flight, so a double-click or a stray Enter key cannot place two orders.

## What is validated before payment

These run in order, and the first failure aborts the whole checkout with that message. Nothing is created until they all pass.

| Check | Failure message |
|---|---|
| Cart is not empty | `Cart is empty.` |
| Guest checkout allowed, or the visitor is signed in | `Please sign in to check out.` |
| Billing email present | `Billing email is required.` |
| Billing first name, last name, email, country present | `Billing {field} is required.` |
| Shipping first name, last name, address, city, country present (only when the cart needs shipping) | `Shipping {field} is required.` |
| The stored shipping method still resolves for that address | `Please select a valid shipping method before placing your order.` |
| The chosen gateway exists, is enabled, and is usable by this customer | `Selected payment method is not available.` |
| A cart containing a subscription product uses a gateway that can charge renewals | `Selected payment method is not available.` |
| Stock check on every non-downloadable line | `Insufficient stock: …` |

### The stock check

For each line that is not downloadable:

- The product must still be `published`. A product unpublished or deleted after it was added reports `{name} (no longer available)`.
- If the line is a variation and that variation manages its own stock, the variation's quantity must cover the line.
- Otherwise, if the parent product manages stock, its quantity must cover the line.

All shortfalls are collected and reported together, so a customer fixes every problem in one pass rather than one per attempt. Add-ons can append their own shortfalls through the `ambikly_stock_shortfalls` filter — Pro's Bundles add-on uses this to reject a bundle whose components are sold out.

### Coupon limits

Coupon usage is recorded immediately after the order row is created and **before** the gateway is called. Recording is an atomic conditional update on the coupon row, so two simultaneous checkouts can never both claim the last remaining use. If the limit was already taken, the order is moved to `failed`, its stock is released, and the customer sees `This coupon has reached its usage limit.` No payment is attempted.

The same applies to a per-customer limit, which fails with `You have already used this coupon the maximum number of times allowed.`

::: warning Stock is decremented at order creation
Stock comes off the moment the order row is created, not when payment succeeds. A failed or abandoned payment restores it by moving the order to `failed`, which is what triggers the restore. A customer who abandons a Stripe or PayPal redirect without ever cancelling leaves the order pending — Stripe's session-expiry event eventually fails it; PayPal sends no equivalent event.
:::

## Guest versus logged-in checkout

Guest checkout is on by default and is controlled by **Enable Guest Checkout** in <span class="screen-path">Ambikly → Settings → Store Settings</span>.

| | Guest | Logged in |
|---|---|---|
| WordPress user account | None is created | Existing account |
| Ambikly customer record | Created or matched by billing email | Matched by email, linked to the user ID |
| `user_id` on the order | Empty | The WordPress user ID |
| Cart across devices | Cookie only | Merged on login |
| Thank-you page access | Needs the signed key in the URL | Also allowed by matching user ID or email |

Turning guest checkout off makes the checkout page render a sign-in prompt rather than a form, and the server rejects an anonymous submission regardless.

## The order that gets created

The order is created before the gateway runs, with `status` `pending`, `payment_status` `pending` and `fulfillment_status` `unfulfilled`. Creation writes:

- The order row, with a generated order number, the cart's totals copied field by field, the payment and shipping method identifiers and titles, the comma-joined coupon codes, the customer note, the client IP, the user agent, and a hash of the cart contents.
- One `order item` row per cart line, carrying the product type, `requires_shipping` and `is_downloadable` flags so downloads are granted correctly later.
- A billing address row, and a shipping address row when one was supplied.
- An order note: `Order placed via checkout.`
- The `ambikly_order_created` action, which is what decrements stock.

The gateway then runs and sets the real status. See [Payments overview](/payments) for the status each gateway produces.

When a payment genuinely settles, Ambikly marks the order paid: `payment_status` becomes `paid`, `total_paid` is set to the order total, and an order sitting in `pending` or `on-hold` moves to `processing`. That fires `ambikly_order_paid`, which issues download grants and license keys, and auto-completes an order whose contents are entirely digital. A mixed cart stays in `processing` so you can ship the physical part.

## Where the customer lands

For a gateway that settles in-process (cash on delivery, bank transfer, check, manual, net terms) the browser goes straight to the thank-you page, carrying `order_id` and a signed `key`. That key is an HMAC over the order — without it, the page would be enumerable by order ID.

For Stripe and PayPal the browser goes to the gateway first. Both come back to the thank-you page only after the payment has actually been confirmed. The cart is deliberately **not** cleared when a gateway returns a redirect, so a customer who cancels or abandons still has their cart intact. It is cleared once on the thank-you page for a genuinely paid order, guarded by order metadata so a refresh does not wipe a cart the customer has since started refilling.

::: tip Handlers of `ambikly_checkout_completed` must null-check
For redirect gateways the completion action fires from the thank-you page with `null` as its second argument, because there is no payment result object at that point.
:::

## Cart and checkout on the storefront

Both pages are rendered from a block or a shortcode — they are interchangeable, and both mount the same JavaScript app against the REST API.

| Page | Block | Shortcode | Notes |
|---|---|---|---|
| Cart | `ambikly/cart` | `[ambikly_cart]` | Block attributes: `layout` (`two-column` or `stacked`), `showCoupons`, `showShipping`, `checkoutLabel` |
| Checkout | `ambikly/checkout` | `[ambikly_checkout]` | No attributes |
| Thank you | — | `[ambikly_thank_you]` | Reads `order_id` and `key` from the URL |

The setup wizard creates these pages for you. See [Blocks & store pages](/blocks) for the full block reference and [Shortcodes](/shortcodes) for the shortcode list.

## Cart REST endpoints

Every cart route is public — the visitor's cookie identifies the cart.

| Method | Route | Notes |
|---|---|---|
| GET | `/cart` | Full cart with computed totals |
| POST | `/cart/items` | `product_id`, `quantity`, `variation_id`, `pricing_plan_id`, `attributes` |
| PUT | `/cart/items/{line_key}` | `quantity`; zero or less removes the line |
| DELETE | `/cart/items/{line_key}` | Remove a line |
| POST | `/cart/clear` | Empty the cart, its coupons and its shipping selection |
| POST | `/cart/coupons` | `code` |
| DELETE | `/cart/coupons/{code}` | Remove an applied coupon |
| POST | `/cart/shipping` | `method_key` and `address` |
| POST | `/cart/billing` | `address` |
| GET | `/checkout/options` | Available gateways, currency, guest-checkout flag |
| POST | `/checkout/shipping` | Shipping methods for an address |
| POST | `/checkout` | Place the order |

Price overrides and line metadata are server-only. The public add-to-cart route strips them, so a crafted request cannot set its own price.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Checkout add-ons</span></div>
  <p class="pro-callout__desc">Ambikly Pro replaces the multi-step flow with a single page, adds accept-in-one-click offers inside the checkout summary, and offers upsells after the order is paid by re-charging the card already on file.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

- [One-page checkout](/addons/one-page-checkout)
- [Order bumps](/addons/order-bumps)
- [Post-purchase upsells](/addons/post-purchase-upsells)

Post-purchase upsells re-charge the stored card without a second checkout, which only works on a gateway that saved a reusable payment method. In practice that means Stripe.

## Next

[Payments overview](/payments) covers all seven gateways, how to enable them, and the order status each one produces.
