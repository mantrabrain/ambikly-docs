---
title: PayPal
description: Configure PayPal in Ambikly — the sandbox-by-default limitation you must fix first, credentials, the Orders v2 flow, the return URL, webhooks and refunds.
prev:
  text: Stripe
  link: /payments-stripe
next:
  text: Offline payment methods
  link: /payments-offline
---

# PayPal

PayPal uses the Orders v2 API. The customer is sent to PayPal to approve the payment, and Ambikly captures it server-side when they come back. Refunds and asynchronous events are handled through a webhook.

::: warning PayPal runs in sandbox until you change the database
The gateway chooses between PayPal's sandbox and live API hosts from a `mode` setting. That setting **defaults to `sandbox` and has no field anywhere in the admin UI** — there is no live/sandbox switch on the Payments tab.

Until you set `mode` to `live` directly in the database, every PayPal transaction goes to `api-m.sandbox.paypal.com` and **no real money is ever taken**. Orders will still appear to complete, because sandbox captures succeed exactly like live ones. The fix is in the next section — do it before you go live.
:::

## Switching PayPal to live

The setting lives in the WordPress option `ambikly_settings_payments`, under the `paypal` key. Set it once with WP-CLI:

```bash
wp eval '
$p = get_option("ambikly_settings_payments", []);
$p["paypal"]["mode"] = "live";
update_option("ambikly_settings_payments", $p);
'
```

Verify it took:

```bash
wp eval 'var_dump(get_option("ambikly_settings_payments")["paypal"]["mode"] ?? "(unset)");'
```

You should see `string(4) "live"`. Anything else — including `(unset)` — means you are still in sandbox.

If you have no WP-CLI access, the same change can be made from a one-off mu-plugin or a database client, editing the serialized `ambikly_settings_payments` row in `wp_options`. Do not hand-edit serialized data in phpMyAdmin unless you are comfortable with it; a broken string length corrupts every gateway's settings.

<ol class="step-list">
  <li>Set <code>mode</code> to <code>live</code> as above.</li>
  <li>Replace your sandbox client ID and secret with live credentials on the Payments tab.</li>
  <li>Delete the cached access token so the next call authenticates against the live host: <code>wp transient delete ambikly_paypal_token</code>.</li>
  <li>Place one small real order and refund it to confirm the round trip.</li>
</ol>

::: danger Switching mode without switching credentials will fail every payment
Sandbox credentials are rejected by the live host and vice versa. Change both together, or PayPal returns `no access token` and the gateway disappears from checkout.
:::

## Credentials

<ol class="step-list">
  <li>Sign in to the PayPal Developer Dashboard and open <strong>Apps &amp; Credentials</strong>.</li>
  <li>Pick the <strong>Live</strong> tab for production, or <strong>Sandbox</strong> for testing.</li>
  <li>Create or open a REST API app and copy its <strong>Client ID</strong> and <strong>Secret</strong>.</li>
  <li>In <span class="screen-path">Ambikly → Settings → Payment Settings</span>, toggle <strong>PayPal</strong> on and click <strong>Configure</strong>.</li>
  <li>Paste both values and click <strong>Save Gateway</strong>.</li>
</ol>

| Field | Required | Notes |
|---|---|---|
| Client ID | Yes | PayPal hides the gateway at checkout unless both this and the secret are saved |
| Client secret | Yes | Masked on read, showing only the last four characters |

Ambikly exchanges the pair for an OAuth access token and caches it in the `ambikly_paypal_token` transient until shortly before it expires. Changing credentials does not clear that cache automatically — delete the transient, or wait for it to lapse.

## The Orders v2 flow

<ol class="step-list">
  <li>The customer picks PayPal and places the order. Ambikly creates the order in <code>pending</code>.</li>
  <li>Ambikly creates a PayPal order with <code>intent: CAPTURE</code> and an amount breakdown, and stores PayPal's order ID in the option <code>ambikly_paypal_order_{order_id}</code>.</li>
  <li>The browser is redirected to PayPal's approval link. The button reads "Pay Now" rather than "Continue", because <code>user_action</code> is set to <code>PAY_NOW</code>.</li>
  <li>After approval PayPal returns the buyer to Ambikly's own capture endpoint, not to the thank-you page.</li>
  <li>That endpoint captures the payment, records it, marks the order paid, and then redirects to the thank-you page.</li>
</ol>

### The amount breakdown

PayPal rejects an order outright unless `item_total + shipping + tax_total − discount` equals the amount exactly. Ambikly sends:

| Breakdown field | Source |
|---|---|
| `item_total` | Order subtotal |
| `shipping` | Order shipping total |
| `tax_total` | Order tax total |
| `discount` | The gap between those three and the order total |

