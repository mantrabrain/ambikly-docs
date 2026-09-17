---
title: Offline payment methods
description: Cash on delivery, bank transfer, check, manual payment and company net terms — what each is for, its settings, and the order status it produces.
prev:
  text: PayPal
  link: /payments-paypal
next:
  text: Shipping
  link: /shipping
---

# Offline payment methods

Five of Ambikly's seven gateways take no API credentials and move no money at checkout. They record how the customer intends to pay and set the order into the right state for you to follow up. This page covers all five.

## At a glance

| Method | ID | Default title | Order status | Payment status | Refunds |
|---|---|---|---|---|---|
| Cash on Delivery | `cod` | Cash on Delivery | `processing` | `pending` | No |
| Direct Bank Transfer | `bank_transfer` | Direct Bank Transfer | `on-hold` | `pending` | No |
| Check Payments | `cheque` | Check Payments | `on-hold` | `pending` | No |
| Manual Payment | `manual` | Manual Payment | `processing` | `paid` | Yes |
| Bill my company | `net_terms` | Bill my company | `processing` | `invoiced` | Yes |

The difference between `processing` and `on-hold` matters: `processing` means "start working on this", and `on-hold` means "do not ship yet". Cash on delivery goes to `processing` because you are expected to dispatch and collect on arrival. Bank transfer and check go to `on-hold` because you should wait for the money.

None of `cod`, `bank_transfer` or `cheque` ever reaches paid on its own. When the money arrives, open the order and record the payment there — see [Orders](/orders).

## Shared settings

All five share the same four fields in <span class="screen-path">Ambikly → Settings → Payment Settings</span>:

| Field | What it does | Default |
|---|---|---|
| Enabled | Whether the method is offered at checkout | `cod` is enabled on a fresh install; the rest are off |
| Title shown at checkout | Replaces the method's default title | The default title in the table above |
| Description | Shown under the title in the checkout payment list | The default description for each method |
| Instructions | Stored against the gateway | Empty |

::: warning Instructions are stored but never shown
The Instructions field's help text promises the text appears on the thank-you page and in the order email. Nothing in the free core reads it. To give a customer bank details or a mailing address, put them in the **Description** — which is rendered in the checkout payment list — or in your order notification email template. See [Emails](/emails).
:::

None of these methods takes credentials, so the Configure panel shows no key fields for them.

To change any of the four, go to <span class="screen-path">Ambikly → Settings → Payment Settings</span>, toggle the method on, click **Configure**, edit the fields, and click **Save Gateway**. Each card saves independently.

### None of them redirects

All five settle inside the checkout request. There is no external page, no return trip and no webhook, which has two consequences worth knowing:

- The customer's cart is cleared immediately and they land straight on the thank-you page, carrying the signed key that authorizes them to see their order summary.
- The `ambikly_checkout_completed` action fires at checkout time with a real payment result, not later from the thank-you page. Integrations built against these methods always receive both arguments.

## Cash on Delivery

**What it is for.** Local delivery and courier services where the driver collects payment on the doorstep. Also used for pick-up-and-pay-in-store arrangements.

**Default description.** "Pay with cash when your order is delivered."

**What happens.** The order is placed and moved straight to `processing` with payment still `pending`. There is no redirect and no external call — placing the order is the whole interaction, so the cart is cleared and the customer goes directly to the thank-you page.

**When to use it.** Only where you can actually collect. There is no verification of any kind: any visitor can place a cash-on-delivery order, so restrict what you are prepared to dispatch unpaid, and watch your abandoned-collection rate.

**Settling it.** Record the payment on the order when the driver reports back. That marks it paid, issues any downloads, and fires the same completion hooks every other gateway uses.

## Direct Bank Transfer

**What it is for.** Invoice-style payment by wire, ACH or SEPA where the customer pushes the money to you.

**Default description.** "Place your order and pay via bank transfer using the details we send you."

**What happens.** The order goes to `on-hold` with payment `pending`, so it does not appear in your fulfillment queue. The customer is returned to the thank-you page with the message `Order placed. Bank transfer instructions will be emailed.`

