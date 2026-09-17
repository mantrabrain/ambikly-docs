---
title: "Order Bumps"
description: "One-click add-on offers on the checkout page to lift average order value. Bump offers carry targeting conditions and an optional schedule; the eligible ones for the current…"
prev:
  text: "One Page Checkout"
  link: /addons/one-page-checkout
next:
  text: "PDF Stamping"
  link: /addons/pdf-stamping
---

# Order Bumps <span class="pro-pill">PRO</span>

> One-click add-on offers on the checkout page to lift average order value.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Order Bumps</span></p>

## What it does

Bump offers carry targeting conditions and an optional schedule; the eligible ones for the current cart are shown above the order summary. Accepting adds the product to the cart at a server-resolved price, so it flows through totals, tax, payment and fulfillment like any other line. Eligibility is re-checked at accept time.

## Capabilities

- Discount types: percent off, fixed amount off, or a fixed bump price
- Targeting by subtotal range and by product or category, with a schedule
- Excludes bumps whose product is already in the cart; priority ordered
- Price always resolved server-side — the client never supplies it
- Eligibility re-validated at accept time
- Configurable maximum bumps per checkout
- Accept is idempotent; decline removes the line

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Order Bumps</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: bump offers above the checkout order summary.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Order Bumps</span>.

- **Maximum bumps to show per checkout**

## Where it appears

**On the storefront**

- Bump offers above the checkout order summary

**In the admin**

- Order bumps — list, create, edit, delete

## For developers

**REST routes**

- `GET /ambikly-pro/v1/order-bumps`
- `POST /ambikly-pro/v1/order-bumps`
- `GET /ambikly-pro/v1/order-bumps/{id}`
- `PUT /ambikly-pro/v1/order-bumps/{id}`
- `DELETE /ambikly-pro/v1/order-bumps/{id}`
- `GET /ambikly-pro/v1/checkout/order-bumps`
- `POST /ambikly-pro/v1/checkout/order-bumps/{id}/accept`
- `DELETE /ambikly-pro/v1/checkout/order-bumps/{id}/decline`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `rest_api_init`
- `wp_enqueue_scripts`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Can a buyer tamper with the bump price?

No. The accept endpoint refuses a client-supplied price and resolves it server-side from the bump record.

### Is this a second checkout step?

No. Accepting adds the product to the existing cart, so it flows through the same totals, tax and payment.

## Works well with

[One Page Checkout](/addons/one-page-checkout) · [Post-purchase Upsells](/addons/post-purchase-upsells)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Order Bumps is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
