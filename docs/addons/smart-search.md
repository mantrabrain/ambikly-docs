---
title: "Smart Search"
description: "Type-ahead product search with thumbnails, prices and matching category suggestions. A type-ahead search box delivered by the [ambikly_smart_search] shortcode or by adding…"
prev:
  text: "Size Chart"
  link: /addons/size-chart
next:
  text: "Social Login"
  link: /addons/social-login
---

# Smart Search <span class="pro-pill">PRO</span>

> Type-ahead product search with thumbnails, prices and matching category suggestions.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Smart Search</span></p>

## What it does

A type-ahead search box delivered by the [ambikly_smart_search] shortcode or by adding data-ambikly-smart-search to any input. Keystrokes are debounced for 180 ms and sent to GET /ambikly-pro/v1/smart-search, which matches the query against product name, SKU and short description, orders results by units sold on non-cancelled orders, and optionally returns up to five matching published categories. The panel shows thumbnails, names and formatted prices, supports arrow-key navigation, Enter and Escape, and carries combobox ARIA attributes. Links point at the real shop page, so the box works in a header or widget. The endpoint enforces the minimum character count and allows 60 requests per IP per minute.

## Capabilities

- Results appear as the shopper types, debounced at 180 ms
- Matches product name, SKU and short description
- Ranked by units sold, newest product as tiebreaker
- Up to five published category suggestions
- Thumbnails and formatted prices in the results panel
- Arrow keys, Enter and Escape with combobox ARIA
- Minimum characters enforced server-side; 60 requests per IP per minute
- Stale responses discarded so fast typing never shows old results

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Smart Search</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_smart_search] shortcode with optional placeholder attribute.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Smart Search</span>.

- **Maximum number of results (default 8)**
- **Minimum characters before a search runs (default 2)**
- **Whether category suggestions are shown**
- **Placeholder text in the box**

## Where it appears

**On the storefront**

- [ambikly_smart_search] shortcode with optional placeholder attribute
- Any input carrying data-ambikly-smart-search
- Results panel with Categories and Products groups

## When to use it

### Stores where customers search by SKU

A parts or supplies store whose repeat buyers know product codes. Typing a partial SKU brings up the exact item with its thumbnail and price, letting a trade customer reorder in seconds without browsing categories or opening a product page first.

### Large catalogs with deep categories

A store with hundreds of categories turns category suggestions on. A shopper typing 'lamp' sees the Lamps category above individual products and can jump straight to the filtered grid, while the product list below still shows the best sellers that match.

### Header search on a content-heavy site

A store that also publishes buying guides adds the box to the site header. Because links resolve to the shop page, product results open correctly from a blog post, and a reader who learns about a product in an article can reach it in one step.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/smart-search`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does Smart Search need a search index or external service?

No. It runs a LIKE match over name, SKU and short description in the products table, with popularity computed from order history in the same query. That is fast enough for catalogs of roughly ten thousand products; no cron job or third-party API is involved.

### How are search results ranked?

By total units sold across orders that were not cancelled or failed, highest first, with the newest product id breaking ties. A product that sells often therefore appears above an older product with the same name match, and category suggestions are ordered shortest name first.

### Can I put the search box in my header instead of the shop page?

Yes. Result links are built from your configured shop page's permalink, not the current URL, so the box works in a header, footer or sidebar widget. Use the shortcode or add data-ambikly-smart-search to an existing input and the script wires it up.

### Can someone hammer the search endpoint?

The endpoint refuses queries shorter than your minimum character setting and returns a 429 response once an IP has made 60 requests within a minute. Genuine typing stays well under that limit because the client waits 180 ms after the last keystroke before requesting.

## Works well with

[AJAX Filters](/addons/ajax-filters)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Smart Search is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
