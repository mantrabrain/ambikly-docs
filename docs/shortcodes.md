---
title: Shortcodes
description: All eight Ambikly shortcodes with every attribute and default, the shop query strings for sorting, paging and filtering, and the AmbiklyStore bootstrap object.
prev:
  text: Blocks & store pages
  link: /blocks
next:
  text: Themes & template overrides
  link: /themes
---

# Shortcodes

Ambikly registers eight shortcodes. They are the primary way to place the storefront on a page — the five pages created at activation each hold one — and unlike the [blocks](/blocks), their attributes are plain text you can edit anywhere, including in page builders.

Every shortcode enqueues the storefront stylesheet and script when it renders, so there is nothing to load manually.

## The eight shortcodes at a glance

| Shortcode | Renders | Usual page |
|---|---|---|
| `[ambikly_shop]` | Product grid, or a single product when `?ambikly_product=` is set | Shop |
| `[ambikly_product]` | One product's detail page | Shop (via the query string) |
| `[ambikly_cart]` | The cart application | Cart |
| `[ambikly_checkout]` | The checkout application | Checkout |
| `[ambikly_account]` | Customer account, or a sign-in form | My Account |
| `[ambikly_thank_you]` | Order confirmation | Order Received |
| `[ambikly_search]` | Search results grid | A search page |
| `[ambikly_archive]` | Category, tag or brand listing | An archive page |

## [ambikly_shop]

The catalog grid, and the busiest shortcode in the plugin.

| Attribute | Default | Clamp / accepted values | What it does |
|---|---|---|---|
| `per_page` | `12` | Clamped to 1–100 | Products per page. |
| `columns` | `3` | Not clamped | Grid columns, written to a `--cols` CSS variable. |
| `category` | `""` | Category ID | Restrict to one category. A `?category=` query arg overrides it. |
| `featured` | `""` | See below | Show only featured products. |
| `show_sort` | `yes` | `no` hides it | Show the sort dropdown. |
| `show_search` | `yes` | `no` hides it | Show the search box. |

<div class="ui-warn"><strong>Careful:</strong> <code>featured</code> is on for <em>any</em> value except an empty string, <code>no</code> and <code>false</code>. Write <code>featured="yes"</code> to turn it on and simply leave the attribute off to turn it off.</div>

### Delegating to the single product page

When the URL carries `?ambikly_product=<slug>`, `[ambikly_shop]` hands off to the single-product renderer instead of drawing the grid. That is what lets one WordPress page serve as both the catalog and every product detail page.

This is also why the Shop page must keep this shortcode. Replacing it with the `ambikly/product-grid` block breaks every product URL on the site.

### Sorting

The sort dropdown submits `?orderby=`. Four values are recognized:

| `?orderby=` value | Label in the dropdown | Sorts by |
|---|---|---|
| `created_at` | Newest | `created_at` descending |
| `price_asc` | Price: low to high | `price` ascending |
| `price_desc` | Price: high to low | `price` descending |
| `name` | Name A–Z | `name` ascending |

Anything else falls back to `created_at`. The dropdown resubmits the whole GET form, and any active `category`, `tag` or `brand` filter is carried along as a hidden field so sorting does not silently drop it.

### Pagination

Pages are addressed with `?ap=`. `?ap=1` is the first page; the value is floor-clamped to 1.

If you ask for a page past the end of the result set — a stale bookmark, or `?ap=9999` — the grid re-queries clamped to the real last page and shows that instead of an empty "No products matched your search." The pagination nav itself always shows the first and last page plus a two-page window around the current one, with ellipses between, so a large catalog does not emit dozens of links.

### Filtering by query string

| Query arg | Example | Effect |
|---|---|---|
| `?s=` | `?s=mug` | Free-text product search. |
| `?category=` | `?category=4` | Filter to a category ID. Overrides the `category` attribute. |
| `?tag=` | `?tag=summer` | Filter to a tag slug. |
| `?brand=` | `?brand=acme` | Filter to a brand slug. |
| `?orderby=` | `?orderby=price_asc` | Sort, as above. |
| `?ap=` | `?ap=3` | Page number. |
| `?ambikly_product=` | `?ambikly_product=blue-mug` | Render that product's detail page. |

