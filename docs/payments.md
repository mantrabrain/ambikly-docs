---
title: Payments overview
description: All seven Ambikly payment gateways compared, how to enable and configure one, how credentials are masked, and why a subscription cart only offers Stripe.
prev:
  text: Cart & checkout
  link: /cart-checkout
next:
  text: Stripe
  link: /payments-stripe
---

# Payments overview

Ambikly ships seven payment gateways in the free core. Two are online gateways that move real money through a third party, and five are offline methods that record how the customer intends to pay. This page compares them, shows how to turn one on, and explains which gateway a customer actually sees at checkout.

## The seven gateways

| Gateway | ID | Default title at checkout | Refunds | Recurring | What it does at checkout | Resulting status |
|---|---|---|---|---|---|---|
| [Stripe](/payments-stripe) | `stripe` | Credit / Debit Card | Yes | Yes | Creates a Stripe Checkout Session and redirects the customer to it | `pending` / payment `pending`, then `processing` / `paid` on the webhook |
| [PayPal](/payments-paypal) | `paypal` | PayPal | Yes | No | Creates a PayPal Orders v2 order and redirects to the approval page | `pending` / payment `pending`, then `processing` / `paid` on capture |
| [Cash on Delivery](/payments-offline) | `cod` | Cash on Delivery | No | No | Places the order with nothing to collect now | `processing` / payment `pending` |
| [Direct Bank Transfer](/payments-offline) | `bank_transfer` | Direct Bank Transfer | No | No | Places the order and waits for the transfer | `on-hold` / payment `pending` |
| [Check Payments](/payments-offline) | `cheque` | Check Payments | No | No | Places the order and waits for the check | `on-hold` / payment `pending` |
| [Manual Payment](/payments-offline) | `manual` | Manual Payment | Yes | No | Marks the order paid immediately, with no verification | `processing` / payment `paid` |
| [Bill my company](/payments-offline) | `net_terms` | Bill my company | Yes | No | Reserves credit against the buyer's company and sets a due date | `processing` / payment `invoiced` |

"Recurring" means the gateway can charge a stored payment method off-session later, for a subscription renewal or a post-purchase upsell. Only Stripe can.

"Refunds" means the gateway can push a refund back through its own API from the Ambikly admin. Manual Payment reports success without contacting anything, and Bill my company releases the reserved company credit rather than moving money.

### What each gateway does after a successful payment

Marking an order paid is the same operation for every gateway, and it is guarded against duplicates so a retried webhook cannot double-fire it:

<ol class="step-list">
  <li>Payment status becomes <code>paid</code> and <code>total_paid</code> is set to the order total.</li>
  <li>An order still in <code>pending</code> or <code>on-hold</code> moves to <code>processing</code>.</li>
  <li>An order note records the gateway transaction ID.</li>
  <li>Download grants and license keys are issued.</li>
  <li>An order whose contents are entirely digital auto-completes; a mixed cart stays in <code>processing</code>.</li>
</ol>

Cash on delivery, bank transfer and check never reach this point on their own — the order is not paid, so you mark it paid from the order screen when the money arrives. See [Orders](/orders).

### What happens when a payment fails

A gateway that reports failure — a declined card, a rejected request, an ineligible net-terms account — takes the order down a single path: payment status becomes `failed`, the order status becomes `failed`, and the gateway's own message is recorded as the reason. Moving the order to `failed` is what restores the stock that was decremented when the order was created, so a declined payment does not quietly drain inventory.

The customer sees the gateway's message inline on the checkout form and their cart is untouched, so they can correct the problem and try again.

### Default descriptions

Each gateway ships with a description you can overwrite on the Payments tab.

| Gateway | Default description |
|---|---|
| Stripe | Pay securely via Stripe — cards, Apple Pay, Google Pay, Link. |
| PayPal | Pay with your PayPal balance, credit card, or local payment methods. |
| Cash on Delivery | Pay with cash when your order is delivered. |
| Direct Bank Transfer | Place your order and pay via bank transfer using the details we send you. |
| Check Payments | Mail us a check using the address provided on the order confirmation. |
| Manual Payment | Mark this order as paid immediately. Intended for admin / offline orders. |
| Bill my company | Invoice this order against your company's account, payable per your agreed terms. |

