---
title: "Recently Viewed"
description: "Tracks and re-surfaces the products a visitor has already browsed. A tracker script runs on every storefront page."
prev:
  text: "Quick View"
  link: /addons/quick-view
next:
  text: "Shipment Tracking"
  link: /addons/shipment-tracking
---

# Recently Viewed <span class="pro-pill">PRO</span>

> Tracks and re-surfaces the products a visitor has already browsed.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Recently Viewed</span></p>

## What it does

A tracker script runs on every storefront page. On a product page it determines the current product id (passed from the server, or read from a meta tag or data attribute) and moves it to the front of an ambikly_recent cookie that lives 30 days and holds up to your maximum. The server reads that cookie at render time, loads the published products in viewing order, excludes the product being viewed, formats prices and outputs a grid, so the section works without JavaScript on the rendering page. Show it with [ambikly_recently_viewed], the ambikly_recently_viewed action, or automatically under product detail pages. Logging out deletes the cookie.

## Capabilities

- History kept in a 30-day cookie, never on the server
- Separate limits for remembering and displaying
- Grid rendered server-side in viewing order
- Current product excluded from its own page
- Shortcode attributes for count, heading and columns (1 to 6)
- Auto-append on product pages, or place with the action hook
- Cookie cleared on logout for shared computers
- Only published products with formatted prices are shown

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Recently Viewed</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_recently_viewed] shortcode with count, heading and columns attributes.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Recently Viewed</span>.

- **Maximum products to remember (default 12)**
- **How many to display (default 6)**
- **Auto-append on product pages**
- **Section heading**

## Where it appears

**On the storefront**

- [ambikly_recently_viewed] shortcode with count, heading and columns attributes
- Automatic Recently viewed grid on product pages
- do_action('ambikly_recently_viewed') for theme templates

## When to use it

### Comparison shoppers on fashion stores

A clothing store's visitors open several dresses before deciding. On each product page the Recently viewed grid below the description brings back the previous options in order, letting them return to a favorite without using the back button repeatedly.

### Returning visitors within a month

A gift store's shoppers browse, leave and come back a week later. Because the cookie lasts 30 days, the shortcode on the homepage shows exactly what they looked at last time, picking up the session where it stopped.

### Theme templates with custom layouts

A store with a bespoke theme calls do_action('ambikly_recently_viewed') in its footer template. The server-rendered grid appears with the configured heading and column count, styled by the theme, without any extra JavaScript or template logic.

## For developers

**Core hooks it listens to**

- `ambikly_recently_viewed`
- `ambikly_product_detail_body`
- `wp_logout`
- `wp_enqueue_scripts`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Is browsing history stored on the server?

No. Product ids live in an ambikly_recent cookie in the shopper's browser, capped at your maximum and expiring after 30 days. The server only reads the cookie when rendering the grid and looks up those products; nothing is written to your database.

### What happens on a shared or kiosk computer?

The add-on hooks wp_logout and deletes the cookie when a customer signs out, so the next person does not inherit their history. Guests who never log in keep the cookie until it expires after 30 days or they clear it.

### Can I control how many products are shown and in how many columns?

Yes. The shortcode accepts count, heading and columns attributes, with columns clamped between 1 and 6, and the settings screen sets the defaults used by the automatic product-page section. Remembering and displaying have separate limits.

### Does the current product show in its own Recently viewed list?

No. When the server can identify the product being viewed from the URL, it removes that id before rendering, so the section only shows other products the shopper has visited, in the order they visited them.

## Works well with

[Frequently Bought Together](/addons/ai-recommendations)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Recently Viewed is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
