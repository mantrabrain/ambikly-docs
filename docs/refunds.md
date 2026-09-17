---
title: Refunds & cancellations
description: Full and partial refunds, which gateways return money, what happens to stock and customer totals, recording a net-terms invoice payment, and when cancelling restores stock.
prev:
  text: "Orders"
  link: /orders
next:
  text: "Invoices & packing slips"
  link: /invoices
---

# Refunds & cancellations

Two different things are often called "refunding an order": returning money to a customer, and closing out an order that never completed. Ambikly treats them separately, and a third operation — recording a net-terms invoice payment — looks superficially similar but must never go through the refund path.

## Issuing a refund

<ol class="step-list">
  <li>Open the order from <span class="screen-path">Ambikly → Orders</span>.</li>
  <li>Click <strong>Refund</strong> in the header. The button is disabled when there is nothing left to refund.</li>
  <li>Enter an amount. The dialog shows the remaining refundable balance and refuses anything above it.</li>
  <li>Optionally enter a reason. It is stored on the refund record and written into the order note.</li>
  <li>Click <strong>Refund</strong>.</li>
</ol>

The refundable balance is `total` minus `total_refunded`. A refund of zero, a negative amount, or anything that would push `total_refunded` past `total` is rejected with an "Invalid refund amount" error.

<div class="ui-warn"><strong>Careful:</strong> A refund cannot be undone from the admin. It charges the money back through the gateway that took it, where supported.</div>

## Full versus partial refunds

There is one refund operation; whether it is "full" or "partial" is decided by the resulting total.

| Outcome | Condition | Effect on the order |
|---|---|---|
| Partial refund | `total_refunded` is still below `total` | `payment_status` becomes `partially-refunded`. The order status is untouched. Stock is **not** restored. |
| Full refund | `total_refunded` reaches `total` | `payment_status` becomes `refunded` **and** `status` becomes `refunded`. Stock is restored. Any license keys issued by the order are revoked. |

A full refund can be reached in one go, or by several partial refunds that add up. The moment the running total reaches the order total, the full-refund consequences fire.

Line-level refunds do not exist in the free core. You refund an amount, not specific items, which is why a partial refund cannot know which stock to put back.

## What each gateway does

The refund is pushed to the gateway that took the payment, when that gateway supports it. Four of the seven gateways do.

| Gateway | `payment_method` | Refund support | What happens on refund |
|---|---|---|---|
| Stripe | `stripe` | Yes | Looks up the latest paid payment intent for the order, then calls Stripe's refunds API for the amount in minor units. The reason is passed through, defaulting to `requested_by_customer`. |
| PayPal | `paypal` | Yes | Looks up the latest paid capture for the order, then calls PayPal's capture-refund API for the amount in the order's currency. The reason becomes the note to payer. |
| Net Terms | `net_terms` | Yes | No money moves — none ever did. Releases the refunded amount back onto the company's credit line. |
| Manual Payment | `manual` | Yes | Returns success without calling anything. The refund is recorded locally only. |
| Cash on Delivery | `cod` | No | No gateway call. The refund is recorded locally; you return the cash yourself. |
| Direct Bank Transfer | `bank_transfer` | No | No gateway call. Send the money back through your bank yourself. |
| Check Payments | `cheque` | No | No gateway call. |

When a supporting gateway declines the refund, nothing is recorded: the reservation against `total_refunded` is released and the error message from the gateway is surfaced in the admin. You will not end up with a local refund record for money that never moved.

### Refunds issued from the gateway's own dashboard

If you refund a charge directly in Stripe or PayPal rather than in Ambikly, their webhook records that refund locally without placing a second refund request against the same charge. Everything below — the refund record, `total_refunded`, stock, the note — still happens; only the outbound gateway call is skipped.

## Concurrency

The amount is claimed against `total_refunded` with a single conditional database update before the gateway is called. Two simultaneous refund requests for the same order — a double-clicked button, a retried request — cannot both pass the balance check and both charge the gateway. The Refund button in the admin is also disabled while a refund is in flight.

## The refund record

Each refund inserts a row into `ambikly_refunds`:

