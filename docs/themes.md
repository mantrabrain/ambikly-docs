---
title: Themes & template overrides
description: What Ambikly can and cannot be overridden with. Three email templates support theme overrides; storefront markup is inline and customizable through CSS and filters only.
prev:
  text: Shortcodes
  link: /shortcodes
next:
  text: Settings reference
  link: /settings
---

# Themes & template overrides

Ambikly works with any WordPress theme. The storefront is rendered by shortcodes and blocks inside your theme's normal page template, so your header, footer, container widths and typography all apply without configuration.

What Ambikly does **not** have is a WooCommerce-style template hierarchy. This page is deliberately precise about where the line falls, because the difference matters a lot if you are planning customization work.

## What you can override, and what you cannot

| Area | Override method |
|---|---|
| Transactional email markup | Theme template override — three templates, listed below |
| Shop, product, cart, checkout, account, thank-you markup | **No template override.** CSS, block and shortcode attributes, and `ambikly_*` filters only |
| Product card badges and buttons | `ambikly_*` filters |
| Account tabs | `ambikly_*` filters and actions |
| Product URLs | `ambikly_product_permalink` filter |
| Colors, spacing, layout | Your theme's CSS |

::: danger There is no storefront template-override system
The plugin ships exactly **three** template files, and all three are email templates. Shop, product, cart, checkout, account and thank-you markup is generated inline in PHP. Copying a file into `your-theme/ambikly/` will not change any storefront page, because there is no storefront template file to copy.
:::

## The template loader

The loader function is `ambikly_locate_template()`. It resolves a template name through WordPress's own `locate_template()`, which checks the child theme first and then the parent theme:

<ol class="step-list">
  <li><code>{child-theme}/ambikly/{template}</code></li>
  <li><code>{parent-theme}/ambikly/{template}</code></li>
  <li>The plugin's own <code>templates/{template}</code></li>
</ol>

The first file that exists wins. The resolved path then passes through the `ambikly_locate_template` filter, so a plugin can redirect a template somewhere else entirely.

`ambikly_get_template()` wraps the loader: it locates the file, extracts any named arguments into scope, fires `ambikly_before_template_part`, includes the file, and fires `ambikly_after_template_part`. If the located file does not exist it calls `_doing_it_wrong()` and renders nothing rather than fataling.

Both functions are declared inside `if (!function_exists())` guards, so a theme can replace either one wholesale by declaring it first.

## The three templates you can override

These are the only template files in the plugin.

| Template | Plugin path | Child theme override path |
|---|---|---|
| Email header | `templates/emails/header.php` | `your-child-theme/ambikly/emails/header.php` |
| Email footer | `templates/emails/footer.php` | `your-child-theme/ambikly/emails/footer.php` |
| Order notification body | `templates/emails/order/notification.php` | `your-child-theme/ambikly/emails/order/notification.php` |

To override one, copy the file from the plugin into your child theme at the matching path under an `ambikly/` folder and edit your copy. Keep the folder structure — `emails/order/notification.php`, not `notification.php`.

<div class="ui-tip"><strong>Tip:</strong> Override the header and footer to wrap every transactional email in your own branding once, rather than editing message bodies individually. Message text itself is editable without any code — see <a href="/emails">Emails</a>.</div>

## Customizing the storefront

With no templates to copy, storefront customization comes down to three things: CSS, attributes, and filters.

### 1. CSS

All storefront markup carries stable, prefixed class names. The stylesheet is registered as `ambikly-storefront` and enqueued by every shortcode and block, so you can enqueue your own stylesheet after it and override freely.

The classes you will use most:

| Class | Element |
|---|---|
| `.ambikly-shop` | Shop wrapper. Carries `data-columns`. |
| `.ambikly-shop__grid` | The product grid. Column count is the `--cols` CSS variable. |
| `.ambikly-product-card` | One product card. Carries `data-ambikly-product-id`. |
| `.ambikly-product-card--out-of-stock` | Added to cards for products that are not in stock. |
| `.ambikly-product-card__badges` / `__badge` | Badge container and individual badges. |
| `.ambikly-product-detail` | Single product page wrapper. |
| `.ambikly-product-gallery` | Product gallery, main image and thumbnails. |
| `.ambikly-cart` / `#ambikly-cart-app` | Cart mount node. |
| `.ambikly-checkout` / `#ambikly-checkout-app` | Checkout mount node. |
| `.ambikly-account` | Account wrapper. `.ambikly-account--guest` for the sign-in card. |
| `.ambikly-thankyou` | Order confirmation wrapper. |
| `.ambikly-btn`, `.ambikly-btn--primary`, `.ambikly-btn--outline`, `.ambikly-btn--block` | Buttons. |
| `.ambikly-pagination` / `.ambikly-page` | Pagination nav and links. |
| `.ambikly-reviews__list` / `.ambikly-review` | Reviews list and one review. |

