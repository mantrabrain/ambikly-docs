---
title: "Popup Campaigns"
description: "One email-capture popup with delay, scroll or exit-intent triggers and an optional coupon reveal. A single configurable modal, driven by the trigger you choose and suppressed…"
prev:
  text: "PDF Stamping"
  link: /addons/pdf-stamping
next:
  text: "Post-purchase Upsells"
  link: /addons/post-purchase-upsells
---

# Popup Campaigns <span class="pro-pill">PRO</span>

> One email-capture popup with delay, scroll or exit-intent triggers and an optional coupon reveal.

<p><strong>Category:</strong> Marketing · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Popup Campaigns</span></p>

## What it does

A single configurable modal, driven by the trigger you choose and suppressed for a set number of days once seen. Submissions are nonce-checked and rate-limited per IP, stored in a leads table, and fire an event other add-ons can act on — CRM Sync forwards them to Mailchimp or HubSpot.

## Capabilities

- Three triggers: time delay, scroll depth, exit intent
- Frequency capping for N days after being seen
- Coupon code revealed only after a genuine submission — never in page HTML
- Nonce verification plus a per-IP limit of 10 submissions per 5 minutes
- Emails de-duplicated
- Fires ambikly_popup_lead_captured for downstream syncing
- Editable heading, subheading, button label and success message

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Popup Campaigns</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: popup modal with email capture form.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Popup Campaigns</span>.

- **Campaign active**
- **Heading**
- **Subheading**
- **Button label**
- **Success message**
- **Reveal coupon code on success**
- **Trigger (delay / scroll / exit)**
- **Delay in seconds**
- **Scroll threshold percent**
- **Suppress for N days after seen**

## Where it appears

**On the storefront**

- Popup modal with email capture form

## For developers

**REST routes**

- `POST /ambikly-pro/v1/popup-leads`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `wp_footer`
- `wp_enqueue_scripts`
- `ambikly_popup_lead_captured`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Can someone read the coupon code without signing up?

No. It is returned only in the response to a real form submission.

### Can the capture endpoint be spammed?

It requires a valid nonce and is limited to 10 attempts per IP per 5 minutes.

### Can I run several campaigns at once?

No — this is deliberately the one banner, one goal version.

## Works well with

[CRM Sync](/addons/crm-sync) · [Dynamic Pricing](/addons/dynamic-pricing)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Popup Campaigns is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
