---
title: Blocks & store pages
description: The eight Ambikly Gutenberg blocks, every attribute with its type and default, what each one renders, and why they are server-rendered with no block-editor UI.
prev:
  text: Reports
  link: /reports
next:
  text: Shortcodes
  link: /shortcodes
---

# Blocks & store pages

Ambikly registers eight Gutenberg blocks on the `init` hook. Every one of them is rendered in PHP by a `render_callback`, which keeps product and review content in the HTML source for search engines and lets your theme's own styles apply.

Read this page before you reach for blocks: they behave differently from the blocks you are used to, and for most stores the [shortcodes](/shortcodes) are the easier route.

## The blocks are server-rendered only

There is no block-editor UI for any Ambikly block. The registration calls pass `render_callback` and an `attributes` array and nothing else — no `block.json`, no `editor_script`, no `edit` component, no inspector controls.

In practice that means:

- Ambikly blocks do **not** appear in the block inserter with a friendly name and icon.
- Selecting one in the editor gives you **no sidebar panel** to set `productId`, `columns`, `perPage` or anything else.
- The editor treats them as generic blocks. You will not see a live preview of the product grid while editing.
- The blocks work correctly on the **front end**. Rendering happens at page load, from whatever attributes are stored in the block comment.

So attributes have to be set another way. You have two options.

### Option 1 — write the block comment by hand

In the post editor, open the options menu (⋮) and choose **Code editor**, then paste the block comment directly. Attributes go in the JSON object.

```html
<!-- wp:ambikly/product-grid {"columns":4,"perPage":12,"featured":true} /-->
```

Switch back to the visual editor afterwards. WordPress keeps the attributes in the comment and the front end reads them.

### Option 2 — use the shortcode instead

Every block except `mini-cart`, `reviews` and `featured-product` has a shortcode equivalent that takes plain attributes and works in any editor or page builder. See [Shortcodes](/shortcodes).

<div class="ui-tip"><strong>Tip:</strong> Unless you are building a block theme template where a shortcode is awkward, use the shortcodes. They are the better-supported path and they carry the same rendering code.</div>

## Block reference

### ambikly/add-to-cart

A single button that adds one product to the cart.

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `productId` | integer | `0` | The product to add. Required. |
| `label` | string | `Add to cart` | Button text. Empty falls back to "Add to cart". |
| `align` | string | `""` | Block alignment. Supports `left`, `center`, `right`. |

Renders a `<button data-ambikly-add-to-cart="{id}">` that `storefront.js` wires to the cart REST route. For an **external** product (type `external` with an `external_url`), it renders an `<a>` to that URL with `target="_blank" rel="noopener"`, using the product's own button text if set.

With no product selected it renders the error text:

> Select a product to display this button.

If the product exists but its status is not `published`, the block renders nothing at all.

### ambikly/mini-cart

A header cart trigger with a live item count.

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `showSubtotal` | boolean | `true` | Show the cart subtotal next to the count. |
| `align` | string | `""` | Block alignment. Supports `left`, `center`, `right`. |

The trigger is rendered server-side with the current visitor's real cart, so the count badge is correct on first paint instead of flashing empty. The wrapper carries `data-cart-url` and `data-checkout-url` resolved from your page settings, and `storefront.js` hydrates the drawer and keeps the count in sync from the `ambikly:cart:rendered` DOM event.

If the cart cannot be resolved (an editor preview, for example) the block falls back to a count of zero rather than erroring.

### ambikly/product-grid

A paginated grid of published products.

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `columns` | integer | `3` | Grid columns. Clamped to 1–6. |
| `perPage` | integer | `9` | Products per page. Clamped to 1–100. |
| `category` | integer | `0` | Filter to one category ID. `0` means no filter. |
| `featured` | boolean | `false` | Show only products flagged as featured. |
| `productType` | string | `""` | **Registered but never read.** See below. |
| `orderBy` | string | `created_at` | Sort column passed to the product query. |
| `order` | string | `DESC` | Sort direction. |

The current page comes from the `?ap=` query string, not from a block attribute.

Each card is rendered by the same `renderProductCard()` used by `[ambikly_shop]`, search, archives and the "You may also like" row on a product page. That means the grid gets the shared card treatment: `data-ambikly-product-id` on every card, the `ambikly_product_card_badges` and `ambikly_product_card_actions` filters, a stock check that disables the button and labels it "Out of stock", rating stars, and the Digital/External type label.

::: warning productType does nothing
The `productType` attribute is registered on the block but nothing reads it. Setting it has no effect on which products appear. Use `category` or `featured` to narrow the grid, or use `[ambikly_shop]`.
:::

### ambikly/cart

The full cart page.

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `layout` | string | `two-column` | `two-column` or `stacked`. Anything else falls back to `two-column`. |
| `showCoupons` | boolean | `true` | Written to `data-show-coupons` for the cart app. |
| `showShipping` | boolean | `true` | Written to `data-show-shipping` for the cart app. |
| `checkoutLabel` | string | `""` | Checkout button text. Empty falls back to "Checkout". |

