---
title: "Size Chart"
description: "Shows a per-category size guide in a modal, triggered from the product page. Charts are stored as a JSON array in the add-on settings; each has a name, an HTML table and an…"
prev:
  text: "Shipment Tracking"
  link: /addons/shipment-tracking
next:
  text: "Smart Search"
  link: /addons/smart-search
---

# Size Chart <span class="pro-pill">PRO</span>

> Shows a per-category size guide in a modal, triggered from the product page.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Size Chart</span></p>

## What it does

Charts are stored as a JSON array in the add-on settings; each has a name, an HTML table and an optional list of category ids. On a product page the ambikly_product_detail_body action renders a Size guide button when a chart matches the product's category, one of its parent categories (walked up to ten levels), or a chart with no categories acting as the store-wide default. Clicking it fetches GET /ambikly-pro/v1/size-chart?product_id=N, a public route returning the chart name and HTML filtered through a strict allow list of table and basic text tags, and opens a dialog that closes on Escape or backdrop click. The [ambikly_size_chart] shortcode renders the same table inline.

## Capabilities

- Multiple charts, each assigned to category ids
- Chart with no categories acts as the default
- Parent-category inheritance up to ten levels
- Size guide button rendered on matching product pages
- Modal fetched once per product and cached client-side
- Inline rendering with the [ambikly_size_chart] shortcode
- HTML filtered to table and basic text tags only
- Public endpoint returns charts for published products only

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Size Chart</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: size guide button on product pages.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Size Chart</span>.

- **Label on the trigger button (default Size guide)**
- **Charts as JSON: name, category ids and table HTML**

## Where it appears

**On the storefront**

- Size guide button on product pages
- Size chart dialog with title and close button
- [ambikly_size_chart product_id="N"] inline table

**In the admin**

- Charts and trigger label edited in the add-on settings panel

## When to use it

### Clothing stores with brand-specific fits

An apparel store sells several brands whose sizing differs. It creates one chart per brand category, assigns each by category id, and keeps a generic default. Shoppers on any product page see the chart that matches its brand without the store editing individual products.

### Footwear with international conversions

A shoe store publishes a UK, EU and US conversion table as a single default chart. Every product page gets the Size guide button, and shoppers unsure of their size open the dialog, check the row and pick a variation without leaving the page.

### Kids' ranges under a parent category

A store files products under Kids, then Boys, then Outerwear. A single chart assigned to Kids covers every nested subcategory because matching walks up the parent chain, so new subcategories added later inherit the guide automatically.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/size-chart`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_product_detail_body`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Do I need a size chart for every category?

No. A chart with an empty category list is the default and applies wherever no specific chart matches. A chart assigned to a parent category such as Clothing also covers products filed under child categories like Men's Shirts, because matching walks up the hierarchy.

### Is merchant-authored HTML safe to show shoppers?

The chart HTML passes through wp_kses with an allow list limited to table, thead, tbody, tfoot, tr, th, td, p, strong, em, br, ul, ol, li, small and span, so scripts and event handlers are stripped before the modal or shortcode outputs it.

### Why doesn't the Size guide button appear on some products?

The button only renders when a chart matches the product's category chain or a default chart exists, and only for published products. Check that the product has a category assigned and that the chart's category ids match the ids in your categories list.

### Can I show the size table inline instead of in a modal?

Yes. Place [ambikly_size_chart product_id="123"] in page content and the matching chart's sanitized table renders directly in the page, using the same category matching as the button. Without a product_id attribute the shortcode outputs nothing.

## Works well with

[Advanced Variations](/addons/advanced-variations)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Size Chart is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
