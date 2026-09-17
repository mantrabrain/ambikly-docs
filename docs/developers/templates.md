---
title: Template overrides
description: How ambikly_locate_template and ambikly_get_template resolve files, the three overridable email templates, and why the storefront, invoice and packing slip are customized differently.
prev:
  text: Database schema
  link: /developers/database
next:
  text: Payment gateway API
  link: /developers/payment-gateways
---

# Template overrides

Ambikly ships a small template system borrowed from the familiar WooCommerce pattern: a helper looks for your file in the theme first and falls back to the plugin's own copy.

It covers **three files, all email**. Everything else in Ambikly is customized a different way, and this page is explicit about which is which so you do not spend an afternoon creating a `wp-content/themes/your-theme/ambikly/checkout.php` that will never be read.

## What is overridable

| Plugin file | Copy to | Renders |
|---|---|---|
| `templates/emails/header.php` | `{theme}/ambikly/emails/header.php` | The opening HTML document and inline styles shared by every transactional email |
| `templates/emails/footer.php` | `{theme}/ambikly/emails/footer.php` | The closing container and footer for every transactional email |
| `templates/emails/order/notification.php` | `{theme}/ambikly/emails/order/notification.php` | The body of the order notification email, to the customer and to the admin |

That is the complete list. There are no other files in `templates/`.

## The lookup

Two global functions do the work. Both are defined in `src/Support/email-helpers.php` inside `if (!function_exists())` guards, so a child theme can replace the functions themselves if it needs to.

### `ambikly_locate_template()`

```php
ambikly_locate_template($template_name, $theme_path = '', $default_path = '')
```

Returns the absolute path of the file that should be used. It does not include anything.

The lookup order is:

<ol class="step-list">
  <li><strong>Child theme</strong> — <code>{child theme}/ambikly/{template_name}</code></li>
  <li><strong>Parent theme</strong> — <code>{parent theme}/ambikly/{template_name}</code></li>
  <li><strong>Plugin</strong> — <code>{plugin}/templates/{template_name}</code></li>
</ol>

Steps 1 and 2 are a single call to WordPress's `locate_template()`, which always prefers the child theme's stylesheet directory over the parent's template directory. Step 3 is the fallback, and it is returned even if the file does not exist.

| Argument | Default | Effect |
|---|---|---|
| `$template_name` | required | Path relative to the `ambikly/` folder, for example `emails/order/notification.php` |
| `$theme_path` | `'ambikly/'` | The folder inside the theme to look in |
| `$default_path` | `{plugin}/templates/` | Where to fall back to |

The result passes through the `ambikly_locate_template` filter before it is returned.

### `ambikly_get_template()`

```php
ambikly_get_template($template_name, $args = [], $theme_path = '', $default_path = '')
```

Locates the file, then includes it.

1. Calls `ambikly_locate_template()` with the same arguments.
2. If the located file does not exist, calls `_doing_it_wrong()` with a message naming the template and returns without output.
3. `extract()`s `$args` into the template's scope, so each key becomes a local variable.
4. Fires `ambikly_before_template_part`.
5. `include`s the file.
6. Fires `ambikly_after_template_part`.

Because `$args` is extracted rather than passed as an array, a template reads `$heading`, not `$args['heading']`. Always null-coalesce in your own copies — `<?php echo esc_html($heading ?? ''); ?>` — because an arg can be absent.

## Hooks around the system

| Hook | Type | Arguments | Fires |
|---|---|---|---|
| `ambikly_locate_template` | filter | `string $template`, `string $template_name`, `string $theme_path`, `string $default_path` | On every lookup, before the path is returned |
| `ambikly_before_template_part` | action | `string $template_name`, `string $located`, `array $args` | Immediately before the file is included |
| `ambikly_after_template_part` | action | `string $template_name`, `string $located`, `array $args` | Immediately after the file is included |

### Redirecting a template from a plugin

Use the filter when the file lives somewhere other than a theme — in your own plugin, for example.

```php
add_filter('ambikly_locate_template', function ($template, $template_name) {
    if ($template_name === 'emails/order/notification.php') {
        $mine = plugin_dir_path(__FILE__) . 'templates/ambikly-order-notification.php';
        if (file_exists($mine)) {
            return $mine;
        }
    }
    return $template;
}, 10, 2);
```

Always check `file_exists()` before returning your path. Returning a path that does not exist produces a `_doing_it_wrong()` notice and an empty email body.

### Appending without copying the file

The two actions let you add markup around a template without maintaining a copy of it, which means you keep getting upstream fixes.

