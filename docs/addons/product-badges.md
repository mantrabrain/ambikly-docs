---
title: "Product Badges"
description: "Adds Sale, New, Hot and Sold out ribbons to product cards from a simple rules engine. Hooks the core ambikly_product_card_badges filter to append Sale, New, Hot and Sold out…"
prev:
  text: "Post-purchase Upsells"
  link: /addons/post-purchase-upsells
next:
  text: "Product Bundles"
  link: /addons/bundles
---

# Product Badges <span class="pro-pill">PRO</span>

> Adds Sale, New, Hot and Sold out ribbons to product cards from a simple rules engine.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Product Badges</span></p>

## What it does

Hooks the core ambikly_product_card_badges filter to append Sale, New, Hot and Sold out badges to the array the storefront renders on cards and product pages. Sale defers to the core on-sale check, which Flash Sales can gate; New compares the product's created date against your day count; Hot sums units sold in a rolling window and compares against your threshold; Sold out mirrors the core stock precedence. For markup the storefront does not render, such as the Product Grid block, a script collects data-ambikly-product-id elements without badges, calls GET /ambikly-pro/v1/badges?ids= once (capped at 200 ids and cached for five minutes) and paints the ribbons at your configured position.

## Capabilities

- Four badges with individual toggles and labels
- Sale badge follows core on-sale logic and Flash Sales windows
- New based on days since the product was created
- Hot based on units sold in a rolling window
- Sold out mirrors core stock precedence
- Public badges endpoint, cached five minutes, capped at 200 ids
- JavaScript fallback for cards the server did not decorate
- Results extensible through the ambikly_pro_product_badges filter

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Product Badges</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: ribbons on product cards in the shop, search and archive grids.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Product Badges</span>.

- **Show Sale badge and its label**
- **Show New badge, its label and the number of days**
- **Show Hot badge, its label, the sold threshold and the window in days**
- **Show Sold out badge and its label**
- **Badge position (default top-left)**

## Where it appears

**On the storefront**

- Ribbons on product cards in the shop, search and archive grids
- Ribbons on product pages and related products
- Fallback ribbons on block or theme cards carrying a product id

## When to use it

### Frequent new arrivals

A fashion store adds products weekly. With New set to 14 days, arrivals are labeled automatically and the badge disappears on its own, so nobody has to edit products to add or remove a 'new' tag as the range turns over.

### Highlighting momentum

A gadget store enables Hot with a threshold of 20 units in 7 days. Products that catch on after a review show the ribbon while the trend lasts, and it fades once sales slow, giving shoppers a live signal of what others are buying.

### Managing expectations on stock

A store with limited runs keeps sold-out products visible for search traffic. The Sold out ribbon on cards tells shoppers before they click, reducing frustration and matching the disabled Add to cart they would find on the product page.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/badges`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_product_card_badges`
- `ambikly_pro_product_badges`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### What makes a product Hot?

Units sold across orders in the last N days reaching your threshold, both configurable, with defaults of 50 units in 30 days. It is a current-trend signal rather than an all-time bestseller count, so a product that spiked years ago does not stay Hot forever. Hot is off by default.

### Will badges work with my theme's own product cards?

Yes, provided each card element carries data-ambikly-product-id. The script batches those ids into one request to the public badges endpoint and appends the ribbons, skipping any card that the server already decorated so nothing doubles up.

### Why is there no Sale badge during a scheduled promotion?

The Sale badge defers to the core on-sale check, which Flash Sales gates to its schedule. Outside the window the product is not on sale, so no badge appears even if a sale price is stored, and the badge is added only once when core already supplied it.

### How does Sold out decide a product is unavailable?

It follows core stock logic: when stock is managed, a quantity at or below zero means sold out; otherwise the stock status must be 'outofstock'. That keeps the ribbon consistent with whether the Add to cart button actually works on the product page.

## Works well with

[Flash Sales](/addons/flash-sales) · [AJAX Filters](/addons/ajax-filters)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Product Badges is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