**When to use it.** B2B and higher-value orders where card fees matter, or markets where transfers are the norm. It suits stores that can afford a day or two of settlement lag before shipping.

**Getting your bank details to the customer.** Because the Instructions field is not rendered anywhere, put the account details in the gateway **Description** so they show in the checkout payment list, and repeat them in the order notification email template.

**Settling it.** Reconcile against your bank statement, then record the payment on the order. That moves it from `on-hold` to `processing`.

## Check Payments

**What it is for.** Mailed checks. Functionally identical to bank transfer, with different wording.

**Default description.** "Mail us a check using the address provided on the order confirmation."

**What happens.** The order goes to `on-hold` with payment `pending`, and the customer sees `Order received. Awaiting cheque payment.`

**When to use it.** Markets and customer segments — schools, municipalities, some B2B accounts — where checks are still standard. Expect a longer hold.

**Settling it.** Record the payment once the check has cleared, not when it arrives.

## Manual Payment

**What it is for.** Staff entering an order that was already paid some other way — over the phone, in person, or through a payment link handled outside Ambikly. Also useful for sandbox testing of the post-payment flow.

**Default description.** "Mark this order as paid immediately. Intended for admin / offline orders."

**What happens.** The order is marked **paid** right away, with no verification of anything. Because it routes through the same mark-paid path as every real gateway, it produces the same results: the order moves to `processing`, a note records the transaction reference, download grants and license keys are issued, the payment webhook fires, and Pro add-ons that listen for a paid order (loyalty points, store credit, gift cards, CRM sync) all run.

::: danger Manual Payment can never appear at public checkout
This gateway marks an order paid with zero verification, so enabling it must not expose a free-checkout option to shoppers. Availability is restricted to a **logged-in user holding `ambikly_manage_store`** (or `manage_options`). A guest, or a signed-in customer without that capability, never sees it in the payment list, and a crafted request naming `manual` as its payment method is refused server-side.
:::

**When to use it.** Enable it if your staff place orders on customers' behalf. Leave it off otherwise — there is nothing to gain from having it on.

**Refunds.** The gateway reports a refund as successful without contacting anything, because there is nothing to contact. The refund is recorded against the order; moving the money back is your responsibility.

## Bill my company (Net Terms)

**What it is for.** B2B buyers on an account. Instead of taking a card, the order is invoiced against the buyer's company credit line and given a due date.

**Default description.** "Invoice this order against your company's account, payable per your agreed terms."

**What happens.**

<ol class="step-list">
  <li>The buyer's company is resolved from their customer record.</li>
  <li>The order total is reserved against the company's available credit. The reservation is atomic, so two simultaneous orders cannot both claim the same headroom.</li>
  <li>The order is set to <code>processing</code> with payment status <code>invoiced</code>, linked to the company, and stamped with the company's payment terms.</li>
  <li>A due date is calculated from those terms — net-7, 15, 30, 60 or 90 — in the store's own timezone.</li>
  <li>The customer sees <code>Invoiced — payment due {date}.</code></li>
</ol>

**Who sees it.** Unlike the other methods, the Enabled toggle is not what gates this one. It is offered only when the buyer is on a company account that is active, has net terms turned on, and has credit remaining. Everyone else never sees it. Eligibility is checked twice — once when building the checkout options, and again atomically when the credit is reserved — so credit claimed by a concurrent order in between is caught.

**When credit runs out.** Checkout fails with `This order exceeds your available credit ({amount} remaining). Contact us to increase your limit or pay another way.` The buyer can switch to another method without losing their cart.

**When the buyer is not set up.** `Your account is not set up for net-terms billing.`

**Settling it.** When the wire or check arrives, record the payment against the order. That releases the reserved credit and marks the order paid.

**Refunds.** Refunding a net-terms order moves no money, because none moved in the first place — it releases the reserved credit back to the company's limit.

Full coverage of companies, credit limits, terms and buyer accounts is in [B2B companies & Net Terms](/b2b-companies).

