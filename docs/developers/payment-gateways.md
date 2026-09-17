---
title: Payment gateway API
description: The PaymentGateway abstract class, the PaymentResult shape and its four factories, registering a gateway through ambikly_payment_gateways, and a complete working custom gateway.
prev:
  text: Template overrides
  link: /developers/templates
next:
  text: Addon SDK
  link: /developers/addon-sdk
---

# Payment gateway API

A payment gateway is a class that takes an order, does something to collect money, and reports back. Ambikly ships seven — `stripe`, `paypal`, `cod`, `bank_transfer`, `cheque`, `manual` and `net_terms` — and registers yours through a single filter.

Extend `Ambikly\Payments\PaymentGateway`, implement one method, and add your instance to the registry.

## The `PaymentGateway` class

```php
namespace Ambikly\Payments;

abstract class PaymentGateway
{
    public $id;
    public $title;
    public $description;
    public $supportsRefunds = false;
    public $supportsRecurring = false;

    abstract public function process(Order $order, array $params = []);

    public function refund(Order $order, $amount, $reason = '') { /* … */ }
    public function chargeRenewal($subscription, Order $renewalOrder) { /* … */ }
    public function chargeAdditional(Order $order, $amount, $description = '', $idempotencyKey = null) { /* … */ }
    public function isAvailable(array $context = []) { /* … */ }
    public function settings() { /* … */ }
    public function toArray(array $context = []) { /* … */ }
}
```

### Properties

| Property | Type | Required | Default | Purpose |
|---|---|---|---|---|
| `$id` | string | **Yes** | none | Unique slug. Stored on the order as `payment_method`, and the key in the registry. Use `[a-z0-9_-]` |
| `$title` | string | **Yes** | none | Label shown at checkout and stored as `payment_method_title` |
| `$description` | string | Recommended | none | Short explanation shown under the title at checkout |
| `$supportsRefunds` | bool | No | `false` | Surfaced in `toArray()` so the admin refund UI knows whether to offer a gateway refund |
| `$supportsRecurring` | bool | No | `false` | When false, the gateway is hidden at checkout for a cart containing a subscription product |

Set all of these in your constructor. Nothing else populates them.

::: warning `$supportsRecurring` prevents a specific real failure
A cart containing a subscription passes `requiresRecurring` in the context. `PaymentManager::available()` filters out any gateway whose `$supportsRecurring` is false. Without that flag, a subscription created against a gateway that cannot charge a stored card is guaranteed to fail every renewal from day one — it either auto-cancels after the retry limit or sits permanently past due, having never been capable of renewing. Leave the default `false` unless you have implemented `chargeRenewal()`.
:::

### Methods

#### `process(Order $order, array $params = [])` — required

The only abstract method. Called by `CheckoutService` when a customer places an order with this gateway selected.

| Argument | Contains |
|---|---|
| `$order` | The already-created `Order` with its items, totals and addresses |
| `$params` | The gateway-specific fields submitted at checkout |

The order row already exists by the time `process()` runs. Your job is to attempt payment and set the order's state to match.

Set `payment_method` and `payment_method_title` on the order and call `save()`. Return a `PaymentResult`.

#### `refund(Order $order, $amount, $reason = '')` — optional

**Default behavior:** returns `PaymentResult::failed('Refunds are not supported for this gateway.')`.

Override when your provider can refund programmatically, and set `$supportsRefunds = true`. `$amount` is the refund amount, which may be less than the order total for a partial refund.

#### `chargeRenewal($subscription, Order $renewalOrder)` — optional

**Default behavior:** returns `PaymentResult::failed('This gateway does not support automatic renewals.')`.

Override when your provider stores a reusable payment method, and set `$supportsRecurring = true`. `$subscription` is an `\Ambikly\Models\Subscription`; `$renewalOrder` is the newly created order for this billing cycle.

#### `chargeAdditional(Order $order, $amount, $description = '', $idempotencyKey = null)` — optional

**Default behavior:** returns `PaymentResult::failed('This payment method cannot be charged again without a new checkout.')`.

Charges an incremental amount against the method already on file for a paid order — what the Post-Purchase Upsells add-on uses. Only a provider that stores a reusable method can implement this; in the shipped gateways, only Stripe does, via `setup_future_usage` at the original checkout.

Honor `$idempotencyKey` if your provider supports one. The same upsell acceptance can arrive twice.

#### `isAvailable(array $context = [])` — optional

**Default behavior:** returns `!empty($this->settings()['enabled'])` — the admin-configured on/off flag, the same answer for every caller.

Override when *who* the caller is matters. The context is built by `CompanyService::contextForCurrentUser()`:

