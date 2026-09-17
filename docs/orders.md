---
title: Orders
description: The Orders screen, every order and payment status with its exact slug, the order detail view section by section, what a status change triggers, and order notes.
prev:
  text: "Coupons"
  link: /coupons
next:
  text: "Refunds & cancellations"
  link: /refunds
---

# Orders

Every checkout in your store creates an order. This page covers the Orders list, the order detail screen, the full status vocabulary, and exactly what happens when you move an order from one status to another.

## The Orders screen

Open <span class="screen-path">Ambikly → Orders</span>. The list shows 25 orders per page, newest first.

| Column | What it shows |
|---|---|
| Order | `order_number`, or the numeric id if no number was generated. Click it to open the order. |
| Customer | The order's `customer_email`. If the order is linked to a customer record, it links to that customer. Guest orders show "Guest". |
| Date | `created_at`. |
| Status | The order status pill. |
| Payment | The payment status pill — a separate field from the order status. |
| Total | `total` in the order's own currency. |
| Actions | View and Edit. |

Order, Date, Status and Total are sortable. Sorting is server-side and only these columns are accepted: `id`, `order_number`, `status`, `total`, `created_at`, `updated_at`. Anything else falls back to `created_at`.

### Search

The search box matches `order_number` or `customer_email` with a `LIKE` comparison. It does not search customer names, product names, SKUs or addresses.

### Filters

Two independent dropdowns sit above the table:

- **Order status** — one of the seven statuses below, or "All orders".
- **Payment status** — one of the seven payment statuses below, or "Any payment status".

They combine. "Processing" plus "Invoiced (net terms)" isolates B2B orders you have shipped but not yet been paid for.

<div class="ui-tip"><strong>Tip:</strong> The order list and the detail screen both read their status vocabulary from <code>GET /ambikly/v1/orders/statuses</code>, so labels stay in sync with whatever the store's language pack translates them to.</div>

## Order statuses

Seven statuses exist. These slugs are what the database stores and what the REST API accepts.

| Slug | Label | Meaning |
|---|---|---|
| `pending` | Pending | Order created, payment not settled. Every order starts here. |
| `processing` | Processing | Payment received (or an offline method was settled). Ready to fulfill. |
| `on-hold` | On Hold | Parked for a manual check — a suspected fraud review, a stock problem, a customer query. |
| `completed` | Completed | Fulfilled and closed. Sets `completed_at` and forces `fulfillment_status` to `fulfilled`. |
| `cancelled` | Cancelled | Called off before fulfillment. Sets `cancelled_at`. |
| `refunded` | Refunded | Set automatically when the refunded total reaches the order total. See [Refunds & cancellations](/refunds). |
| `failed` | Failed | Payment did not go through. |

Note the spelling: the on-hold slug is `on-hold` with a hyphen, and cancelled is `cancelled` with two Ls.

## Payment statuses

Payment status is tracked separately from order status, on the same row.

| Slug | Label | Meaning |
|---|---|---|
| `pending` | Pending | No payment settled yet. |
| `paid` | Paid | Payment confirmed. `total_paid` is set to the order total. |
| `partially-paid` | Partially Paid | Part of the balance is settled. Nothing in the free core sets this automatically. |
| `refunded` | Refunded | The full order total has been refunded. |
| `partially-refunded` | Partially Refunded | Some, but not all, of the total has been refunded. |
| `failed` | Failed | The gateway declined or errored. |
| `invoiced` | Invoiced (net terms) | A B2B order billed to a company account, awaiting invoice payment by its due date. See [B2B companies & Net Terms](/b2b-companies). |

## The order detail screen

Click an order number, or use the eye icon. The screen is one header bar plus a two-column body.

### Header

The header carries the order number, the placed-at timestamp, and the controls:

