---
title: "Quick View"
description: "Opens a fast product preview modal from any shop page, with no page navigation. Adds a Quick view button to every shop-grid card through the ambikly_product_card_actions…"
prev:
  text: "Product Compare"
  link: /addons/compare
next:
  text: "Recently Viewed"
  link: /addons/recently-viewed
---

# Quick View <span class="pro-pill">PRO</span>

> Opens a fast product preview modal from any shop page, with no page navigation.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Quick View</span></p>

## What it does

Adds a Quick view button to every shop-grid card through the ambikly_product_card_actions filter. Clicking it opens a modal and fetches GET /ambikly-pro/v1/quick-view/{id}, a public route that returns a published product's name, image, price, sale price, descriptions, stock state and canonical URL. Simple in-stock products get an Add to cart button wired to the core cart handler; out-of-stock products show a disabled button; products with published variations get a Select options link to the full product page, where variation pricing and stock are resolved correctly. The modal closes on backdrop click, the close button or Escape, and nothing is written to the database.

## Capabilities

- Quick view button on shop-grid cards
- Dedicated public endpoint for published products
- Shows image, name, price, sale price and description
- Add to cart for simple in-stock products
- Disabled button when the product is out of stock
- Variable products link to the product page
- Closes on backdrop click, close button or Escape
- No settings, no database changes

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Quick View</strong> and switch it on. There is nothing else to install.</li>
  <li>Visit your storefront to confirm the new surface appears: quick view button on product cards.</li>
</ol>

## Settings

This add-on has no settings — turning it on is the whole configuration.

## Where it appears

**On the storefront**

- Quick view button on product cards
- Preview modal with image, price and description
- Add to cart, Out of stock or Select options action

## When to use it

### Fashion grids with many similar items

A clothing store's category pages show dozens of tees. Shoppers open Quick view to read the description and price, then click Select options to pick a size on the product page, and their position in the grid is still there when they come back.

### Simple consumables bought in bulk

A store selling stationery or snacks has mostly simple products. Shoppers preview each item and add it to the cart from the modal, working through an entire category page without a single page load or losing the filters they applied.

### Browsing a sale grid

During a sale, shoppers on a homeware store scan a grid of discounted items. The modal shows the struck-through regular price beside the sale price and a working Add to cart, so the decision happens where the discount caught their eye.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/quick-view/{id}`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_product_card_actions`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does Quick View work with variable products?

Partly. The modal shows the product's image, price and description, but instead of an Add to cart button it shows Select options linking to the product page. Adding a variable product without choosing a variation would charge the parent price, so the add-on avoids that.

### Why does Quick View have its own REST endpoint?

The core products route is restricted to store staff, so guests would receive a 401. This add-on registers a public GET /ambikly-pro/v1/quick-view/{id} route that returns only published products and only the fields the modal needs to render.

### How does the modal decide a product is out of stock?

It mirrors core stock logic: when stock is managed, the quantity must be above zero; otherwise the stock status must be 'instock'. Out-of-stock simple products show a disabled Out of stock button rather than letting the shopper add them to the cart.

### Are there any Quick View settings to configure?

No. Enable the add-on and the button appears on cards; the modal uses your store currency symbol for prices. The button and modal are plain HTML with class names you can restyle from your theme's stylesheet if the defaults do not suit.

## Works well with

[Product Compare](/addons/compare) · [Wishlist](/addons/wishlist)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Quick View is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