Because the Instructions field is never rendered, the Description is the only place where text you write reaches the customer at the moment they choose a payment method.

## Statuses a gateway can produce

Two separate fields track an order. The order status drives your workflow; the payment status tracks the money.

| Order status | Meaning |
|---|---|
| `pending` | Created, nothing settled yet. Redirect gateways sit here while the customer is away |
| `processing` | Live work to do — pack it, ship it, or collect on delivery |
| `on-hold` | Do not ship. Waiting for money that has to arrive by another route |
| `completed` | Finished. Digital-only orders reach this automatically once paid |
| `cancelled` | Called off. Stock is restored |
| `refunded` | Money returned |
| `failed` | The payment did not go through. Stock is restored |

| Payment status | Meaning |
|---|---|
| `pending` | Nothing collected yet |
| `paid` | Settled in full |
| `partially-paid` | Part of the total collected |
| `refunded` | Fully refunded |
| `partially-refunded` | Part of the total returned |
| `failed` | The gateway declined or errored |
| `invoiced` | Net terms — billed to a company account, not yet collected |

## Transaction records

Every checkout writes a transaction row against the order, whatever the outcome. The row carries the gateway ID, the gateway's own transaction reference, the status the gateway reported, the amount, the currency, and the raw gateway response.

These rows are more than an audit trail — they are load-bearing. A refund looks up the most recent `paid` row for the order to find the charge to reverse, and Stripe's card-on-file recharge reads the same row to recover the saved customer and payment-method IDs. A gateway that never produced a `paid` row cannot be refunded from the admin.

For an in-process gateway the row is written at checkout with its final status. For Stripe and PayPal the checkout row is written as `pending`, and a second `paid` row is added when the webhook or the return handler confirms the money. Both write paths check for an existing `paid` row with the same transaction reference first, so a retried webhook delivery does not duplicate it.

## Enabling a gateway

Gateways live on their own settings tab.

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Settings → Payment Settings</span>. Every registered gateway is listed as a card with its title, description, an <strong>ACTIVE</strong> or <strong>DISABLED</strong> pill, and a "Supports refunds" badge where it applies.</li>
  <li>Flip the toggle on the right of the row to enable the gateway.</li>
  <li>Click <strong>Configure</strong> to expand the settings panel.</li>
  <li>For Stripe and PayPal, enter the API credentials. The other five take no credentials.</li>
  <li>Adjust the customer-facing title, description and instructions if you want to.</li>
  <li>Click <strong>Save Gateway</strong>. Changes take effect only after saving — the toggle alone does nothing until you save the card.</li>
</ol>

Each gateway is saved separately. There is no single "save all" on this tab.

### The per-gateway fields

| Field | Type | What it does |
|---|---|---|
| Enabled | Toggle | Whether the gateway is offered at all |
| Title shown at checkout | Text | Replaces the gateway's default title in the payment method list |
| Description | Text | Shown under the title in the payment method list |
| Instructions | Textarea | Stored against the gateway |
| Credentials | Text / password | Stripe and PayPal only — see each gateway's page |

::: warning The Instructions field is stored but never displayed
The field's help text says instructions appear on the thank-you page and in the order email. Nothing in the free core reads the stored value, so entering bank details there has no effect on what a customer sees. Put payment instructions in the gateway **Description**, which is rendered in the checkout payment list, or in your order notification email template — see [Emails](/emails).
:::

### Availability is more than the toggle

Being enabled is necessary but not always sufficient. Each gateway decides for itself whether it is usable right now:

| Gateway | Additional requirement |
|---|---|
| Stripe | A non-empty secret key must be saved, or the gateway is hidden |
| PayPal | Both a client ID and a client secret must be saved |
| Manual Payment | The current user must be logged in and hold `ambikly_manage_store` (or `manage_options`) |
| Bill my company | The buyer must be on an active company account with net terms turned on and credit remaining |

The rest are offered whenever they are enabled.

If no gateway passes, the checkout page shows: `No payment methods are enabled. Enable one in admin → Settings → Payments.`

## How credentials are masked

API keys never leave the server in readable form after they are saved.

