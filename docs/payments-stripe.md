---
title: Stripe
description: Configure Stripe in Ambikly — API keys, the Checkout Session redirect, the signed webhook that confirms the order, refunds, saved cards, and common failures.
prev:
  text: Payments overview
  link: /payments
next:
  text: PayPal
  link: /payments-paypal
---

# Stripe

Stripe is the card gateway that ships in the free core. It uses Stripe Checkout: the customer is redirected to a Stripe-hosted page, pays there, and the order is confirmed by a signed webhook coming back to your site. Stripe is the only Ambikly gateway that can charge a saved card later, which makes it the only gateway usable for subscriptions and post-purchase upsells.

## Before you start

You need a Stripe account and its API keys. The webhook is not optional: without it, a paid order never leaves `pending`.

## Getting your keys

<ol class="step-list">
  <li>Sign in to the Stripe Dashboard.</li>
  <li>Open <strong>Developers → API keys</strong>.</li>
  <li>Copy the <strong>Publishable key</strong> (<code>pk_live_…</code> or <code>pk_test_…</code>).</li>
  <li>Reveal and copy the <strong>Secret key</strong> (<code>sk_live_…</code> or <code>sk_test_…</code>). Stripe shows a live secret key once — store it somewhere safe.</li>
</ol>

Test keys point at Stripe's test mode and live keys at real money. Ambikly has no separate mode switch of its own: **which key you paste is what decides whether real money moves.**

## Entering the keys

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Settings → Payment Settings</span>.</li>
  <li>Toggle <strong>Credit / Debit Card</strong> on.</li>
  <li>Click <strong>Configure</strong>.</li>
  <li>Paste the publishable key and the secret key.</li>
  <li>Adjust the title and description if you want. The defaults are "Credit / Debit Card" and "Pay securely via Stripe — cards, Apple Pay, Google Pay, Link."</li>
  <li>Click <strong>Save Gateway</strong>.</li>
</ol>

| Field | Required | Notes |
|---|---|---|
| Publishable key | No | Stored, but the free core never sends it anywhere — Stripe Checkout is server-initiated |
| Secret key | Yes | Used for every API call. Stripe is hidden at checkout until this is non-empty |

Saved keys come back masked, showing only their last four characters. Saving the card again without retyping a key keeps the stored value — see [Payments overview](/payments).

::: warning There is no capture-mode field
Stripe supports authorizing a card now and capturing the funds later. Ambikly requests **automatic** capture unless a `capture_manual` flag is set in the stored settings, and that flag has no input anywhere in the admin. Nothing in the free core calls Stripe's capture endpoint either, so an order authorized manually would be fulfilled while the money was never collected. Treat capture as always automatic.
:::

## What the customer experiences

<ol class="step-list">
  <li>The customer picks <strong>Credit / Debit Card</strong> and places the order.</li>
  <li>Ambikly creates the order in <code>pending</code> and builds a Stripe Checkout Session from it.</li>
  <li>The browser is redirected to the Stripe-hosted checkout page, where the customer pays with a card, Apple Pay, Google Pay or Link depending on what your Stripe account has enabled.</li>
  <li>Stripe returns the customer to your thank-you page, and separately sends a signed webhook event to your site.</li>
  <li>The webhook is what marks the order paid, issues downloads and licenses, and sends the confirmation email.</li>
</ol>

The cart is deliberately not cleared when the redirect starts — only once a genuinely paid order reaches the thank-you page. A customer who abandons the Stripe page still has their cart.

### How the Checkout Session is built

| Part of the session | Value |
|---|---|
| Mode | `payment` |
| Line items | One per order item, at its unit price and quantity |
| Shipping | Added as its own line item, titled with the shipping method, when the shipping total is above zero |
| Tax | Added as its own line item titled "Tax", when the tax total is above zero |
| Discounts | A one-time Stripe coupon for the gap between those lines and the order total |
| Customer email | The billing email, pre-filled on the Stripe page |
| Metadata | `ambikly_order_id` and `ambikly_order_number`, on both the session and the payment intent |
| Success URL | Your thank-you page with `order_id` and Stripe's session ID |
| Cancel URL | Your cart page |

The discount is computed as the difference between the reconstructed line total and the order total rather than from the coupon discount alone. That way gift cards, store credit and any other adjustment that lowers the order total are reflected in what Stripe charges. If Stripe rejects the coupon creation, the checkout fails with `Unable to apply this order's discount at checkout. Please try again or contact support.` rather than charging the undiscounted amount.

