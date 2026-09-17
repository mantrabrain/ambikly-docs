---
title: "Advanced Reports"
description: "Cohort retention, RFM segmentation, top customers and CSV exports from your order history. Four read-only reports computed directly from your orders and customers — no new…"
prev:
  text: "Abandoned Cart Recovery"
  link: /addons/abandoned-cart
next:
  text: "Advanced Shipping"
  link: /addons/advanced-shipping
---

# Advanced Reports <span class="pro-pill">PRO</span>

> Cohort retention, RFM segmentation, top customers and CSV exports from your order history.

<p><strong>Category:</strong> Admin · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Advanced Reports</span></p>

## What it does

Four read-only reports computed directly from your orders and customers — no new tables, no background jobs. Cohort groups customers by first-purchase month and shows net revenue per month since; RFM scores every customer on recency, frequency and monetary value and buckets them into named segments; Top Customers ranks by net spend; Export returns orders or customers for a date range.

## Capabilities

- Cohort grid: first-purchase month vs revenue month, netting refunds
- RFM segments: Champions, Loyal Customers, New Customers, At Risk, Hibernating, Promising
- Configurable recency, frequency and monetary thresholds
- Top-customers ranking by net spend (5–100 rows)
- CSV export for orders or customers, up to 366 days and 5,000 rows per request
- Readable by the Support Agent (read-only) role, not just admins

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Advanced Reports</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Advanced Reports</span>.

- **Recency bucket days**
- **Frequency bucket counts**
- **Monetary bucket totals**

## Where it appears

**In the admin**

- Cohort retention report
- RFM segments report
- Top customers report
- Orders / customers export

## For developers

**REST routes**

- `GET /ambikly-pro/v1/reports/cohort`
- `GET /ambikly-pro/v1/reports/rfm`
- `GET /ambikly-pro/v1/reports/top-customers`
- `GET /ambikly-pro/v1/reports/export`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Which orders count toward these reports?

Every order that is not cancelled or failed, with refunds netted out — the same convention the free plugin’s own Reports page uses.

### Can I change the RFM thresholds?

Yes. Recency days, frequency counts and monetary totals are each a comma-separated list in the add-on settings.

### How large can an export be?

Up to 5,000 rows, with the date span clamped to 366 days so a single response stays bounded.

## Works well with

[Multi-vendor](/addons/multi-vendor) · [CRM Sync](/addons/crm-sync)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Advanced Reports is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