Put your rules in your theme's stylesheet or a child theme. There is **no** "Custom CSS" or "Custom JS" field in the plugin's settings screens that affects the storefront — nothing in the plugin reads such a value.

### 2. Block and shortcode attributes

Columns, products per page, whether the sort and search controls appear, cart layout, media position, CTA labels — a lot of what looks like it needs a template change is a shortcode attribute. Check [Shortcodes](/shortcodes) and [Blocks & store pages](/blocks) before writing any PHP.

### 3. Filters and actions

These are the storefront extension points in the free core. Register them with plain `add_action()` and `add_filter()` in your theme's `functions.php` or a small site plugin.

| Hook | Type | Fires | Arguments |
|---|---|---|---|
| `ambikly_product_card_badges` | filter | On every product card, before rendering badges | `array $badges`, `Product $product` |
| `ambikly_product_card_actions` | filter | On every product card, after the View and add-to-cart buttons | `array $actions`, `int $product_id`, `Product $product` |
| `ambikly_product_detail_body` | action | Inside the product detail info column, after the short description | `Product $product` |
| `ambikly_product_detail_actions` | filter | Inside the add-to-cart form on the product detail page | `array $extras`, `int $product_id`, `Product $product` |
| `ambikly_product_permalink` | filter | Whenever a product URL is built | `string $url`, `Product $product` |
| `ambikly_account_tabs` | filter | When the account page builds its sidebar | `array $tabs` (key => label) |
| `ambikly_account_tab_{tab}` | action | After the account page renders the selected tab | `array $customer` |
| `ambikly_account_order_extras` | filter | Per order row in the account Orders table | `string $html`, `Order $order` |
| `ambikly_login_form_after` | filter | Directly after the sign-in form on a logged-out account page | `string $html` |
| `ambikly_locate_template` | filter | Every template lookup | `string $template`, `string $name`, `string $theme_path`, `string $default_path` |
| `ambikly_before_template_part` | action | Before a template file is included | `string $name`, `string $located`, `array $args` |
| `ambikly_after_template_part` | action | After a template file is included | `string $name`, `string $located`, `array $args` |

Note what each is for:

- **`ambikly_product_card_badges`** is the only supported way to add a ribbon to a product card. Each badge is an array with a `key` (used in the CSS class) and a `label`.
- **`ambikly_product_card_actions`** and **`ambikly_product_detail_actions`** both take an array of ready-made HTML strings and join them with a space. Escape your own output — the plugin does not.
- **`ambikly_product_detail_body`** is an action, not a filter: echo your markup directly.
- **`ambikly_product_permalink`** is where you would add pretty permalinks. Ambikly's own URLs are `{shop page}?ambikly_product={slug}` and there is no rewrite in the free core.
- **`ambikly_account_tabs`** plus **`ambikly_account_tab_{tab}`** are a pair: add the tab to the array with the first, render its body with the second.
- **`ambikly_login_form_after`** takes and returns a string of HTML appended below the login form.

### A real example

Add a "Free shipping" badge to every product over $50, and a small "Ships in 24h" note under the add-to-cart button on product pages.

```php
<?php
// In your child theme's functions.php, or a small site plugin.

add_filter('ambikly_product_card_badges', function (array $badges, $product) {
    $price = (float) ($product->sale_price ?: $product->price);
    if ($price >= 50.0) {
        $badges[] = [
            'key'   => 'free-shipping',
            'label' => __('Free shipping', 'my-theme'),
        ];
    }
    return $badges;
}, 10, 2);

add_filter('ambikly_product_detail_actions', function (array $extras, $product_id, $product) {
    if ($product->type !== 'digital') {
        $extras[] = '<p class="my-ships-fast">'
            . esc_html__('Ships in 24 hours', 'my-theme')
            . '</p>';
    }
    return $extras;
}, 10, 3);
```

Then style the new badge with the class the plugin generates for it:

```css
.ambikly-product-card__badge--free-shipping {
  background: #0f766e;
  color: #fff;
}
```

