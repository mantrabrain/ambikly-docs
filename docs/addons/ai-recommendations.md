---
title: "Frequently Bought Together"
description: "“Customers who bought this also bought” companions from real purchase co-occurrence. A scheduled job builds a pairs table from your own order history, keeps pairs above a…"
prev:
  text: "Flash Sales"
  link: /addons/flash-sales
next:
  text: "Gift Cards"
  link: /addons/gift-cards
---

# Frequently Bought Together <span class="pro-pill">PRO</span>

> “Customers who bought this also bought” companions from real purchase co-occurrence.

<p><strong>Category:</strong> Merchandising · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Frequently Bought Together</span></p>

## What it does

A scheduled job builds a pairs table from your own order history, keeps pairs above a minimum support and scores them by lift. Product pages render the top companions automatically, or you place them with a shortcode; a public REST route serves the same data. Rebuilds are non-blocking so the storefront never shows an empty gap.

## Capabilities

- Rebuild on a custom N-day schedule with a rolling lookback window
- Minimum-support threshold so one-off coincidences don’t surface
- Score is overridable via the ambikly_recommendation_score filter
- Companions filtered to published products that are in stock
- Renders on product pages, via [ambikly_recommendations], and over REST
- Manual rebuild action for store managers

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Frequently Bought Together</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_recommendations] shortcode.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Frequently Bought Together</span>.

- **Number of recommendations**
- **Minimum orders for co-occurrence**
- **Rebuild every N days**
- **Heading**
- **Only consider orders from the last N days**

## Where it appears

**On the storefront**

- [ambikly_recommendations] shortcode
- Automatic block on product detail pages

**In the admin**

- Rebuild recommendations action

## For developers

**REST routes**

- `GET /ambikly-pro/v1/recommendations`
- `POST /ambikly-pro/v1/recommendations/rebuild`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_pro_reco_rebuild`
- `ambikly_product_detail_body`
- `ambikly_recommendation_score`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does this use an AI model?

No. It is a market-basket co-occurrence query over your real orders — not a language model. The score filter is the hook for swapping in embedding-based similarity later.

### Will out-of-stock products be recommended?

No. Only published, in-stock products are returned.

## Works well with

[Product Bundles](/addons/bundles) · [Product Badges](/addons/product-badges)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Frequently Bought Together is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