The Checkout Session ID is stored in a WordPress option named `ambikly_stripe_session_{order_id}`.

### Saved cards

Every Checkout Session requests `setup_future_usage: off_session` on its payment intent. This asks Stripe to save the payment method against a customer so it can be charged again without the customer present. Ambikly stores the resulting Stripe customer ID and payment method ID when the webhook arrives, which is what makes two things possible:

- **Subscription renewals**, charged off-session by the Pro Subscriptions add-on. The free core never schedules a renewal by itself.
- **Post-purchase upsells**, which re-charge the card on file instead of running a second checkout.

This is requested on every order, not only subscription orders, so an upsell offered after a one-off purchase still has a card to charge.

### Pinned API version

Every request sends `Stripe-Version: 2024-06-20`. Pinning means a Stripe API upgrade cannot change response shapes under you. Requests time out after 20 seconds.

## Registering the webhook

The order is confirmed by the webhook, not by the customer's return trip. Register the endpoint before taking a live payment.

**Endpoint URL:**

```
https://yourstore.example/wp-json/ambikly/v1/stripe/webhook
```

<ol class="step-list">
  <li>In the Stripe Dashboard open <strong>Developers → Webhooks</strong> and click <strong>Add endpoint</strong>.</li>
  <li>Paste the URL above, substituting your own domain.</li>
  <li>Select the events listed in the table below.</li>
  <li>Save, then copy the endpoint's <strong>Signing secret</strong> (<code>whsec_…</code>).</li>
  <li>Store that secret as <code>webhook_secret</code> on the Stripe gateway settings — see below.</li>
</ol>

### Events to subscribe to

| Event | What Ambikly does |
|---|---|
| `checkout.session.completed` | Marks paid, but only when the session's own payment status is already `paid` |
| `payment_intent.succeeded` | Marks paid, records the paid transaction row, and stores the customer and payment method IDs |
| `payment_intent.payment_failed` | Moves the order to `failed`, releasing its stock |
| `checkout.session.async_payment_succeeded` | Marks paid for delayed methods (ACH, SEPA, Klarna) |
| `checkout.session.async_payment_failed` | Fails the order if it is not already paid |
| `checkout.session.expired` | Fails an abandoned session's order, releasing its stock |
| `charge.refunded` | Records a refund that was issued on Stripe's side |

`payment_intent.succeeded` is the important one. It is the only event that carries the customer and payment-method IDs, and the only one that writes the `paid` transaction row that refunds and card-on-file recharges look up. **Subscribe to it even if you subscribe to nothing else.**

A completed session whose payment status is not yet `paid` is deliberately ignored: for ACH, SEPA and Klarna the debit is still in flight at that moment, and confirming it would mark the order fulfillable before the money moved.

### Setting the webhook secret

The signing secret has no field on the Payments tab. It is read from `webhook_secret` at the top level of the Stripe gateway's stored settings. Set it once with WP-CLI:

```bash
wp eval '
$p = get_option("ambikly_settings_payments", []);
$p["stripe"]["webhook_secret"] = "whsec_your_secret_here";
update_option("ambikly_settings_payments", $p);
'
```

Signature verification is mandatory and fails closed. With no secret stored, the endpoint answers every request with HTTP 503 and `Webhook secret not configured`, and no order is ever marked paid. Verification is Stripe's v1 scheme — an HMAC-SHA256 over the timestamp and the raw body — with a five-minute timestamp tolerance.

## What gets recorded on the order

| When | What is written |
|---|---|
| At checkout | A transaction row with the gateway `stripe` and status `pending`, plus the order's own payment method and title |
| At checkout | The Checkout Session ID, in the option `ambikly_stripe_session_{order_id}` |
| On `payment_intent.succeeded` | A transaction row with status `paid`, the payment intent ID, and the full Stripe response — including the customer and payment-method IDs |
| On any successful settlement | An order note reading `Payment received (pi_…)` |
| On `payment_intent.succeeded` | The Stripe customer and payment-method IDs copied onto any subscription tied to the order |
| On failure or expiry | A status change to `failed` with the reason as the note, restoring stock |

If the order's notes show no `Payment received` line, Stripe never confirmed the payment to your site — go straight to the webhook rows in the troubleshooting table.

## Currency

