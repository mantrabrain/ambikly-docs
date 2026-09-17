---
title: Store pages
description: The five pages Ambikly creates, the shortcodes on them, how slugs are recorded, why you sometimes get shop-2, and how to move or rename a store page safely.
prev:
  text: Setup wizard
  link: /setup-wizard
next:
  text: Your first product
  link: /first-product
---

# Store pages

Ambikly's storefront is five ordinary WordPress pages, each carrying one shortcode. Activation creates them, the setup wizard can recreate them, and the plugin remembers which page is which by slug. This page covers what each one does, how the mapping works, what to do when you end up with a `shop-2`, and how to move or rename a page without breaking checkout.

## The five pages

| Page | Title created | Shortcode | Key in `ambikly_settings_pages` | What it renders |
|---|---|---|---|---|
| Shop | Shop | `[ambikly_shop]` | `shop` | The product listing, and — with `?ambikly_product=` in the URL — the single product page |
| Cart | Cart | `[ambikly_cart]` | `cart` | Line items, quantity controls, coupon field, totals |
| Checkout | Checkout | `[ambikly_checkout]` | `checkout` | Billing and shipping fields, shipping methods, payment methods, place order |
| My Account | My Account | `[ambikly_account]` | `account` | Login, plus the customer's orders, downloads, addresses and profile |
| Order Received | Order Received | `[ambikly_thank_you]` | `thank_you` | The post-purchase confirmation, and the return target for redirect gateways |

All five are published immediately, with no parent and no menu entry. They are normal pages — you can edit their content, add blocks above or below the shortcode, assign a page template, or exclude them from search.

Three more shortcodes exist but no page is created for them: `[ambikly_product]`, `[ambikly_search]` and `[ambikly_archive]`. Use them wherever you like. See [Shortcodes](/shortcodes).

<div class="ui-tip"><strong>Tip:</strong> Each shortcode also exists as a Gutenberg block, so you can build these pages in the block editor instead. The blocks are server-rendered and render the same markup. See <a href="/blocks">Blocks &amp; store pages</a>.</div>

## The Order Received page matters more than it looks

It is tempting to treat Order Received as decoration. It is not. It is the URL Stripe and PayPal send the customer back to after they approve a payment, and it is where the order is finalized for redirect gateways. If it is missing, trashed, or no longer contains `[ambikly_thank_you]`, customers who pay by card land somewhere that cannot complete their order.

Leave it published, leave the shortcode in place, and do not add it to your navigation menu — nobody should reach it except after buying something.

## How Ambikly finds each page

Ambikly does not store page IDs. It stores **slugs**, in a single option:

```php
get_option( 'ambikly_settings_pages' );
// [ 'shop' => 'shop', 'cart' => 'cart', 'checkout' => 'checkout',
//   'account' => 'my-account', 'thank_you' => 'order-received' ]
```

At runtime, `Settings::get('pages', 'cart', 'cart')` reads that array, and the storefront calls `get_page_by_path()` on the slug it finds. If the key is missing, the lookup falls back to the key name itself — so a missing `cart` entry makes Ambikly look for a page at `/cart`.

Those resolved URLs are handed to the storefront JavaScript on every front-end page load, which is how the cart knows where the checkout is and the checkout knows where the thank-you page is.

::: warning There is no admin screen for this option
`ambikly_settings_pages` is written in exactly two places — the activation seed and the setup wizard's Pages step. No Settings tab reads it, edits it, or shows it to you. To change the mapping you edit the option directly, as described below.
:::

## Two writers, one rule

Both writers follow the same rule, and the rule is the reason a store sometimes ends up with `shop-2`.

**A page is only adopted if it already contains the matching shortcode.**

Here is what happens per page, in order:

1. **Already ours?** (wizard only) If the option already records a slug for this key, and that page exists, is not in the trash, and still contains the shortcode, stop. Nothing changes.
2. **An existing page with our shortcode?** Look up the bare slug — `shop`, `cart`, `checkout`, `account`, `thank_you`. If a page is there **and** its content contains the shortcode, adopt it: record its slug and stop.
3. **Otherwise, create a new page.** Publish a new page with the standard title and the shortcode, passing **no explicit slug**. WordPress then assigns a free one.

Step 3 is where `shop-2` comes from. If `/shop` is already taken by a page that does not contain `[ambikly_shop]` — very commonly a page another eCommerce plugin or your theme created — WordPress cannot give the new page the `shop` slug, so it appends a number. Ambikly records `shop-2` in the option and uses it.

This is deliberate. Adopting a page by slug alone would silently point your entire storefront at unrelated content. A URL you did not expect is a much smaller problem than a shop page that shows somebody else's text.

### You got a `shop-2` — now what

You have two good options.

**Option A — keep it.** `/shop-2` works perfectly. The store functions, the links resolve, nothing is broken. If the URL does not bother you, do nothing.

**Option B — free up the nice slug.** Decide what should own `/shop`:

<ol class="step-list">
  <li>Go to <span class="screen-path">Pages</span> and find the page currently sitting at <code>/shop</code>.</li>
  <li>If it belongs to a plugin you no longer use, trash it. If you still need it, edit it and change its slug to something else — <code>/old-shop</code>, say.</li>
  <li>Open Ambikly's own page — the one containing <code>[ambikly_shop]</code> — and change its slug from <code>shop-2</code> to <code>shop</code>.</li>
  <li>Update <code>ambikly_settings_pages</code> to match, using one of the methods below. Ambikly does not notice the rename on its own.</li>
</ol>

## Moving or renaming a store page

The page and the recorded slug must stay in sync. Change one and you must change the other, in this order.

