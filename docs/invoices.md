---
title: Invoices & packing slips
description: How Ambikly generates invoices and packing slips, the token-guarded URLs, who can view them, PDF output, and the filters and actions for customizing both documents.
prev:
  text: "Refunds & cancellations"
  link: /refunds
next:
  text: "Emails"
  link: /emails
---

# Invoices & packing slips

Ambikly generates two per-order documents: a customer-facing invoice with prices, and a warehouse-facing packing slip without them. Both are rendered as self-contained HTML that any browser can print or save as a PDF.

## Settings

Both documents are configured under <span class="screen-path">Ambikly → Settings → Invoice & Packing</span>.

| Setting | What it does | Default |
|---|---|---|
| Enable Invoices | Turns on sequential invoice numbering. With it off, invoices still render but show the order number instead of an invoice number. | On |
| Invoice Prefix | Prepended to the sequential number, e.g. `INV-`. | `INV-` |
| Starting Invoice Number | The number the sequence starts from, used only until the first invoice is assigned. | `1` |
| Invoice Footer | Free text printed above the invoice footer bar — payment terms, a thank-you line. | Empty |
| Enable Packing Slips | Turns packing slips on. With it off the endpoint returns a clean 404 page and the admin hides the print button. | On |
| Packing Slip Prefix | Prepended to the sequential slip number, e.g. `PS-`. | `PS-` |
| Packing Slip Footer | Free text printed at the bottom of the slip. | Empty |

The store name, address lines, email and site URL printed on both documents come from <span class="screen-path">Ambikly → Settings → Store</span>, not from this panel.

## How documents are generated

There is nothing to generate in advance. Both documents are rendered on demand from the order's current data each time the URL is opened.

The one thing that is written and remembered is the document number. The first time an invoice is rendered for an order, the next number in the sequence is claimed, formatted with the prefix, and stored in the order's own meta. Every later view of that invoice shows the same number. Packing slips use their own independent counter the same way.

This means two things worth knowing:

- An order that has never had its invoice opened has no invoice number yet.
- Invoice numbers are assigned in the order that invoices are first *viewed*, not in the order that orders were *placed*.

## Printing from the admin

<ol class="step-list">
  <li>Open an order from <span class="screen-path">Ambikly → Orders</span>.</li>
  <li>Click the printer icon in the header for the invoice, or the shipping icon for the packing slip.</li>
  <li>The document opens in a new tab with a <strong>Save / Print PDF</strong> button at the top. That button calls the browser's own print dialog.</li>
</ol>

The packing-slip icon is only rendered when packing slips are enabled. When the feature is off the order's `packing_slip_url` comes back as `null` so the admin does not show a button that would only 404.

## The document URLs

Both documents live on the REST API but are served as plain HTML rather than a JSON envelope, so a browser renders them directly.

| Document | URL |
|---|---|
| Invoice | `{site}/wp-json/ambikly/v1/orders/{id}/invoice?token={token}` |
| Packing slip | `{site}/wp-json/ambikly/v1/orders/{id}/packing-slip?token={token}` |

### The token

The token is an HMAC-SHA256 of the order id and order number against a store secret, truncated to 32 hex characters. It is **deterministic**: the same order always produces the same token, so re-sending an order email never invalidates a link the customer already has. The secret is generated once and stored as the `ambikly_invoice_secret` option.

Both documents share one token — the packing slip reuses the invoice's, so there is a single link scheme for both.

Rotating the secret in the database invalidates every previously issued link at once.

### Who can view a document

A request is allowed if **any** of these is true:

| Condition | Who it covers |
|---|---|
| Has `manage_options` | WordPress Administrators |
| Has `ambikly_view_store` | Support Agents, Store Managers, Administrators |
| Has `ambikly_manage_store` | Store Managers, Administrators |
| Carries a valid token | Anyone holding the link — typically the customer from an email |
| Logged in with a user id matching the order's `user_id` | The account that placed the order |
| Logged in with an email matching the order's `customer_email` | The same person on a differently-linked account |

Anything else gets a styled 403 page rather than a JSON error, because a customer pasting a stale link should see readable text. A missing order gets a 404 page. Both pages are `noindex, nofollow` and sent with no-cache headers.

<div class="ui-tip"><strong>Tip:</strong> Because the token alone authorizes the view, treat an invoice link the way you would treat a password-reset link. Anyone with the URL can read the order's items, totals and addresses.</div>

## The `format` parameter

The invoice endpoint accepts `format`, defaulting to `html`.

| Value | Result |
|---|---|
| `html` (or omitted) | The HTML invoice, served as `text/html`. |
| `pdf` | A real PDF **only if a renderer is installed**. Otherwise the request silently falls through to HTML. |

The packing-slip endpoint does not accept `format`. It always serves HTML.

::: danger PDF output requires a third-party renderer
The free core ships **no PDF engine at all**. `format=pdf` calls the `ambikly_invoice_pdf_renderer` filter, and when nothing is hooked to it the filter returns `null` and the endpoint serves HTML instead — with an HTML content type, not a PDF one. There is no error and no warning.

To get real PDFs you must install a renderer yourself. Until you do, the supported way to produce a PDF is the browser's own **Save / Print PDF** button at the top of the HTML invoice.
:::

Registering a renderer takes three arguments — the current value, the rendered HTML, and the order — and returns the PDF bytes as a string:

