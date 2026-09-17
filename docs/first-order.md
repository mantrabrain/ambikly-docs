---
title: Your first order
description: Place a test order through your own storefront using an offline payment method, verify the order, emails, invoice, stock and downloads, then refund or cancel it.
prev:
  text: Your first product
  link: /first-product
next:
  text: Go-live checklist
  link: /go-live
---

# Your first order

The fastest way to find out whether your store works is to buy something from it. This page walks through a complete test purchase using an offline payment method — no card, no gateway, no real money — then through every check worth making afterwards, and finally through undoing the order cleanly.

Do this before you accept a real customer. It exercises the cart, the shipping calculation, the tax calculation, order creation, stock, emails, the invoice and the account area in one pass.

## Pick an offline method

Ambikly ships four payment methods that move no money. Which one you pick changes where the order lands, so it is worth choosing deliberately.

| Method | Gateway id | Order status after checkout | Payment status | Best for |
|---|---|---|---|---|
| Cash on Delivery | `cod` | `processing` | `pending` | The realistic customer path — use this one |
| Direct Bank Transfer | `bank_transfer` | `on-hold` | `pending` | Testing the "awaiting payment" workflow |
| Check Payments | `cheque` | `on-hold` | `pending` | Same as bank transfer |
| Manual Payment | `manual` | `processing` (or `completed`) | `paid` | Staff-entered orders; skips straight to paid |

This walkthrough uses **Cash on Delivery**, because it is the only one of the four a real shopper would ever see and it reproduces the customer's actual experience.

<div class="ui-warn"><strong>Careful:</strong> <strong>Manual Payment</strong> is deliberately never offered to the public — it only appears for logged-in users who can manage the store. It is useful precisely because it marks the order paid straight away, but it therefore skips the "awaiting payment" half of the flow. Test with COD first, then try Manual if you take phone orders.</div>

### Turn Cash on Delivery on

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Settings → Payment Settings</span>.</li>
  <li>Find <strong>Cash on Delivery</strong> and switch its toggle on. The chip beside it should change from <strong>DISABLED</strong> to <strong>ACTIVE</strong>.</li>
  <li>Click <strong>Configure</strong> to expand the gateway, then click <strong>Save Gateway</strong>.</li>
  <li>Reload the page and confirm the toggle is still on.</li>
</ol>

<div class="ui-warn"><strong>Careful:</strong> The enable toggle alone does not save anything — it only changes the form. Each gateway is persisted by the <strong>Save Gateway</strong> button inside its own <strong>Configure</strong> panel. Flipping a toggle and navigating away loses the change silently. Always reload to confirm.</div>

The setup wizard may already have enabled Cash on Delivery — activation seeds it on by default. Details in [Offline payment methods](/payments-offline).

<div class="ui-tip"><strong>Tip:</strong> Do the whole test in a private or incognito window, logged out. Guest checkout is on by default, and testing logged out is the only way to see what an actual first-time customer sees. If you want to check the account area afterwards, use a real email address you can read.</div>

## Place the order

<ol class="step-list">
  <li>Open your <strong>Shop</strong> page in a logged-out window.</li>
  <li>Click a product. Confirm the price, the description and the photo are what you expect.</li>
  <li>Click <strong>Add to cart</strong>, then go to the <strong>Cart</strong> page.</li>
  <li>Check the line item, the quantity control and the subtotal. If you have a coupon, try it in the coupon field now — see <a href="/coupons">Coupons</a>.</li>
  <li>Continue to <strong>Checkout</strong>.</li>
  <li>Fill in the billing details. Use a real email address; every email in this test goes there.</li>
  <li>For a physical product, choose a shipping method. If the list is empty, stop — no shipping zone matches your address. See <a href="/shipping">Shipping</a>.</li>
  <li>Check that shipping and tax appear in the totals and that the grand total adds up.</li>
  <li>Select <strong>Cash on Delivery</strong> as the payment method.</li>
  <li>Click <strong>Place order</strong>.</li>
</ol>

You land on the **Order Received** page with an order number. The cart is now empty.

### What happened behind the scenes

Worth understanding, because it explains everything you are about to check:

1. The order was created at status `pending` with payment status `pending`, and a system note recorded "Order placed via checkout."
2. **Stock was decremented immediately**, at order creation — not at payment. Downloadable line items are skipped.
3. Coupon usage, if any, was recorded.
4. The COD gateway returned a *pending* result: successful, but not paid. The order moved to `processing`, and payment status stayed `pending`.
5. The cart was cleared.
6. Emails went out — see below.

