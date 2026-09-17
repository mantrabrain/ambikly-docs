---
title: Webhooks
description: Ambikly's nine outbound webhook events, the signed JSON envelope, HMAC-SHA256 signature verification in PHP and Node, and the retry, timeout and log-retention behavior.
prev:
  text: Hooks & filters
  link: /developers/hooks
next:
  text: WP-CLI
  link: /developers/wp-cli
---

# Webhooks

A webhook pushes a store event to an HTTPS endpoint you control. Use one when an external system — a fulfillment service, an ERP, a Slack relay, a data warehouse — needs to know about orders without polling the [REST API](/developers/rest-api).

Ambikly signs every delivery, queues it rather than sending it inline, and retries it with backoff for up to eight attempts.

## Creating a webhook

### From the admin

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Webhooks</span>.</li>
  <li>Click <strong>New webhook</strong>.</li>
  <li>Enter the <strong>URL</strong>. It must be <code>http</code> or <code>https</code> — any other scheme is rejected.</li>
  <li>Give it a <strong>Name</strong>. Leave it blank and the hostname is used.</li>
  <li>Pick the <strong>Events</strong> that should trigger a delivery.</li>
  <li>Save, then use <strong>Copy secret</strong> straight away — it is shown once.</li>
  <li>Click <strong>Test</strong> to confirm your receiver responds with a 2xx.</li>
</ol>

Webhook management requires `manage_options`. A Store Manager cannot reach this screen.

### From the REST API

```bash
curl -u 'admin:app password' \
  -X POST 'https://example.com/wp-json/ambikly/v1/webhooks' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Fulfillment bridge",
    "url": "https://ops.acme.example/hooks/ambikly",
    "events": ["order.paid", "order.status_changed"],
    "active": 1
  }'
```

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Fulfillment bridge",
    "url": "https://ops.acme.example/hooks/ambikly",
    "secret": "kQ3nXv8pR2tYwL6mHgJzD4sFbN9cA1eU7oP0iK5lQ2s",
    "events": ["order.paid", "order.status_changed"],
    "active": true,
    "last_fired_at": null,
    "last_status": 0,
    "failure_count": 0
  }
}
```

Omit `secret` and a 32-byte base64url secret is generated for you. Omit `events` and the webhook is created subscribed to nothing.

Subscribe to everything, including events added in future versions, with the wildcard:

```json
{ "events": ["*"] }
```

### The secret is shown once

`POST /webhooks` returns the real secret in its response body. Every later read masks it — `GET /webhooks` and `GET /webhooks/{id}` replace all but the last four characters with bullets, so you can confirm which secret is configured but not recover it.

::: danger Rotation means delete and recreate
`PUT /webhooks/{id}` explicitly discards any `secret` in the request body. There is no rotate endpoint and no admin control for it. To change a secret, delete the webhook and create a new one — which also deletes its delivery log. Plan a brief window where your receiver accepts either the old or the new secret.
:::

## Events

Nine events. `GET /webhooks/events` returns the live catalog.

| Event | Underlying action | `data` keys |
|---|---|---|
| `order.created` | `ambikly_order_created` | `order` |
| `order.paid` | `ambikly_order_paid` | `order` |
| `order.status_changed` | `ambikly_order_status_changed` | `order`, `old_status`, `new_status` |
| `order.refunded` | `ambikly_order_refunded` | `order`, `refund` |
| `checkout.completed` | `ambikly_checkout_completed` | `order`, `payment` |
| `review.submitted` | `ambikly_review_submitted` | `review` |
| `subscription.renewed` | `ambikly_subscription_renewed` | `subscription`, `renewal_order` |
| `subscription.cancelled` | `ambikly_subscription_cancelled` | `subscription` |
| `subscription.renewal_failed` | `ambikly_subscription_renewal_failed` | `subscription`, `renewal_order`, `error_code`, `error_message` |

Each `data` key holds a flattened array of the corresponding model. Class names never appear on the wire.

### Order payloads carry their line items

An `order` object is decorated with an `items` array so you do not need a second API call to know what was bought.

### Fields that are never sent

Keys named `secret`, `password`, `pin_hash` or `webhook_secret` are stripped recursively from every payload before it is sent. A gift card's PIN hash and a webhook's own secret can never leak through a delivery.

::: warning `subscription.*` events need Ambikly Pro
All nine events are subscribable in the free core, but the three `subscription.*` ones hook actions that only Ambikly Pro's Subscriptions add-on emits. Subscribing to them on a free-only site is accepted and simply never fires. They deliver only when the Subscriptions add-on is enabled **and** the Pro license is currently valid — a lapsed license stops the add-on booting, which stops the events.
:::

### `checkout.completed` can carry a null payment

The underlying action fires twice, and the thank-you page path for redirect gateways (Stripe, PayPal) passes `null` as the payment. Your receiver will see `"payment": null` for those. Handle it.

## The envelope

Every delivery is a `POST` with a JSON body in this exact shape:

```json
{
  "id": "evt_9f2b41c8ad7e5301b6c2f4a9",
  "event": "order.paid",
  "created_at": "2026-03-14T09:21:07+00:00",
  "data": {
    "order": {
      "id": 1044,
      "order_number": "AMB-1044",
      "status": "processing",
      "payment_status": "paid",
      "currency": "USD",
      "subtotal": "58.00",
      "shipping_total": "5.50",
      "tax_total": "0.00",
      "total": "63.50",
      "customer_email": "buyer@example.com",
      "payment_method": "stripe",
      "payment_method_title": "Credit card",
      "created_at": "2026-03-14 09:20:55",
      "items": [
        {
          "id": 2210,
          "product_id": 42,
          "name": "Blue Mug",
          "sku": "MUG-BLUE",
          "quantity": 2,
          "price": "18.00",
          "line_total": "36.00"
        }
      ]
    }
  }
}
```

`id` is unique per delivery attempt group, prefixed `evt_` followed by 24 hex characters. `created_at` is UTC in ISO 8601. A test event additionally carries `"test": true` and an `id` prefixed `evt_test_`.

### Request headers

| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `User-Agent` | `Ambikly/{version}` |
| `X-Ambikly-Event` | The dot-notation event name |
| `X-Ambikly-Signature` | `sha256=<hex>` |

## Verifying the signature

`X-Ambikly-Signature` is `sha256=` followed by the lowercase hex HMAC-SHA256 of the **raw request body**, keyed with the webhook's secret.

Two rules matter more than anything else on this page:

1. **Compute the HMAC over the raw body, before any parsing.** Decoding JSON and re-encoding it will reorder keys, change number formatting and change whitespace. The signature will not match and you will conclude the feature is broken.
2. **Compare in constant time.** `hash_equals()` in PHP, `crypto.timingSafeEqual()` in Node. A plain `===` leaks timing information that can be used to forge a signature.

### PHP

A complete, self-contained receiver:

```php
<?php
/**
 * Ambikly webhook receiver.
 * Responds 2xx only after the signature verifies.
 */