When a category, tag or brand filter is active, the grid header shows a label such as "Category: Mugs" so the shopper can tell a filter is on.

A category whose own status is not `published` matches nothing. Draft and archived categories are not browsable from the front end even if you know their ID.

### What a product card shows

Cards are shared by the shop grid, search, archives, related products and the `ambikly/product-grid` block:

- Image (or a placeholder), linked to the product.
- A **Sale** badge, passed through the `ambikly_product_card_badges` filter.
- A **Digital** or **External** type label where it applies.
- Title, price, and rating stars with a review count when there is at least one approved review.
- A **View** button and an add-to-cart button. The button is disabled and reads "Out of stock" when the product is not in stock, and reads "Download" for digital products.
- Any extra buttons returned by the `ambikly_product_card_actions` filter.

Variable products that leave their own price blank show "From $X", computed from the cheapest published variation's effective price.

## [ambikly_product]

One product's full detail page: gallery, attribute selectors, variations, pricing plans, description, reviews and related products.

| Attribute | Default | What it does |
|---|---|---|
| `id` | `""` | Look the product up by numeric ID. |
| `slug` | `""` | Look the product up by slug. |

With neither attribute set, the shortcode falls back to the `?ambikly_product=` query arg. That is how the Shop page serves product detail pages.

If the product does not exist, or exists but is not `published`, the page sends a **404** status header, disables caching, and renders:

> Product not found.

with a link back to the Shop page. Draft products are never visible to anonymous visitors, even by a guessed slug.

The page also adds real SEO output on `wp_head`: a `rel="canonical"` link to the product's own URL, a meta description from the product's `meta_description` (falling back to its short description, trimmed to 30 words), and a document title from `meta_title` (falling back to the product name).

### Product URLs

Product permalinks are query-string based:

```
{shop page URL}?ambikly_product={slug}
```

There is no pretty-permalink rewrite in the free core. Every product URL is built by one helper, which passes the finished URL through the `ambikly_product_permalink` filter — so a theme or plugin can swap in its own rewrite without touching the plugin.

## [ambikly_cart]

The cart application. **No attributes.**

Renders `#ambikly-cart-app` with a "Loading cart..." placeholder, then `storefront.js` fetches the cart over REST and takes over. For a server-rendered first paint with a real item preview, use the `ambikly/cart` block instead.

## [ambikly_checkout]

The checkout application. **No attributes.**

Renders `#ambikly-checkout-app` with a "Loading checkout..." placeholder. Everything after that — addresses, shipping methods, gateways, order placement — runs in JavaScript against the REST API.

## [ambikly_account]

The customer account area. **No attributes.**

**Logged out**, it renders a branded sign-in card: a WordPress login form, whatever the `ambikly_login_form_after` filter returns (this is where the Social Login add-on injects its buttons), and a "Lost your password?" link.

**Logged in**, it renders a sidebar and one tab of content. The tab comes from `?ambikly_tab=`; an unknown value falls back to the dashboard.

| `?ambikly_tab=` | Tab | Content |
|---|---|---|
| `dashboard` *(default)* | Dashboard | "Hello, {name}", plus live order count and total spent. |
| `orders` | Orders | Paginated order table with number, date, status, total and an invoice link. |
| `downloads` | Downloads | Paginated file list with use count, limit and expiry. |
| `addresses` | Addresses | Saved billing and shipping addresses. |
| `profile` | Profile | Display name, email and phone. |

Both the orders and downloads tables paginate 50 rows at a time, using the same `?ap=` parameter as the shop grid.

The tab list runs through the `ambikly_account_tabs` filter, and after the core tab renders, `ambikly_account_tab_{tab}` fires — that is how Pro add-ons add a Subscriptions, Licenses, Gift Cards or Wishlist tab.

<div class="ui-warn"><strong>Careful:</strong> The Addresses tab is display-only. There is no storefront address editing in the free core — addresses are saved from checkout. The Profile tab's "Edit profile" button goes to the WordPress profile screen, which covers name, email and password but not the customer phone number.</div>

## [ambikly_thank_you]

The order confirmation page. **No attributes.**

