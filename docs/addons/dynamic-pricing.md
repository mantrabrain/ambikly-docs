---
title: "Dynamic Pricing"
description: "Rule-based cart discounts — tiered, role-based, quantity, BOGO and scheduled. A rule engine over the cart totals: active, in-window, under-limit rules are evaluated against…"
prev:
  text: "Download Analytics"
  link: /addons/download-analytics
next:
  text: "Flash Sales"
  link: /addons/flash-sales
---

# Dynamic Pricing <span class="pro-pill">PRO</span>

> Rule-based cart discounts — tiered, role-based, quantity, BOGO and scheduled.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Dynamic Pricing</span></p>

## What it does

A rule engine over the cart totals: active, in-window, under-limit rules are evaluated against the cart and appended as discount lines. Rules target everything, specific products, categories, tags or brands, and are either combinable or exclusive. Usage limits are enforced atomically at order creation.

## Capabilities

- Discount types: percent, fixed amount, fixed price, and buy-X-get-Y
- Conditions: subtotal range, minimum quantity, user roles, logged-in, exclude sale items
- Targets: whole cart, products, categories, tags or brands, with exclusions
- Exclusive rules take the largest discount; combinable rules keep the best per scope
- Total discount capped so a cart can never go negative
- Usage limit enforced atomically — a rule can’t be over-redeemed by concurrent checkouts
- Respects Flash Sales windows when excluding sale items

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Dynamic Pricing</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: discount line in cart and checkout totals, labelled with the rule name.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Dynamic Pricing</span>.

- **Apply discount against (cart / matching items)**

## Where it appears

**On the storefront**

- Discount line in cart and checkout totals, labelled with the rule name

**In the admin**

- Pricing rules list, create, edit, delete
- Activate / deactivate a rule
- Rule-builder metadata

## For developers

**REST routes**

- `GET /ambikly-pro/v1/pricing-rules`
- `POST /ambikly-pro/v1/pricing-rules`
- `GET /ambikly-pro/v1/pricing-rules/{id}`
- `PUT /ambikly-pro/v1/pricing-rules/{id}`
- `DELETE /ambikly-pro/v1/pricing-rules/{id}`
- `POST /ambikly-pro/v1/pricing-rules/{id}/activate`
- `POST /ambikly-pro/v1/pricing-rules/{id}/deactivate`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_cart_totals`
- `ambikly_order_created`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### How do stacked tier rules behave?

Rules on the same target keep only the single best discount rather than summing; rules with different scopes still stack.

### What does making a rule exclusive do?

If an exclusive rule matches, no other rule applies; among several exclusive matches, the largest discount wins.

### Can a usage limit be exceeded by concurrent checkouts?

No. The increment is guarded by the limit; if it was exhausted in between, the order is stopped and the customer asked to review their cart.

## Works well with

[Flash Sales](/addons/flash-sales) · [Gift Cards](/addons/gift-cards) · [Store Credit Wallet](/addons/store-credit)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Dynamic Pricing is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
