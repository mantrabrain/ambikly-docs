---
title: "Product Compare"
description: "Adds a compare button to product cards and a side-by-side comparison table. Adds an 'Add to Compare' button to shop-grid cards and the single product page through the…"
prev:
  text: "Product Bundles"
  link: /addons/bundles
next:
  text: "Quick View"
  link: /addons/quick-view
---

# Product Compare <span class="pro-pill">PRO</span>

> Adds a compare button to product cards and a side-by-side comparison table.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Product Compare</span></p>

## What it does

Adds an 'Add to Compare' button to shop-grid cards and the single product page through the ambikly_product_card_actions and ambikly_product_detail_actions filters. Clicking it toggles the product id in an ambikly_compare cookie that lasts seven days and holds at most your configured maximum; when the list is full the oldest id drops off. A floating tray lists the chosen products with remove buttons and a Compare button that activates at two items. That button calls GET /ambikly-pro/v1/compare, which returns published products with image, price, sale price, SKU, weight, dimensions and summary, rendered as a side-by-side table inside the [ambikly_compare] container or appended to the page.

## Capabilities

- Compare button on grid cards and product pages
- Selection kept in a seven-day cookie
- Oldest item drops off when the list is full
- Floating tray with per-product remove buttons
- Compare button enabled once two products are chosen
- Rows for image, name, price, sale price, SKU, weight, dimensions, summary
- Dimensions composed from length, width and height
- Only published products are returned

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Product Compare</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: add to compare button on cards and product pages.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Product Compare</span>.

- **Maximum products to compare (minimum 2, default 4)**
- **Label on the trigger button and tray**

## Where it appears

**On the storefront**

- Add to Compare button on cards and product pages
- Floating compare tray
- [ambikly_compare] table container
- Side-by-side comparison table

## When to use it

### Electronics with close specifications

A store selling headphones or routers has products that differ mainly in weight, size and a few summary lines. Shoppers pick two to four models from the grid and read them side by side instead of opening tabs, which shortens the path to a decision.

### Furniture that must fit a space

A furniture store's customers care about dimensions above all. The compare table lists length, width and height for each chosen piece in one row, so a shopper can check which desk or shelf fits the wall they have measured before adding it to the cart.

### Sale-price shopping

During a promotion a shopper on a kitchenware store collects several similar items and opens the table. Regular and sale prices sit in adjacent rows, making it obvious which product carries the bigger reduction without reading each product page in turn.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/compare`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_product_card_actions`
- `ambikly_product_detail_actions`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### How many products can shoppers compare at once?

As many as your Max products setting allows, with a floor of two and a default of four. When a shopper adds one more than the maximum, the oldest selection is dropped rather than blocking the click, so the tray never fills up permanently.

### Does the compare list survive a page refresh?

Yes. Product ids are stored in an ambikly_compare cookie that expires after seven days, so the tray repaints with the same products on every page during that time. Nothing is written to the database for the selection itself.

### Where does the comparison table appear?

If the page contains the [ambikly_compare] shortcode, the table renders inside it and the page scrolls there. If not, the script appends a container to the end of the page so the table still appears. A dedicated compare page gives the cleanest result.

### Which product fields are compared?

Image, name, price, sale price, SKU, weight, dimensions and the short description. Dimensions are built from the product's length, width and height fields, so they display as, for example, 30 x 20 x 10. Unpublished products are excluded from the table.

## Works well with

[Quick View](/addons/quick-view) · [Wishlist](/addons/wishlist)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Product Compare is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