Renders `#ambikly-cart-app`, the same mount node the `[ambikly_cart]` shortcode uses, so the JavaScript hydrates it identically. Before hydration the block server-renders a real preview: the first three line items with image, name, quantity and price, a "+ N more items" line, the subtotal, and a checkout button. An empty cart renders "Your cart is empty."

### ambikly/checkout

The checkout application mount point. **No attributes.**

Delegates straight to the storefront's checkout renderer, so it produces the same `#ambikly-checkout-app` node as `[ambikly_checkout]` with a "Loading checkout..." placeholder until the JavaScript takes over.

### ambikly/customer-account

The customer account dashboard. **No attributes.**

Delegates to the storefront's account renderer. For a logged-out visitor that returns the branded sign-in card — a WordPress login form plus a "Lost your password?" link — rather than an empty block. For a logged-in customer it renders the account sidebar and whichever tab `?ambikly_tab=` selects.

### ambikly/reviews

Recently approved reviews, store-wide or for one product.

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `productId` | integer | `0` | Limit to one product. `0` shows reviews from the whole store. |
| `count` | integer | `5` | How many reviews to list. Clamped to 1–50. |
| `minRating` | integer | `0` | Only show reviews at or above this rating. Clamped to 0–5. |
| `showSummary` | boolean | `true` | Show the average rating and review count header. |

Only reviews with status `approved` are queried, newest first. Each review is wrapped in `schema.org/Review` markup with the author, body and date. The summary header shows the average to one decimal place and a "Based on N reviews" line. With nothing to show it renders "No reviews yet."

This block is entirely server-rendered with no JavaScript, because review text is SEO-critical content.

### ambikly/featured-product

A large single-product feature for landing pages.

| Attribute | Type | Default | What it does |
|---|---|---|---|
| `productId` | integer | `0` | The product to feature. Required. |
| `showDescription` | boolean | `true` | Show the product's short description. |
| `showPrice` | boolean | `true` | Show the price, with a struck-through regular price when on sale. |
| `showAddToCart` | boolean | `true` | Show the call-to-action button. |
| `mediaPosition` | string | `left` | `left`, `right` or `top`. Anything else falls back to `left`. |
| `ctaLabel` | string | `""` | Button text. Empty falls back to "Add to cart". |

Renders a `schema.org/Product` article with the product image linked to the product page, the title, the price, the short description and the button. External products get a link to the partner URL instead of an add-to-cart button.

With no product selected it renders the error text:

> Select a product to feature.

A product that is not `published` renders nothing.

## Which blocks belong on which store page

Ambikly creates five pages on activation, each holding its shortcode. If you would rather build those pages from blocks, these are the equivalents.

| Store page | Default content | Block equivalent |
|---|---|---|
| Shop | `[ambikly_shop]` | `ambikly/product-grid` |
| Cart | `[ambikly_cart]` | `ambikly/cart` |
| Checkout | `[ambikly_checkout]` | `ambikly/checkout` |
| My Account | `[ambikly_account]` | `ambikly/customer-account` |
| Order Received | `[ambikly_thank_you]` | *(no block — keep the shortcode)* |

Three blocks have no page of their own and are meant to be placed wherever you want them:

- **`ambikly/mini-cart`** belongs in a site header template, so it appears on every page.
- **`ambikly/featured-product`** belongs on a home page or landing page.
- **`ambikly/reviews`** belongs anywhere you want social proof — a home page, an about page, or scoped to one product.

<div class="ui-warn"><strong>Careful:</strong> The Shop page does double duty. When <code>?ambikly_product=</code> is in the URL, <code>[ambikly_shop]</code> renders the single-product page instead of the grid. The <code>ambikly/product-grid</code> block does <strong>not</strong> do this — it always renders a grid. If you replace the Shop page's shortcode with the block, product detail pages stop working. Keep <code>[ambikly_shop]</code> on the Shop page and use the block elsewhere.</div>

## Assets

Every block enqueues the shared storefront stylesheet, and every block that needs interactivity also enqueues the storefront script:

| Block | Stylesheet | Script |
|---|---|---|
| `add-to-cart` | yes | yes |
| `mini-cart` | yes | yes |
| `product-grid` | yes | yes |
| `cart` | yes | yes |
| `checkout` | yes | yes (via the storefront renderer) |
| `customer-account` | yes | yes (via the storefront renderer) |
| `reviews` | yes | no |
| `featured-product` | yes | yes |

Both handles are registered on `wp_enqueue_scripts` and versioned with the plugin version, so a plugin update busts the browser cache.

## Where to go next

- [Shortcodes](/shortcodes) — the same rendering, with attributes you can actually edit in the editor.
- [Themes & template overrides](/themes) — how far you can customize this markup.
- [Store pages](/store-pages) — what each of the five pages does and how to point Ambikly at a different one.
