---
title: "Multi-vendor"
description: "Vendor signups, per-vendor dashboards and recorded earnings on every sale they make. Vendors apply through a shortcode form, you approve, reject or suspend them, and each…"
prev:
  text: "Loyalty Points"
  link: /addons/loyalty-points
next:
  text: "One Page Checkout"
  link: /addons/one-page-checkout
---

# Multi-vendor <span class="pro-pill">PRO</span>

> Vendor signups, per-vendor dashboards and recorded earnings on every sale they make.

<p><strong>Category:</strong> Physical · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Multi-vendor</span></p>

## What it does

Vendors apply through a shortcode form, you approve, reject or suspend them, and each paid order writes one earnings row per vendor line — gross, platform commission and vendor net — with coupon discounts prorated. Vendors see their status, orders and pending versus paid earnings in a dashboard; you assign products, set per-vendor rates and mark earnings paid.

## Capabilities

- Application and approval flow, with optional auto-approve and self-signup toggle
- Per-vendor earnings rows: gross, platform commission, vendor net
- Coupon discounts prorated so vendors aren’t paid on revenue never collected
- Vendor share clamped 0–100%; self-purchase earnings blocked
- Earnings reversed on cancel or full refund; recomputed on partial refunds
- Mark-paid settles all of a vendor’s pending earnings
- Payout details hidden from read-only staff

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Multi-vendor</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_vendor_dashboard] shortcode.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Multi-vendor</span>.

- **Default vendor share of each sale (%)**
- **Auto-approve vendor signups**
- **Allow self-service signups**

## Where it appears

**On the storefront**

- [ambikly_vendor_dashboard] shortcode
- [ambikly_vendor_signup] shortcode

**In the admin**

- Vendor list
- Approve / reject / suspend
- Per-vendor commission rate and payout details
- Assign a product to a vendor
- Mark pending earnings paid

## For developers

**REST routes**

- `GET /ambikly-pro/v1/vendors/me`
- `POST /ambikly-pro/v1/vendors/signup`
- `GET /ambikly-pro/v1/vendors`
- `POST /ambikly-pro/v1/vendors/{id}/approve`
- `POST /ambikly-pro/v1/vendors/{id}/reject`
- `POST /ambikly-pro/v1/vendors/{id}/suspend`
- `POST /ambikly-pro/v1/vendors/{id}`
- `POST /ambikly-pro/v1/products/{id}/vendor`
- `POST /ambikly-pro/v1/vendors/{id}/mark-paid`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_order_paid`
- `ambikly_order_status_changed`
- `ambikly_order_refunded`
- `ambikly_product_query_filters`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Is the commission setting the platform’s cut or the vendor’s?

The vendor’s share — default 80%. The vendor keeps that share and the platform keeps the remainder.

### Do cash-on-delivery orders credit vendors?

Yes — earnings are recorded when you move the order to processing or completed.

### Can a vendor set their own rate?

No. The rate is manager-only; a vendor may edit only their payout method and details.

## Works well with

[Affiliate System](/addons/affiliate) · [Advanced Reports](/addons/advanced-reports)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Multi-vendor is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
