---
title: Coupons
description: Create and manage Ambikly discount codes — the three discount types, every restriction and usage-limit field, how limits are enforced, and checkout failure messages.
prev:
  text: Tax
  link: /tax
next:
  text: Orders
  link: /orders
---

# Coupons

A coupon is a code a customer types into the cart to reduce their total. Ambikly supports percentage discounts, fixed cart discounts and fixed per-product discounts, each with product, customer, spend, schedule and usage restrictions. This page covers the Coupons screen, every field in the editor, how the limits are enforced, and what the customer sees when a code is rejected.

Coupons can be switched off store-wide with **Enable Coupons** in <span class="screen-path">Ambikly → Settings → Store Settings</span>. With it off, the cart page hides the coupon form and every code is rejected with `Coupons are not currently accepted.`

## The Coupons screen

<span class="screen-path">Ambikly → Coupons</span> lists every coupon, 25 per page.

| Column | Sortable | Notes |
|---|---|---|
| Code | Yes | Always stored and displayed uppercase |
| Type | No | Percentage, Cart discount or Product discount |
| Amount | Yes | Shown as `10%` for a percentage, or as currency otherwise |
| Min spend | No | Blank when there is none |
| Usage | Yes | `used / limit`, or the count alone when unlimited |
| Expires | Yes | Red when the expiry date has passed |
| Status | Yes | Active, Inactive or Expired |
| Actions | — | Edit and delete |

The toolbar has a search box — matching code or description — and a status filter: All, Active, Inactive, Expired. A coupon whose expiry has passed is shown as Expired in the list even if its stored status still says Active.

Deleting a coupon stops it being applied to new orders. Orders that already used it are unaffected: an order keeps its coupon codes as plain text, not as a reference.

## The coupon editor

Click **Add Coupon**, or edit an existing one. The editor has four sections. Nothing is saved until you click **Save coupon**, and leaving with unsaved changes prompts you first.

### General

| Field | Type | Required | Notes |
|---|---|---|---|
| Code | Text | Yes | What the customer types. Uppercased and trimmed on save. Must be unique |
| Discount type | Select | Yes | Percentage, Fixed cart or Fixed product discount |
| Amount | Number | Yes | Two decimals. Cannot be negative. Capped at 100 for a percentage |
| Status | Select | Yes | Active, Inactive or Expired. Only Active coupons can be applied |
| Description (internal) | Textarea | No | Admin-only note. Never shown to customers, but it is searchable in the list |

Saving a code that already exists returns `Coupon code already exists.` — on both create and edit.

### Restrictions

| Field | Type | Notes |
|---|---|---|
| Minimum spend | Number | The cart subtotal must be at least this much |
| Maximum spend | Number | The cart subtotal must not exceed this much |
| Restrict to these products | Product picker | Only these products count toward the discount. Leave empty for all products |
| Exclude these products | Product picker | These products never count toward the discount |
| Restrict to customer emails | Chip input | Only these email addresses may use the coupon. Leave empty for any customer |
| Individual use only | Checkbox | This coupon cannot be combined with another |
| Exclude sale items | Checkbox | Products currently on sale do not count toward the discount |
| Grant free shipping | Checkbox | Forces the shipping total to zero |

The two product fields are searchable pickers that query your published products and show each product's price alongside its name. Products already chosen are filtered out of the search, so a duplicate cannot be added. Editing a coupon re-loads the chosen products by name rather than by bare ID.

The email field accepts one address at a time — press Enter or comma to add each as a chip. A malformed address is rejected as you type. Matching is case-insensitive and ignores stray whitespace on either side, so a pasted address with a trailing space still matches.

::: warning There is no category restriction
Coupons restrict by **product**, not by category, tag or brand. Despite what the plugin readme says, no category field exists in the editor, the API or the discount calculation. To cover a category, add its products to **Restrict to these products** — and remember to update the coupon when you add products to that category.

Product include and exclude, and the email restriction, all work exactly as described above.
:::

#### How restrictions shape the discount

The product and sale-item restrictions do not allow or block the coupon outright — they decide which cart lines count. Ambikly builds an eligible subtotal from the lines that survive all three filters, and every discount type is computed against that:

<ol class="step-list">
  <li>If <strong>Restrict to these products</strong> is set, a line is eligible only if its product is on that list.</li>
  <li>If <strong>Exclude these products</strong> is set, a line on that list is dropped.</li>
  <li>If <strong>Exclude sale items</strong> is on, a line whose product is on sale right now is dropped. This is a live check, not a flag captured when the item was added to the cart.</li>
  <li>The surviving lines' price × quantity is the eligible subtotal.</li>
</ol>

So a 20% coupon on a cart of one eligible $50 item and one excluded $50 item discounts $10, not $20.

### Usage limits

| Field | Type | Notes |
|---|---|---|
| Total uses allowed | Number | Across all customers. Blank means unlimited |
| Uses per customer | Number | Per customer, matched by customer record or by email. Blank means unlimited |

The editor rejects a per-customer figure larger than the total limit.

### Schedule

| Field | Type | Notes |
|---|---|---|
| Starts at | Date and time | Before this moment the coupon is not active |
| Expires at | Date and time | After this moment the coupon is not active |

Both are entered in your own local time and stored in the store's timezone, so a coupon set to expire at midnight expires at midnight as the store sees it. The editor rejects an expiry that is not after the start.

A coupon is considered active only when its status is Active **and** the current time is inside the schedule. A coupon left with no dates is active as long as its status is.

## The three discount types

Each is computed against the eligible subtotal described above, and the final discount is always clamped so it can never exceed the cart subtotal.

### Percentage discount

