---
title: Reviews
description: Moderating product reviews in Ambikly — the Reviews screen, the auto-approve rule, verified-purchase detection, the storefront form and the public REST routes.
prev:
  text: Import & export (CSV)
  link: /import-export
next:
  text: Cart & checkout
  link: /cart-checkout
---

# Reviews

Customers leave a star rating, a title and a review on any published product. Reviews go to moderation unless they meet a specific test, and you approve them from one screen.

## Turning reviews on and off

Reviews are on by default.

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Settings → Store</span>.</li>
  <li>Scroll to the <strong>Product Features</strong> group.</li>
  <li>Toggle <strong>Enable Product Reviews</strong>.</li>
  <li>Save the settings page.</li>
</ol>

Turning it off does two things: the storefront stops rendering the reviews section on product pages, and the public submission endpoint starts refusing with `reviews_disabled` and HTTP 403. Existing reviews stay in the database and stay visible in the admin.

## The Reviews screen

Open <span class="screen-path">Ambikly → Reviews</span>.

### Filters and search

Five filter pills across the top: **Pending**, **Approved**, **Spam**, **Trash** and **All**. The screen opens on Pending. Each pill except All shows a live count, refreshed after every moderation action so the numbers never go stale.

The search box matches `author_name`, `author_email`, `title` and `content`, debounced at 250 ms.

The list shows 25 reviews per page.

### Columns

| Column | Sortable | Contents |
|---|---|---|
| Author | No | Name, email, submitting IP, and a **Verified** pill when the review is a verified purchase. |
| Rating | Yes | Five stars, announced to screen readers as "4 out of 5 stars". |
| Review | Yes (by date) | Title, then the body. Anything over 240 characters collapses to three lines with a **Show more** toggle. The submission date sits underneath. |
| Product | No | A link straight to that product's editor. |
| Status | Yes | Pending / Approved / Spam / Trash pill. |
| Actions | — | See below. |

The API also accepts sorting by `author_name`, though the screen does not expose it.

### Moderating one review

| Button | Shown when | Effect |
|---|---|---|
| Approve | Status is not Approved | Publishes the review on the storefront. |
| Unapprove | Status is Approved | Returns it to Pending and pulls it off the storefront. |
| Spam | Status is not Spam | Marks it as spam. |
| Delete (trash icon) | Always | Permanently removes the row after a confirmation dialog. |

Delete is permanent — it removes the database row, unlike **Trash**, which is a status you can move back out of.

### Bulk actions

Tick rows to reveal the bulk bar. The available buttons change with the active filter: the action matching the filter you are already viewing is hidden.

| Action | Effect |
|---|---|
| Approve | Sets status to `approved`. |
| Mark pending | Sets status to `pending`. |
| Spam | Sets status to `spam`. |
| Trash | Sets status to `trash`. |
| Delete | Permanently removes the rows, after confirmation. |

A bulk status change reports the number affected and refreshes both the list and the pill counts.

## Review statuses

| Status | On the storefront | Notes |
|---|---|---|
| `pending` | Hidden | The default for anything that does not auto-approve. |
| `approved` | Visible, and counted in the rating summary | |
| `spam` | Hidden | A moderation bucket. Nothing is deleted automatically. |
| `trash` | Hidden | A moderation bucket. Rows stay until you delete them. |

Only `approved` reviews are returned by the public endpoints, rendered on product pages, or included in the average rating and the star display anywhere on the storefront.

## Where a review comes from

The public endpoint is `POST /ambikly/v1/reviews`. The storefront form posts to it, and so does anything else you build.

### What is required

| Field | Required | Notes |
|---|---|---|
| `product_id` | Yes | Must match an existing product, or the request returns `product_not_found` (404). |
| `content` | Yes | Empty content returns `empty_content` (400). Sanitized as a textarea. |
| `rating` | No | Clamped to 1–5. Defaults to 5 when absent. |
| `title` | No | Sanitized and truncated to 255 characters so an oversized value cannot fail the insert. |
| `author_name` | For guests only | Logged-in users get their WordPress display name. |
| `author_email` | For guests only | Logged-in users get their WordPress account email. |
| `website` | Never | A honeypot. See below. |

Missing name or email on a guest submission returns `missing_identity` (400).

### Spam and abuse controls

