---
title: Emails
description: The Emails screen, the four transactional emails Ambikly sends, the complete smart-tag table, every option key, deliverability notes, and how to preview and test.
prev:
  text: "Invoices & packing slips"
  link: /invoices
next:
  text: "Customers"
  link: /customers
---

# Emails

Ambikly sends transactional email through WordPress's own `wp_mail()`. This page covers the Emails screen, exactly which emails exist, the smart tags you can put in them, and how to test that they arrive.

## The Emails screen

Open <span class="screen-path">Ambikly → Emails</span>. The screen is a left-hand section list and a right-hand editor:

- **General** — settings that apply to every Ambikly email.
- **Order Notification** — sent when an order is placed, or when a digital-only order is paid.
- **Order Status Change** — sent when an order moves to a new status.

Each of the two event sections holds a Customer template and an Admin template, editable independently. Changes are saved with the **Save changes** button in the header; nothing saves as you type.

::: warning Only four transactional emails exist
The free core ships exactly four editable emails: **order notification to customer**, **order notification to admin**, **order status change to customer**, and **order status change to admin**.

There is **no shipping-notification email**, **no cancelled-order email** and **no refund-notification email**. Refunding an order sends the customer nothing. If the refund pushed the order into `refunded` status, the generic order-status-change email goes out — but it is not a refund notice and does not mention the amount.

If you need a shipping notification, the [Shipment Tracking](/addons/shipment-tracking) add-on covers that case.
:::

## General settings

| Setting | Option key | What it does | Default |
|---|---|---|---|
| Disable all emails | `ambikly_disable_all_email` | Master kill switch. Stops every Ambikly transactional email. | Off (`no`) |
| Admin email recipients | `ambikly_admin_email_recipient_lists` | One address per line. Receives every admin-targeted Ambikly email. Falls back to the WordPress admin email when empty. | Empty |
| "From" name | `ambikly_email_from_name` | Display name on outgoing customer email. Falls back to the store's `from_name` setting, then to the site title. | Empty |
| "From" email address | `ambikly_email_from_address` | From and Reply-To address on outgoing customer email. Falls back to the store's `from_email` setting, then to the WordPress admin email. | Empty |
| Hide "Powered by Ambikly" footer | `ambikly_disable_powered_by_link_on_email` | Removes the credit line from every transactional email footer. | Off (`no`) |

The three toggles store the literal strings `yes` and `no`, not booleans. The recipient list is split on newlines and commas, and each entry is sanitized as an email — invalid entries are dropped silently.

<div class="ui-tip"><strong>Tip:</strong> An empty From name or From address is not simply "unset" — PHPMailer rejects a message with a blank From outright. Ambikly guards against this by falling through to the store settings and then to the site defaults whenever either field is an empty string.</div>

## Per-email settings

Each of the four emails has three settings of its own.

| Setting | Option key pattern |
|---|---|
| Enabled | `ambikly_enable_email_{event}_{audience}` |
| Subject | `ambikly_{event}_subject_for_{audience}` |
| Content | `ambikly_{event}_content_for_{audience}` |

`{event}` is `order` or `order_status_change`. `{audience}` is `customer` or `admin`. So the four enable keys are:

- `ambikly_enable_email_order_customer`
- `ambikly_enable_email_order_admin`
- `ambikly_enable_email_order_status_change_customer`
- `ambikly_enable_email_order_status_change_admin`

All four default to on. An email only sends when both the master switch is off *and* its own toggle is on.

**Leaving a subject or content field blank restores the built-in default.** The plugin deletes the option row rather than storing an empty string, which is what makes the fallback work. The placeholder text in each field shows you what the default is.

Content is filtered through `wp_kses_post`, so ordinary HTML survives but scripts do not. You supply only the inner body — the shared header and footer wrap it, so you cannot break the email's outer HTML by editing a subject line.

## When each email fires

| Email | Fires on | Notes |
|---|---|---|
| Order notification → customer | Order created, **and** again when the order is paid | Skipped at creation time for a digital-only order, because the real confirmation with download links goes out at payment time. |
| Order notification → admin | Order created | Only at creation, not again on payment. |
| Order status change → customer | Every status transition | Needs a `customer_email` on the order. |
| Order status change → admin | Every status transition | Skipped when the admin recipient list resolves to nothing. |

