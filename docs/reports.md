---
title: Reports
description: The four built-in reports — summary, sales by day, top products and status breakdown — what each measures, how date ranges work, and which statuses are excluded from revenue.
prev:
  text: "B2B companies & Net Terms"
  link: /b2b-companies
next:
  text: "Blocks & store pages"
  link: /blocks
---

# Reports

Ambikly ships four reports, all computed directly from the orders table at request time. There are no rollup tables, no nightly aggregation job and nothing to rebuild — what you see always reflects the current state of your orders.

## The Reports screen

Open <span class="screen-path">Ambikly → Reports</span>. The screen is one date range applied to four panels:

- Four stat tiles — gross sales, net sales, orders, unique customers.
- A **Sales by day** bar chart.
- An **Order status** breakdown with proportional bars.
- A **Top products** table.

All four reload together whenever you change the range.

## Date handling

### Presets

| Preset | Range |
|---|---|
| Last 7 days | Today minus 7 days, through today |
| Last 30 days | Today minus 30 days, through today — the default |
| Last 90 days | Today minus 90 days, through today |
| This month | The 1st of the current month through today |
| This year | 1 January of the current year through today |
| Custom… | Two date pickers; nothing loads until both are filled |

Ranges are built from **local** date components, not UTC, so the boundary day is correct outside UTC. Each range starts at `00:00:00` on the from-date and ends at `23:59:59` on the to-date, and both ends are inclusive.

If you send no range at all to the API, it defaults to the last 30 days.

### Compare to previous period

Tick **Compare to previous period** and each stat tile gains a percentage delta, and the sales chart gains a ghost series behind the current bars.

The comparison range is the same number of days, ending one second before the current range begins. A rise is green and a fall is red. When the previous period was zero the delta is suppressed rather than shown as an infinite increase.

### Export CSV

**Export CSV** downloads the whole screen — the range, the summary figures, the daily rows, the top products and the status breakdown — as one CSV, named with a timestamp. It exports exactly what is on screen for the current range.

## Which orders count

This is the single most important thing to understand about these numbers.

| Status | Counted in summary, sales by day, top products |
|---|---|
| `pending` | Yes |
| `processing` | Yes |
| `on-hold` | Yes |
| `completed` | Yes |
| `refunded` | **Yes** |
| `cancelled` | **No** |
| `failed` | **No** |

Only `cancelled` and `failed` are excluded. Those orders never transacted at all, so counting them would overstate every figure.

`refunded` is deliberately **included**. A refunded order represents a real sale that really happened — net sales already subtracts the refunded amount, so excluding the order entirely would double-count the reversal. It would also produce visibly contradictory dashboards: the customer would still be counted while their order and its revenue vanished.

The status breakdown report is the exception — it counts **every** status, including cancelled and failed, because its whole purpose is to show you the distribution.

<div class="ui-tip"><strong>Tip:</strong> Orders are bucketed by <code>created_at</code>, not by when they were paid or completed. A December order paid in January counts as December revenue.</div>

## Summary

Route: `GET /ambikly/v1/reports/summary`

One row of aggregates over the range.

| Figure | How it is computed |
|---|---|
| `total_orders` | Count of qualifying orders |
| `gross_sales` | Sum of `total` |
| `net_sales` | Sum of `total` minus sum of `total_refunded` |
| `refunds` | Sum of `total_refunded` |
| `taxes` | Sum of `tax_total` |
| `shipping` | Sum of `shipping_total` |
| `discounts` | Sum of `discount_total` |
| `average_order_value` | Average of `total` |
| `unique_customers` | Count of distinct `customer_id` |

The screen surfaces four of these as tiles: gross sales, net sales, orders and unique customers. The rest come back in the API response and in the CSV export.

Two things to note:

- **Average order value is gross, not net.** It averages `total` and ignores refunds.
- **`unique_customers` counts distinct customer ids.** Guest orders carry no customer id and are therefore not counted as customers, though their revenue is included in sales.

## Sales by day

Route: `GET /ambikly/v1/reports/sales-by-day`

One row per calendar day that had at least one qualifying order, ascending.

| Field | Meaning |
|---|---|
| `day` | The date, from `DATE(created_at)` |
| `orders` | Order count that day |
| `gross` | Sum of `total` |
| `net` | Sum of `total` minus `total_refunded` |

Days with no orders are **omitted**, not returned as zeroes. The chart plots whatever days come back, so a quiet store produces a chart with uneven spacing rather than a flat line.

The chart plots the **net** figure. Every bar is keyboard-focusable and labelled, there is a visually hidden data table behind it for screen readers, and the y-axis ticks are formatted in the store's currency.