The Checkout Session is created in the order's own currency, which is the store currency at the time the cart was created. Amounts are sent to Stripe in the smallest currency unit, rounded from the order's two-decimal values. Your Stripe account must support the currency you sell in — Stripe rejects the session outright otherwise, and the checkout fails with Stripe's own message.

## Refunds

Refund from the order screen; see [Refunds & cancellations](/refunds). Ambikly looks up the most recent `paid` Stripe transaction row for the order, takes its payment intent ID, and posts a refund to Stripe for the requested amount. Partial refunds are supported by passing a smaller amount. If no reason is given, Stripe records `requested_by_customer`.

A refund issued from the Stripe Dashboard instead arrives as `charge.refunded` and is recorded locally without a second refund being sent — the refund is not duplicated.

If the refund fails, the message is Stripe's own. The one message that is Ambikly's is `No paid Stripe charge found for this order.`, which means no `paid` transaction row exists — see the troubleshooting table.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Stripe does not appear at checkout | No secret key saved, or the gateway toggle is off | Save a secret key and enable the gateway |
| `Stripe is not configured.` on submit | The secret key is empty when `process()` runs | Re-enter the secret key and save |
| Orders stay `pending` after a successful payment | The webhook is not registered, or points at the wrong URL | Register `/wp-json/ambikly/v1/stripe/webhook` and check Stripe's delivery log |
| Stripe's webhook log shows 503 | No `webhook_secret` stored | Set it with the WP-CLI snippet above |
| Stripe's webhook log shows 400 `Invalid signature` | Wrong secret, or the endpoint's secret was rotated | Copy the signing secret again from the endpoint in Stripe |
| Webhooks arrive but nothing changes | The event's metadata has no `ambikly_order_id` | Only sessions Ambikly created carry it; a manual Stripe payment will not match an order |
| Refund fails with `No paid Stripe charge found for this order.` | `payment_intent.succeeded` is not subscribed, so no `paid` row was ever written | Add that event in Stripe; it cannot be backfilled for past orders |
| `Unable to apply this order's discount at checkout.` | Stripe rejected the one-time coupon, usually a key or currency problem | Check the Stripe logs for the `/v1/coupons` call |
| Customer abandons the Stripe page and the order sits `pending` | Stripe has not expired the session yet | Subscribe to `checkout.session.expired`; the order fails and stock is released when it fires |
| Stock looks wrong after failed payments | Stock is decremented at order creation and restored when the order fails | Confirm the failure events above are subscribed |
| Subscription renewals fail with `No saved payment method to charge.` | The customer and payment-method IDs were never captured | `payment_intent.succeeded` must be subscribed at the time of the original order |

::: tip Test with Stripe test keys first
Paste test keys, register a second webhook endpoint against the same URL from Stripe's test mode, and place a real order with a test card. Watch the Stripe webhook delivery log and the order's notes together — the note `Payment received (pi_…)` is written the moment the webhook lands.
:::

### Going-live checklist

<ol class="step-list">
  <li>Swap the test keys for live keys on <span class="screen-path">Ambikly → Settings → Payment Settings</span> and save.</li>
  <li>Register a webhook endpoint in Stripe's <strong>live</strong> mode — a test-mode endpoint does not carry over — and subscribe to the seven events above.</li>
  <li>Store that live endpoint's signing secret as <code>webhook_secret</code>, replacing the test one.</li>
  <li>Place one small real order and confirm the order reaches <code>processing</code> / <code>paid</code> on its own.</li>
  <li>Refund that order from the admin and confirm it succeeds — this is the fastest way to prove the <code>paid</code> transaction row was written.</li>
</ol>

The general go-live steps are in the [Go-live checklist](/go-live).

## What Stripe does not do here

- **No embedded card form.** Ambikly uses Stripe's hosted Checkout page, so the card is never entered on your domain. The publishable key is stored but never used, because nothing client-side talks to Stripe.
- **No manual capture.** See the warning above.
- **No Stripe Tax.** Tax is calculated by Ambikly from your own rate table and sent to Stripe as a line item. See [Tax](/tax).
- **No saved-card management for customers.** Cards are saved against the Stripe customer for renewals and upsells, but there is no storefront screen where a customer can view or remove them.
- **No renewals in the free core.** The off-session charging code ships in free, but nothing schedules a renewal unless the Pro Subscriptions add-on is active. See [Subscriptions](/addons/subscriptions).

## Next

[PayPal](/payments-paypal) — including a sandbox limitation that will stop you taking real money until you fix it.