const AMBIKLY_WEBHOOK_SECRET = 'kQ3nXv8pR2tYwL6mHgJzD4sFbN9cA1eU7oP0iK5lQ2s';

// 1. Read the RAW body. Never json_decode() before verifying.
$raw = file_get_contents('php://input');

// 2. Read the header. Apache exposes it as HTTP_X_AMBIKLY_SIGNATURE.
$header = $_SERVER['HTTP_X_AMBIKLY_SIGNATURE'] ?? '';

// 3. Reject anything that is not in the documented sha256=<hex> form.
if (strpos($header, 'sha256=') !== 0) {
    http_response_code(400);
    exit('Missing or malformed signature');
}
$provided = substr($header, 7);

// 4. Compute the expected signature over the raw body.
$expected = hash_hmac('sha256', $raw, AMBIKLY_WEBHOOK_SECRET);

// 5. Constant-time comparison. hash_equals() is not optional.
if (!hash_equals($expected, $provided)) {
    http_response_code(401);
    exit('Bad signature');
}

// 6. Only now is it safe to parse.
$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    exit('Bad JSON');
}

// 7. Ignore a replay of an event id you have already processed.
if (acme_event_already_seen($payload['id'])) {
    http_response_code(200);
    exit('Already processed');
}

switch ($payload['event']) {
    case 'order.paid':
        acme_queue_fulfillment($payload['data']['order']);
        break;
    case 'order.status_changed':
        acme_sync_status(
            $payload['data']['order']['id'],
            $payload['data']['old_status'],
            $payload['data']['new_status']
        );
        break;
}

acme_mark_event_seen($payload['id']);

// 8. Any 2xx counts as success. Return quickly.
http_response_code(200);
echo 'ok';
```

### Node

```js
const express = require('express');
const crypto = require('crypto');

const SECRET = process.env.AMBIKLY_WEBHOOK_SECRET;
const app = express();

// Capture the RAW body. express.json() alone would give you a parsed
// object with no way to recover the exact bytes that were signed.
app.post(
  '/hooks/ambikly',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const header = req.get('X-Ambikly-Signature') || '';
    if (!header.startsWith('sha256=')) {
      return res.status(400).send('Missing or malformed signature');
    }

    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(req.body) // req.body is a Buffer of the raw bytes
      .digest('hex');

    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(header.slice(7), 'utf8');

    // timingSafeEqual throws on a length mismatch, so check first.
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).send('Bad signature');
    }

    const payload = JSON.parse(req.body.toString('utf8'));

    // Acknowledge fast, then do the work.
    res.status(200).send('ok');
    handle(payload).catch((err) => console.error(err));
  }
);

async function handle(payload) {
  switch (payload.event) {
    case 'order.paid':
      await queueFulfillment(payload.data.order);
      break;
    case 'order.refunded':
      await reverseFulfillment(payload.data.order, payload.data.refund);
      break;
  }
}