<div class="ui-warn"><strong>Careful:</strong> Do not use the helper class <code>Ambikly\Support\Hooks</code> to register these. It exists in the source but has no call sites. Use plain <code>add_action()</code> and <code>add_filter()</code>.</div>

## Using Ambikly in a block theme

Block themes work, with one thing to plan around: Ambikly's blocks have no editor UI, so a full-site-editing template is usually easier to build with shortcodes.

<ol class="step-list">
  <li>Leave the five store pages exactly as the activation seeder created them — a page each holding <code>[ambikly_shop]</code>, <code>[ambikly_cart]</code>, <code>[ambikly_checkout]</code>, <code>[ambikly_account]</code> and <code>[ambikly_thank_you]</code>.</li>
  <li>Make sure your theme's <strong>Page</strong> template renders <code>post_content</code> full-width enough for a product grid and a two-column cart.</li>
  <li>For a cart icon in the site header, edit your <strong>Header</strong> template part and add the mini-cart block through the code editor: <code>&lt;!-- wp:ambikly/mini-cart {"showSubtotal":true} /--&gt;</code>.</li>
  <li>For product listings elsewhere — a home page featured row, a landing page — use a <strong>Shortcode</strong> block with <code>[ambikly_shop]</code> and its attributes, rather than the product grid block. You get an editable attribute string instead of hand-written JSON.</li>
</ol>

<div class="ui-warn"><strong>Careful:</strong> Do not build a custom FSE template for "single product". There is no product post type and no product template in the hierarchy — product pages are the Shop page rendering a different shortcode branch based on the <code>?ambikly_product=</code> query string.</div>

## Overriding an email template

The three templates are the one place a real file override applies, so here is what you get inside them.

The order notification body is rendered with the order in scope and its content passed through the smart-tag parser. Smart tags are `{{double_brace_tokens}}` replaced at send time, and this is the complete built-in set:

| Smart tag | Value |
|---|---|
| `{{order_number}}` | The order number, falling back to the order ID |
| `{{order_total}}` | The order total, formatted in the order's currency |
| `{{order_status}}` | The order's current status |
| `{{payment_method}}` | The customer-facing payment method title |
| `{{customer_email}}` | The order's email address |
| `{{customer_first_name}}` | Billing first name, falling back to "there" |
| `{{customer_name}}` | Billing full name, falling back to the email address |
| `{{invoice_url}}` | Link to the order's invoice |
| `{{order_admin_url}}` | Link to the order in wp-admin |
| `{{home_url}}` | The site home URL |
| `{{blog_info}}` | The site name |

Add your own with the `ambikly_all_smart_tags` filter — it receives the tag map, the order, and any extra tags the caller supplied, and whatever you return is what gets substituted.

<ol class="step-list">
  <li>Copy <code>templates/emails/header.php</code> and <code>templates/emails/footer.php</code> from the plugin into <code>your-child-theme/ambikly/emails/</code>.</li>
  <li>Edit your copies to wrap every email in your own table-based layout, logo and footer text.</li>
  <li>Send a test order to yourself and check the result in a real email client, not just a browser.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> Override the header and footer, not the notification body. Message text is editable from <span class="screen-path">Ambikly → Emails</span> without any code, and a merchant editing copy there should not have to touch a PHP file you own.</div>

## Practical advice for theme authors

- **Give the shortcodes room.** The shop grid, cart and checkout expect a reasonably wide content column. A narrow blog-post container will squeeze the two-column cart layout.
- **Do not fight the column variable.** The grid sets `--cols` inline from the `columns` attribute. Read it in your own CSS rather than hard-coding a column count.
- **Style the disabled state.** Out-of-stock cards get `.ambikly-product-card--out-of-stock` and a disabled button. If your theme's button styles ignore `[disabled]`, an unbuyable product will look buyable.
- **Check the guest account page.** The logged-out account page uses `.ambikly-account--guest` and renders WordPress's own `wp_login_form()` markup. That form inherits core styles, not yours, unless you style it.
- **Test the 404.** A missing or unpublished product sends a real 404 header from inside the Shop page. Make sure your theme does not swallow that.

## Where to go next

- [Hooks & filters](/developers/hooks) — the complete hook reference, including the order, cart, checkout and email hooks not listed here.
- [Template overrides](/developers/templates) — the loader in more detail, and the exact contents of the three email templates.
- [Emails](/emails) — editing email content without touching a template file.