| Control | Behavior |
|---|---|
| Honeypot | A hidden `website` field. Any non-empty value returns `spam_detected` (400). Real visitors never see it — it is hidden with CSS and carries `tabindex="-1"`. |
| Rate limit | One submission per IP-and-email pair per 60 seconds. A faster second attempt returns `rate_limited` (429). |
| Duplicate check | The same `author_email` cannot review the same product twice. A second attempt returns `duplicate_review` (400). |
| IP capture | Recorded on every review and shown in the moderation list, so a burst from one address is visible. |

The IP is read from the first of `HTTP_CF_CONNECTING_IP`, `HTTP_X_FORWARDED_FOR` or `REMOTE_ADDR` that is set, taking the value before the first comma.

There is no CAPTCHA and no third-party spam service in the free core.

## Verified purchases

A review is flagged as a verified purchase when an order item for that product exists on an order whose `customer_email` matches the review's email **and** whose payment status is `paid` or `partially-paid`.

The flag is computed once, at submission time, and stored on the review row. It does not re-evaluate later.

Guests can earn the badge: the check is on the email address, not on being logged in. That is intentional — the badge is informational, and an unverified guest review still goes to moderation like any other.

On the storefront an approved review with the flag renders a **Verified purchase** label next to the author's name. In the admin it renders as a **Verified** pill.

## The auto-approve rule

```php
$autoApprove = apply_filters(
    'ambikly_review_auto_approve',
    $userId && $verified === 1,
    $pid,
    $params
);
```

By default a review is published immediately only when **both** are true:

- The submitter is **logged in**, so WordPress itself has authenticated the email address, and
- that email has a **verified purchase** of this product.

Everything else goes to Pending.

The login requirement is what makes the rule safe. Verification alone matches on a guest-supplied email, so anyone who happened to know a real customer's address could otherwise publish instantly and carry a Verified Purchase badge with it.

### Changing the rule

`ambikly_review_auto_approve` is a standard filter. Arguments: the computed boolean, the product ID, and the raw request parameters.

```php
// Auto-approve every 4- and 5-star review from a verified buyer,
// logged in or not.
add_filter( 'ambikly_review_auto_approve', function ( $approve, $product_id, $params ) {
    return $approve;
}, 10, 3 );
```

Return `false` to force everything through moderation, or widen the condition to suit your store. See [Hooks & filters](/developers/hooks).

A saved review also fires `do_action('ambikly_review_submitted', $review)`.

## On the storefront

### The reviews section

Every published product page ends with a **Reviews** section, provided Enable Product Reviews is on. It renders, in order:

1. **The summary.** Star row, the average to one decimal, and "based on N review(s)". When there are no approved reviews it reads *No reviews yet — be the first.*
2. **The list.** Up to 20 approved reviews, newest first. Each shows the author name, a Verified purchase label when applicable, a star row, the optional title, the body and the date.
3. **The form.**

Stars render to the nearest half star.

### The review form

| Field | Notes |
|---|---|
| Rating | A select whose first option is a disabled *Select a rating…* placeholder, so an untouched form cannot silently submit 5 stars. Required. |
| Title | Optional. |
| Review | Required textarea. |
| Name, Email | Shown to guests only. Logged-in users have both taken from their account. |
| Website | The hidden honeypot. |

After submitting, the notice line under the button reports the outcome. A review that did not auto-approve does not appear in the list until you approve it.

### Ratings elsewhere

The average rating and review count also appear:

- On product cards in the shop grid, search results and the "You may also like" row — only when the product has at least one approved review. These counts are fetched for the whole page in one query rather than one per card.
- On the product page as `schema.org` `AggregateRating` markup, with `ratingValue` and `reviewCount`.

## The reviews block

`ambikly/reviews` renders approved reviews anywhere in the block editor or a block theme.

| Attribute | Type | Default | Effect |
|---|---|---|---|
| `productId` | integer | `0` | `0` pulls reviews from every product. |
| `count` | integer | `5` | Clamped to 1–50. |
| `minRating` | integer | `0` | `0` means no minimum. Clamped to 0–5. |
| `showSummary` | boolean | `true` | Prints an average-and-count header above the list. |

The block outputs a star row, optional title, body, author and date per review, each wrapped in `schema.org/Review` markup. With no matching reviews it prints *No reviews yet.*

<div class="ui-warn"><strong>Careful:</strong> like every Ambikly block, this one is server-rendered only. There is no editor script and no inspector panel, so its attributes cannot be set from the block editor sidebar — it renders correctly on the front end but appears as a generic block while you edit. See <a href="/blocks">Blocks &amp; store pages</a>.</div>

