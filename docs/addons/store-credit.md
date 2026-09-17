---
title: "Store Credit Wallet"
description: "A per-customer wallet for refunds, gift credit and goodwill, spendable at checkout. An append-only ledger per customer, with the balance as the running sum."
prev:
  text: "Sticky Add to Cart"
  link: /addons/sticky-add-to-cart
next:
  text: "Subscriptions"
  link: /addons/subscriptions
---

# Store Credit Wallet <span class="pro-pill">PRO</span>

> A per-customer wallet for refunds, gift credit and goodwill, spendable at checkout.

<p><strong>Category:</strong> Customer · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Store Credit Wallet</span></p>

## What it does

An append-only ledger per customer, with the balance as the running sum. Customers apply credit at checkout; the amount is snapshotted at order creation and debited under a per-customer lock once payment lands. Refunds on payment methods that can’t refund can be issued as credit instead.

## Capabilities

- Append-only ledger — every grant and spend is auditable
- Apply and clear credit at checkout
- Per-customer lock before the debit is written
- Offline-payment orders debit on status change
- Refund-to-credit only for methods that can’t issue a real refund
- Configurable minimum balance to apply
- Manager adjustment endpoint

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Store Credit Wallet</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_store_credit_balance] shortcode.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Store Credit Wallet</span>.

- **Credit refunds to store credit for non-refundable payment methods**
- **Minimum balance applied at checkout**

## Where it appears

**On the storefront**

- [ambikly_store_credit_balance] shortcode
- “Store credit applied” line in cart totals
- Apply / remove credit at checkout

**In the admin**

- Manual wallet adjustment
- Balance lookup

## For developers

**REST routes**

- `POST /ambikly-pro/v1/cart/store-credit`
- `DELETE /ambikly-pro/v1/cart/store-credit`
- `GET /ambikly-pro/v1/store-credit`
- `POST /ambikly-pro/v1/store-credit/adjust`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_cart_totals`
- `ambikly_order_created`
- `ambikly_order_paid`
- `ambikly_order_status_changed`
- `ambikly_order_refunded`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Will a refund pay the customer twice?

No. Refund-to-credit only fires for payment methods that can’t refund, where crediting the wallet is the refund.

### Can the same balance be spent on two orders at once?

No. The debit is re-validated against the live balance inside a per-customer lock.

### Where does credit come from?

Manual adjustments, refunds on non-refundable methods, and any other add-on that writes a ledger row.

## Works well with

[Loyalty Points](/addons/loyalty-points) · [Gift Cards](/addons/gift-cards)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Store Credit Wallet is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