<div class="ui-warn"><strong>Careful:</strong> Daily bucketing uses <code>created_at</code>, which is stamped by the database server's own timezone rather than the site's. If the two disagree, an order placed near midnight can land on the neighbouring day here, or fall just outside a "Last 7 days" boundary you expected it inside.</div>

## Top products

Route: `GET /ambikly/v1/reports/top-products`

The best sellers in the range, **ordered by revenue**, not by units. Ten rows by default; the `limit` parameter accepts any count.

| Field | Meaning |
|---|---|
| `product_id` | The product |
| `name` | The product's **current** name, falling back to the last order-item snapshot if the product has since been deleted |
| `quantity_sold` | Sum of line quantities |
| `revenue` | Sum of `line_total` |

Rows are grouped by product id, not by the name on each order item. An order item stores the product's name as it was at checkout, so grouping by name would split a renamed product's sales across two rows and could knock a genuine top seller off the list entirely. Grouping by id fixes the aggregation, and joining the live product name means a renamed product shows its current name here.

Order items with no `product_id` — an upsell line, a manually named item — are excluded.

## Status breakdown

Route: `GET /ambikly/v1/reports/status-breakdown`

One row per status present in the range.

| Field | Meaning |
|---|---|
| `status` | The status slug |
| `total` | Number of orders |
| `revenue` | Sum of `total` for that status |

**No status is excluded from this report.** Cancelled and failed orders appear here even though they are excluded everywhere else, which is the point — this is where you see how much of your order flow is failing.

The screen renders the count and a proportional bar per status. The `revenue` figure comes back in the API response but is not shown on screen.

<div class="ui-tip"><strong>Tip:</strong> A large <code>failed</code> slice usually means a payment gateway problem rather than a customer problem. Check <a href="/payments">Payments overview</a>.</div>

## Reading the numbers correctly

A few combinations trip people up:

- **Gross minus net does not equal refunds for a single order** — it does across the range, because `refunds` is exactly the sum being subtracted.
- **Summary order count and status-breakdown totals differ** when the range contains cancelled or failed orders. That is expected: the breakdown counts them, the summary does not.
- **Top-products revenue does not sum to gross sales.** Line totals exclude shipping and tax and, for a discounted order, reflect the line-level discount rather than the order-level one.
- **Net sales can be negative** for a range where refunds against orders in that range exceed their sales, because a refund is attributed to the original order's date, not to the date the refund was issued.

## Permissions

All four reports require only `ambikly_view_store`. A Support Agent can read every report but change nothing. See [Roles & permissions](/roles).

## For developers

| Method | Route | Permission | Parameters |
|---|---|---|---|
| GET | `/ambikly/v1/reports/summary` | `ambikly_view_store` | `from`, `to` |
| GET | `/ambikly/v1/reports/sales-by-day` | `ambikly_view_store` | `from`, `to` |
| GET | `/ambikly/v1/reports/top-products` | `ambikly_view_store` | `from`, `to`, `limit` |
| GET | `/ambikly/v1/reports/status-breakdown` | `ambikly_view_store` | `from`, `to` |

`from` and `to` are MySQL datetime strings, `YYYY-MM-DD HH:MM:SS`. Both are optional; omitting them gives the last 30 days.

```bash
curl 'https://example.com/wp-json/ambikly/v1/reports/summary?from=2026-01-01%2000:00:00&to=2026-01-31%2023:59:59' \
  -H 'X-WP-Nonce: <nonce>'
```

```bash
curl 'https://example.com/wp-json/ambikly/v1/reports/top-products?limit=25' \
  -H 'X-WP-Nonce: <nonce>'
```

Responses use the standard envelope with the payload under `data`. These four endpoints are not paginated. See [Endpoint reference](/developers/endpoints).

For anything the built-in reports do not cover, query the `ambikly_orders` and `ambikly_order_items` tables directly — the schema is documented in [Database schema](/developers/database) — or export with `wp ambikly export orders`, covered in [WP-CLI](/developers/wp-cli).

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Cohort retention and RFM segmentation</span></div>
  <p class="pro-callout__desc">Advanced Reports adds cohort revenue retention by first-purchase month, RFM scoring that buckets every customer into named segments, a top-customers ranking by net spend, and date-ranged CSV exports of orders and customers. Its panels appear inline below the built-in reports on this same screen.</p>
  <a class="pro-callout__cta" href="/addons/advanced-reports">See Advanced Reports →</a>
</div>

## Where to go next

- [Orders](/orders) — the statuses these reports count and exclude.
- [Refunds & cancellations](/refunds) — how a refund moves gross and net.
- [System status](/system-status) — when the numbers look wrong for environmental reasons.
- [Advanced Reports](/addons/advanced-reports) — cohorts, RFM and exports.
