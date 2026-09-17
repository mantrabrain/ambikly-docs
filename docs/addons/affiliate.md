---
title: "Affiliate System"
description: "Tracks ?ref= referrals with a cookie window and records a commission on every qualifying order. Captures a referral code from the URL into a cookie and a de-duplicated visit…"
prev:
  text: "Advanced Variations"
  link: /addons/advanced-variations
next:
  text: "AI Product Descriptions"
  link: /addons/ai-descriptions
---

# Affiliate System <span class="pro-pill">PRO</span>

> Tracks ?ref= referrals with a cookie window and records a commission on every qualifying order.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Affiliate System</span></p>

## What it does

Captures a referral code from the URL into a cookie and a de-duplicated visit log, snapshots it onto the order at creation, and writes a pending commission when the order is paid. Affiliates get a shortcode dashboard with their link, visits, referred orders and pending versus paid balances; you mark commissions paid when you settle them.

## Capabilities

- ?ref=CODE capture with a configurable cookie window and visit log
- Referral snapshotted at order creation, so gateway webhooks and offline payments still credit it
- Commission on subtotal minus discount (not shipping or tax); rate clamped 0–100%
- Self-referral blocked by matching the order email to the affiliate’s account
- Reversed on cancel, failure or full refund; prorated on partial refunds
- Minimum payout threshold before an affiliate can be paid
- Per-affiliate status (active, suspended, rejected) and rate override

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Affiliate System</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_affiliate_dashboard] shortcode — link, rate, visits, orders, pending and paid totals.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Affiliate System</span>.

- **Default commission rate (%)**
- **Cookie window (days)**
- **URL parameter name**
- **Minimum payout**

## Where it appears

**On the storefront**

- [ambikly_affiliate_dashboard] shortcode — link, rate, visits, orders, pending and paid totals

**In the admin**

- Mark commissions paid
- Update affiliate status or per-affiliate rate

## For developers

**REST routes**

- `GET /ambikly-pro/v1/affiliate/dashboard`
- `POST /ambikly-pro/v1/affiliate/register`
- `POST /ambikly-pro/v1/affiliate/mark-paid`
- `POST /ambikly-pro/v1/affiliate/{id}`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_order_created`
- `ambikly_order_paid`
- `ambikly_order_status_changed`
- `ambikly_order_refunded`
- `init`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does it pay affiliates for me?

No. It records what is owed and lets you mark commissions paid; the payout itself is settled outside Ambikly.

### Do cash-on-delivery orders earn commission?

Yes. For payment methods that can’t refund, commission settles when you move the order to processing or completed.

### What happens on a partial refund?

The pending commission is recomputed in proportion to the refunded amount.

## Works well with

[Multi-vendor](/addons/multi-vendor) · [Advanced Reports](/addons/advanced-reports)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Affiliate System is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