| Field | What it holds |
|---|---|
| `order_id` | The order this refund belongs to. |
| `amount` | The refunded amount. |
| `reason` | The reason you typed, sanitized. |
| `refunded_by` | The WordPress user id of whoever issued it, when there is one. |
| `status` | Always `completed`. |
| `gateway_refund_id` | The gateway's own refund id, when the gateway returned one. |
| `created_at` | Site-local timestamp. |

The order's own `total_refunded` column carries the running total and is what the admin, the invoice and the reports all read.

## What a refund does to everything else

**Stock.** Restored only on a full refund, and only once per order — the same guard the cancel path uses. Digital line items are skipped.

**License keys.** Revoked on a full refund, with a note recording how many. Without this a refunded customer would keep working, activatable software.

**Customer totals.** The Customers list and the customer record compute lifetime spend live as the sum of `total` minus `total_refunded` across all orders that are not cancelled or failed. A refund therefore reduces a customer's total spend immediately — there is nothing to recompute by hand. See [Customers](/customers).

**Reports.** Net sales subtract `total_refunded`. Gross sales do not. A fully refunded order still counts as an order and still counts its customer, because the sale genuinely happened. See [Reports](/reports).

**The invoice.** A "Refunded" line appears on the invoice whenever `total_refunded` is above zero.

**Hooks.** `ambikly_order_refunded` fires with the order and the refund record.

::: warning No refund email exists
The free core has exactly four editable transactional emails: order notification and order status change, each to the customer and to the admin. There is **no refund-notification email**. Issuing a refund does not email the customer anything. If the refund also drove the order to `refunded` status, the order-status-change email goes out — but it is a generic status email, not a refund notice. See [Emails](/emails).
:::

## Recording a net-terms invoice payment

This is the opposite of a refund and must never be done through the refund path.

A B2B order placed with "Bill my company" reserves credit against the company's limit at checkout and sits at `payment_status: invoiced` until the customer pays the invoice off-platform — by wire, check or ACH. When that money arrives, you record it.

<ol class="step-list">
  <li>Open the order. The <strong>Record Payment</strong> button appears only for a net-terms order still in the <code>invoiced</code> payment status.</li>
  <li>Confirm the dialog. It states the amount and warns that the action releases the company's reserved credit.</li>
</ol>

Behind the button is `POST /ambikly/v1/orders/{id}/record-payment`. It:

1. Verifies the order really is a net-terms invoice with a linked company. Anything else is rejected outright.
2. Claims the pending-to-paid transition atomically.
3. Releases the order's total back onto the company's credit line, tied to that same atomic claim so a double-submitted click cannot release credit twice.
4. Marks the order paid, sets `total_paid`, writes a payment-received note, and fires `ambikly_order_paid`.

<div class="ui-warn"><strong>Careful:</strong> Refunding a net-terms order and recording its payment both release company credit, but they mean opposite things. A refund records the order as refunded and cancels the sale. Record Payment records that the customer paid. Using the refund path to close out a paid invoice would wrongly mark a completed B2B sale as refunded and corrupt your revenue reporting.</div>

Full details of credit lines and terms are in [B2B companies & Net Terms](/b2b-companies).

## Cancellations

Cancelling is a status change, not a money movement. Pick **Cancelled** from the status dropdown on the order.

### When cancelling restores stock

Stock is restored when the order moves from `pending`, `processing`, `on-hold` or `completed` into `cancelled` or `failed`. It is restored once per order and the fact is recorded on the order, so repeated transitions cannot inflate inventory. Digital items are skipped, and a system note records the restoration.

Cancelling an order that was already cancelled, or already had its stock restored by a full refund, does nothing further to inventory.

### Cancelling a net-terms order

An unpaid net-terms order releases its full reserved credit back to the company when it is cancelled or failed. A net-terms order that was already paid does not — at that point money has genuinely been received and the correct operation is a refund, which releases the credit through the gateway's own refund handler.

### Cancelled versus refunded

| | Cancelled | Refunded |
|---|---|---|
| Money moves | No | Yes, when the gateway supports it |
| Stock restored | Yes | Only on a full refund |
| Counts in reports | No — excluded from revenue entirely | Yes, gross; netted out of net sales |
| Counts toward customer lifetime spend | No | Yes, minus the refunded amount |
| Refund record created | No | Yes |