```php
add_action('ambikly_after_template_part', function ($template_name, $located, $args) {
    if ($template_name !== 'emails/order/notification.php') {
        return;
    }
    if (($args['email_to'] ?? '') !== 'customer') {
        return;
    }
    echo '<tr><td class="content-block aligncenter" style="padding:16px;">'
       . '<a href="https://acme.example/returns">Start a return</a>'
       . '</td></tr>';
}, 10, 3);
```

This fires inside `ambikly_get_template()`'s output buffer, so the markup lands in the email body in document order.

For order emails specifically, `ambikly_order_email_extras` is usually the better tool — it is a filter designed for exactly this, takes the `Order` object, and does not require you to know the table markup.

## What is **not** overridable

### The storefront

**There is no storefront template-override system.** Shop, product detail, cart, checkout and account markup is generated inline in `src/Frontend/Storefront.php` and emitted by the blocks and shortcodes. There is no `templates/shop.php`, no `content-product.php`, no template hierarchy. Creating `{theme}/ambikly/single-product.php` will have no effect whatsoever.

`ambikly_locate_template()` supports `{theme}/ambikly/{template}` as a mechanism, but the plugin only ever calls it for the three email files. Nothing on the storefront goes through it.

Customize the storefront with these, in roughly increasing order of effort:

| Tool | Good for |
|---|---|
| CSS in your theme | Colors, spacing, typography, hiding elements, layout tweaks |
| Block attributes | Column counts, product counts, which sections a page shows — see [Blocks & store pages](/blocks) |
| Shortcode attributes | The same, outside the block editor — see [Shortcodes](/shortcodes) |
| `ambikly_*` filters | Adding badges, buttons, account tabs, extra HTML at defined points |
| `ambikly_product_detail_body` action | Injecting a block of markup into the product detail layout |

The storefront markup carries stable class names, so CSS reaches most of what you would otherwise want a template for. [Themes & template overrides](/themes) covers the storefront side in more detail for non-developers.

The filters most often reached for:

```php
// A badge on every product card in a grid.
add_filter('ambikly_product_card_badges', function (array $badges, $product) {
    if (!empty($product->featured)) {
        $badges[] = ['key' => 'featured', 'label' => __('Staff pick', 'acme')];
    }
    return $badges;
}, 10, 2);

// An extra button beneath the add-to-cart form.
add_filter('ambikly_product_detail_actions', function (array $extras, $productId) {
    $url = add_query_arg('product', (int) $productId, home_url('/contact'));
    $extras[] = '<a class="acme-ask" href="' . esc_url($url) . '">Ask a question</a>';
    return $extras;
}, 10, 2);

// An extra tab in the account area.
add_filter('ambikly_account_tabs', function (array $tabs) {
    $tabs['warranty'] = __('Warranty', 'acme');
    return $tabs;
});
```

See [Hooks & filters](/developers/hooks) for the full list.

### Invoices and packing slips

Both documents have templates, but they live under `src/Templates/`, not `templates/`, and they are included directly rather than through `ambikly_get_template()`. **A theme copy is never consulted.**

| Document | Template | Customize with |
|---|---|---|
| Invoice | `src/Templates/invoice.php` | `ambikly_invoice_context`, `ambikly_invoice_logo_url`, `ambikly_invoice_after`, `ambikly_invoice_pdf_renderer` |
| Packing slip | `src/Templates/packing-slip.php` | `ambikly_packing_slip_context`, `ambikly_packing_slip_after` |

The context filters are the intended extension point. They receive the array that becomes the template's variables, so you add or replace data rather than markup.

```php
add_filter('ambikly_invoice_context', function (array $context) {
    $context['company_registration'] = 'Acme Ltd — Reg. 12345678';
    $context['payment_terms']        = 'Net 30';
    return $context;
});

add_filter('ambikly_invoice_logo_url', function () {
    return 'https://acme.example/wp-content/uploads/invoice-logo.png';
});

add_action('ambikly_invoice_after', function ($order) {
    echo '<p class="acme-invoice-note">Questions? billing@acme.example</p>';
});
```

::: warning `ambikly_invoice_pdf_renderer` has no core implementation
Requesting `?format=pdf` on an invoice applies this filter, gets `null` back, and falls back to rendering HTML. To get real PDFs, return PDF bytes from a renderer of your own:

```php
add_filter('ambikly_invoice_pdf_renderer', function ($pdf, $html, $order) {
    $dompdf = new \Dompdf\Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->render();
    return $dompdf->output();
}, 10, 3);
```
:::

### Admin screens

The admin is a compiled React application. There is no PHP template layer and no override mechanism. Extend it through the [REST API](/developers/rest-api) and, on the Pro side, through the [Addon SDK](/developers/addon-sdk).

## Worked example: overriding the order notification email

Change the customer's order confirmation to add a delivery-estimate line and a support footer, keeping the shared header and footer.

### 1. Copy the file