<ol class="step-list">
  <li>Edit the page under <span class="screen-path">Pages</span> and change its slug. Keep the shortcode in the content.</li>
  <li>Update the matching key in <code>ambikly_settings_pages</code>.</li>
  <li>Load the storefront and click through Shop → Cart → Checkout to confirm the links resolve.</li>
</ol>

### Updating the option with WP-CLI

`wp option patch` edits one key inside the array without rewriting the rest:

```bash
# Point the shop key at a page whose slug is now "store"
wp option patch update ambikly_settings_pages shop store

# Check the result
wp option get ambikly_settings_pages --format=json
```

### Updating the option in code

Run this once from a mu-plugin or a snippet, then remove it:

```php
$pages = get_option( 'ambikly_settings_pages', [] );
$pages['shop'] = 'store'; // the page's new slug, not its title
update_option( 'ambikly_settings_pages', $pages );
```

The valid keys are `shop`, `cart`, `checkout`, `account` and `thank_you`. The value is always a page **slug** — the `post_name` — never a page ID, a title, or a full URL.

<div class="ui-warn"><strong>Careful:</strong> Two pages must never carry the same shortcode. If <code>[ambikly_checkout]</code> appears on both <code>/checkout</code> and an old duplicate, customers can reach a checkout that Ambikly does not consider canonical, and redirect gateways will return them to the wrong place. Trash the duplicate rather than unpublishing it.</div>

### Nesting a page under a parent

Nesting changes the slug path but not the `post_name`. A page moved under a parent has the URL `/store/shop/` while its `post_name` is still `shop`. Ambikly calls `get_page_by_path()`, which resolves the full path, so record the **full path** in the option in that case:

```php
$pages['shop'] = 'store/shop';
```

## Permalinks

Ambikly registers no rewrite rules at all. There is no custom post type, no product archive, and no rewrite tag. The store rides entirely on WordPress pages, so whatever permalink structure your site uses is what the store uses.

| Permalink setting | Works? | What your URLs look like |
|---|---|---|
| Post name | Yes — recommended | `/shop/`, `/cart/`, `/checkout/` |
| Day and name, Month and name, Numeric | Yes | Pages are unaffected; only post URLs change |
| Plain | Works, but ugly | `/?page_id=42`, and products become `/?page_id=42&ambikly_product=blue-mug` |

Set this under <span class="screen-path">Settings → Permalinks</span>. Anything other than Plain is fine. Because Ambikly adds no rewrite rules, you never need to flush permalinks after installing, activating or updating it.

## Product URLs are query strings

This is the part that surprises people most, so it is worth stating plainly.

**There is no pretty permalink for a product in the free core.** A product page is the shop page plus a query argument:

```
https://example.com/shop/?ambikly_product=blue-ceramic-mug
```

`Storefront::productUrl()` builds it: it reads the shop slug from `ambikly_settings_pages`, resolves that page's permalink, appends `ambikly_product={slug}`, and returns the result. The `[ambikly_shop]` shortcode notices the query argument and renders the single product instead of the listing.

What that means in practice:

- Rename your shop page and **every product URL changes with it**. Redirect the old path if the store was public.
- The product slug comes from the product's own **Web address (URL slug)** field in the editor. Changing it changes the URL.
- SEO still works. Ambikly outputs a `<link rel="canonical">` pointing at the query-string URL, sets the document title from the product's meta title, and emits a meta description from the meta description or short description. A canonical query-string URL is indexable.
- The product's `meta_keywords` field is saved but never output on the front end. Filling it in has no effect.

### Making product URLs pretty

The URL passes through a filter before it is returned, so you can rewrite it — but the rewrite side is entirely yours to build:

```php
add_filter( 'ambikly_product_permalink', function ( $url, $product ) {
    return home_url( '/product/' . $product->slug . '/' );
}, 10, 2 );
```

<div class="ui-warn"><strong>Careful:</strong> That filter only changes the links Ambikly <em>prints</em>. Nothing in the plugin will serve <code>/product/blue-ceramic-mug/</code>. You must also register a rewrite rule that maps your path back to the shop page with <code>ambikly_product</code> set, and flush rewrite rules once. Without that second half you will have produced a site full of 404s. See <a href="/developers/hooks">Hooks &amp; filters</a>.</div>

## Checking your store pages

Five checks, all quick:

| Check | Where | What you want |
|---|---|---|
| All five exist and are published | <span class="screen-path">Pages</span> | Shop, Cart, Checkout, My Account, Order Received |
| Each has its shortcode | Edit each page | Exactly one Ambikly shortcode, and only on that page |
| The mapping matches | `wp option get ambikly_settings_pages` | Five keys, each holding a real slug |
| Links resolve | The storefront | Shop → product → Cart → Checkout without a 404 |
| No duplicates | <span class="screen-path">Pages</span>, search "Shop" | One page per shortcode |

If a store page shows its raw shortcode text instead of the store, the plugin is deactivated — the shortcodes are registered by Ambikly and unregistered with it.

If checkout redirects you back to the cart, or the thank-you page 404s, the recorded slug no longer matches a real page. Re-check the option.

More symptoms and fixes in [Troubleshooting](/troubleshooting).

## Customizing what the pages look like

Ambikly generates the shop, product, cart, checkout and account markup inline. There is **no template-override system for the storefront** — the plugin ships only three template files, and all three are email templates. Dropping an `ambikly/` folder into your theme will not override a storefront template, because there is no storefront template to override.

Your three real levers are:

- **CSS.** The storefront stylesheet is enqueued as `ambikly-storefront`; override it from your theme.
- **Block attributes.** The blocks accept attributes such as column counts and product limits.
- **Filters and actions.** 47 `ambikly_`-prefixed hooks exist in the free core.

See [Themes & template overrides](/themes) and [Hooks & filters](/developers/hooks).

## Next

Your storefront is in place but empty. [Your first product](/first-product) walks through creating one physical and one digital product.
