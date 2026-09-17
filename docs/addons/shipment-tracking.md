---
title: "Shipment Tracking"
description: "Adds tracking numbers to orders with carrier links and an automatic customer email. One order can carry several tracking entries for partial shipments, with six pre-seeded…"
prev:
  text: "Recently Viewed"
  link: /addons/recently-viewed
next:
  text: "Size Chart"
  link: /addons/size-chart
---

# Shipment Tracking <span class="pro-pill">PRO</span>

> Adds tracking numbers to orders with carrier links and an automatic customer email.

<p><strong>Category:</strong> Physical · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Shipment Tracking</span></p>

## What it does

One order can carry several tracking entries for partial shipments, with six pre-seeded carriers whose URL templates turn a number into a live link. Adding the first entry can flip the order to shipped and write an order note; every entry can email the customer. Shipments show on the admin order and the customer’s account.

## Capabilities

- Multiple tracking entries per order
- Six pre-seeded carriers — UPS, FedEx, USPS, DHL, Royal Mail, Australia Post — plus Other
- Optional auto-mark-shipped on the first entry, with an audit note
- Optional customer notification email
- Duplicate entries return the existing row instead of re-emailing
- Customers see only their own shipments
- Deleting the last shipment reverts the fulfillment status

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Shipment Tracking</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: shipments on the customer’s account order view.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Shipment Tracking</span>.

- **Email customer when tracking is added**
- **Mark order as shipped on first tracking entry**

## Where it appears

**On the storefront**

- Shipments on the customer’s account order view
- “Your order has shipped” email

**In the admin**

- Shipments on the order detail screen
- Add / delete tracking entries

## Third-party services

This add-on talks to:

- Carrier tracking links (no API calls)

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/shipments`
- `POST /ambikly-pro/v1/shipments`
- `DELETE /ambikly-pro/v1/shipments/{id}`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_order_detail_extras`
- `ambikly_account_order_extras`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does it call carrier APIs for live status?

No. It stores the number and builds a link from a per-carrier URL template.

### Can one order have several tracking numbers?

Yes — designed for partial shipments. Only the first entry flips the order to shipped.

### Can a customer see someone else’s tracking?

No. Non-staff callers must own the order or the request is refused.

## Works well with

[Advanced Shipping](/addons/advanced-shipping)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Shipment Tracking is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