Computing the discount from the gap rather than from the coupon discount alone means gift cards, store credit and any other adjustment that lowers the order total are included, so the breakdown always balances.

Each line item is sent with its name (truncated to 127 characters), quantity and unit price, and is categorised as `DIGITAL_GOODS` or `PHYSICAL_GOODS`. A cart with no shippable item sets `shipping_preference` to `NO_SHIPPING`, so PayPal does not ask for an address; otherwise PayPal supplies the address on file.

## The return URL

PayPal sends the buyer back to a REST endpoint, which performs the capture and then redirects onward:

```
https://yourstore.example/wp-json/ambikly/v1/paypal/return
```

You do not register this anywhere — Ambikly sets it on each PayPal order as the `return_url`, with the order ID appended. The endpoint:

- Requires both an `order_id` and PayPal's `token`, and refuses the request with HTTP 403 unless the token matches the one stored for that exact order. Without this, a token from a cheap order could be replayed against an expensive one.
- Is idempotent: revisiting it for an order already paid redirects to the thank-you page without a second capture.
- Captures the PayPal order, then compares the captured amount against the order total. A mismatch is refused with HTTP 409, logged to the PHP error log, and the order is left unpaid for manual review rather than trusted.
- Writes a `paid` transaction row — this is what refunds later look up — and marks the order paid.
- Redirects to the thank-you page with the order ID.

::: tip A guest may see an empty thank-you page after PayPal
The redirect back from the capture endpoint carries only `order_id`, not the signed key the thank-you page uses to authorize anonymous viewers. A guest who is not logged in under a matching email will land on a thank-you page with no order summary. The order itself is paid and the confirmation email is sent — only the on-screen summary is withheld. A signed-in customer, or any store user, sees the full page.
:::

### The cancel URL

If the buyer cancels on PayPal's page, they are returned to your cart page. PayPal sends no event for this, so the order stays `pending` indefinitely with the stock it reserved still held. The customer loses nothing — their cart was never cleared — but you may want to cancel such orders periodically from [Orders](/orders). Stripe's equivalent case is handled by an expiry event; PayPal has no counterpart.

## The webhook

The webhook handles events that arrive without a browser: refunds issued from PayPal's own dashboard, declines, and captures that complete out of band.

**Endpoint URL:**

```
https://yourstore.example/wp-json/ambikly/v1/paypal/webhook
```

<ol class="step-list">
  <li>In the PayPal Developer Dashboard open your app and add a webhook pointing at that URL.</li>
  <li>Subscribe to the events in the table below.</li>
  <li>Copy the resulting <strong>Webhook ID</strong>.</li>
  <li>Store it as <code>webhook_id</code> on the PayPal gateway settings.</li>
</ol>

Like PayPal's `mode`, the webhook ID has no field in the admin:

```bash
wp eval '
$p = get_option("ambikly_settings_payments", []);
$p["paypal"]["webhook_id"] = "YOUR-WEBHOOK-ID";
update_option("ambikly_settings_payments", $p);
'
```

Verification is mandatory and fails closed. With no webhook ID stored, the endpoint answers HTTP 503 with `Webhook ID not configured` and nothing is processed. When it is stored, each event is verified by calling PayPal's own `verify-webhook-signature` API before anything is acted on; an unverified event is rejected with HTTP 400.

### Events handled

| Event | What Ambikly does |
|---|---|
| `PAYMENT.CAPTURE.COMPLETED` | Marks the order paid and records a `paid` transaction row if one does not already exist |
| `PAYMENT.CAPTURE.DENIED` | Moves the order to `failed`, releasing its stock |
| `PAYMENT.CAPTURE.DECLINED` | Same as denied |
| `PAYMENT.CAPTURE.REFUNDED` | Records a refund that already happened on PayPal's side |

Ambikly matches an event to an order through the `custom_id` it set on the purchase unit (`ambikly_order_{id}`), falling back to the stored PayPal order ID mapping. An event that matches no order is acknowledged and ignored.

## What gets recorded on the order

| When | What is written |
|---|---|
| At checkout | A transaction row with the gateway `paypal` and status `pending`, plus the order's payment method and title |
| At checkout | PayPal's order ID, in the option `ambikly_paypal_order_{order_id}` |
| On capture at the return endpoint | A transaction row with status `paid`, the capture ID and the full PayPal response |
| On `PAYMENT.CAPTURE.COMPLETED` | The same `paid` row, if the return endpoint did not already write one |
| On any successful settlement | An order note reading `Payment received ({capture id})` |
| On a decline | A status change to `failed`, restoring stock |