The customer order email splices in anything returned by the `ambikly_order_email_extras` filter just before the closing table of the body shell — this is how download links and license keys reach the customer without forking the layout.

## Smart tags

Smart tags are `{{double_brace}}` tokens replaced in both the subject and the body at send time.

| Tag | Expands to | Shown in the UI |
|---|---|---|
| `{{order_number}}` | The order number, falling back to the order id | Yes |
| `{{order_total}}` | The order total, formatted in the order's currency | Yes |
| `{{customer_email}}` | The order's customer email | Yes |
| `{{customer_first_name}}` | The billing first name, or "there" when unknown | Yes |
| `{{customer_name}}` | The billing full name, falling back to the email, then "there" | Yes |
| `{{invoice_url}}` | The tokenized invoice URL for this order | Yes |
| `{{blog_info}}` | The site title | Yes |
| `{{home_url}}` | The site home URL | Yes |
| `{{old_status}}` | The status the order left | Status-change emails only |
| `{{new_status}}` | The status the order moved to | Status-change emails only |
| `{{order_status}}` | The order's current status slug | **No** |
| `{{payment_method}}` | The payment method title, e.g. "Direct Bank Transfer" | **No** |
| `{{order_admin_url}}` | A deep link to the order in the Ambikly admin | **No** |

The last three work in every Ambikly email even though the token chips on the Emails screen do not list them. `{{order_admin_url}}` is particularly useful in the admin templates — it takes a staff member straight to the order.

`{{old_status}}` and `{{new_status}}` expand to raw slugs such as `on-hold`, not to the display labels.

<div class="ui-tip"><strong>Tip:</strong> Click any token chip under a template's content field to copy it.</div>

Add your own tags with the `ambikly_all_smart_tags` filter. Keys arrive already wrapped in braces:

```php
add_filter('ambikly_all_smart_tags', function ($tags, $order) {
    $tags['{{tracking_url}}'] = 'https://track.example.com/' . $order->order_number;
    return $tags;
}, 10, 2);
```

## Subject and message filters

Every subject and body passes through a filter, giving eight hooks in total. They run after the stored option and before smart-tag substitution, so a filtered value can still contain tags.

| Hook | Type | Changes |
|---|---|---|
| `ambikly_order_subject_to_customer` | Filter | Order notification subject, customer |
| `ambikly_order_message_to_customer` | Filter | Order notification body, customer |
| `ambikly_order_subject_to_admin` | Filter | Order notification subject, admin |
| `ambikly_order_message_to_admin` | Filter | Order notification body, admin |
| `ambikly_order_status_change_subject_to_customer` | Filter | Status change subject, customer |
| `ambikly_order_status_change_message_to_customer` | Filter | Status change body, customer |
| `ambikly_order_status_change_subject_to_admin` | Filter | Status change subject, admin |
| `ambikly_order_status_change_message_to_admin` | Filter | Status change body, admin |

Two more hooks wrap every send: `ambikly_email_send_before` and `ambikly_email_send_after`, both with no arguments. They are useful for swapping in an SMTP configuration around Ambikly's mail only.

<div class="ui-warn"><strong>Careful:</strong> <code>ambikly_email_from_name</code> and <code>ambikly_email_from_address</code> are WordPress <strong>options</strong>, not filters. Use <code>update_option()</code>, not <code>add_filter()</code>.</div>

## The two hard-coded system emails

Two more emails exist that are not on the Emails screen and cannot be edited there.

### Low-stock and out-of-stock alerts

Sent to the store admin when a paid order drops a stock-managed product to or below its threshold.

- Fires on `ambikly_order_paid`, after stock has been decremented.
- Digital line items are skipped — they have no stock.
- The threshold comes from the product's own `low_stock_threshold` meta when set, otherwise from the store-wide Low Stock Threshold under <span class="screen-path">Ambikly → Settings → Store</span>, defaulting to 5.
- Two variants: "Out of stock" when the quantity reaches zero, "Low stock: {name} ({n} left)" when it is at or below the threshold.
- **Throttled to one email per product per level every 6 hours**, so a burst of orders cannot flood your inbox. The throttle is a transient keyed by level and product id.
- The body carries the product name, SKU and current quantity, plus a link to edit the product.
- Fires `ambikly_inventory_alert_sent` with the level, the product and the quantity.