```php
add_filter('ambikly_invoice_pdf_renderer', function ($pdf, $html, $order) {
    $dompdf = new \Dompdf\Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4');
    $dompdf->render();
    return $dompdf->output();
}, 10, 3);
```

Once a string is returned, the endpoint sends it as `application/pdf` with an inline `Content-Disposition` and a filename of `invoice-{order number}.pdf`.

## What is on the invoice

| Section | Contents |
|---|---|
| Header | Optional logo, store name, store address lines, store email. |
| Meta | The word "Invoice", the invoice number, the order date formatted with the site's date format, and a colored payment-status pill. |
| Billed to | The billing address, falling back to the order's email when no billing address exists. |
| Shipping to | The shipping address, rendered only when one exists. |
| Items | One row per line item: name, SKU, quantity, unit price, line total. |
| Totals | Subtotal, Discounts, the shipping method title and cost, Tax, Total, and a Refunded line. Every row except Subtotal and Total is hidden when its value is zero. |
| Customer note | The order's customer note, when there is one. |
| Footer text | Your configured invoice footer. |
| Footer bar | "Paid with {method title}" on the left, the site URL on the right. |

The invoice carries `schema.org/Invoice` microdata, loads no external assets, no JavaScript and no web fonts, and declares `noindex, nofollow`. It is deliberately style-isolated so it survives being saved or forwarded.

## What is on the packing slip

The packing slip is deliberately price-free — it shows what is in the box and where it goes, nothing about money.

| Section | Contents |
|---|---|
| Header | Store name and address lines only. |
| Meta | The word "Packing slip", the slip number, the order number, the order date. |
| Ship to | The shipping address, falling back to the billing address, falling back to the order email. |
| Items | A tick-box column for the packer, the item name and SKU, and the quantity. No prices, no totals. |
| Customer note | The order's customer note, when there is one. |
| Footer | Your configured packing-slip footer. |

## Customizing the documents

Both templates run their data through a filter before rendering, and fire an action after the document body.

| Hook | Type | Fires | Arguments |
|---|---|---|---|
| `ambikly_invoice_context` | Filter | Before the invoice template is included | `$context` array, `$order` |
| `ambikly_invoice_logo_url` | Filter | While building the invoice context | `''` — return a URL to print a logo |
| `ambikly_invoice_pdf_renderer` | Filter | On `format=pdf` | `null`, `$html`, `$order` |
| `ambikly_invoice_after` | Action | At the end of the invoice `<body>` | `$order` |
| `ambikly_packing_slip_context` | Filter | Before the packing-slip template is included | `$context` array, `$order` |
| `ambikly_packing_slip_after` | Action | At the end of the packing-slip `<body>` | `$order` |

The invoice context contains `order`, `items`, `billing`, `shipping`, `store`, `currency`, `logo_url`, `invoice_number` and `invoice_footer`. The packing-slip context contains `order`, `items`, `shipping`, `store`, `slip_number` and `footer`.

Adding a logo to every invoice:

```php
add_filter('ambikly_invoice_logo_url', function () {
    return 'https://example.com/wp-content/uploads/logo.png';
});
```

Reordering or relabelling line items without touching the template:

```php
add_filter('ambikly_invoice_context', function ($context, $order) {
    $context['invoice_footer'] = 'Payment terms: net 30. Questions: ap@example.com';
    return $context;
}, 10, 2);
```

Appending a block below the invoice — a VAT statement, a QR code:

```php
add_action('ambikly_invoice_after', function ($order) {
    echo '<p style="text-align:center;font-size:12px;color:#6b7280;">VAT reg. GB123456789</p>';
});
```

See [Hooks & filters](/developers/hooks) for the complete hook list.

::: warning These two templates are not theme-overridable
`src/Templates/invoice.php` and `src/Templates/packing-slip.php` are included directly from the plugin directory. They do **not** go through the theme-override lookup — dropping a copy into `your-theme/ambikly/` has no effect on either document.

The override lookup exists, but the only templates it covers are the three email templates under `templates/emails/`. Customize invoices and packing slips through the context filters and the `_after` actions above. See [Template overrides](/developers/templates).
:::

## Where documents appear for customers

- **Account area.** The Orders tab of the storefront account page prints an Invoice link on every order row. See [Customers](/customers).
- **Emails.** The `{{invoice_url}}` smart tag expands to the tokenized invoice URL and can be dropped into any email body. See [Emails](/emails).
- **Packing slips** are never linked to customers. The URL works for anyone holding a valid token, but nothing in the free core sends one out.

## For developers

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/ambikly/v1/orders/{id}/invoice` | Public route; checked inside | Accepts `token` and `format`. Serves HTML or PDF, never a JSON envelope. |
| GET | `/ambikly/v1/orders/{id}/packing-slip` | Public route; checked inside | Accepts `token`. 404s when packing slips are disabled. |

`GET /ambikly/v1/orders/{id}` returns `invoice_url` on every order, and `packing_slip_url` — which is `null`, not absent, when packing slips are off. See [Endpoint reference](/developers/endpoints).

## Where to go next

- [Emails](/emails) — putting `{{invoice_url}}` into a transactional email.
- [Orders](/orders) — the header controls that open both documents.
- [Hooks & filters](/developers/hooks) — the full hook reference.
- [Template overrides](/developers/templates) — what is and is not overridable.