The key consequence: **the order is not paid**, so download grants and license keys have not been issued yet. That happens when you settle the payment.

## What to check afterwards

### 1. The order exists

Go to <span class="screen-path">Ambikly → Orders</span>. Your order should be at the top of the list.

| Check | Expected |
|---|---|
| Order number | Matches the one on the Order Received page |
| Status | **Processing — paid, fulfil now** for COD; **On Hold** for bank transfer or check |
| Payment status | **Pending** |
| Total | Matches what checkout showed, including shipping and tax |
| Customer | Your test email address |

Click the order number to open it. Confirm the line items, the billing and shipping addresses, the shipping method, the payment method, and the order notes. There should be a system note about the order being placed.

::: warning "Processing" does not mean "paid"
For Cash on Delivery the order sits at Processing with a payment status of Pending. The status describes fulfillment; the payment status describes money. Read both columns. See [Orders](/orders).
:::

### 2. The emails arrived

Ambikly sends transactional email through `wp_mail()`, so whatever your site uses for delivery is what sends these.

| Trigger | Customer gets | Admin gets |
|---|---|---|
| Order created | Order notification — **unless the cart was digital-only** | Order notification |
| Order marked paid | Order notification | Nothing |
| Order status changed | Order status change | Order status change |

Check your test inbox and the store admin address. Both should hold an order notification.

If nothing arrived, the usual suspects are WordPress mail delivery in general (test with any other plugin that sends mail), the per-event toggles, or the master kill switch. See [Emails](/emails).

::: warning Only four transactional emails exist
Order notification to customer, order notification to admin, order status change to customer, order status change to admin. That is the complete set. There is **no** shipping-notification email, **no** cancellation email and **no** refund email in the free core. Do not wait for one that is never coming.
:::

### 3. The invoice renders

On the order screen, click the printer icon in the header — its tooltip reads **Print invoice**. The invoice opens in a new tab.

Confirm it shows your store name, the invoice number, the line items, the totals, and your invoice footer. Configure the prefix, starting number and footer under <span class="screen-path">Ambikly → Settings → Invoice & Packing</span>.

<div class="ui-warn"><strong>Careful:</strong> The invoice is HTML, always. The endpoint accepts <code>format=pdf</code>, but no PDF renderer ships in either the free core or Pro, so it silently falls back to HTML. Use your browser's Print to PDF. See <a href="/invoices">Invoices &amp; packing slips</a>.</div>

The invoice URL carries a signed token, so customers can open their own invoice from the account area without logging in. A **Print packing slip** icon sits next to it when packing slips are enabled.

### 4. Stock went down

Open the product under <span class="screen-path">Ambikly → Products</span> and check the stock quantity. If you were tracking stock, it should be lower by the quantity ordered.

Remember: this happened at **order creation**, not at payment. An unpaid order is already holding stock. For a variable product, both the variation row and the parent product row are decremented.

If stock could not cover the order because two orders raced, Ambikly clamps at zero and writes an order note: *"Stock warning: this order oversold..."*. Watch for that note.

There is no "reduce stock" or "restock" button on the order screen. Stock movements are automatic. See [Inventory & stock](/inventory).

### 5. Settle the payment, then check the download

For a **digital product**, this is the step that matters. Downloads are granted when the order becomes paid, and a COD order is not paid yet.

<ol class="step-list">
  <li>On the order screen, use the <strong>Order status</strong> dropdown and choose <strong>Completed</strong>.</li>
  <li>Confirm in the dialog titled <strong>Change order status?</strong> by clicking <strong>Change status</strong>.</li>
  <li>The payment settles automatically. Offline gateways are marked paid when you move the order forward, so payment status flips to <strong>Paid</strong>.</li>
</ol>

Now the checks:

| Check | Where | Expected |
|---|---|---|
| Payment status | The order screen | **Paid** |
| Download grant | The order screen, **Digital downloads** table | One row per file, showing uses and expiry |
| Customer access | <span class="screen-path">My Account → Downloads</span> on the storefront | "Your downloads", with a **Download** button per file |
| Status-change email | Your test inbox | An order status change email |

Click the customer's **Download** button and confirm the file actually downloads. The link is token-authenticated — the token is the authorization, so treat those URLs as private.