Alerts go to the WordPress admin email. The master "Disable all emails" switch does **not** cover them — they are sent through `wp_mail()` directly, using the same From name and address as everything else.

See [Inventory & stock](/inventory).

### Company buyer invitation

Sent when you invite someone onto a B2B company account. Subject: "You've been added to {company} on {site}". The body tells them they can now place orders on that company's terms and asks them to sign in or register with that email address.

It is not editable and has no toggle. See [B2B companies & Net Terms](/b2b-companies).

## Deliverability

Customer email and admin email are sent with deliberately different headers.

| | Customer email | Admin email |
|---|---|---|
| `From` header | Set to your configured From name and address | **Not set** |
| `Reply-To` | Your configured From address | Your configured From address |
| `Content-Type` | `text/html; charset=UTF-8` | `text/html; charset=UTF-8` |

Admin notifications deliberately omit the From header so WordPress's own default sender applies — an address on the site's own domain. That keeps admin mail SPF-aligned and stops it being filed as spoofed when your From address is on a different domain from the server sending the mail.

Recipients are sent one message each, not one message with multiple recipients, so a single bad address in the admin list cannot suppress the rest.

Further deliverability notes:

- Ambikly does not bundle an SMTP layer. If your host's PHP mail is unreliable, install a dedicated SMTP plugin — it will pick up these messages like any other `wp_mail()` call.
- Set a From address on a domain you control and that your SPF record authorizes.
- The "Powered by Ambikly" footer link is the only outbound link in the default templates. Removing it with the General toggle is fine and does not affect anything else.

## Previewing

Each template has a **Preview ↗** link that opens the resolved HTML body in a new tab, with smart tags already expanded.

- The preview uses your **most recently created real order** as sample data. If the store has no orders yet, a stub order numbered `SAMPLE-1001` totalling $19.00 is used instead.
- Status-change previews always substitute `processing` for `{{old_status}}` and `completed` for `{{new_status}}`.
- The preview URL is on the front end, in the form `?action=ambikly-email-preview&email_type={event}&email_to={audience}`, and requires `manage_options`.

<div class="ui-warn"><strong>Careful:</strong> Preview renders the <strong>saved</strong> template, not the unsaved text in the editor. Save before previewing.</div>

## Sending a test

Each template has a **Send test** field and button.

<ol class="step-list">
  <li>Enter a recipient address under the template you want to test.</li>
  <li>Click <strong>Send test</strong>. The screen saves your current edits first, so the test reflects what is on screen.</li>
  <li>Check the inbox. A test uses the same sample-order data as the preview.</li>
</ol>

A test is a real send through `wp_mail()`, with the same headers the live email would use — an admin-audience test omits the From header just as the real one does. If `wp_mail()` returns false you get an explicit "wp_mail() returned false. Check your mail configuration." error, which almost always points at the host's mail setup rather than at Ambikly.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| No Ambikly email arrives at all | `ambikly_disable_all_email` is set to `yes`, or the host cannot send mail. Send a test to distinguish the two. |
| Customer emails arrive, admin ones do not | The admin recipient list is empty or contains only invalid addresses. |
| Subject arrives empty | The subject was saved with content that sanitized down to nothing. Clear the field entirely to restore the default. |
| A status-change email did not send | The order has no `customer_email`, or that event's toggle is off. |
| Digital order sent no confirmation at checkout | Expected. The confirmation for a digital-only order goes out at payment time, with the download links included. |
| A tag printed literally as `{{tag}}` | It is not a real tag. Check the spelling against the table above. |

See also [Troubleshooting](/troubleshooting).

## Permissions

The Emails screen and its REST routes require `manage_options`. Neither the Store Manager nor the Support Agent role can reach it — raw HTML editing is deliberately kept to Administrators. See [Roles & permissions](/roles).

## Where to go next

- [Customers](/customers) — the account area customers land in from these emails.
- [Invoices & packing slips](/invoices) — what `{{invoice_url}}` points at.
- [Orders](/orders) — the status transitions that trigger the status-change email.
- [Hooks & filters](/developers/hooks) — the complete hook reference.