Reads `?order_id=` and `?key=` from the URL. The `key` is an HMAC token returned by the checkout response; without a valid one, only the order's owner (matched on user ID or email) or a store administrator can view the page. Anyone else sees the generic "Thank you for your purchase." message. That guard is what stops sequential order IDs from leaking order numbers, totals and payment status.

For a paid order the page shows the item table, the order number, payment method, payment status, total, and a **View invoice** button.

This page is also the completion point for redirect gateways. When a paid order lands here for the first time, the cart is cleared and `ambikly_checkout_completed` fires — once, guarded by order meta so a refresh does not re-fire it.

<div class="ui-tip"><strong>Tip:</strong> For Stripe and PayPal, <code>ambikly_checkout_completed</code> fires with <code>null</code> as its second argument. Any handler you write must null-check it.</div>

## [ambikly_search]

| Attribute | Default | Clamp |
|---|---|---|
| `per_page` | `12` | Clamped to 1–100 by the grid |
| `columns` | `3` | Not clamped |

Delegates to the shop grid, so it honors `?s=`, `?orderby=`, `?ap=` and every other shop query arg. Use it when you want a dedicated search results page separate from the catalog.

## [ambikly_archive]

| Attribute | Default | Clamp |
|---|---|---|
| `per_page` | `12` | Clamped to 1–100 by the grid |
| `columns` | `3` | Not clamped |

Also delegates to the shop grid. It is meant for category, tag and brand listings driven by `?category=`, `?tag=` and `?brand=`. The tag and brand chips on a product detail page link here by default.

## window.AmbiklyStore

Every storefront page that enqueues the script also gets a small bootstrap object on `window`. The JavaScript reads it instead of hard-coding anything, and you can read it too.

```js
window.AmbiklyStore = {
  rest_url: 'https://example.com/wp-json/ambikly/v1',
  nonce: 'a1b2c3d4e5',
  currency: 'USD',
  currency_symbol: '$',
  store: {
    country: 'US'
  },
  pages: {
    shop: 'https://example.com/shop/',
    cart: 'https://example.com/cart/',
    checkout: 'https://example.com/checkout/',
    account: 'https://example.com/my-account/',
    thank_you: 'https://example.com/order-received/'
  }
};
```

| Key | What it holds |
|---|---|
| `rest_url` | Base URL for the `ambikly/v1` REST namespace. |
| `nonce` | A `wp_rest` nonce. Send it as the `X-WP-Nonce` header. |
| `currency` | The store currency code. |
| `currency_symbol` | The symbol for that currency. |
| `store.country` | The store country, used as the default in the checkout country select. |
| `pages` | Resolved permalinks for the five store pages. |

That is the whole object. There is nothing else on it — no cart contents, no customer data.

## Recipes

### A category landing page

Create a page, drop in the archive shortcode, and link to it with the category ID.

```
[ambikly_archive per_page="24" columns="4"]
```

Then link to `/mugs/?category=4`. The grid filters itself and the header shows "Category: Mugs". Sorting and paging from there keep the filter.

If you would rather bake the category into the page so no query string is needed, use the shop shortcode with the attribute instead:

```
[ambikly_shop category="4" columns="4" per_page="24" show_search="no"]
```

### A search results page

Create a page at `/search/` with:

```
[ambikly_search per_page="24" columns="3"]
```

Then point any search form at it:

```html
<form method="get" action="/search/">
  <input type="search" name="s" placeholder="Search products…">
  <button type="submit">Search</button>
</form>
```

The grid reads `?s=` and shows the match count in its header. An empty result renders "No products matched your search."

### A featured row on the home page

```
[ambikly_shop featured="yes" per_page="4" columns="4" show_sort="no" show_search="no"]
```

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Filtering without a page reload</span></div>
  <p class="pro-callout__desc">The shop grid filters through query strings, which means a full page load per change. The AJAX Filters add-on adds faceted filter widgets that refresh the grid in place, and Smart Search replaces the plain search box with instant results.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

## Where to go next

- [Themes & template overrides](/themes) — how to restyle and extend this markup.
- [Blocks & store pages](/blocks) — the block equivalents, and their limits.
- [Store pages](/store-pages) — which page each shortcode belongs on.
