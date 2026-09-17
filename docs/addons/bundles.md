---
title: "Product Bundles"
description: "Package several products under one SKU at a fixed or automatically computed price. Turns any product into a bundle with a stored composition, recomputing the bundle price…"
prev:
  text: "Product Badges"
  link: /addons/product-badges
next:
  text: "Product Compare"
  link: /addons/compare
---

# Product Bundles <span class="pro-pill">PRO</span>

> Package several products under one SKU at a fixed or automatically computed price.

<p><strong>Category:</strong> Merchandising · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Product Bundles</span></p>

## What it does

Turns any product into a bundle with a stored composition, recomputing the bundle price whenever the composition changes. The bundle sells as a single line, but real inventory is checked and decremented against each component, and the component list is snapshotted onto the order for warehouse and invoice use.

## Capabilities

- Composition editor with atomic full-list replacement
- Price computed from components, honoring per-line overrides
- Component stock shortfalls surfaced at checkout
- Component stock decremented atomically at order creation
- Stock restored once on cancel or full refund from the order snapshot
- Validation: no self-reference, no nested bundles

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Product Bundles</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: “what’s included” section on the product page.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Product Bundles</span>.

- **Show the bundle contents on the product page**

## Where it appears

**On the storefront**

- “What’s included” section on the product page

**In the admin**

- Bundle composition editor per product

## For developers

**REST routes**

- `GET /ambikly-pro/v1/products/{id}/bundle-items`
- `PUT /ambikly-pro/v1/products/{id}/bundle-items`
- `POST /ambikly-pro/v1/products/{id}/bundle-items`
- `DELETE /ambikly-pro/v1/products/{id}/bundle-items`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_stock_shortfalls`
- `ambikly_product_detail_body`
- `ambikly_order_created`
- `ambikly_order_status_changed`
- `ambikly_order_refunded`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does a bundle sell out when one component does?

Yes. Each component’s real stock is checked, so a bundle with a sold-out part reports the shortfall like any ordinary product.

### Can I put a bundle inside a bundle?

No — nested bundles are rejected on save.

### What happens to a digital product turned into a bundle?

Its original type is remembered and restored when the bundle is removed.

## Works well with

[Dynamic Pricing](/addons/dynamic-pricing) · [Frequently Bought Together](/addons/ai-recommendations)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Product Bundles is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
