---
title: "AJAX Filters"
description: "Sidebar facets that refresh the shop grid without a page reload. The [ambikly_filters] shortcode renders an aside with published-category checkboxes, minimum and maximum…"
prev:
  text: "AI Product Descriptions"
  link: /addons/ai-descriptions
next:
  text: "Checkout Field Editor"
  link: /addons/checkout-field-editor
---

# AJAX Filters <span class="pro-pill">PRO</span>

> Sidebar facets that refresh the shop grid without a page reload.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → AJAX Filters</span></p>

## What it does

The [ambikly_filters] shortcode renders an aside with published-category checkboxes, minimum and maximum price inputs, a sort selector (default, popularity, newest, price ascending and descending) and a Reset button. Any change is debounced for 250 ms and sent to GET /ambikly-pro/v1/filtered-products, which returns published products matching the selected category ids, price range and the term in the core shop search box, paginated at up to 60 per page. Popularity is computed from units sold on non-cancelled orders. The script replaces the contents of the element carrying data-ambikly-products-grid with cards that use the same markup as the server-rendered grid, discards stale responses, and shows an error message if a request fails.

## Capabilities

- Category, price range and sort facets from one shortcode
- Grid refreshes 250 ms after the last change
- Popularity sort computed from real order history
- Search term from the core shop box carried through
- Only published categories offered and accepted
- Per page capped at 60; pagination in the response
- Cards use the storefront's own product-card markup
- Stale responses ignored; error message on failure

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>AJAX Filters</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_filters] sidebar shortcode.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → AJAX Filters</span>.

- **Whether the category checklist is shown**
- **Whether the price range inputs are shown**
- **Attribute filters toggle (no attribute facet is rendered in the current release)**

## Where it appears

**On the storefront**

- [ambikly_filters] sidebar shortcode
- Category checkboxes, Min and Max price inputs, Sort by selector
- Reset filters button
- Loading and error states on the product grid

## When to use it

### Home goods with broad categories

A homeware store lists hundreds of products across kitchen, bath and decor. Shoppers tick two categories and set a price ceiling, and the grid updates in place while they adjust, so they refine the list rather than reloading the page after every change.

### Budget-driven gift shopping

A gift store's visitors often shop to a budget. Entering a maximum price narrows the grid immediately, and switching the sort to price low-to-high puts the most affordable items first, all without the shopper leaving the page or losing their category choices.

### Refining a search result

A shopper on a tool store searches for 'drill' using the core shop box, then ticks the Cordless category in the sidebar. The search term travels with the request, so the grid shows cordless drills rather than every cordless product in the catalog.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/filtered-products`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Where do I put the filter widget?

Drop [ambikly_filters] in a sidebar or column next to the shop grid. The script targets the first element with data-ambikly-products-grid or the ambikly-products-grid class, which the shop, search and archive shortcodes all render, and rewrites that grid in place.

### Can I filter by attributes like size or color?

Not in the current release. The settings panel includes an attribute filters toggle, but the shortcode renders only the category checklist, price range and sort selector. Products can be narrowed by category and price, and any search term typed into the shop box is preserved.

### How is the Popularity sort calculated?

The endpoint joins order items to orders whose status is not cancelled or failed, sums quantities per product in one pass, and sorts by that total. Products with no sales sort last. Newest uses the product's created date, and the two price options sort by regular price.

### Does applying a filter drop the customer's search term?

No. Before each request the script reads the value of the core shop search box and passes it as the search parameter, which matches name and SKU. A shopper who searched for 'lamp' and then ticks a category sees only lamps in that category.

## Works well with

[Smart Search](/addons/smart-search) · [Product Badges](/addons/product-badges)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">AJAX Filters is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