| Key | Type | Meaning |
|---|---|---|
| `customer` | `Customer\|null` | The resolved store customer |
| `company` | `Company\|null` | Their company account, if any |
| `requiresRecurring` | bool | The cart contains a subscription product |

The array is empty for a caller that has not resolved one, so always null-coalesce.

Two shipped gateways override it. `ManualGateway` calls `parent::isAvailable()` and then requires `ambikly_manage_store`, so it only appears for staff. `NetTerms` ignores the settings flag entirely and requires an active company with net terms enabled and available credit.

::: danger `isAvailable()` is eligibility, not enforcement
`isAvailable()` decides whether your gateway is *offered*. It is advisory and it runs before the order exists. State can change between that check and `process()` — a concurrent order can consume the credit, a card can be removed, a limit can be reached.

`process()` is where enforcement belongs, and it must be atomic. `NetTerms::process()` does not re-read a balance and compare it in PHP; it issues a single conditional `UPDATE ... WHERE credit_used + %f <= credit_limit` and checks whether a row was affected. Never treat `isAvailable()` returning true as proof that a specific amount is actually collectable.
:::

#### `settings()` — provided

Reads the `payments` settings group and returns the sub-array for `$this->id`. You do not normally override it.

It also flattens credentials. The admin saves credential fields (`secret_key`, `client_id`, `client_secret`, and so on) nested under a `credentials` sub-array, and `settings()` merges that sub-array up to the top level. Read credentials flat:

```php
$settings = $this->settings();
$apiKey = $settings['api_key'] ?? '';   // works whether saved flat or nested
```

#### `toArray(array $context = [])` — provided

Serializes the gateway for the REST API as `id`, `title`, `description`, `enabled` (the result of `isAvailable($context)`) and `supports_refunds`. Override only if you need to expose more.

## `PaymentResult`

Every payment method returns one. It is a plain value object with four static factories.

```php
class PaymentResult
{
    public $success;              // bool
    public $status;               // 'paid' | 'pending' | 'failed'
    public $redirectUrl;          // string|null
    public $message;              // string|null
    public $gatewayTransactionId; // string|null
    public $rawResponse;          // mixed|null
}
```

| Factory | `success` | `status` | Also sets | Use when |
|---|---|---|---|---|
| `PaymentResult::paid($transactionId = null, $rawResponse = null)` | `true` | `paid` | `gatewayTransactionId`, `rawResponse` | Money has been captured now |
| `PaymentResult::pending($message = null)` | `true` | `pending` | `message` | The order is valid but payment happens later — cash on delivery, bank transfer, check, net terms |
| `PaymentResult::redirect($url)` | `true` | `pending` | `redirectUrl` | The customer must be sent to the provider to complete payment |
| `PaymentResult::failed($message)` | `false` | `failed` | `message` | Payment was declined or errored. The message is shown to the customer |

`toArray()` serializes it as `success`, `status`, `redirect_url`, `message` and `transaction_id`. `rawResponse` is deliberately not serialized — keep provider responses out of API output.

::: tip `redirect()` produces status `pending`, not a status of its own
A redirect result is a pending payment with somewhere to send the browser. The order stays pending until the provider's callback route confirms it. Remember that `ambikly_checkout_completed` fires with `null` as its second argument on the thank-you page for exactly these gateways — see [Hooks & filters](/developers/hooks).
:::

## Registering a gateway

`PaymentManager::gateways()` builds the default list, passes it through the `ambikly_payment_gateways` filter, and indexes the result by `$id`.

```php
add_filter('ambikly_payment_gateways', function (array $gateways) {
    $gateways[] = new \Acme\Payments\AcmePayGateway();
    return $gateways;
});
```

Rules the registry enforces:

- Anything in the returned array that is not a `PaymentGateway` instance is silently skipped.
- The array is re-keyed by `$id`. A duplicate `$id` **replaces** the earlier entry, which is how you would override a shipped gateway.

```php
// Replace the built-in Stripe gateway with your own implementation.
add_filter('ambikly_payment_gateways', function (array $gateways) {
    foreach ($gateways as $i => $gateway) {
        if ($gateway->id === 'stripe') {
            $gateways[$i] = new \Acme\Payments\BetterStripe();
        }
    }
    return $gateways;
});
```

::: danger The registry is memoized — register early
`PaymentManager::gateways()` caches its result in a static property on first call. The `ambikly_payment_gateways` filter runs **once per request**, and only on that first call. A filter added after something has already asked for the gateway list is never invoked, and your gateway simply does not exist for the rest of the request — no error, no warning.

Register at the top level of your plugin file, or on an early hook:

