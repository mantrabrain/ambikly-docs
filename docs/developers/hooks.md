---
title: Hooks & filters
description: Every ambikly_ action and filter in the Ambikly free core with its arguments and where it fires, plus the two dynamic patterns and the hooks the plugin documents but does not actually emit.
prev:
  text: Endpoint reference
  link: /developers/endpoints
next:
  text: Webhooks
  link: /developers/webhooks
---

# Hooks & filters

The free core emits **47 concrete `ambikly_` hooks** — 16 actions and 31 filters (23 general filters plus 8 email subject and message filters) — and two dynamic hook patterns.

Register for them with plain `add_action()` and `add_filter()` from a small plugin of your own. Every hook on this page is available whether or not Ambikly Pro is installed.

::: tip Hook count is per name, not per call site
`ambikly_checkout_completed` is one hook with two call sites, and the second one passes `null` where the first passes a `PaymentResult`. See [the note below](#checkout-completed-can-fire-with-null).
:::

## Actions

All 16 actions in the free core.

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_order_created` | `Order $order` | After an order row and its items are written, before payment is attempted — `OrderService::create()` |
| `ambikly_order_paid` | `Order $order` | When an order transitions to paid, from checkout or from a gateway callback — `OrderService` |
| `ambikly_order_status_changed` | `Order $order`, `string $old`, `string $new` | Every status transition, including ones made through `POST /orders/{id}/status` |
| `ambikly_order_refunded` | `Order $order`, `Refund $refund` | After a refund row is written and the order totals are updated |
| `ambikly_checkout_completed` | `Order $order`, `PaymentResult\|null $payment` | Twice: after `CheckoutService` finishes an inline payment, and again on the thank-you page for a redirect gateway — where arg 2 is `null` |
| `ambikly_review_submitted` | `Review $review` | After `POST /reviews` writes the row, whether or not it was auto-approved |
| `ambikly_customer_deleted` | `Customer $customer` | Inside `Customer::delete()`, before the row is removed |
| `ambikly_download_served` | `string $token`, `array $result`, `string $file_url` | After a digital download is authorized and the file URL resolved |
| `ambikly_inventory_alert_sent` | `string $level`, `Product $product`, `int $qty` | After a low-stock or out-of-stock alert email is sent. `$level` is the alert tier |
| `ambikly_email_send_before` | none | Immediately before `Mailer` calls `wp_mail()` |
| `ambikly_email_send_after` | none | Immediately after `wp_mail()` returns |
| `ambikly_before_template_part` | `string $template_name`, `string $located`, `array $args` | Inside `ambikly_get_template()`, before the file is included |
| `ambikly_after_template_part` | `string $template_name`, `string $located`, `array $args` | Inside `ambikly_get_template()`, after the file is included |
| `ambikly_invoice_after` | `Order $order` | At the foot of the rendered invoice, inside `src/Templates/invoice.php` |
| `ambikly_packing_slip_after` | `Order $order` | At the foot of the rendered packing slip |
| `ambikly_product_detail_body` | `Product $product` | In the storefront product detail layout, below the main product body |

### Arguments and `add_action()`

WordPress passes only one argument by default. Declare the count you need:

```php
add_action('ambikly_order_status_changed', function ($order, $old, $new) {
    // ...
}, 10, 3);
```

Getting this wrong is the single most common cause of "my hook fires but the variables are empty".

## Filters

23 general filters. The 8 email filters are in [their own section](#email-subject-and-message-filters).

### Payments and checkout

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_payment_gateways` | `PaymentGateway[] $gateways` | Once per request, inside `PaymentManager::gateways()`. **The result is memoized** — see [Payment gateway API](/developers/payment-gateways) |
| `ambikly_stock_shortfalls` | `array $shortfalls`, `array $items` | During checkout validation, after stock is checked and before the order is refused |
| `ambikly_cart_totals` | `array $totals`, `CartService $cart` | Every time cart totals are computed |
| `ambikly_shipping_rates` | `array $rates`, `array $context` | After `ShippingService` resolves rates for an address |
| `ambikly_order_number_prefix` | `string $prefix` | When a new order number is generated. Default `'AMB-'` |

### Products and storefront

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_product_permalink` | `string $url`, `Product $product` | Every time a product URL is built. Permalinks are query-string based: `{shop page}?ambikly_product={slug}` |
| `ambikly_product_on_sale` | `bool $onSale`, `Product $product` | Inside `Product::isOnSale()` |
| `ambikly_product_card_badges` | `array $badges`, `Product $product` | Per product card in a grid. Each badge is `['key' => ..., 'label' => ...]` |
| `ambikly_product_card_actions` | `array $actions`, `int $productId`, `Product $product` | Per product card, for extra buttons next to Add to cart |
| `ambikly_product_detail_actions` | `array $extras`, `int $productId`, `Product $product` | On the product detail page, next to the add-to-cart form |

### Customer account

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_account_tabs` | `array $tabs` | When the storefront account area builds its tab list. Keys become tab slugs |
| `ambikly_account_order_extras` | `string $html`, `Order $order` | Per order row in the account order list. Return appended HTML |
| `ambikly_login_form_after` | `string $html` | Below the storefront login form. Return appended HTML |

### Emails, invoices and documents

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_all_smart_tags` | `array $tags`, `Order $order`, `array $extra` | When the `{{smart_tag}}` map for an order is built |
| `ambikly_order_email_extras` | `string $html`, `Order $order`, `string $audience` | Inside the order email body. `$audience` is `'customer'` |
| `ambikly_locate_template` | `string $template`, `string $template_name`, `string $theme_path`, `string $default_path` | Every template lookup. Return an absolute path to redirect it |
| `ambikly_invoice_context` | `array $context` | Before the invoice template renders. The main customization point for invoices |
| `ambikly_invoice_logo_url` | `string $url` | Invoice logo. Default is an empty string |
| `ambikly_invoice_pdf_renderer` | `null $pdf`, `string $html`, `Order $order` | When `?format=pdf` is requested. **There is no core implementation** — return PDF bytes or `format=pdf` falls back to HTML |
| `ambikly_packing_slip_context` | `array $context` | Before the packing slip template renders |

### Downloads, reviews and Pro

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_download_file_url` | `string $file_url`, `string $token`, `array $result` | Before a download is served. Used by PDF Stamping to substitute a stamped file |
| `ambikly_review_auto_approve` | `bool $auto`, `int $productId`, `array $request` | On review submission. Default is true only for a logged-in verified purchaser |
| `ambikly_pro_license_status` | `string $status` | When the admin app's bootstrap data is built. Set by Pro |

::: warning `ambikly_is_pro_active`
Ambikly Pro sets this value, but nothing in the free core ever reads it. Do not use it to detect Pro — check `class_exists('\AmbiklyPro\Updater\License')` or `function_exists()` for something Pro actually defines.
:::

## Email subject and message filters

Eight filters, one per combination of two events (`order`, `order_status_change`), two parts (subject, message) and two audiences (customer, admin). They are the last layer: the stored option value is passed in, and your return value is what gets sent.

| Hook | Arguments | Filters |
|---|---|---|
| `ambikly_order_subject_to_customer` | `string $subject` | Customer order notification subject |
| `ambikly_order_message_to_customer` | `string $message` | Customer order notification body, before header and footer are wrapped around it |
| `ambikly_order_subject_to_admin` | `string $subject` | Admin order notification subject |
| `ambikly_order_message_to_admin` | `string $message` | Admin order notification body |
| `ambikly_order_status_change_subject_to_customer` | `string $subject` | Customer status-change subject |
| `ambikly_order_status_change_message_to_customer` | `string $message` | Customer status-change body |
| `ambikly_order_status_change_subject_to_admin` | `string $subject` | Admin status-change subject |
| `ambikly_order_status_change_message_to_admin` | `string $message` | Admin status-change body |

Each one receives `get_option('ambikly_{event}_{subject|content}_for_{audience}', <default>)`. The `message` filters run *before* `EmailTemplates::get_template()` wraps the result in the shared header and footer, so return inner content only, not a full HTML document.

Smart tags such as `{{order_number}}` are substituted after these filters run, so you can return a string containing them and they will still resolve.

::: warning There is no filter for the sender identity
`ambikly_email_from_name` and `ambikly_email_from_address` are **WordPress options**, not filters. Set them with `update_option()`, or use core's own `wp_mail_from` and `wp_mail_from_name` filters. See [Documented but not present](#documented-but-not-present).
:::

Only four transactional emails are editable in the free core: order notification and order status change, each to the customer and to the admin. There are no shipping, cancellation or refund emails to filter.

## Dynamic hook patterns

Two hooks have a name that is assembled at runtime.

### `ambikly_account_tab_{tab}`

Fires when the storefront account area renders a custom tab body.

| Part | Value |
|---|---|
| `{tab}` | The tab key you added through `ambikly_account_tabs` |
| Arguments | `Customer $customer` |
| Fires | Inside the account area, in place of the tab's content |

Add a tab and render it in two steps:

```php
add_filter('ambikly_account_tabs', function (array $tabs) {
    $tabs['warranty'] = __('Warranty', 'acme');
    return $tabs;
});

add_action('ambikly_account_tab_warranty', function ($customer) {
    echo '<h2>Your warranty registrations</h2>';
    echo '<p>Registered to ' . esc_html($customer->email) . '</p>';
});
```

Built-in tab keys already have handlers; use a key of your own.

### `ambikly_job_{hook}`

Fires when the job runner claims a queued job. `{hook}` is the job type string you passed to `JobQueue::enqueue()`.

| Part | Value |
|---|---|
| `{hook}` | Your job type, for example `webhook_deliver` |
| Arguments | `array $args`, `array $job` |
| Fires | From `JobRunner::process()`, once per claimed job |

Returning normally completes the job and deletes the row. Throwing schedules a backoff retry. A job type with no listener is failed immediately with "No handler registered" rather than retried forever. Full details are on the [Addon SDK](/developers/addon-sdk#the-job-queue) page.

```php
add_action('ambikly_job_acme_sync', function (array $args, array $job) {
    if (!acme_push($args['order_id'])) {
        throw new \RuntimeException('Push failed for order ' . $args['order_id']);
    }
}, 10, 2);
```

## Worked examples

### Post to Slack when an order is paid

```php
add_action('ambikly_order_paid', function ($order) {
    wp_safe_remote_post('https://hooks.slack.com/services/XXX/YYY/ZZZ', [
        'timeout'  => 5,
        'headers'  => ['Content-Type' => 'application/json'],
        'body'     => wp_json_encode([
            'text' => sprintf(
                'Order %s paid: %s %s',
                $order->order_number,
                $order->currency,
                number_format((float) $order->total, 2)
            ),
        ]),
    ]);
});
```

For anything that must not be lost, queue it instead of posting inline — see the [job queue](/developers/addon-sdk#the-job-queue), or use a [webhook](/developers/webhooks), which already does the retrying for you.

### Free shipping over $75

```php
add_filter('ambikly_shipping_rates', function (array $rates, array $context) {
    $subtotal = (float) ($context['subtotal'] ?? 0);
    if ($subtotal < 75.0) {
        return $rates;
    }
    foreach ($rates as &$rate) {
        $rate['cost'] = 0.0;
        $rate['title'] = __('Free shipping', 'acme');
    }
    return $rates;
}, 10, 2);
```

The store's currency is configurable; this example assumes USD.

### Change the order number prefix

```php
add_filter('ambikly_order_number_prefix', function () {
    return 'ACME-';
});
```

This affects orders created from that point on. Existing order numbers are stored, not computed, so they do not change.

### Add a "Best seller" badge to product cards

```php
add_filter('ambikly_product_card_badges', function (array $badges, $product) {
    if ((int) get_option('acme_bestseller_id') === (int) $product->id) {
        $badges[] = ['key' => 'bestseller', 'label' => __('Best seller', 'acme')];
    }
    return $badges;
}, 10, 2);
```

Badges render as spans you can target with CSS using the `key`.

### Write every status change to a log table

```php
add_action('ambikly_order_status_changed', function ($order, $old, $new) {
    global $wpdb;
    $wpdb->insert($wpdb->prefix . 'acme_order_log', [
        'order_id'   => (int) $order->id,
        'old_status' => $old,
        'new_status' => $new,
        'changed_at' => current_time('mysql'),
    ]);
}, 10, 3);
```

### Put a purchase-order number on the invoice

```php
add_filter('ambikly_invoice_context', function (array $context) {
    $order = $context['order'] ?? null;
    if ($order && !empty($order->customer_note)) {
        $context['po_number'] = $order->customer_note;
    }
    return $context;
});
```

`ambikly_invoice_context` and `ambikly_packing_slip_context` are the supported way to customize those documents. Their templates live under `src/` and are **not** theme-overridable — see [Template overrides](/developers/templates).

### Handle the redirect-gateway case safely

```php
add_action('ambikly_checkout_completed', function ($order, $payment) {
    // $payment is null on the thank-you page for Stripe and PayPal.
    $transactionId = $payment ? $payment->gatewayTransactionId : null;
    acme_record_conversion($order->id, $transactionId);
}, 10, 2);
```

## Documented but not present

`src/Support/Hooks.php` carries a docblock listing every hook the plugin emits. **Parts of that list are wrong.** Reading it and writing against it will cost you an afternoon, so the discrepancies are spelled out here.

| Name in the docblock | Reality |
|---|---|
| `ambikly_cart_item_added` | **Does not exist.** No `do_action()` anywhere emits it. Nothing fires when an item is added to the cart |
| `ambikly_cart_cleared` | **Does not exist.** Nothing fires when the cart is cleared |
| `ambikly_addon_registry` | **Wrong name.** The real filter is `ambikly_pro_addons`, and it lives in Ambikly Pro, not the free core. See [Addon SDK](/developers/addon-sdk#registering-a-third-party-add-on) |
| `ambikly_email_from_name` | **Not a filter.** It is a WordPress option read with `get_option()` |
| `ambikly_email_from_address` | **Not a filter.** Also an option |

To change the sender identity, set the options or use core's filters:

```php
// Either write the options Ambikly reads:
update_option('ambikly_email_from_name', 'Acme Store');
update_option('ambikly_email_from_address', 'orders@acme.example');

// Or filter at the wp_mail() level, which also covers WordPress's own mail:
add_filter('wp_mail_from_name', fn() => 'Acme Store');
add_filter('wp_mail_from', fn() => 'orders@acme.example');
```

To react to a cart change in the absence of `ambikly_cart_item_added`, hook the REST response with core's `rest_request_after_callbacks`, or use `ambikly_cart_totals`, which does fire every time totals are recomputed.

### Checkout completed can fire with null

It is emitted from two places. `CheckoutService` passes the real `PaymentResult`. The storefront thank-you page passes `null` as the second argument, which is the path taken for redirect gateways — Stripe and PayPal. Any handler that reads `$payment->status` without a null check will throw a fatal error on exactly those two gateways, which are the two most likely to be in use. Always null-check.

### The `Hooks` helper class has no call sites

`Ambikly\Support\Hooks` exposes `Hooks::on()`, `Hooks::filter()`, `Hooks::fire()` and `Hooks::apply()`, which prepend `ambikly_` to a name for you. Nothing in either plugin calls them. They work, but they add a layer between your code and the hook name you are actually registering for, which makes grepping harder. Use plain `add_action()` and `add_filter()` with the full hook name, as every example on this page does.

## Hooks emitted by Ambikly Pro

Two actions come from Pro's `AddonManager` rather than the free core, so they only fire when Pro is active:

| Hook | Arguments | Fires |
|---|---|---|
| `ambikly_addon_activated` | `string $slug` | After an add-on is enabled, activated and booted |
| `ambikly_addon_deactivated` | `string $slug` | After an add-on is disabled |

Pro also emits `ambikly_pro_addons` (the add-on registry filter), `ambikly_pro_license_data_updated` (after any license API call), and the `ambikly_subscription_renewed`, `ambikly_subscription_cancelled` and `ambikly_subscription_renewal_failed` actions that back the `subscription.*` [webhook events](/developers/webhooks).

## Next

[Webhooks](/developers/webhooks) covers pushing these same events to an external HTTP endpoint, with signing and retries handled for you.