Cancel an order that never really happened. Refund an order where the customer paid and is getting their money back.

## Deleting instead of cancelling

Deleting an order restores its stock and releases net-terms credit first, then removes the order and all its child rows. The order disappears from reports entirely. Prefer cancelling: it keeps the audit trail.

## Choosing the right action

| Situation | What to do |
|---|---|
| Customer paid and wants their money back | Refund |
| Customer paid for three items and is returning one | Refund the value of that one item, then adjust stock by hand — a partial refund does not restore stock |
| Customer never paid and no longer wants the order | Cancel |
| Payment was attempted and the gateway declined | Set the status to Failed, or leave it — stock is restored either way |
| B2B invoice has been paid by wire or check | Record Payment, never Refund |
| B2B order placed in error, invoice not yet paid | Cancel — this releases the reserved credit |
| Duplicate order created by a double-submitted checkout | Cancel the duplicate. Refund it instead if the customer was charged twice |
| Test order cluttering your reports | Cancel it. Cancelled orders are excluded from revenue entirely |

## What the customer sees

Nothing is sent to the customer by the refund itself. What they may see:

- **An email, but only indirectly.** A full refund drives the order to `refunded` status, and that status change sends the order-status-change email if it is enabled. A partial refund changes no status and therefore sends nothing at all.
- **Their account page.** The order's status on the storefront Orders tab reflects the new status. See [Customers](/customers).
- **The invoice.** Re-opening the invoice link shows a Refunded line and an updated payment-status pill. The link itself is unchanged — invoice tokens are deterministic. See [Invoices & packing slips](/invoices).
- **The gateway's own notification.** Stripe and PayPal email their own refund receipts, depending on how your account is configured there.

If you want the customer told, send it yourself and add a customer-visible order note recording that you did.

## Troubleshooting

| Error or symptom | Cause |
|---|---|
| "Invalid refund amount." | The amount is zero, negative, or larger than `total` minus `total_refunded`. It is also returned when a concurrent refund claimed the balance first. |
| "No paid Stripe charge found for this order." | No transaction row for this order has `payment_method` of `stripe` and a status of `paid`. The order was probably paid by another method, or its payment never completed. |
| "No PayPal capture found for this order." | The same, for PayPal — no paid capture is recorded against the order. |
| "The payment gateway declined this refund. No refund was recorded." | The gateway rejected the request. Nothing was written locally, so the order is unchanged. Check the gateway's own dashboard for the reason. |
| "This order is not a net-terms invoice." | Record Payment was called on an order whose `payment_method` is not `net_terms`, or which has no linked company. |
| The Refund button is disabled | `total_refunded` already equals `total`. There is nothing left to refund. |
| Refund succeeded but stock did not come back | Expected for a partial refund. Stock is restored only on a full refund. |
| Refund succeeded but the company's credit did not free up | Check that the order's `payment_method` really is `net_terms` and that it has a `company_id`. |

The gateway transaction id used for a Stripe or PayPal refund comes from the most recent `paid` row in `ambikly_order_transactions` for that order and method. If an order was paid outside the normal flow and has no transaction row, the gateway refund cannot be placed and you will need to refund from the gateway's own dashboard — the webhook then records it locally.

See also [Troubleshooting](/troubleshooting).

## For developers

| Method | Route | Permission |
|---|---|---|
| POST | `/ambikly/v1/orders/{id}/refund` | `ambikly_manage_store` |
| POST | `/ambikly/v1/orders/{id}/record-payment` | `ambikly_manage_store` |

The refund endpoint takes `amount` and an optional `reason`, and returns the refund record alongside the updated order. The record-payment endpoint takes an optional `reference`; when omitted a reference of `net_terms_{order id}` is generated.

Both refuse with a 400 and a readable message rather than a partial write. See [Endpoint reference](/developers/endpoints) and [Hooks & filters](/developers/hooks).

## Where to go next

- [Orders](/orders) — the status vocabulary and what each transition triggers.
- [Invoices & packing slips](/invoices) — the refunded line on a printed invoice.
- [B2B companies & Net Terms](/b2b-companies) — credit reservation and release in full.
- [Reports](/reports) — how refunds move gross and net sales.