```php
// Safe — runs when the plugin file is loaded.
add_filter('ambikly_payment_gateways', 'acme_register_gateway');

// Also safe.
add_action('plugins_loaded', function () {
    add_filter('ambikly_payment_gateways', 'acme_register_gateway');
}, 5);

// NOT safe — checkout and the admin may already have built the list.
add_action('wp_footer', function () {
    add_filter('ambikly_payment_gateways', 'acme_register_gateway');
});
```

A Pro add-on's `boot()` runs on `plugins_loaded` and is early enough.
:::

### Configuring your gateway in the admin

Once registered, your gateway appears at <span class="screen-path">Ambikly → Settings → Payments</span> with the standard enabled / title / description fields, saved under `ambikly_settings_payments` keyed by your `$id`. Credentials save into a `credentials` sub-array, which `settings()` flattens for you.

There is no API for adding custom fields to that panel. Read anything extra from your own option.

## A complete custom gateway

A working gateway that charges a fictional provider's API, supports refunds, and handles both the immediate-capture and redirect flows.

```php
<?php
/**
 * Plugin Name: AcmePay for Ambikly
 * Description: Adds AcmePay as an Ambikly payment method.
 */

namespace Acme\Payments;

use Ambikly\Models\Order;
use Ambikly\Payments\PaymentGateway;
use Ambikly\Payments\PaymentResult;

if (!defined('ABSPATH')) {
    exit;
}

class AcmePayGateway extends PaymentGateway
{
    const API_BASE = 'https://api.acmepay.example/v1';

    public function __construct()
    {
        $this->id              = 'acmepay';
        $this->title           = __('AcmePay', 'acmepay');
        $this->description     = __('Pay securely with AcmePay.', 'acmepay');
        $this->supportsRefunds = true;
        // Leave false until chargeRenewal() is implemented — see the
        // warning above about subscriptions that can never renew.
        $this->supportsRecurring = false;
    }

    /**
     * Only offer this gateway when it is switched on AND credentials
     * are actually configured. The default implementation checks only
     * the enabled flag, which would offer a gateway that is certain
     * to fail at process() time.
     */
    public function isAvailable(array $context = [])
    {
        if (!parent::isAvailable($context)) {
            return false;
        }
        return $this->apiKey() !== '';
    }

    public function process(Order $order, array $params = [])
    {
        $token = isset($params['acmepay_token']) ? sanitize_text_field($params['acmepay_token']) : '';
        if ($token === '') {
            return PaymentResult::failed(__('No payment token was submitted.', 'acmepay'));
        }

        // Record the chosen method before attempting the charge, so a
        // failed order still shows what the customer tried to use.
        $order->payment_method       = $this->id;
        $order->payment_method_title = $this->title;
        $order->save();

        $response = $this->post('/charges', [
            'amount'      => $this->minorUnits($order->total),
            'currency'    => strtolower((string) $order->currency),
            'token'       => $token,
            'reference'   => (string) $order->order_number,
            'return_url'  => $this->returnUrl($order),
            // Guards against a double-submitted checkout form.
            'idempotency' => 'order-' . (int) $order->id,
        ]);

        if (is_wp_error($response)) {
            return PaymentResult::failed(
                __('We could not reach AcmePay. Please try again.', 'acmepay')
            );
        }

        switch ($response['status'] ?? '') {
            case 'succeeded':
                $order->status         = Order::STATUS_PROCESSING;
                $order->payment_status = Order::PAYMENT_PAID;
                $order->total_paid     = $order->total;
                $order->save();
                return PaymentResult::paid($response['id'] ?? null, $response);

            case 'requires_action':
                // The customer must approve on AcmePay's own page.
                // The order stays pending until the callback confirms.
                return PaymentResult::redirect($response['redirect_url']);

            default:
                return PaymentResult::failed(
                    $response['error_message'] ?? __('Your payment was declined.', 'acmepay')
                );
        }
    }

    public function refund(Order $order, $amount, $reason = '')
    {
        $chargeId = $this->lastChargeId($order);
        if (!$chargeId) {
            return PaymentResult::failed(__('No AcmePay charge is recorded for this order.', 'acmepay'));
        }

        $response = $this->post('/refunds', [
            'charge'      => $chargeId,
            'amount'      => $this->minorUnits($amount),
            'reason'      => sanitize_text_field($reason),
            'idempotency' => 'refund-' . (int) $order->id . '-' . $this->minorUnits($amount),
        ]);

        if (is_wp_error($response) || ($response['status'] ?? '') !== 'succeeded') {
            return PaymentResult::failed(__('AcmePay refused the refund.', 'acmepay'));
        }

        return PaymentResult::paid($response['id'] ?? null, $response);
    }

    // ---- helpers -------------------------------------------------

    private function apiKey()
    {
        $settings = $this->settings();
        return (string) ($settings['api_key'] ?? '');
    }

    private function minorUnits($amount)
    {
        return (int) round(((float) $amount) * 100);
    }

    private function returnUrl(Order $order)
    {
        return add_query_arg(
            ['ambikly_order' => (int) $order->id],
            home_url('/acmepay/return')
        );
    }

    private function lastChargeId(Order $order)
    {
        global $wpdb;
        return $wpdb->get_var($wpdb->prepare(
            "SELECT gateway_transaction_id
               FROM {$wpdb->prefix}ambikly_order_transactions
              WHERE order_id = %d AND payment_method = %s AND status = 'succeeded'
           ORDER BY id DESC
              LIMIT 1",
            (int) $order->id,
            $this->id
        ));
    }

    private function post($path, array $body)
    {
        $response = wp_remote_post(self::API_BASE . $path, [
            'timeout' => 20,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey(),
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode($body),
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        return is_array($decoded) ? $decoded : new \WP_Error('acmepay_bad_response', 'Unparseable response');
    }
}

// Registered at the top level of the plugin file — early enough that
// the memoized registry has not been built yet.
add_filter('ambikly_payment_gateways', function (array $gateways) {
    $gateways[] = new AcmePayGateway();
    return $gateways;
});
```

