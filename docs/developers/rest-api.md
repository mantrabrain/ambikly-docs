---
title: REST API
description: Authentication, permission callbacks, the response envelope, body-only pagination, query parameters and error codes for Ambikly's two REST namespaces.
prev:
  text: Developer overview
  link: /developers/
next:
  text: Endpoint reference
  link: /developers/endpoints
---

# REST API

Ambikly registers its routes on WordPress's own REST infrastructure. Everything the admin app does — listing products, saving an order, applying a coupon — goes through these routes, and so can your code.

This page covers how to authenticate, what a response looks like, and how to page through a collection. The routes themselves are on the [Endpoint reference](/developers/endpoints).

## Base URLs

There are two namespaces.

| Namespace | Base URL | Provided by |
|---|---|---|
| `ambikly/v1` | `https://example.com/wp-json/ambikly/v1` | Free core |
| `ambikly-pro/v1` | `https://example.com/wp-json/ambikly-pro/v1` | Ambikly Pro, including add-on routes |

The free core registers 117 `register_rest_route()` calls, which expand to 123 routes at runtime because two controllers register in a loop. Pro registers 94 calls, expanding to 99. That is **over 200 REST routes** in total across both namespaces.

If your site does not use pretty permalinks, the same routes are reachable as `https://example.com/?rest_route=/ambikly/v1/products`.

## Authentication

**Ambikly does not implement its own authentication.** It relies entirely on WordPress's REST authentication. There is no custom auth layer, no API key mechanism, and no JWT support of any kind in either plugin.

That leaves two practical options.

### Cookie plus nonce — for JavaScript on the same site

A logged-in browser session authenticates with its WordPress cookie, which core only honors for REST when the request also carries a valid `wp_rest` nonce in the `X-WP-Nonce` header.

Ambikly creates that nonce for you and hands it to its own scripts: the admin app receives it as `rest_nonce`, and the storefront receives it as `nonce`, both from `wp_create_nonce('wp_rest')`. In your own enqueued script, create your own with `wp_localize_script()`.

```php
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script('acme-store', plugins_url('acme.js', __FILE__), [], '1.0', true);
    wp_localize_script('acme-store', 'AcmeStore', [
        'root'  => esc_url_raw(rest_url('ambikly/v1/')),
        'nonce' => wp_create_nonce('wp_rest'),
    ]);
});
```

```js
const res = await fetch(`${AcmeStore.root}cart`, {
  method: 'GET',
  credentials: 'same-origin',
  headers: { 'X-WP-Nonce': AcmeStore.nonce },
});
const body = await res.json();
console.log(body.data.items);
```

`credentials: 'same-origin'` is required — without it the browser does not send the cookie and the request is treated as logged out.

::: warning Nonces expire
A `wp_rest` nonce is valid for roughly 24 hours. A long-lived page will start getting `403 rest_cookie_invalid_nonce` after that. Refresh the page or fetch a new nonce rather than retrying with the old one.
:::

### Application Passwords — for server-to-server

For a script, a cron job or an external system, use WordPress Application Passwords over HTTP Basic auth. This is a WordPress core feature, available on any site running WordPress 5.6 or newer over HTTPS — not something Ambikly adds. Create one under <span class="screen-path">Users → Profile → Application Passwords</span> for a user who holds the capability the route requires.

```bash
curl -u 'storemanager:abcd EFGH ijkl MNOP qrst UVWX' \
  'https://example.com/wp-json/ambikly/v1/orders?per_page=5&status=processing'
```

```bash
curl -u 'storemanager:abcd EFGH ijkl MNOP qrst UVWX' \
  -X POST 'https://example.com/wp-json/ambikly/v1/products' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Blue Mug","price":18.00,"sku":"MUG-BLUE","status":"published"}'
```

Application Passwords are per-user and revocable individually. Revoking one does not affect the user's real password or their other application passwords.

::: danger Treat an application password as a full credential
It carries every capability the user has, on every REST endpoint on the site, not just Ambikly's. Create a dedicated user with the narrowest role that works — usually Support Agent for read-only integrations, Store Manager for write ones — rather than reusing an administrator.
:::

### What is not supported

- No bearer tokens, no OAuth, no JWT.
- No per-application scopes. Access is whatever the authenticating user's capabilities allow.
- No separate API rate limiting. Standard WordPress and host-level limits apply.

## Capabilities and permission callbacks

Every Ambikly route declares a `permission_callback`. There are two Ambikly capabilities, held by two custom roles plus Administrator.

