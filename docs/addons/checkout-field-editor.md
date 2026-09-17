---
title: "Checkout Field Editor"
description: "Define, relabel and reorder checkout fields as a schema — live checkout wiring lands in a coming release. Stores a checkout field schema as JSON in the add-on settings."
prev:
  text: "AJAX Filters"
  link: /addons/ajax-filters
next:
  text: "CRM Sync"
  link: /addons/crm-sync
---

# Checkout Field Editor <span class="pro-pill">PRO</span>

> Define, relabel and reorder checkout fields as a schema — live checkout wiring lands in a coming release.

<p><strong>Category:</strong> Checkout · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Checkout Field Editor</span></p>

## What it does

Stores a checkout field schema as JSON in the add-on settings. Each entry carries an id, section, label, type, required flag, position, optional options list, placeholder and a removed flag. GET and POST /ambikly-pro/v1/checkout-fields read and write the schema, gated on the view-store and manage-store capabilities, and every label, placeholder and option is sanitized before saving. The ambikly_checkout_fields filter merges entries over a default field list, relabelling, reordering by position, adding and removing fields, and ambikly_order_meta_keys registers custom ids. In the current release the core checkout does not apply either filter, so a saved schema has no visible effect on the live checkout until that wiring lands.

## Capabilities

- JSON field schema stored in add-on settings
- Read and write the schema over REST
- Merge, relabel, reorder and remove default fields
- Position-based ordering of the merged list
- Custom field ids exposed through the order-meta filter
- Labels, placeholders and options sanitized on save
- Read needs view-store; write needs manage-store
- Filters registered but not yet applied by the core checkout

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Checkout Field Editor</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Checkout Field Editor</span>.

- **Field schema (JSON array of field entries)**

## Where it appears

**In the admin**

- Field schema edited in the add-on settings panel or via POST /ambikly-pro/v1/checkout-fields

## When to use it

### Preparing a B2B checkout

A wholesale supplier plans to collect a company name and VAT number. It defines both fields in the schema now, with required flags and positions, so the moment the core checkout consumes the schema the fields appear without further configuration work.

### Simplifying checkout for digital goods

A store selling only downloads intends to drop the postal address fields. Marking them removed in the schema documents the intended checkout shape for its developers and for the future core renderer, in one place rather than scattered notes.

### Developer integrations

An agency building a custom checkout template reads the schema over GET /ambikly-pro/v1/checkout-fields and applies the ambikly_checkout_fields filter in its own code, using the add-on as the single source of truth for field definitions across environments.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/checkout-fields`
- `POST /ambikly-pro/v1/checkout-fields`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_checkout_fields`
- `ambikly_order_meta_keys`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Will my field changes show on the live checkout today?

Not yet. The core checkout form and validation do not call ambikly_checkout_fields or ambikly_order_meta_keys in the current release, so the schema is stored and available to code but nothing renders it. This page will be updated when the core wiring lands.

### Who can edit the checkout field schema?

Reading requires the ambikly_view_store capability and saving requires ambikly_manage_store, or manage_options for either. Because Store Managers can save, every label, placeholder and option is passed through sanitize_text_field and ids and types through sanitize_key.

### What does a field entry look like?

A JSON object with id, section (defaults to shipping), label, type (defaults to text), required, position (defaults to 99), an optional options array, placeholder and a removed flag. Entries with removed set to true delete the matching default field when the filter runs.

### Can I add a completely new field, not just edit existing ones?

In the schema, yes: an id that does not match a default field is appended with the values you supply, and its id is registered through the order-meta filter. Storing the submitted value against the order is not implemented in the current release.

## Works well with

[One Page Checkout](/addons/one-page-checkout)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Checkout Field Editor is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