The eligible subtotal × the amount, as a percentage. An amount above 100 is rejected on save by both the form and the server.

*Cart: two eligible items at $30 and $70. A 15% coupon discounts $15.00.*

### Fixed cart discount

A flat amount off the cart, capped at the eligible subtotal. It is not pro-rated across lines.

*Cart: one eligible item at $12 and one excluded item at $100. A $25 fixed-cart coupon discounts $12.00, not $25.00 — the excluded line cannot be discounted.*

### Fixed product discount

The amount, multiplied by the quantity, for every eligible line.

*Cart: 3 units of an eligible product and 2 units of an excluded one. A $5 fixed-product coupon discounts $15.00.*

## Combining coupons

More than one coupon can be applied to a cart, and their discounts sum. **Individual use only** changes that:

- Applying a coupon while an active individual-use coupon is already on the cart is refused with `{CODE} cannot be combined with another coupon.`
- Applying an individual-use coupon clears every other coupon from the cart first.

An already-applied coupon that has since expired, been deactivated or hit its limit does not block a new one. It stops discounting, stays visible so the cart can flag it, and is ignored by the exclusivity check.

## How usage limits are enforced

Validation when a code is applied is only advisory. The real enforcement happens once, at checkout, immediately after the order row is created and **before** any payment is attempted.

<ol class="step-list">
  <li>The total limit is claimed with a single atomic conditional update: increment the usage count only if it is still below the limit. MySQL's row lock serializes concurrent attempts, so at most <em>limit</em> of them can ever succeed, however many arrive at the same instant.</li>
  <li>If that update affects no rows, the limit was already reached. The order is moved to <code>failed</code>, its stock is released, and checkout aborts with <code>This coupon has reached its usage limit.</code> No payment is taken.</li>
  <li>If a per-customer limit is set, the usage ledger is counted for this customer's ID or email. If they are already at the limit, the global slot claimed in step 1 is released again — so nobody else is blocked by this rejection — and checkout aborts with <code>You have already used this coupon the maximum number of times allowed.</code></li>
  <li>Otherwise a row is written to the usage ledger recording the coupon, the order, the customer, their email and the discount amount.</li>
</ol>

Because the claim happens before the gateway runs, a customer is never charged for a discount that was not actually honored.

::: tip One narrow race remains
The per-customer check is a count followed by an insert, which is not itself race-proof against the *same* customer submitting two checkouts at the same instant. The cross-customer race — the one that matters for a limited-quantity promotion — is fully closed by the atomic update in step 1.
:::

## Applying a coupon at checkout

The customer enters the code in the coupon form on the cart page. The storefront posts it to `POST /cart/coupons`, the code is uppercased and trimmed, and the coupon is validated against the current cart. A code already on the cart is accepted as a no-op rather than an error.

Every applied coupon is then re-validated on **every** totals calculation, not only when it was applied. That matters because coupons are usually entered on the cart page, before checkout has collected an email or the cart has reached its final contents:

- An email-restricted coupon is checked against the real checkout email, which checkout writes onto the cart before totals are computed.
- A minimum-spend coupon stops discounting if the customer removes items and drops below the minimum.
- A coupon that expires, is deactivated, or hits its limit while the cart sits open stops discounting immediately.

### Failure messages

| Message | Cause |
|---|---|
| `Enter a coupon code.` | Empty submission |
| `Coupons are not currently accepted.` | **Enable Coupons** is off store-wide |
| `Coupon does not exist.` | No coupon with that code |
| `Coupon is not active or has expired.` | Status is not Active, or the current time is outside the schedule |
| `Coupon usage limit reached.` | The total usage count has reached the limit |
| `Minimum order of {amount} required.` | The cart subtotal is below the minimum spend |
| `Maximum order of {amount} exceeded.` | The cart subtotal is above the maximum spend |
| `Coupon not valid for this email.` | The email restriction does not include this customer |
| `{CODE} cannot be combined with another coupon.` | An individual-use coupon is already applied |
| `This coupon has reached its usage limit.` | Raised at checkout when the atomic claim fails |
| `You have already used this coupon the maximum number of times allowed.` | Raised at checkout when the per-customer limit is reached |

## Coupons on the order

An order stores the comma-joined codes that were used and the discount amount as part of its totals. The usage ledger keeps the per-use detail — which coupon, which order, which customer, how much — which is what per-customer limits count against.

## Coupon REST endpoints

Reading requires store-view permission; writing requires store-manage.

| Method | Route | Notes |
|---|---|---|
| GET | `/coupons` | Paginated. Supports `search`, `status`, `orderby`, `order`, `page`, `per_page` |
| GET | `/coupons/{id}` | One coupon |
| POST | `/coupons` | Create |
| PUT | `/coupons/{id}` | Update. Fields you omit are left alone |
| DELETE | `/coupons/{id}` | Delete |
| POST | `/cart/coupons` | Public: apply a code to the current cart |
| DELETE | `/cart/coupons/{code}` | Public: remove an applied code |

The server rejects a negative amount with `Discount amount cannot be negative.` and a percentage above 100 with `Percentage discount cannot exceed 100.`, on both create and update.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Discounts without codes</span></div>
  <p class="pro-callout__desc">Dynamic Pricing applies rules automatically — quantity breaks, customer-group pricing, buy-one-get-one — with no code for the customer to type. Flash Sales runs scheduled, countdown-backed price drops across products or categories.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

- [Dynamic pricing](/addons/dynamic-pricing)
- [Flash sales](/addons/flash-sales)

A product on a Flash Sales price counts as on sale for the **Exclude sale items** restriction, checked live at the moment totals are computed.

## Next

[Orders](/orders) — the order list, statuses, and everything you can do to an order after it is placed.
