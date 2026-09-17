---
title: "Post-purchase Upsells"
description: "A one-click add-on offer on the thank-you page, charged to the card already on file. When an order is paid, the first matching offer is cached with a single-use token and…"
prev:
  text: "Popup Campaigns"
  link: /addons/popup-campaigns
next:
  text: "Product Badges"
  link: /addons/product-badges
---

# Post-purchase Upsells <span class="pro-pill">PRO</span>

> A one-click add-on offer on the thank-you page, charged to the card already on file.

<p><strong>Category:</strong> Checkout · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Post-purchase Upsells</span></p>

## What it does

When an order is paid, the first matching offer is cached with a single-use token and shown on the thank-you page to the verified order owner. Accepting re-validates everything live, charges the gateway for the difference with an idempotency key, appends the line item, decrements stock and records the transaction.

## Capabilities

- Triggers: always, order-total minimum, or contains a category
- Single-use accept token with a countdown
- Viewer verified as the order owner before the token is rendered
- Per-order lock plus a deterministic idempotency key — no double charges
- Offer, product and price re-derived live at accept time
- Decline invalidates the token immediately
- Stock decremented atomically on accept

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Post-purchase Upsells</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_upsell_offer] block on the thank-you page.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Post-purchase Upsells</span>.

- **Show upsells**
- **Offer expires (minutes)**
- **Offer heading**
- **Offer subheading**

## Where it appears

**On the storefront**

- [ambikly_upsell_offer] block on the thank-you page

**In the admin**

- Upsell offers — product, discount, trigger, priority, enabled

## Third-party services

This add-on talks to:

- Gateway additional charges (Stripe)

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**REST routes**

- `POST /ambikly-pro/v1/upsell/accept`
- `POST /ambikly-pro/v1/upsell/decline`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_order_paid`
- `ambikly_upsell_accepted`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does the customer re-enter payment details?

No. The accept endpoint charges the order’s existing gateway for the difference and appends a line to the same order.

### Can a double-click charge twice?

No. The charge is serialized by a per-order lock and carries a deterministic idempotency key.

### Can someone see another customer’s offer?

No. The viewer is authorized with the same check the thank-you page uses.

## Works well with

[Order Bumps](/addons/order-bumps)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Post-purchase Upsells is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
