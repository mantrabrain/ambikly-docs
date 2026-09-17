---
title: "Abandoned Cart Recovery"
description: "Automatically emails shoppers who left items in their cart, with a one-click link back to it. A 15-minute scan looks at the store's own carts table for carts with items, a…"
prev:
  text: "All add-ons"
  link: /addons/
next:
  text: "Advanced Reports"
  link: /addons/advanced-reports
---

# Abandoned Cart Recovery <span class="pro-pill">PRO</span>

> Automatically emails shoppers who left items in their cart, with a one-click link back to it.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Abandoned Cart Recovery</span></p>

## What it does

A 15-minute scan looks at the store's own carts table for carts with items, a captured email and no matching order since the cart went idle. Up to three reminder emails go out at offsets you set, each with a resume link that restores the cart and lands the shopper on the cart page. A read-only admin list shows which carts are currently abandoned, their subtotals and which reminders have already been sent.

## Capabilities

- Recurring 15-minute scan over the core carts table — no separate abandoned-carts table
- Three configurable reminder stages, with an optional coupon code in the third email
- Resume link restores the cart and redirects to the cart page
- Skips any cart whose email completed an order since the cart went idle
- Per-episode send log, so a resumed-then-reabandoned cart gets a fresh sequence
- Adds database indexes on activation so the scan stays fast at volume

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Abandoned Cart Recovery</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: html reminder emails with cart line items and a “resume your cart” button.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Abandoned Cart Recovery</span>.

- **First reminder (minutes after abandonment)**
- **Second reminder (minutes)**
- **Third reminder (minutes)**
- **Coupon to include in the third email (optional)**

## Where it appears

**On the storefront**

- HTML reminder emails with cart line items and a “Resume your cart” button
- Resume-cart link handler

**In the admin**

- Abandoned carts list — email, item count, subtotal, reminders sent, last update

## For developers

**REST routes**

- `GET /ambikly-pro/v1/admin/abandoned-carts`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_pro_abandoned_cart_scan`
- `init`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### How does it know a cart was abandoned?

A cart needs items, a customer email and no update for the configured number of minutes. If that email completed an order since the cart went idle, no reminder is sent.

### Can a customer get the same reminder twice?

No. Each send is logged against the cart’s last update; the same stage never resends for the same abandonment episode. Resuming and re-abandoning starts a new sequence.

### Does it need a separate table?

No. It reuses the core carts table and adds two indexes on activation for scan performance.

## Works well with

[Dynamic Pricing](/addons/dynamic-pricing) · [CRM Sync](/addons/crm-sync)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Abandoned Cart Recovery is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