## REST routes

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/reviews` | View store |
| `POST` | `/ambikly/v1/reviews` | **Public** |
| `PUT` | `/ambikly/v1/reviews/{id}` | Manage store |
| `DELETE` | `/ambikly/v1/reviews/{id}` | Manage store |
| `POST` | `/ambikly/v1/reviews/bulk` | Manage store |
| `GET` | `/ambikly/v1/products/{id}/reviews` | **Public** |
| `GET` | `/ambikly/v1/products/{id}/reviews/summary` | **Public** |

### Listing reviews (admin)

`GET /reviews` accepts `status`, `product_id`, `search`, `per_page` (default 25, capped at 100), `page`, `orderby` (`created_at`, `rating`, `status`, `author_name`) and `order`. Pagination comes back in the body as `total`, `page`, `per_page` and `total_pages`.

### Public product reviews

`GET /products/{id}/reviews` returns up to **100** approved reviews for that product, newest first, with `id`, `author_name`, `rating`, `title`, `content`, `verified_purchase`, `helpful_count` and `created_at`. It is unauthenticated and exposes no email addresses, user IDs or IPs.

<div class="ui-tip"><strong>Note:</strong> <code>helpful_count</code> is a real column and is returned here, but nothing in the free core ever increments it and no surface renders it. There is no "was this helpful?" control.</div>

### Rating summary

`GET /products/{id}/reviews/summary` returns:

```json
{
  "success": true,
  "data": {
    "total": 42,
    "average": 4.31,
    "distribution": { "5": 25, "4": 11, "3": 4, "2": 1, "1": 1 }
  }
}
```

`average` is rounded to two decimals and counts approved reviews only. `distribution` is the count per star value.

This is the endpoint to use for a rating breakdown bar — the free-core storefront prints the average and the total, but does not render the distribution itself.

### Updating and bulk-updating

`PUT /reviews/{id}` accepts `status` (one of the four values), `rating` (clamped 1–5), `title` and `content`.

`POST /reviews/bulk` takes `{ "action": "...", "ids": [1,2,3] }` where `action` is `approve`, `pending`, `spam`, `trash` or `delete`. It returns `affected`. An unknown action returns `invalid_action`, and an empty `ids` array returns `no_ids`.

## Errors

| Code | HTTP | Cause |
|---|---|---|
| `reviews_disabled` | 403 | Enable Product Reviews is off. |
| `spam_detected` | 400 | The honeypot field was filled in. |
| `missing_product` | 400 | No `product_id`. |
| `product_not_found` | 404 | No product with that ID. |
| `empty_content` | 400 | No review body. |
| `missing_identity` | 400 | A guest submitted without a name or email. |
| `rate_limited` | 429 | Another review from the same IP and email within 60 seconds. |
| `duplicate_review` | 400 | That email already reviewed this product. |
| `save_failed` | 500 | The database write failed. The real cause is in the PHP error log. |

## Limits worth knowing

- Reviews cannot be replied to. There is no store-owner response field.
- There is no review-request email. Nothing prompts a customer to leave one.
- Reviews cannot be imported or exported by CSV.
- A review's `verified_purchase` flag is fixed at submission time and is not re-checked if the order changes later.
- Deleting a product deletes its reviews along with it.
- A customer cannot edit or delete their own review from the storefront.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Every review lands in Pending | Expected unless the submitter was logged in **and** had a verified purchase. Use the `ambikly_review_auto_approve` filter to widen it. |
| A verified buyer's review still went to Pending | They were not logged in. Verification alone is not enough. |
| The Verified badge is missing on an obvious buyer | The review email does not match the order's `customer_email`, or the order's payment status is not `paid` or `partially-paid`. |
| The reviews section vanished from product pages | Enable Product Reviews is off in <span class="screen-path">Ambikly → Settings → Store</span>. |
| A customer got "You have already reviewed this product." | One review per email per product. Delete the old one to let them resubmit. |
| A customer got a 429 | The 60-second per-IP-and-email throttle. Ask them to wait and retry. |
| Approving a review did not change the average | The average counts approved reviews only and is computed live — reload the product page. |
| The block shows nothing in the editor | Blocks are server-rendered with no editor UI. Preview the front end. |

## Next

- [Cart & checkout](/cart-checkout) — what happens after the customer decides to buy.
- [Blocks & store pages](/blocks) — placing the reviews block.
- [Hooks & filters](/developers/hooks) — `ambikly_review_auto_approve` and `ambikly_review_submitted`.