| Capability | Granted to | Means |
|---|---|---|
| `ambikly_manage_store` | Administrator, Store Manager | Full read and write on store operations |
| `ambikly_view_store` | Administrator, Store Manager, Support Agent | Read-only store access |

Routes resolve those through a small set of named callbacks. Both `BaseController` (the legacy controllers) and `RestController` (the newer ones) expose the same helpers.

| Callback | Passes when | Typical routes |
|---|---|---|
| `store_permission()` | `ambikly_manage_store` or `manage_options` | Every create, update and delete on products, orders, customers, coupons, categories, variations, attributes, tax rates, shipping, reviews; `POST /jobs/{id}/retry` |
| `store_view_permission()` | `ambikly_view_store`, or anything `store_permission()` passes | Every admin list and detail read: products, orders, customers, coupons, categories, companies, reports, downloads for an order or customer, `GET /jobs/status`, `GET /jobs/failed` |
| `admin_permission()` / `check_permissions()` | `manage_options` only | Settings, payment gateway config, webhooks, system status, import/export, email templates, the setup wizard steps |
| `customer_permission()` | Any logged-in user | `GET /account/downloads`, the `/companies/me*` self-service routes |
| `public_permission()` / `__return_true` | Everyone, including logged out | Cart, checkout, storefront reads, gateway callbacks, token-gated documents |

`admin_permission()` and `check_permissions()` are identical in effect — `current_user_can('manage_options')`. The two names are an artifact of the two controller base classes.

::: tip Which capability a route needs
The [Endpoint reference](/developers/endpoints) lists the permission callback for every single route, and flags the ones that require no authentication at all.
:::

## The response envelope

Every successful Ambikly response is a JSON object with a `success` key. It is not a bare resource, and it is not core's standard REST shape.

### Success

