---
title: "Advanced Shipping"
description: "Conditional shipping rules driven by cart subtotal, weight, destination or contents. A rule engine that plugs into the core shipping-rates filter: the first matching rule…"
prev:
  text: "Advanced Reports"
  link: /addons/advanced-reports
next:
  text: "Advanced Variations"
  link: /addons/advanced-variations
---

# Advanced Shipping <span class="pro-pill">PRO</span>

> Conditional shipping rules driven by cart subtotal, weight, destination or contents.

<p><strong>Category:</strong> Physical · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Advanced Shipping</span></p>

## What it does

A rule engine that plugs into the core shipping-rates filter: the first matching rule becomes the shipping line the customer sees. Rules are evaluated in priority order; if nothing matches and no other method exists, an optional flat fallback applies. Rules are created and deleted from the admin over REST with full validation.

## Capabilities

- Conditions: cart subtotal min/max, cart weight min/max, destination countries, has product, has category
- Results: free, flat, percentage of subtotal, or per item
- Priority ordering with a stable tie-break; up to 200 active rules
- Optional fallback flat rate when no rule matches
- Rejects invalid ranges and unknown result types at save time
- Result amount floored at zero — a rule can never produce negative shipping

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Advanced Shipping</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: shipping method line at checkout, titled from the rule.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Advanced Shipping</span>.

- **Fallback flat rate**

## Where it appears

**On the storefront**

- Shipping method line at checkout, titled from the rule

**In the admin**

- Shipping rules list, create, delete

## For developers

**REST routes**

- `GET /ambikly-pro/v1/shipping-rules`
- `POST /ambikly-pro/v1/shipping-rules`
- `DELETE /ambikly-pro/v1/shipping-rules`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_shipping_rates`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### What happens if two rules both match?

First match wins, ordered by priority then by age, so ties resolve deterministically to the oldest rule.

### Does it talk to carrier APIs for live rates?

No. It is a rule engine evaluated against the cart; it is not a replacement for carrier-API integrations.

### How is a category condition matched?

Against the product’s category — Ambikly products carry one primary category.

## Works well with

[Shipment Tracking](/addons/shipment-tracking)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Advanced Shipping is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
