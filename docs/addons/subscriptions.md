---
title: "Subscriptions"
description: "Recurring billing for memberships and subscription boxes, self-managed from the account page. Any product with a billing period becomes a subscription: when the order is…"
prev:
  text: "Store Credit Wallet"
  link: /addons/store-credit
next:
  text: "Wishlist"
  link: /addons/wishlist
---

# Subscriptions <span class="pro-pill">PRO</span>

> Recurring billing for memberships and subscription boxes, self-managed from the account page.

<p><strong>Category:</strong> Checkout · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Subscriptions</span></p>

## What it does

Any product with a billing period becomes a subscription: when the order is paid, a subscription is created per line with its period, interval, cycle limit, trial and next payment date. An hourly job claims due subscriptions atomically, creates a renewal order and charges through the gateway’s renewal method — Stripe today — with configurable retries. Customers cancel, pause and resume from their account.

## Capabilities

- Hourly renewal job with an atomic claim — overlapping runs can’t double-charge
- Automatic renewals through Stripe; other gateways are hidden when a cart contains a subscription
- Configurable retry attempts, hours between retries, and cancel-after-failure
- Renewal success and failure emails, each toggleable
- Soft cancel (runs out the paid period), immediate cancel, pause and resume
- Month and year advances clamped to the last valid day
- Renewal orders tagged so they never spawn new subscriptions
- Deleting a customer cancels their active subscriptions

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Subscriptions</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: “subscriptions” account tab — status, next payment, amount, cancel.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Subscriptions</span>.

- **Failed-payment retry attempts**
- **Hours between retries**
- **Cancel after all retries fail**
- **Email customer on successful renewal**
- **Email customer on failed renewal**

## Where it appears

**On the storefront**

- “Subscriptions” account tab — status, next payment, amount, cancel
- Renewal succeeded and renewal failed emails

**In the admin**

- Subscriptions list with status and customer filters
- Subscription detail with renewal history
- Force a renewal charge now

## Third-party services

This add-on talks to:

- Stripe off-session charges

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/subscriptions`
- `GET /ambikly-pro/v1/subscriptions/{id}`
- `POST /ambikly-pro/v1/subscriptions/{id}/cancel`
- `POST /ambikly-pro/v1/subscriptions/{id}/pause`
- `POST /ambikly-pro/v1/subscriptions/{id}/resume`
- `POST /ambikly-pro/v1/subscriptions/{id}/charge`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_pro_subscriptions_tick`
- `ambikly_order_paid`
- `ambikly_customer_deleted`
- `ambikly_account_tabs`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Who owns the renewal schedule?

Ambikly does — the schedule is driven by the plugin’s own job, which keeps the add-on gateway-agnostic.

### Which payment methods renew automatically?

Stripe. PayPal and the offline methods leave renewals pending so you can invoice manually.

### What does Cancel do for the customer?

By default a soft cancel: access continues until the end of the paid period. Staff can cancel immediately.

## Works well with

[Store Credit Wallet](/addons/store-credit) · [Software Licensing Pro](/addons/license-pro) · [CRM Sync](/addons/crm-sync)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Subscriptions is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