### Handling the redirect return

A `redirect()` result needs somewhere for the customer to come back to. Register your own REST route for it — the shipped gateways do the same with `/paypal/return` and `/stripe/webhook`, both public because the caller is the provider or the returning browser.

```php
add_action('rest_api_init', function () {
    register_rest_route('acmepay/v1', '/return', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function (\WP_REST_Request $req) {
            $orderId = (int) $req->get_param('ambikly_order');
            $order   = \Ambikly\Models\Order::find($orderId);
            if (!$order) {
                return new \WP_Error('not_found', 'Unknown order', ['status' => 404]);
            }
            // Verify with AcmePay directly. Never trust a status
            // that arrived as a query parameter on the browser's URL.
            // ...
        },
    ]);
});
```

Confirm the payment against the provider's API or a signed webhook, never against a query parameter the browser carried back.

### Testing a gateway

<ol class="step-list">
  <li>Activate your plugin and check <span class="screen-path">Ambikly → Settings → Payments</span> lists your gateway.</li>
  <li>Enable it and enter credentials.</li>
  <li>Call <code>GET /wp-json/ambikly/v1/checkout/options</code> with a cart present and confirm your <code>id</code> appears — that route reports the result of <code>isAvailable($context)</code>.</li>
  <li>Place a test order and check <code>ambikly_orders.payment_method</code> and <code>payment_status</code>.</li>
  <li>Refund from the order screen and confirm the provider recorded it.</li>
</ol>

If your gateway does not appear in `/checkout/options`, the cause is almost always one of three things: the filter ran too late for the memoized registry, `isAvailable()` returned false, or the cart contains a subscription and `$supportsRecurring` is false.

## Where Stripe actually lives

The Pro developer guide tells you to "see `addons/stripe/Addon.php`" for a worked gateway example. **That file does not exist.** There is no Stripe add-on in Ambikly Pro.

Stripe is part of the **free core**, at `src/Payments/Gateways/Stripe.php`, alongside the other six shipped gateways:

```text
wp-content/plugins/ambikly/src/Payments/Gateways/
├── BankTransfer.php
├── CashOnDelivery.php
├── CheckPayment.php
├── ManualGateway.php
├── NetTerms.php
├── PayPal.php
└── Stripe.php
```

Read `Stripe.php` for a full-featured example — stored payment methods, `chargeRenewal()`, `chargeAdditional()` and refunds. Read `CashOnDelivery.php` for the minimum viable gateway; it is about twenty lines. `NetTerms.php` is the reference for a gateway whose availability depends on the caller.

::: warning The plugins' DEVELOPER.md files are stale in places
Both plugins ship a `DEVELOPER.md`. Treat it as a starting point, not as reference — it is out of date on at least two points documented here and on the [Addon SDK](/developers/addon-sdk) page. Where it disagrees with the source, the source is right.
:::

## Known limitations of the shipped gateways

These are worth knowing if you are deciding whether to write your own.

| Gateway | Limitation |
|---|---|
| PayPal | No sandbox/live switch in the admin. The `mode` setting defaults to `sandbox` and has no field, so PayPal stays in sandbox until the option is set directly in the database |
| Stripe | `capture_manual` has no admin field. Capture is always automatic |
| Shipping classes | Cosmetic. The list is hard-coded and never read by `ShippingService` |

## Next

[Addon SDK](/developers/addon-sdk) covers packaging a gateway — or any feature — as a Pro add-on with settings and a lifecycle.
