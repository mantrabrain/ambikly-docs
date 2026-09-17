---
title: "One Page Checkout"
description: "Combines cart, contact details, shipping and payment onto a single checkout page. The [ambikly_one_page_checkout] shortcode renders an empty shell that a small script fills…"
prev:
  text: "Multi-vendor"
  link: /addons/multi-vendor
next:
  text: "Order Bumps"
  link: /addons/order-bumps
---

# One Page Checkout <span class="pro-pill">PRO</span>

> Combines cart, contact details, shipping and payment onto a single checkout page.

<p><strong>Category:</strong> Checkout · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → One Page Checkout</span></p>

## What it does

The [ambikly_one_page_checkout] shortcode renders an empty shell that a small script fills with the cart, contact details, shipping address, shipping methods, coupon field and payment method on one page. Every action calls the core ambikly/v1 routes: cart, cart/items, cart/coupons, cart/shipping, checkout/options, checkout/shipping and checkout. Changing the country, postcode or state re-quotes shipping, a single quoted method is selected automatically, and Place order is a real form submit so browser required-field checks run before any request is sent. Items that became unavailable are flagged and block submission until removed. Fewer steps means fewer places for a customer to drop out.

## Capabilities

- Cart, address, shipping, coupon and payment on one page
- Drives the core cart and checkout REST routes only
- Shipping re-quoted when country, postcode or state changes
- Single shipping method selected automatically
- Quantity edits and item removal without leaving the page
- Free-shipping coupons shown as struck-through shipping cost
- Unavailable items flagged and block Place order
- Gateway redirect honored, otherwise the thank-you page

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>One Page Checkout</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: [ambikly_one_page_checkout] shortcode.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → One Page Checkout</span>.

- **Layout (one column or two column)**
- **Collect phone number**
- **Show coupon field**

## Where it appears

**On the storefront**

- [ambikly_one_page_checkout] shortcode
- Inline cart with quantity inputs and Remove buttons
- Shipping method radio list quoted from the entered address
- Coupon field with Apply button
- Payment method selector built from active gateways

## When to use it

### Single-product launch pages

A store selling one flagship product runs a landing page with the shortcode directly beneath the pitch. Visitors see the cart line, enter their address, pick a shipping method and pay without navigating to a separate cart and checkout, so the purchase happens on the page that convinced them.

### Digital downloads with no shipping

A store selling ebooks or presets has carts that never require shipping. The shipping-method block is skipped entirely, leaving email, billing details and payment on one short page, which suits impulse purchases of low-priced files where every extra step costs a sale.

### Mobile-heavy stores

A store whose traffic comes mostly from phones chooses the one-column layout so the cart, form and Place order button stack vertically. Native required-field checks flag empty fields immediately instead of after a round trip, which matters on slower mobile connections.

## For developers

**Core hooks it listens to**

- `wp_enqueue_scripts`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does One Page Checkout use its own checkout logic?

No. It calls the same ambikly/v1 cart and checkout routes as the standard multi-step checkout, so coupons, shipping quotes, stock checks and payment gateways behave identically. Nothing is duplicated server-side; the add-on is a shortcode plus a script.

### Does One Page Checkout work for digital-only carts?

Yes. When the cart totals report that no shipping is required, the shipping method section is not rendered and no shipping address is sent with the order. The contact block, billing fields, coupon field and payment selector still appear.

### What happens if the payment gateway needs a redirect?

If the checkout response includes a payment redirect URL, the customer is sent there first. Otherwise they land on your configured thank-you page with the order id and thank-you key appended so the order summary can be displayed.

### Can a customer order an item that was unpublished after adding it?

No. Lines the cart service flags as unavailable are marked 'No longer available', their quantity input is disabled and the Place order button stays disabled until the customer removes them from the cart.

## Works well with

[Order Bumps](/addons/order-bumps) · [Gift Cards](/addons/gift-cards) · [Store Credit Wallet](/addons/store-credit)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">One Page Checkout is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