- When the Payments tab loads, every stored credential is masked to bullet characters with only the **last four characters** visible, so you can tell which key is configured without exposing it. A value of eight characters or fewer is masked completely.
- The same masking is applied to the response of a save, so the write path leaks nothing either.
- When you save a card without retyping a credential, the form sends the mask back. Ambikly recognizes a value that exactly matches the mask of the stored value as "untouched" and keeps the real secret, rather than overwriting it with bullets.

The practical consequence: **you can safely edit a gateway's title or description without re-entering its keys**. To change a key, type the new value in full.

::: tip Some gateway options have no field on this screen
Stripe's webhook signing secret and manual-capture flag, and PayPal's live/sandbox mode and webhook ID, are all read from the stored settings but have no input on the Payments tab. Each gateway's page shows how to set them.
:::

## Subscriptions filter the list

A cart containing at least one subscription-billed product is only offered gateways that can charge a renewal off-session. A subscription taken on a gateway that cannot recur is guaranteed to fail its first renewal and every one after it, so Ambikly refuses to create that situation.

Only Stripe declares recurring support, so in practice a subscription cart shows Stripe and nothing else. If Stripe is not configured, such a cart has no payment method at all.

This is enforced in two places: `GET /checkout/options` filters the offered list, and the checkout endpoint re-checks it on submission. A request that skips the options call and posts a spoofed payment method is still refused.

Company eligibility for **Bill my company** is re-checked the same way, against the real logged-in user rather than whatever list the browser was shown.

## Gateway settings storage

All gateway settings live in a single WordPress option, `ambikly_settings_payments`, keyed by gateway ID. Within a gateway, `enabled`, `title`, `description` and `instructions` sit at the top level, and the credential fields sit under a nested `credentials` key. Gateways read their credentials flat, so both shapes resolve.

Two REST routes back the screen, both restricted to administrators:

| Method | Route | Notes |
|---|---|---|
| GET | `/payments/gateways` | Every registered gateway with its masked settings |
| POST | `/payments/gateways/{id}` | Save one gateway |

## Adding your own gateway

A third-party gateway registers through a filter:

```php
add_filter('ambikly_payment_gateways', function ($gateways) {
    $gateways[] = new My_Gateway();
    return $gateways;
});
```

The class must extend `Ambikly\Payments\PaymentGateway` and implement `process()`. Registered gateways appear on the Payments tab automatically, with the same Enabled / Title / Description / Instructions fields.

What `process()` returns is what tells Ambikly how to update the order:

| Return | Effect |
|---|---|
| `PaymentResult::paid($transactionId)` | The order is marked paid, the cart is cleared, and the completion action fires |
| `PaymentResult::pending($message)` | The order is left in whatever state the gateway set, the cart is cleared, and the completion action fires |
| `PaymentResult::redirect($url)` | The browser is sent to `$url`. The cart is **not** cleared and no completion action fires — the gateway's own return or webhook handler confirms the payment later |
| `PaymentResult::failed($message)` | The order is moved to `failed`, its stock is restored, and `$message` is shown to the customer |

A gateway that stores a reusable payment method can also override `chargeRenewal()` for subscription renewals and `chargeAdditional()` for post-purchase upsells, and set `supportsRecurring` so subscription carts will offer it. The base class fails both by default. See [Payment gateway API](/developers/payment-gateways).

## Choosing what to enable

| Situation | Enable |
|---|---|
| Any store taking cards | Stripe |
| Customers who expect a PayPal button | PayPal, alongside Stripe |
| Selling subscriptions | Stripe — nothing else can renew |
| Offering post-purchase upsells | Stripe — nothing else can re-charge a saved card |
| Local delivery with collection on the doorstep | Cash on Delivery |
| Higher-value or B2B orders where card fees hurt | Direct Bank Transfer |
| Staff entering orders paid elsewhere | Manual Payment, which customers never see |
| Trade customers on account | Bill my company |

Enabling more methods is not free: every extra option is another decision at checkout. Two online methods plus at most one offline method covers most stores.

## Where to go next

- [Stripe](/payments-stripe) — keys, the Checkout Session flow, the webhook, refunds
- [PayPal](/payments-paypal) — Orders v2, the return URL, and the sandbox limitation you must know about
- [Offline payment methods](/payments-offline) — the five methods that take no credentials
