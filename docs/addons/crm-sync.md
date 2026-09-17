---
title: "CRM Sync"
description: "Pushes new customers, completed orders and captured leads to Mailchimp or HubSpot. Listens for registrations, paid orders and popup leads, logs every event to an audit table…"
prev:
  text: "Checkout Field Editor"
  link: /addons/checkout-field-editor
next:
  text: "Download Analytics"
  link: /addons/download-analytics
---

# CRM Sync <span class="pro-pill">PRO</span>

> Pushes new customers, completed orders and captured leads to Mailchimp or HubSpot.

<p><strong>Category:</strong> Admin · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → CRM Sync</span></p>

## What it does

Listens for registrations, paid orders and popup leads, logs every event to an audit table and dispatches it through Ambikly’s durable job queue with exponential backoff. Mailchimp gets an audience-member upsert; HubSpot gets a contact upsert by email. A status endpoint reports sync counts by state.

## Capabilities

- Three sync sources — customers, orders, popup leads — each independently toggleable
- Every attempt logged with status, attempts and last error
- Retries via the shared job queue: 5 attempts, 1m / 5m / 30m / 2h / 6h backoff
- Order sync fires on both paid and checkout-completed, so offline-payment stores sync too
- Mailchimp datacenter derived from the key; audience id validated
- HubSpot upsert by email so returning customers update their record

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>CRM Sync</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → CRM Sync</span>.

- **Provider (Mailchimp / HubSpot)**
- **API key**
- **Mailchimp audience ID**
- **Mailchimp datacenter**
- **Sync completed orders**
- **Sync new customers**
- **Sync popup-captured emails**

## Where it appears

**In the admin**

- CRM sync status — counts by state

## Third-party services

This add-on talks to:

- Mailchimp Marketing API
- HubSpot CRM API

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/crm-sync/status`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `user_register`
- `ambikly_order_paid`
- `ambikly_checkout_completed`
- `ambikly_popup_lead_captured`
- `ambikly_job_crm_sync_dispatch`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### What happens if the CRM is down?

The audit row stays pending and the job queue retries with exponential backoff up to 5 attempts before marking it failed.

### Is there inbound sync from the CRM?

No — sync is one-way, from your store to the CRM.

### Do I need to set the Mailchimp datacenter?

Usually not; it is derived from the API key. The setting is a fallback for unusual key formats.

## Works well with

[Popup Campaigns](/addons/popup-campaigns) · [Subscriptions](/addons/subscriptions)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">CRM Sync is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