```bash
cd wp-content
mkdir -p themes/your-child-theme/ambikly/emails/order
cp plugins/ambikly/templates/emails/order/notification.php \
   themes/your-child-theme/ambikly/emails/order/notification.php
```

The directory structure inside `ambikly/` must match the plugin's `templates/` exactly. `emails/order/notification.php`, not `notification.php`.

### 2. Know what you receive

`ambikly_get_template()` extracts these into scope:

| Variable | Type | Contains |
|---|---|---|
| `$heading` | string | The large heading above the greeting |
| `$greetings` | string | The "Hi {name}," line |
| `$byline_text` | string | The body paragraph. Limited HTML is allowed |
| `$email_to` | string | `'customer'` or `'admin'`. Toggles the admin-only "View order" link |

Any variable can be absent. Null-coalesce every one.

### 3. Edit your copy

```php
<?php
/**
 * Order notification body — Acme override.
 *
 * @var string $heading
 * @var string $greetings
 * @var string $byline_text
 * @var string $email_to  'customer' or 'admin'
 */
if (!defined('ABSPATH')) {
    exit;
}

$allowed = [
    'a'      => ['href' => [], 'target' => [], 'rel' => []],
    'br'     => [],
    'strong' => [],
    'em'     => [],
    'b'      => [],
    'i'      => [],
];
?>
<table class="main" width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td class="content-wrap aligncenter">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td class="content-block">
                        <h1 class="aligncenter"><?php echo esc_html($heading ?? ''); ?></h1>
                    </td>
                </tr>
                <tr>
                    <td class="content-block aligncenter">
                        <?php echo esc_html($greetings ?? ''); ?><br><br>
                        <?php echo wp_kses($byline_text ?? '', $allowed); ?>
                    </td>
                </tr>

                <?php if (($email_to ?? '') === 'customer') : ?>
                <tr>
                    <td class="content-block aligncenter">
                        <p><strong><?php esc_html_e('Estimated delivery: 3–5 business days.', 'acme'); ?></strong></p>
                        <p>
                            <?php esc_html_e('Questions about this order?', 'acme'); ?>
                            <a href="https://acme.example/support">acme.example/support</a>
                        </p>
                    </td>
                </tr>
                <?php endif; ?>
            </table>
        </td>
    </tr>
</table>
```

Escape everything. `esc_html()` for plain strings, `wp_kses()` with an allow-list for anything that may legitimately contain markup.

### 4. Smart tags still work

Smart tags such as `{{order_number}}` and `{{order_total}}` are substituted **after** the template renders, so a literal tag in your template resolves normally.

```php
<p><?php echo esc_html__('Order', 'acme') . ' {{order_number}}'; ?></p>
```

Available tags: `{{order_number}}`, `{{order_total}}`, `{{order_status}}`, `{{payment_method}}`, `{{customer_email}}`, `{{customer_first_name}}`, `{{customer_name}}`, `{{invoice_url}}`, `{{order_admin_url}}`, `{{home_url}}`, `{{blog_info}}`. Add your own with `ambikly_all_smart_tags`:

```php
add_filter('ambikly_all_smart_tags', function (array $tags, $order) {
    $tags['{{tracking_url}}'] = $order ? acme_tracking_url($order->id) : '';
    return $tags;
}, 10, 2);
```

### 5. Test it

Send a test from <span class="screen-path">Ambikly → Emails</span>, or place a real test order. If your copy is not picked up, check the path — it must be `{theme}/ambikly/emails/order/notification.php`, and on a child theme it must be in the child, not the parent.

### 6. Keep it maintained

A copied template is frozen. When a plugin update changes the original, your copy keeps the old markup, silently. Diff yours against `plugins/ambikly/templates/emails/order/notification.php` after each update:

```bash
diff wp-content/themes/your-child-theme/ambikly/emails/order/notification.php \
     wp-content/plugins/ambikly/templates/emails/order/notification.php
```

This is the reason to prefer `ambikly_order_email_extras` or `ambikly_after_template_part` when you are only appending something. Neither one goes stale.

## Which emails exist

Only four transactional emails are editable in the free core, and all four render through the same `emails/order/notification.php` body:

| Email | Audience |
|---|---|
| Order notification | Customer |
| Order notification | Admin |
| Order status change | Customer |
| Order status change | Admin |

There are **no** shipping-notification, cancelled-order or refund-notification emails in the free core. Low-stock alerts and company buyer invitations exist but are hard-coded and not editable. Subject and body text for the four editable ones can be changed without touching a template at all — from <span class="screen-path">Ambikly → Emails</span>, or through the eight [email filters](/developers/hooks#email-subject-and-message-filters).

## Next

[Payment gateway API](/developers/payment-gateways) covers adding a payment method to checkout.