The two write paths both check for an existing `paid` row with the same capture ID first, so a capture confirmed by both the return trip and the webhook produces one row, not two.

## Testing in sandbox

Sandbox is the default, so testing needs no configuration change — only sandbox credentials.

<ol class="step-list">
  <li>In the PayPal Developer Dashboard, create a sandbox business account and a sandbox personal account under <strong>Testing Tools → Sandbox Accounts</strong>.</li>
  <li>Take the sandbox app's client ID and secret and save them on the Payments tab.</li>
  <li>Place an order on your storefront and approve it on PayPal's sandbox page using the personal account.</li>
  <li>Confirm the order reaches <code>processing</code> / <code>paid</code> and carries a <code>Payment received</code> note.</li>
  <li>Refund it from the admin to confirm the capture ID was recorded.</li>
</ol>

When the round trip works, follow [Switching PayPal to live](#switching-paypal-to-live) above. Registering the webhook is a separate step per environment — a sandbox webhook does not carry over to live.

## Refunds

Refund from the order screen; see [Refunds & cancellations](/refunds). Ambikly finds the most recent `paid` PayPal transaction row for the order, takes its capture ID, and posts a refund against it for the requested amount. Partial refunds work by passing a smaller amount. Your reason text is sent to PayPal as the note to payer.

A refund issued from PayPal's dashboard arrives as `PAYMENT.CAPTURE.REFUNDED` and is recorded locally without a second refund being sent.

`No PayPal capture found for this order.` means there is no `paid` transaction row — the order was never captured through the return endpoint or the webhook.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Payments succeed but no money arrives | `mode` is still `sandbox` | Set it to `live` and swap in live credentials |
| PayPal missing at checkout | Client ID or secret is empty, or the gateway is off | Save both credentials and enable the gateway |
| `PayPal is not configured.` | No access token could be obtained | Check the credentials match the mode; delete `ambikly_paypal_token` |
| `no access token` after switching mode | Sandbox credentials against the live host, or a stale cached token | Replace credentials, then `wp transient delete ambikly_paypal_token` |
| PayPal rejects the order creation | The amount breakdown did not balance | Check the order's subtotal, shipping, tax and total in the admin |
| `This PayPal order does not match the requested order.` | The return URL was tampered with or reused across orders | Expected behavior; have the customer check out again |
| HTTP 409 on return, order left unpaid | The captured amount differs from the order total | Check the PHP error log for the capture ID, then reconcile in PayPal manually |
| Webhook log shows 503 | No `webhook_id` stored | Set it with the snippet above |
| Webhook log shows 400 `Invalid signature` | The stored webhook ID belongs to a different webhook, or to the wrong environment | Copy the ID from the webhook you actually registered |
| Buyer canceled, order stuck `pending` | PayPal sends no cancellation event | Cancel the order from the Orders screen to release the stock |
| Refund fails with `No PayPal capture found for this order.` | No `paid` transaction row exists for the order | Confirm the return endpoint or `PAYMENT.CAPTURE.COMPLETED` ran for it |

## Settings reference

Four values make up a working PayPal configuration. Two have fields; two do not.

| Setting | Admin field | Default | Purpose |
|---|---|---|---|
| `client_id` | Yes, on the Payments tab | Empty | OAuth client ID |
| `client_secret` | Yes, on the Payments tab | Empty | OAuth secret. Masked on read |
| `mode` | **No** | `sandbox` | `live` or `sandbox`. Chooses the API host |
| `webhook_id` | **No** | Empty | Required before any webhook event is processed |

All four live under the `paypal` key of the `ambikly_settings_payments` option. To see the whole thing at once:

```bash
wp eval 'print_r(get_option("ambikly_settings_payments")["paypal"] ?? []);'
```

::: tip Check `mode` before every go-live
It is the single most common cause of "PayPal worked in testing but no money arrived". Make verifying it part of your [Go-live checklist](/go-live).
:::

## Differences from Stripe

| | PayPal | Stripe |
|---|---|---|
| Confirmed by | The buyer's return trip, captured server-side | A signed webhook |
| Works if the buyer closes the tab mid-payment | No — the order stays pending | Yes, once the session expiry event arrives |
| Abandonment is detectable | No event is sent | `checkout.session.expired` |
| Can charge a saved payment method later | No | Yes |
| Usable for subscriptions | No | Yes |
| Live/test switch in the admin | No — database only | Implied by which key you paste |
| Signature verification | Remote call to PayPal per event | Local HMAC over the raw body |

## Next

[Offline payment methods](/payments-offline) — the five gateways that take no credentials at all.