app.listen(3000);
```

::: warning Body parsers silently break verification
Express's `express.json()`, Rails' parameter parsing, Laravel's request handling and most API gateways consume the raw body before your handler sees it. Reach for the framework's raw-body option — `express.raw()`, `request.body` in Rails, `$request->getContent()` in Laravel — for this route specifically.
:::

## Delivery behavior

### Queued, never inline

An event does not trigger an HTTP request during the customer's checkout. The dispatcher subscribes at priority 999, so it runs after every other listener has seen the event, then enqueues a `webhook_deliver` job with `kick` enabled. A non-blocking loopback request asks the queue to run immediately instead of waiting up to a minute for the next cron tick.

The practical consequences:

- A slow or unreachable receiver never adds latency to a shopper's checkout or an admin's status change.
- Delivery order is not guaranteed. Two events fired milliseconds apart can arrive in either order. Use `created_at` or the order's own state, not arrival order.
- A very low-traffic site with no cron traffic can see the tick fall behind, because WP-Cron only runs on an incoming request.

The only synchronous send is the admin's **Test** button (`POST /webhooks/{id}/test`), which reports the real result rather than "queued".

### Retries

| Property | Value |
|---|---|
| Attempts before giving up | 8 |
| Backoff after attempt 1 | 1 minute |
| After attempt 2 | 5 minutes |
| After attempt 3 | 30 minutes |
| After attempt 4 | 2 hours |
| After attempt 5 | 6 hours |
| After attempts 6 and 7 | 24 hours each |
| Request timeout | 5 seconds |

An attempt is a failure when the request errors at the transport level, or when the response status is anything outside 200–299. A redirect that is not followed to a 2xx counts as a failure.

Roughly 56 hours elapse between the first attempt and the eighth. After the eighth failure the job is left in `ambikly_jobs` with `status = 'failed'`, visible at `GET /jobs/failed` and retryable with `POST /jobs/{id}/retry`.

Two conditions stop retrying early. If the webhook has been deleted since the job was queued, the job completes silently — there is nothing left to deliver to. If the webhook has been deactivated, the same: retries stop rather than hammering a URL nobody wants delivered to.

The webhook row itself is updated after every attempt with `last_fired_at`, `last_status` and a `failure_count` that resets to zero on any success.

### Delivery log

Every attempt is recorded in `ambikly_webhook_deliveries` — queued attempts and manual tests alike.

| Retained | Detail |
|---|---|
| Rows kept | The most recent **200 per webhook**. Older rows are deleted after each attempt |
| Readable at | `GET /webhooks/{id}/deliveries` — most recent 200, newest first |
| Request body stored | First 4096 characters |
| Response body stored | First 4096 characters |
| Error text stored | First 500 characters |
| Also stored | `status_code`, `duration_ms`, `succeeded`, `attempt`, `processed_at` |

A busy webhook rotates 200 rows quickly. Do not treat the delivery log as an audit trail — if you need one, log on your own side.

Deleting a webhook deletes its delivery log with it.

### Outbound request safety

Deliveries go out through `wp_safe_remote_post()`, WordPress core's SSRF-hardened HTTP client. It resolves the destination host and refuses loopback, private and reserved IP ranges. A webhook pointed at `127.0.0.1`, a `10.x` address or a cloud metadata endpoint will not be fetched.

This matters because response bodies are stored and returned verbatim by `GET /webhooks/{id}/deliveries`. Without the restriction, a webhook URL would be a read primitive into the host's internal network.

::: tip Testing against a local receiver
`wp_safe_remote_post()` blocks private addresses, so a service on `localhost` cannot be reached. Use a public tunnel (ngrok, Cloudflare Tunnel, or similar) and point the webhook at the public hostname.
:::

## Building a reliable receiver

| Do | Why |
|---|---|
| Return 2xx as soon as the signature verifies | The 5-second timeout is wall-clock. Slow work turns a success into a retry |
| Do the real work asynchronously | Same reason |
| De-duplicate on `id` | Retries and a redelivery after a timeout both produce the same event twice |
| Do not assume ordering | Deliveries are queued independently |
| Log the attempt number | `X-Ambikly-Event` plus the payload `id` tells you whether you are seeing a retry |
| Accept unknown event names | New events can appear in a future version, and `"*"` subscribes to them |
| Serve over HTTPS | The body contains customer email addresses and order totals |

A receiver that times out but has already done the work is the classic failure mode: Ambikly records a failure and retries, and you process the same order twice. De-duplication on `id` is what prevents that.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Signature never matches | The body is being parsed before the HMAC is computed |
| Signature never matches, raw body confirmed | The secret is wrong. It cannot be re-read after creation — delete and recreate |
| Nothing arrives at all | The webhook is inactive, not subscribed to that event, or a `subscription.*` event on a site without the Pro Subscriptions add-on |
| Nothing arrives, webhook looks correct | WP-Cron is not running. Check `GET /jobs/status` for a growing `pending` count |
| Deliveries stop after a while | Eight attempts exhausted. Check `GET /jobs/failed` |
| Test event works, real events do not | The test is synchronous; real events go through the queue. Look at the cron tick |
| `last_status` shows 0 | A transport error, not an HTTP response — DNS, TLS or the SSRF guard blocking a private address |

`GET /webhooks/{id}/deliveries` is the first place to look. It carries the status code, duration, error text and a truncated copy of both bodies for every recent attempt.

## Next

[WP-CLI](/developers/wp-cli) covers the three commands for migrations, CSV export and recomputation.
