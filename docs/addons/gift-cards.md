---
title: "Gift Cards"
description: "Sell stored-value gift cards and let customers redeem the balance at checkout. Flag a product as a gift card and every paid unit mints a uniquely coded card, optionally…"
prev:
  text: "Frequently Bought Together"
  link: /addons/ai-recommendations
next:
  text: "Loyalty Points"
  link: /addons/loyalty-points
---

# Gift Cards <span class="pro-pill">PRO</span>

> Sell stored-value gift cards and let customers redeem the balance at checkout.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Gift Cards</span></p>

## What it does

Flag a product as a gift card and every paid unit mints a uniquely coded card, optionally emailed to a recipient. Buyers apply a code at checkout; the deduction happens atomically at order creation with a compare-and-swap loop so a card can never be overdrawn. Refunds credit balances back proportionally, and a refunded gift-card purchase voids the card it issued.

## Capabilities

- Auto-issue on payment — one card per unit, with prefix, expiry and optional recipient email
- Compare-and-swap redemption so concurrent redemptions can’t overdraw
- Applies after merchandise discounts, redeeming against the real payable amount
- Proportional credit-back on partial refunds; full restore on a never-completed order
- A fully refunded purchase voids the card it issued
- Admin bulk cancel and extend-expiry, each with a per-card activity ledger

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Gift Cards</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: gift card redemption at checkout.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Gift Cards</span>.

- **Code prefix**
- **Default expiry (days, 0 = never)**
- **Email recipient when a card is issued**

## Where it appears

**On the storefront**

- Gift card redemption at checkout
- “Gift cards” account tab — code, balance, expiry, status
- Gift card issued email

**In the admin**

- Gift cards list with status and search
- Card detail with full activity ledger
- Manual issue, balance adjust, cancel
- Bulk cancel and bulk extend expiry

## For developers

**REST routes**

- `POST /ambikly-pro/v1/gift-cards/lookup`
- `GET /ambikly-pro/v1/gift-cards`
- `POST /ambikly-pro/v1/gift-cards`
- `GET /ambikly-pro/v1/gift-cards/{id}`
- `POST /ambikly-pro/v1/gift-cards/{id}/adjust`
- `POST /ambikly-pro/v1/gift-cards/{id}/cancel`
- `POST /ambikly-pro/v1/gift-cards/bulk`
- `POST /ambikly-pro/v1/cart/gift-cards`
- `DELETE /ambikly-pro/v1/cart/gift-cards/{code}`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_order_paid`
- `ambikly_order_created`
- `ambikly_order_status_changed`
- `ambikly_order_refunded`
- `ambikly_cart_totals`
- `ambikly_account_tabs`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### What if two people use the same code at once?

Redemption only writes if the balance is still exactly what was read, retrying against the fresh value — a card can never be debited past its balance.

### Do cash-on-delivery gift card purchases issue a code?

Yes — for payment methods that can’t refund, the card is issued when you move the order to processing or completed.

### What if I refund an order that bought a gift card?

On a full refund, any still-active card that order issued is cancelled, so no live balance stays in circulation after the money goes back.

## Works well with

[Store Credit Wallet](/addons/store-credit) · [Loyalty Points](/addons/loyalty-points) · [Dynamic Pricing](/addons/dynamic-pricing)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Gift Cards is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