Controllers extending `BaseController` return `success`, `message` and `data`:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": 42,
    "name": "Blue Mug",
    "sku": "MUG-BLUE",
    "price": "18.00",
    "status": "published"
  }
}
```

Controllers extending `RestController` return `success` and `data`, with no `message`:

```json
{
  "success": true,
  "data": {
    "id": 1044,
    "order_number": "AMB-1044",
    "status": "processing",
    "total": "63.50",
    "currency": "USD"
  }
}
```

A response with nothing to return omits `data` entirely — a successful `DELETE /webhooks/12` is just `{"success":true}`.

::: warning `success_response()` always returns HTTP 200
`BaseController::success_response()` accepts a `$status` argument but never applies it. Every response it produces is HTTP 200, whatever status the calling code asked for. Do not treat a `201` as meaning "created" — you will not see one. Branch on the body's `success` key and on the presence of an error `code`, not on the numeric status of a successful call.
:::

### Errors

Errors are `WP_Error` objects, serialized by core into its standard error shape. There is no `success: false` envelope — an error body has no `success` key at all.

```json
{
  "code": "missing_fields",
  "message": "Missing required fields: name, price",
  "data": {
    "status": 400,
    "data": { "missing_fields": ["name", "price"] }
  }
}
```

The HTTP status is real on errors — `data.status` matches it. The nested `data.data` is present only when the controller attached extra context.

### Handling both shapes

```js
async function ambikly(path, options = {}) {
  const res = await fetch(`${AcmeStore.root}${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': AcmeStore.nonce },
    ...options,
  });
  const body = await res.json();
  if (body.code && body.message) {
    throw new Error(`${body.code}: ${body.message}`);
  }
  return body;
}
```

## Pagination

**Pagination is body-only.** Ambikly never sends `X-WP-Total` or `X-WP-TotalPages` headers. If you are porting code from another WordPress REST client that reads those headers, it will see nothing.

A paginated list response puts the counts alongside `data`:

```json
{
  "success": true,
  "total": 214,
  "page": 3,
  "per_page": 25,
  "total_pages": 9,
  "data": [
    { "id": 1044, "order_number": "AMB-1044", "status": "processing" },
    { "id": 1043, "order_number": "AMB-1043", "status": "completed" }
  ]
}
```

| Field | Meaning |
|---|---|
| `total` | Total rows matching the filters, across all pages |
| `page` | The page you asked for (1-based) |
| `per_page` | Rows per page actually used |
| `total_pages` | `ceil(total / per_page)` |

To walk a whole collection, request page 1 and keep going while `page < total_pages`.

```bash
curl -u 'user:app password' \
  'https://example.com/wp-json/ambikly/v1/products?page=1&per_page=100' \
  | python3 -c 'import json,sys; b=json.load(sys.stdin); print(b["page"], "of", b["total_pages"], "-", b["total"], "products")'
```

### Per-page defaults

Defaults differ by controller, and only some of them clamp the maximum.

| Route | Default `per_page` | Maximum |
|---|---|---|
| `GET /products` | 50 | not clamped |
| `GET /categories` | 100 | not clamped |
| `GET /orders` | 25 | set by the repository |
| `GET /customers` | 25 | set by the repository |
| `GET /coupons` | 25 | set by the repository |
| `GET /companies` | 25 | set by the repository |
| `GET /reviews` | 25 | 100 |
| `GET /customers/{id}/orders` | 100 | 100 |

Routes not listed here return a complete list with no pagination at all — `GET /webhooks`, `GET /tax/rates`, `GET /shipping/zones`, `GET /tags`, `GET /brands` and the reports endpoints all return every row.

`GET /webhooks/{id}/deliveries` and `GET /jobs/failed` each return a fixed, unpaginated most-recent 200 rows.

## Common query parameters

Collection endpoints share a common vocabulary.

| Parameter | Type | Applies to | Notes |
|---|---|---|---|
| `page` | int | All paginated lists | 1-based, defaults to 1 |
| `per_page` | int | All paginated lists | See the table above |
| `search` | string | Products, categories, orders, customers, coupons, companies, reviews | Substring match |
| `status` | string | Products, categories, orders, coupons, reviews, exports | Exact match |
| `orderby` | string | Products, categories, orders, customers, coupons | Allow-listed per controller; an unknown value falls back to the default |
| `order` | `ASC`\|`DESC` | Same as `orderby` | Anything else falls back to the default |

Controller-specific filters:

| Parameter | Route | Notes |
|---|---|---|
| `category_id` | `GET /products` | Pass `all` to skip the filter |
| `type` | `GET /products`, `GET /export/products` | Product type |
| `parent_id` | `GET /categories` | Restrict to one parent |
| `payment_status` | `GET /orders` | Independent of `status` |
| `customer_id` | `GET /orders` | Orders for one customer |
| `date_from`, `date_to` | `GET /orders` | `YYYY-MM-DD` |
| `product_id` | `GET /reviews` | Reviews for one product |
| `ids` | `GET /export/products` | Comma-separated id list |
| `format` | `GET /orders/{id}/invoice` | `html` (default) or `pdf` |
| `token` | `GET /orders/{id}/invoice`, `GET /orders/{id}/packing-slip` | Grants access without being logged in |

`GET /products` accepts `orderby` values `id`, `name`, `sku`, `price`, `stock_quantity`, `status`, `type`, `created_at`, `updated_at` — default `created_at DESC`.

`GET /categories` accepts `id`, `name`, `slug`, `parent_id`, `sort_order`, `status`, `created_at`, `updated_at` and the computed `products` count — default `sort_order ASC`.

## Error codes

`code` values are stable strings. The most common ones:

| Code | Status | Meaning |
|---|---|---|
| `missing_fields` | 400 | One or more required fields absent or empty; `data.data.missing_fields` lists them |
| `invalid_sale_price` | 400 | A sale price was not lower than the regular price |
| `duplicate_sku` | 400 | The SKU is already used by another product or variation |
| `invalid_url` | 400 | A webhook URL was not a valid `http`/`https` URL |
| `not_found` | 404 | No record with that id |
| `order_not_found` | 404 | No order with that id |
| `database_error` | 500 | The underlying `$wpdb` write failed |
| `license_required` | 403 | Enabling a Pro add-on without a valid license |

Core adds its own codes on top: `rest_no_route` (404), `rest_forbidden` (401 or 403), `rest_cookie_invalid_nonce` (403), `rest_invalid_param` (400).

## Reading the order status vocabulary

Do not hard-code status strings. `GET /orders/statuses` returns the store's live vocabulary for both order status and payment status:

```bash
curl -u 'user:app password' \
  'https://example.com/wp-json/ambikly/v1/orders/statuses'
```

```json
{
  "success": true,
  "data": {
    "order_statuses": { "pending": "Pending", "processing": "Processing", "completed": "Completed" },
    "payment_statuses": { "pending": "Pending", "paid": "Paid", "refunded": "Refunded" }
  }
}
```

## Next

The [Endpoint reference](/developers/endpoints) lists every route in both namespaces, grouped by resource, with the permission each one requires.