If the Downloads tab says *"No downloadable files yet"*, the product has no files attached. Ambikly creates no grant in that case, and it does so silently. Go back and attach the file. See [Digital downloads](/digital-downloads).

::: tip Digital-only orders complete themselves
When a paid order contains nothing but digital items, Ambikly moves it to Completed automatically and notes "Digital-only order auto-completed." You will not need to set the status by hand on a Stripe or PayPal digital sale — only on an offline one, because those are not paid until you say so.
:::

### 6. The customer account works

Still in your logged-out window, if you checked out with an account rather than as a guest, open the **My Account** page and check the **Orders** tab. Your order should be listed with an **Invoice** link.

The **Addresses** tab is display-only in the current release — customers cannot edit their address from the storefront. See [Customers](/customers).

## Undo the test order

Do not leave a test order in your reporting. You have two ways to remove it, and they do different things.

### Cancel it

Cancelling is right when no money ever moved — which is exactly the case for an unpaid COD order.

<ol class="step-list">
  <li>Open the order under <span class="screen-path">Ambikly → Orders</span>.</li>
  <li>Set the <strong>Order status</strong> dropdown to <strong>Cancelled</strong>.</li>
  <li>The confirmation warns: "This restores stock for the order and cannot be easily undone." Click <strong>Change status</strong>.</li>
</ol>

What this does:

- Sets the status to `cancelled` and records a cancellation timestamp.
- **Restores stock**, as long as the order was at pending, processing, on-hold or completed beforehand. The restore runs once per order and cannot double up.
- Sends the order status change email to the customer and to the admin.
- Leaves the **payment status untouched**. An order you had already marked paid stays `paid` after cancelling. If money genuinely moved, refund instead.

There is no separate Cancel button — the status dropdown is the cancel action.

### Refund it

Refunding is right once the order has been marked paid, including after you settled the COD payment in step 5.

<ol class="step-list">
  <li>Open the order and click <strong>Refund</strong> in the header. It is disabled when there is nothing left to refund.</li>
  <li>The <strong>Issue refund</strong> dialog opens. Enter an <strong>Amount</strong> — the field shows the maximum refundable.</li>
  <li>Optionally enter a <strong>Reason</strong>. It is recorded on the refund and in the order notes.</li>
  <li>Click <strong>Refund</strong>.</li>
</ol>

For an offline method — Cash on Delivery, bank transfer or check — **no gateway is contacted**. Those gateways do not support refunds, so Ambikly records the refund as bookkeeping only. You return the money however you took it. For Stripe and PayPal the refund is pushed to the gateway for real.

What a refund does:

| | Full refund | Partial refund |
|---|---|---|
| Payment status | `refunded` | `partially-refunded` |
| Order status | `refunded` | unchanged |
| Stock | **Restored** | **Not restored** |
| Download links | Stop working | Keep working |
| Refund record | Written to the refunds table with your user id and reason | Same |
| Order note | Added | Added |

::: warning A refund sends no email
Refunding bypasses the status-change path, so no order status change email goes out, and there is no refund email template in the free core. The customer is not told automatically. Tell them yourself, or add a note marked customer-visible on the order.
:::

More detail, including partial refunds and line-level behavior, in [Refunds & cancellations](/refunds).

### Or delete it outright

Deleting the order from the orders list restores stock first, then removes the row. Use this on a throwaway test order you want gone from reports entirely. It is not reversible.

## If something went wrong

| Symptom | Likely cause |
|---|---|
| No payment methods at checkout | No gateway enabled under <span class="screen-path">Ambikly → Settings → Payment Settings</span> |
| No shipping methods at checkout | No zone matches the address — check the Rest of World zone exists. See [Shipping](/shipping) |
| Tax shows as zero | Taxes disabled, or no rate matches. See [Tax](/tax) |
| Checkout rejects a guest | Guest checkout disabled under <span class="screen-path">Ambikly → Settings → Store Settings</span> |
| Order Received page 404s | The recorded slug does not match a real page. See [Store pages](/store-pages) |
| No emails at all | Site-wide mail delivery, or the email toggles. See [Emails](/emails) |
| Downloads tab is empty | The order is not paid yet, or the product has no files attached |

More in [Troubleshooting](/troubleshooting).

## Next

You have proved the store works end to end. [Go-live checklist](/go-live) is the list of things to fix before real customers arrive.
