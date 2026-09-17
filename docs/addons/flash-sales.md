---
title: "Flash Sales"
description: "Schedules a sale window per product and shows a live countdown until it ends. Stores a start and end window per product and hooks the core on-sale check, so the schedule…"
prev:
  text: "Dynamic Pricing"
  link: /addons/dynamic-pricing
next:
  text: "Frequently Bought Together"
  link: /addons/ai-recommendations
---

# Flash Sales <span class="pro-pill">PRO</span>

> Schedules a sale window per product and shows a live countdown until it ends.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Flash Sales</span></p>

## What it does

Stores a start and end window per product and hooks the core on-sale check, so the schedule decides whether the sale price is honored at checkout — not just whether a banner shows. Countdowns render on product pages and shop-grid cards, plus a shortcode for landing pages. Times are entered in your site’s timezone.

## Capabilities

- Per-product sale window in a dedicated table
- Enforces the window on the real price, not just the banner
- Countdowns on product pages and shop-grid cards, each toggleable
- [ambikly_flash_sale] shortcode for landing pages
- Urgency styling threshold in minutes
- Site-timezone datetimes stored as UTC

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Flash Sales</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: countdown banner on product pages.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Flash Sales</span>.

- **Label prefix**
- **Show timer on product cards**
- **Show timer on product pages**
- **Urgency styling under N minutes**

## Where it appears

**On the storefront**

- Countdown banner on product pages
- Compact countdown on shop-grid cards
- [ambikly_flash_sale] shortcode

**In the admin**

- Flash sale schedules — list, create, delete

## For developers

**REST routes**

- `GET /ambikly-pro/v1/flash-sales`
- `POST /ambikly-pro/v1/flash-sales`
- `DELETE /ambikly-pro/v1/flash-sales`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_product_on_sale`
- `ambikly_product_detail_body`
- `ambikly_product_card_actions`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does the sale price actually stop when the timer runs out?

Yes. Outside the window the sale price is not honored at checkout — the timer and the charged price can’t disagree.

### Can I schedule a sale on a variable product?

No — each variation prices independently, so the parent-level schedule is rejected on save.

### Do I need a cron job?

No. The countdown runs in the browser and the window check happens live on each price evaluation.

## Works well with

[Product Badges](/addons/product-badges) · [Dynamic Pricing](/addons/dynamic-pricing)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Flash Sales is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
