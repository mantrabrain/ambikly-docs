---
title: "Software Licensing Pro"
description: "Activation API, per-site seat enforcement and a license-gated update feed for software you sell. The runtime layer on top of the license keys the free core mints at purchase…"
prev:
  text: "Social Login"
  link: /addons/social-login
next:
  text: "Sticky Add to Cart"
  link: /addons/sticky-add-to-cart
---

# Software Licensing Pro <span class="pro-pill">PRO</span>

> Activation API, per-site seat enforcement and a license-gated update feed for software you sell.

<p><strong>Category:</strong> Digital · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Software Licensing Pro</span></p>

## What it does

The runtime layer on top of the license keys the free core mints at purchase: activate, deactivate and check endpoints where the key is the credential, plus a per-product update feed gated on an active activation for the calling site. Seat counting is serialized with a database lock and site identity is normalized to the domain, so URL tricks can’t buy extra seats.

## Capabilities

- Public activate / deactivate / check endpoints — the license key is the credential
- Per-license lock around the seat check, so the limit can’t be raced past
- Site identity normalized to host, so scheme and trailing slash don’t create extra seats
- Update feed with version, download URL, changelog and WP/PHP requirements
- Optional HMAC-SHA256 signature on every response
- Configurable grace period after expiry
- Admin revoke, reinstate, clear activations and bulk actions
- Customer “Licenses” account tab with key, status, activations and expiry

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Software Licensing Pro</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: “licenses” account tab.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Software Licensing Pro</span>.

- **HMAC signing secret (optional)**
- **Grace period after expiry (days)**

## Where it appears

**On the storefront**

- “Licenses” account tab

**In the admin**

- Licenses list with search and status filter
- License detail with per-site activation history
- Revoke / reinstate / clear activations
- Bulk actions

## For developers

**REST routes**

- `POST /ambikly-pro/v1/licenses/activate`
- `POST /ambikly-pro/v1/licenses/deactivate`
- `POST /ambikly-pro/v1/licenses/check`
- `GET /ambikly-pro/v1/updates/{slug}`
- `GET /ambikly-pro/v1/admin/licenses`
- `GET /ambikly-pro/v1/admin/licenses/{id}`
- `POST /ambikly-pro/v1/admin/licenses/{id}/revoke`
- `POST /ambikly-pro/v1/admin/licenses/{id}/reinstate`
- `POST /ambikly-pro/v1/admin/licenses/{id}/clear-activations`
- `POST /ambikly-pro/v1/admin/licenses/bulk`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_account_tabs`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### How are the public endpoints protected?

The license key is the credential. Throttle them at your firewall or cache layer if abuse is a concern.

### Can a customer activate the same site twice to use two seats?

No. Site identity is derived from the normalized domain, so http vs https, a trailing slash or an extra path all resolve to one seat.

### How are update downloads gated?

The feed requires a valid, unexpired license, an active activation for the calling site, and a product slug that matches the license.

## Works well with

[Download Analytics](/addons/download-analytics) · [Subscriptions](/addons/subscriptions)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Software Licensing Pro is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
