---
title: "Wishlist"
description: "Lets shoppers save favorites — works for guests and merges into their account on login. Adds a heart button to product cards and product pages through the card and detail…"
prev:
  text: "Subscriptions"
  link: /addons/subscriptions
next:
  text: "Developer overview"
  link: /developers/
---

# Wishlist <span class="pro-pill">PRO</span>

> Lets shoppers save favorites — works for guests and merges into their account on login.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Wishlist</span></p>

## What it does

Adds a heart button to product cards and product pages through the card and detail action filters, backed by the core ambikly_wishlists and ambikly_wishlist_items tables. Three REST routes get, add and remove items; guests are identified by the core session key when guest wishlists are allowed, logged-in customers by user id. Read requests never create a wishlist row, adds check for an existing product or variation first, and on wp_login any guest list is merged into the account list without duplicates. A Wishlist tab joins the customer account page, and the [ambikly_wishlist] shortcode lists saved items with image, price and Add to cart, using a saved variation's own price.

## Capabilities

- Heart button on product cards and product pages
- GET, POST and DELETE routes under /ambikly-pro/v1/wishlist
- Guest wishlists via the core session key, toggleable
- Guest list merged into the account on login without duplicates
- Duplicate-safe adds for products and variations
- Read requests never create rows
- Wishlist account tab and [ambikly_wishlist] shortcode
- Saved variations show their own price and image

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Wishlist</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: heart toggle on cards and product pages.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Wishlist</span>.

- **Allow guest wishlists**
- **Show count badge on the heart icon**

## Where it appears

**On the storefront**

- Heart toggle on cards and product pages
- [ambikly_wishlist] shortcode
- Wishlist tab on the customer account page
- Add to cart button on each saved item

## When to use it

### Gift shopping before the holidays

A toy store's visitors browse weeks ahead and save candidates without creating an account. When they register at checkout time, the guest list moves into their new account automatically, so nothing they saved over those weeks is lost.

### High-consideration purchases

A furniture store's customers rarely buy on the first visit. The Wishlist tab in their account page keeps the sofas and tables they liked, each with a current price and Add to cart, making the return visit a short one.

### Variation-specific favorites

A store selling prints in several sizes saves the chosen variation with the product. The wishlist then shows that size's own price and image rather than the parent's, so the shopper sees exactly what they picked when they come back.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/wishlist`
- `POST /ambikly-pro/v1/wishlist/items`
- `DELETE /ambikly-pro/v1/wishlist/items/{id}`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_account_tabs`
- `ambikly_account_tab_wishlist`
- `ambikly_product_card_actions`
- `ambikly_product_detail_actions`
- `wp_login`
- `wp_enqueue_scripts`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does the wishlist work for guests?

Yes, when Allow guest wishlists is on. Guests are identified by the core session key and their list persists for as long as that session cookie does. Turn the setting off and signed-out visitors receive a 401 with a login prompt when they try to save an item.

### Do guests keep their wishlist after they sign up or log in?

Yes. On wp_login the add-on looks up the guest wishlist for the current session. If the account has no list yet, the guest list is reassigned to the user; otherwise each guest item is moved across unless the account already has that product or variation.

### Where do customers see their saved products?

On the Wishlist tab of the customer account page, which renders the [ambikly_wishlist] shortcode. Each item shows image, name and current price with an Add to cart button, and the same shortcode can be placed on any other page you choose.

### Can the same product be added to a wishlist twice?

No. Before inserting, the add route checks for an existing row with the same product and variation, handling a missing variation correctly, so double clicks, network retries or two open tabs cannot create duplicate entries on the list.

## Works well with

[Quick View](/addons/quick-view) · [Product Compare](/addons/compare)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Wishlist is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
