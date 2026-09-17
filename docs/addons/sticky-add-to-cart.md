---
title: "Sticky Add to Cart"
description: "Pins the Add to Cart button to the screen once the real one scrolls out of view. On the single-product route (?ambikly_product=slug) the add-on enqueues a small script and…"
prev:
  text: "Software Licensing Pro"
  link: /addons/license-pro
next:
  text: "Store Credit Wallet"
  link: /addons/store-credit
---

# Sticky Add to Cart <span class="pro-pill">PRO</span>

> Pins the Add to Cart button to the screen once the real one scrolls out of view.

<p><strong>Category:</strong> Store · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Sticky Add to Cart</span></p>

## What it does

On the single-product route (?ambikly_product=slug) the add-on enqueues a small script and stylesheet and nothing else; there are no REST routes and no database writes. The script finds the page's real Add to cart button, reads the title and price from the page, and builds a bar fixed to the top or bottom of the viewport. An IntersectionObserver fades the bar in once the original button scrolls out of view, and a MutationObserver keeps the bar's price and disabled state matched to the page as variations change. Clicking the bar scrolls to and clicks the real button, so every existing cart hook still fires.

## Capabilities

- Bar fixed to the top or bottom of the viewport
- Appears only when the real button scrolls off-screen
- Mobile-only mode for viewports up to 767 px
- Optional live price mirrored from the page
- Disabled state follows the real button
- Click forwards to the original button, so cart hooks fire
- Loads only on the single-product route
- Uses the storefront's primary button styling

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Sticky Add to Cart</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: pinned add to cart bar with product title and price on product pages.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Sticky Add to Cart</span>.

- **Bar position (top or bottom)**
- **Mobile only**
- **Show price in the bar**

## Where it appears

**On the storefront**

- Pinned Add to cart bar with product title and price on product pages

## When to use it

### Long-form product pages

A skincare store writes detailed ingredient and usage sections below the fold. Once the shopper scrolls past the buy box, the bar keeps the price and Add to cart visible, so finishing the article does not mean scrolling back up to buy.

### Mobile shoppers on variable products

A footwear store enables Mobile only. A shopper picks a size, keeps reading reviews, and taps the bar at the bottom of the phone screen; the bar shows that size's price and grays out for sizes the page has marked sold out.

### Stores with tall image galleries

A furniture store's product pages open with several large photos. The bar appears as soon as the original button leaves the viewport, so a shopper who has decided from the images can buy without hunting for the button further down.

## For developers

**Core hooks it listens to**

- `ambikly_is_product_context`
- `wp_enqueue_scripts`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Can I show the sticky bar only on phones?

Yes. Turn on Mobile only and the script exits on viewports wider than 767 px, so desktop visitors see the normal page. The check uses a matchMedia query when the page loads, and no bar markup is added at all on wider screens.

### Does the bar update when a shopper picks a different variation?

Yes. A MutationObserver watches the page's price element and the real button's disabled attribute. When the variation picker changes the displayed price, or disables the button for an out-of-stock combination, the bar mirrors both immediately.

### Will the sticky bar appear on my custom product template?

By default it loads only when the URL carries ambikly_product. Return true from the ambikly_is_product_context filter to enqueue it elsewhere; the script still needs a button matching the storefront's add-to-cart selectors, otherwise it does nothing.

### Does clicking the bar bypass any cart logic?

No. The bar's button scrolls the original Add to cart button into view and triggers a click on it 200 ms later, so quantity, variation selection, stock validation and any analytics bound to that button behave exactly as if it had been clicked directly.

## Works well with

[Quick View](/addons/quick-view)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Sticky Add to Cart is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
