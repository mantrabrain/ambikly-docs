---
title: "Loyalty Points"
description: "Customers earn points on paid orders and redeem them as a cart discount. An append-only ledger makes every credit and debit auditable, with balances derived by walking…"
prev:
  text: "Gift Cards"
  link: /addons/gift-cards
next:
  text: "Multi-vendor"
  link: /addons/multi-vendor
---

# Loyalty Points <span class="pro-pill">PRO</span>

> Customers earn points on paid orders and redeem them as a cart discount.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Loyalty Points</span></p>

## What it does

An append-only ledger makes every credit and debit auditable, with balances derived by walking batches oldest-first so expiry only removes genuinely expired points. Points are awarded when an order is paid, and redemption is applied through cart totals and debited under a per-customer lock once payment lands. Refunds reverse both earning and redemption, once.

## Capabilities

- Append-only ledger with oldest-first batch expiry
- Earn rate per currency unit and redeem value per point
- Minimum points to redeem and a maximum share of the order points may cover
- Per-customer lock prevents double-spend across devices
- Offline-payment orders earn and debit on status change
- Refunds reverse earnings and credit redeemed points back, idempotently
- Customer balance and history endpoints; manual adjustment for managers

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Loyalty Points</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_loyalty_balance] shortcode.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Loyalty Points</span>.

- **Points earned per currency unit**
- **Currency value per point**
- **Minimum points to redeem**
- **Max % of order redeemable**
- **Expire points after N days (0 = never)**

## Where it appears

**On the storefront**

- [ambikly_loyalty_balance] shortcode
- Loyalty redemption line in cart totals
- Apply / remove points at checkout

**In the admin**

- Manual points adjustment
- Per-customer balance and history

## For developers

**REST routes**

- `POST /ambikly-pro/v1/cart/loyalty`
- `DELETE /ambikly-pro/v1/cart/loyalty`
- `GET /ambikly-pro/v1/loyalty/balance`
- `GET /ambikly-pro/v1/loyalty/history`
- `POST /ambikly-pro/v1/loyalty/adjust`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_order_created`
- `ambikly_order_paid`
- `ambikly_order_status_changed`
- `ambikly_order_refunded`
- `ambikly_cart_totals`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Do points expire?

Optionally, after the number of days you set. Expiry is applied per earn batch, oldest first, so spending old points never wrongly expires newer ones.

### Can a customer redeem the same points on two orders?

No. The debit is re-validated against the live balance inside a per-customer lock.

### How much of an order can points cover?

Up to the maximum share you set (default 50%), and never more than the cart total.

## Works well with

[Store Credit Wallet](/addons/store-credit) · [Gift Cards](/addons/gift-cards)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Loyalty Points is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
