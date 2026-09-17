---
title: "Advanced Variations"
description: "Renders product variation options as color chips, image thumbnails or text buttons. Stores one swatch per attribute term in its own ambikly_attribute_swatches table, keyed on…"
prev:
  text: "Advanced Shipping"
  link: /addons/advanced-shipping
next:
  text: "Affiliate System"
  link: /addons/affiliate
---

# Advanced Variations <span class="pro-pill">PRO</span>

> Renders product variation options as color chips, image thumbnails or text buttons.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Advanced Variations</span></p>

## What it does

Stores one swatch per attribute term in its own ambikly_attribute_swatches table, keyed on attribute slug and term slug, with a type of color, image or text and a value. GET /ambikly-pro/v1/variation-swatches returns the whole map publicly; POST upserts a row atomically and is limited to the manage-store capability. On product pages the script fetches the map once, and for each attribute select that has at least one configured swatch it builds a row of buttons: color chips, image tiles or text, with optional labels. The original select stays in the DOM, visually hidden, and receives the value and a change event, so the core variation logic keeps working unchanged.

## Capabilities

- Three swatch types: color, image and text
- One swatch per attribute term in a dedicated table
- Atomic upsert so concurrent saves are never lost
- Swatch type validated; image values URL-sanitized
- Swatch size exposed as a CSS variable
- Optional text labels under color and image swatches
- Core select kept in the DOM for accessibility
- Attributes without swatches keep their dropdown

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Advanced Variations</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: swatch rows replacing attribute dropdowns on variable product pages.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Advanced Variations</span>.

- **Swatch size in pixels (minimum 16, default 32)**
- **Show text labels under swatches**
- **Update product image on hover**

## Where it appears

**On the storefront**

- Swatch rows replacing attribute dropdowns on variable product pages
- Selected and disabled states on each swatch

**In the admin**

- Swatch mapping saved per attribute term over the POST route

## When to use it

### Apparel with color options

A T-shirt store maps each color term to a hex value once. Every variable product with a Color attribute then shows chips instead of a dropdown, and shoppers see the whole palette at a glance before choosing a size from the ordinary select.

### Materials shown as photographs

A furniture store sells sofas in fabrics that a name cannot convey. Image swatches show a photo of each fabric as a tile under the product, so the shopper picks by look rather than by reading 'Oatmeal Boucle' in a list of options.

### Mixed attributes on one product

A store's product has Color and Size attributes. Color terms carry swatches and become chips; Size has none configured and keeps the ordinary dropdown, so the page mixes both controls sensibly without any extra configuration per product.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/variation-swatches`
- `POST /ambikly-pro/v1/variation-swatches`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_product_variation_swatches`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### What if I haven't configured a swatch for a term?

If no term of an attribute has a swatch, that attribute keeps its normal dropdown. If some terms have swatches and others do not, the unconfigured terms render as plain text buttons alongside the color or image swatches, so nothing is missing from the picker.

### Can two admins save the same swatch at once?

Yes. Saves run as a single INSERT ... ON DUPLICATE KEY UPDATE against the unique attribute-plus-term key, so simultaneous writes from two tabs or an import script cannot race; the last write wins and the response reports a failure if the database rejects it.

### Do swatches break variation selection or screen readers?

No. The original select element remains in the page, visually hidden, and each swatch click sets its value and dispatches a change event. Core's variation resolution, price update and stock check listen to that select exactly as before the swatches were added.

### Does choosing a swatch change the product image?

Only if the option carries a data-swap-image attribute and the page has a gallery image the script can find. The core product template does not add that attribute today, so with default markup the setting has no visible effect; custom templates can supply it.

## Works well with

[Size Chart](/addons/size-chart) · [Quick View](/addons/quick-view)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Advanced Variations is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