- **Status dropdown** — changing it is the only supported way to move an order between statuses. See [Changing status](#changing-status).
- **Record Payment** — appears only when `payment_method` is `net_terms` and `payment_status` is `invoiced`. This is not a refund and not a status change; it settles a net-terms invoice and releases company credit.
- **Refund** — disabled once `total_refunded` equals `total`.
- **Print invoice** — opens the token-guarded invoice URL in a new tab.
- **Print packing slip** — appears only when packing slips are enabled under <span class="screen-path">Ambikly → Settings → Invoice & Packing</span>. When the toggle is off the button is hidden, because the endpoint would return a 404 page.

### Line items

A table of every row in `ambikly_order_items`: name, SKU, type (Digital or Physical, read from the item's own `is_downloadable` flag), quantity, unit price and line total.

Below the items, the totals block shows Subtotal, Discount (with the coupon codes that produced it, when any), Shipping, Tax, Total, and a Refunded line when `total_refunded` is above zero. Zero-value rows are hidden.

### Digital downloads

Present only when the order granted downloads. One row per granted file with its download count, any limit, its expiry and a working link. See [Digital downloads](/digital-downloads).

### Order notes

The full audit trail, newest first, with an inline box for adding your own. Covered in [Order notes](#order-notes) below.

### Customer

Name (taken from the billing address, falling back to the email), email and phone. If the order has a `customer_id`, the name links to the customer record.

### Payment

The payment method title, a payment-status pill, and — for a B2B order — a link to the billing company, the payment terms, and the invoice due date.

### Addresses

Billing and shipping cards, each rendered only when that address row exists. A digital-only order has no shipping address at all.

### Documents

Invoices and packing slips are reached from the header icons, not from a panel in the body. Both are covered in [Invoices & packing slips](/invoices).

## Changing status

<ol class="step-list">
  <li>Open the order from <span class="screen-path">Ambikly → Orders</span>.</li>
  <li>Pick the new status from the dropdown in the header.</li>
  <li>Confirm in the dialog. Cancelled, Refunded and Failed get an extra warning because each has consequences beyond the label.</li>
</ol>

A status change always writes a system note recording the transition, then fires `ambikly_order_status_changed` with the order, the old status and the new status.

### What a status change triggers

| Transition | What happens |
|---|---|
| Anything → `completed` | `completed_at` is stamped, `fulfillment_status` becomes `fulfilled`. |
| Anything → `cancelled` | `cancelled_at` is stamped. |
| `pending`, `processing`, `on-hold` or `completed` → `cancelled` or `failed` | Stock is restored for every non-digital line item, once per order. An unpaid net-terms order also releases its reserved company credit. |
| Anything → `processing` or `completed`, on an offline gateway | The order is marked paid automatically. |
| Any change | The order status change email is sent to the customer and to the admin recipients, if those are enabled. |

### Stock restoration

Restoration runs once per order and is recorded in the order's own meta, so cycling an order Processing → Cancelled → Processing → Cancelled cannot inflate your inventory. Digital line items are skipped. A system note records that stock was restored.

### Offline payment settlement

Cash on Delivery, Direct Bank Transfer and Check Payments all leave an order at `payment_status: pending` through checkout, because no money has actually moved yet. Moving such an order to Processing or Completed marks it paid: `total_paid` is set, a "Payment received" note is written, and `ambikly_order_paid` fires — which is what issues download grants and license keys.

Net terms and the Manual gateway are deliberately excluded from this. A net-terms invoice settles only through Record Payment, and a Manual-gateway order is already paid at the moment it is created.

### Digital-only auto-completion

When an order is marked paid and every line item is downloadable (or is not a physical item that requires shipping), the order is moved to Completed automatically, with the note "Digital-only order auto-completed." Mixed carts stay in Processing so you still ship the physical part.

<div class="ui-warn"><strong>Careful:</strong> Setting the status to <strong>Refunded</strong> from the dropdown only relabels the order. It does not move money and does not create a refund record. To actually return funds, use the Refund button — see <a href="/refunds">Refunds &amp; cancellations</a>.</div>

## Order notes

Every order carries a note trail stored in `ambikly_order_notes`. Notes are never editable or deletable from the admin.

| Field | What it holds |
|---|---|
| `content` | The note body. Filtered through `wp_kses_post`, so basic HTML survives. |
| `type` | `system` for notes the plugin writes, `manual` for notes typed into the box. |
| `author` | The display name of the logged-in user who caused the note, or `system` when there is no user in context. |
| `author_id` | The WordPress user id, when there is one. |
| `is_customer_visible` | Whether the note is flagged customer-visible. |

### System notes

The plugin writes a note for each of these, without you doing anything:

- Order placed, naming the channel it came through (`checkout`, `admin`, or whatever `created_via` was set to).
- Status changed from one status to another.
- Payment received, with the gateway transaction id when one is available.
- Download grants issued, and license keys issued.
- Stock restored.
- Refund issued, with the amount and reason.
- License keys revoked on a full refund.

A note written during checkout, by a payment webhook, or by cron has no logged-in user, so its author is `system`. A note caused by an action you took in the admin — a status change, a refund — records your display name even though it is a system note.

### Manual notes

Type into the box at the bottom of the Order notes panel and click **Add note**. The **Customer visible** checkbox flags the note as customer-facing; leave it off for internal notes.

<div class="ui-tip"><strong>Tip:</strong> Customer-visible notes are a flag on the note row. The free core stores and displays the flag in the admin; nothing in the free core emails a note to the customer on its own.</div>

## Creating an order manually

The admin can create an order from scratch. Click **Create Order** on <span class="screen-path">Ambikly → Orders</span>.

<ol class="step-list">
  <li>Search for products by name or SKU and click one to add it as a line. Adding the same product twice increments its quantity instead of adding a second row.</li>
  <li>Adjust the unit price and quantity on any line, or remove the line.</li>
  <li>Search for an existing customer to prefill their name, email and phone, or type a new email. The billing email is required.</li>
  <li>Fill in the billing address. A shipping address block appears only when at least one line item requires shipping; tick <strong>Same as billing</strong> to copy it.</li>
  <li>Pick a payment method from your enabled gateways.</li>
  <li>Click <strong>Save order</strong>.</li>
</ol>

What the manual order screen does and does not do:

- Totals are the sum of the line items. Shipping, tax and discount are all sent as 0 — the screen does not run the shipping, tax or coupon engines.
- Stock is decremented, exactly as it is for a real checkout.
- Choosing **Manual Payment** marks the order paid immediately, which issues downloads and licenses and fires `ambikly_order_paid`. The Manual gateway is only ever offered to a logged-in user with store-manage capability, never at public checkout.
- Choosing Cash on Delivery, Bank Transfer or Check leaves the order pending until you move it to Processing or Completed.
- Stripe and PayPal are not usable here — nothing on this screen charges a card.

## Editing an existing order

Use the pencil icon on the Orders list, or the Edit action. The edit screen deliberately allows far less than the create screen.

**Editable:** `fulfillment_status`, customer email and phone, the customer note, the shipping method and its title, the payment method and its title, and the billing and shipping addresses.

**Not editable:** line items, quantities and prices. Changing them after the fact would leave stock, payment and totals out of sync with what the customer actually paid. The screen says so and renders those fields read-only. To fix a mistake, cancel the order and create a new one, or add a note explaining the correction.

**Not settable here at all:** `status` and `payment_status`. A plain update that flipped those would skip every side effect — no stock movement, no license issuance, no note, no hooks. Status goes through the status dropdown; payment goes through Refund or Record Payment.

## Deleting an order

The Delete action removes the order permanently. Before the row goes, the plugin restores its stock (idempotently, so an already-cancelled order is unaffected) and releases any reserved net-terms credit on an unpaid B2B order. It then cascades the delete to order items, addresses, notes, transactions and any license keys minted from that order.

<div class="ui-warn"><strong>Careful:</strong> Deletion is not reversible and the order disappears from your reports. Cancel an order you want to keep a record of.</div>

## Timestamps and timezone

`completed_at` and `cancelled_at` are written in the site's own timezone, as configured under WordPress's Settings → General. `created_at` falls through to the database column's own default, which is stamped in whatever timezone the MySQL server runs in. If your database server and your site disagree on timezone, an order placed near midnight can land on the neighbouring day in the sales-by-day chart. See [Reports](/reports).

## Where to go next

- [Refunds & cancellations](/refunds) — returning money and what it does to stock and credit.
- [Invoices & packing slips](/invoices) — printing order documents.
- [Emails](/emails) — the notifications a status change sends.
- [B2B companies & Net Terms](/b2b-companies) — invoiced orders and credit lines.