::: tip There is no admin screen for companies
Companies, their credit limits and their buyers are managed through the REST API in the current release. The endpoints are complete; the React screen is not built. [B2B companies & Net Terms](/b2b-companies) shows the calls.
:::

## Settling an unpaid order

Cash on delivery, bank transfer and check all leave an order with payment status `pending`. Recording the payment is the step that turns it into a real, completed sale.

<ol class="step-list">
  <li>Open the order from <span class="screen-path">Ambikly → Orders</span>.</li>
  <li>Record the payment against it.</li>
  <li>The payment status becomes <code>paid</code> and <code>total_paid</code> is set to the order total.</li>
  <li>An order sitting in <code>pending</code> or <code>on-hold</code> moves to <code>processing</code>.</li>
  <li>An order note records the transaction reference.</li>
  <li>Download grants and license keys are issued, and any Pro add-on listening for a paid order runs.</li>
  <li>An order whose contents are entirely digital auto-completes.</li>
</ol>

Marking an order paid is guarded against duplicates, so doing it twice does not re-issue downloads or re-fire notifications. Full detail is in [Orders](/orders).

For a **Bill my company** order, recording the payment also releases the credit that was reserved when the order was placed, freeing it for the customer's next order.

## Watching for orders that never settle

The three pending methods depend on a human following up. Two habits keep them from piling up:

- Filter <span class="screen-path">Ambikly → Orders</span> by `on-hold` on a schedule. Bank-transfer and check orders that have sat there past your terms are ones to chase or cancel.
- Cancel rather than delete. Cancelling restores the stock the order reserved when it was created; deleting the row does not run that logic.

Cash-on-delivery orders go straight to `processing`, so they will not show up in an `on-hold` filter — track uncollected ones through your delivery process instead.

## Choosing between them

| If you want to… | Use |
|---|---|
| Collect cash from a delivery driver | Cash on Delivery |
| Wait for a wire before shipping | Direct Bank Transfer |
| Accept mailed checks | Check Payments |
| Let staff record an order already paid elsewhere | Manual Payment |
| Give trade customers an account with terms | Bill my company |

### Risk at a glance

| Method | What you risk | Mitigation |
|---|---|---|
| Cash on Delivery | Dispatching goods that are never collected | Limit it to territories you deliver yourself; cap the order value you accept |
| Direct Bank Transfer | Nothing — the order is held | Set clear terms in the Description so customers know shipping waits on payment |
| Check Payments | A check that bounces after you ship | Record the payment when it clears, not when it arrives |
| Manual Payment | An order marked paid that never was | Keep it disabled unless staff genuinely need it; it is capability-gated, not customer-facing |
| Bill my company | Credit extended and not repaid | Set conservative company credit limits; the reservation is enforced atomically |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| A method is missing at checkout | Its toggle is off, or the card was edited but not saved | Enable it and click **Save Gateway** on that card |
| Manual Payment is missing for a staff member | They are not logged in, or do not hold `ambikly_manage_store` | Check the user's role — see [Roles & permissions](/roles) |
| Manual Payment is visible to customers | It is not. Availability is capability-gated and re-checked server-side | If a customer reports seeing it, they hold a store capability |
| Bill my company never appears | The buyer has no company, the company is inactive, net terms are off, or the credit is exhausted | See [B2B companies & Net Terms](/b2b-companies) |
| `This order exceeds your available credit` | The order total is larger than the company's remaining headroom | Raise the limit, or have the buyer pay another way |
| Bank-transfer orders never leave `on-hold` | Nothing marks them paid automatically by design | Record the payment when the money lands |
| Cash-on-delivery orders are not in the `on-hold` list | They go to `processing`, not `on-hold` | Filter by `processing` instead |
| Bank details are not reaching customers | The Instructions field is never rendered | Move the text into the gateway Description and the order email |
| Stock looks wrong after cancelling | Cancelling restores stock; deleting does not | Cancel rather than delete |

## Next

[Shipping](/shipping) — zones, methods and how a rate is matched to an address.
