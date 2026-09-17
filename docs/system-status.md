---
title: System status
description: Where to find Ambikly's system status report, what every field in it means, what a bad value looks like, and what to send with a support request.
prev:
  text: Troubleshooting
  link: /troubleshooting
next:
  text: FAQ
  link: /faq
---

# System status

The system status report is a read-only snapshot of everything Ambikly can see about your install:
plugin and database versions, the server environment, which tables exist and how full they are,
your core commerce settings, and the add-ons registered on the site. It is the first thing to
check when something is wrong, and the first thing to send when you ask for help.

## Where to find it

The report lives on the Tools screen, and **Tools is reachable only through the wrench icon in the
top header** of the Ambikly admin. It is not in the sidebar.

<ol class="step-list">
  <li>Open <span class="screen-path">Ambikly</span> from the WordPress admin menu.</li>
  <li>Click the wrench icon in the top-right header toolbar. This opens <span class="screen-path">Ambikly → Tools</span>.</li>
  <li>Find the <strong>System status</strong> card and click <strong>Show status</strong>.</li>
</ol>

The report is fetched live each time. Once loaded, the button becomes **Refresh** and a **Copy**
button appears next to it.

<div class="ui-tip"><strong>Tip:</strong> The same Tools screen holds product and order CSV export, and the product CSV importer. See <a href="/import-export">Import &amp; export (CSV)</a>.</div>

### Who can see it

The report requires the WordPress `manage_options` capability — in practice, an Administrator.
The Store Manager and Support Agent roles can reach most of the Ambikly admin but not this report,
because it exposes site URLs, server configuration and table contents.

### The endpoint behind it

```
GET /wp-json/ambikly/v1/system/status
```

Same permission, same payload. Useful when you want the report from a machine rather than a
browser. Like every Ambikly route it returns the body-only envelope
`{ "success": true, "data": … }`; the report itself is the `data` object.

## Reading the report

The report has five top-level sections. Each is covered below with what a healthy value looks like
and what a bad one means.

### `plugin`

Versions and whether Pro is loaded.

| Field | What it means | Bad value looks like |
|---|---|---|
| `version` | The free core's version constant, `AMBIKLY_VERSION` | `unknown` — the constant is not defined, meaning the plugin did not bootstrap properly |
| `db_version` | The database version currently recorded in the `ambikly_db_version` option | `0` — no migration has ever completed |
| `expected_db_version` | The version this code release expects | Never wrong on its own; it is the comparison that matters |
| `pro_active` | `true` when the `AMBIKLY_PRO_VERSION` constant is defined | `false` while Ambikly Pro is installed and active — Pro failed to load |

**The expected-versus-actual comparison is the important one.** If `db_version` is lower than
`expected_db_version`, your tables are behind the code that is trying to use them. Migrations run
automatically on `admin_init` and again on `plugins_loaded`, so loading any admin page once
normally closes the gap. If it persists, run the migration explicitly:

```bash
wp ambikly upgrade-db
```

A `pro_active: false` on a site where Ambikly Pro is activated usually means the free core is too
old — Pro hard-checks for free core `0.0.10` or newer and refuses to load below that.

See [Changelog](/changelog) and [WP-CLI](/developers/wp-cli).

### `environment`

The server and WordPress configuration Ambikly is running on.

| Field | What it means | Bad value looks like |
|---|---|---|
| `php_version` | The running PHP version | Below `7.4` — under Ambikly's minimum |
| `wp_version` | The WordPress version | Below `5.4` — under Ambikly's minimum |
| `mysql_version` | The database server version reported by WordPress | Very old MySQL/MariaDB builds; check with your host if `dbDelta` migrations fail |
| `memory_limit` | PHP's `memory_limit` | `64M` or lower — large CSV imports and exports will run out |
| `max_execution_time` | PHP's `max_execution_time` | `30` or lower, for a big import; `0` means unlimited, which is fine |
| `multisite` | Whether this is a WordPress multisite install | Not a problem by itself, but say so in a support request |
| `is_ssl` | Whether the current request was served over HTTPS | `false` on a live store — payment gateways and webhook receivers expect HTTPS |
| `home_url` | The site's home URL | Not matching the domain you are actually browsing — a sign of a half-finished migration |
| `site_url` | The WordPress install URL | Same |

`home_url` is also the value Ambikly Pro sends when it activates a license, so a stale or wrong
value here is a common cause of license and add-on problems after a site move. See
[Troubleshooting](/troubleshooting).

### `database`

Which of Ambikly's tables exist, and how much is in them.

| Field | What it means |
|---|---|
| `expected_tables` | The list of tables the check looks for |
| `missing_tables` | Any of those that do not exist |
| `row_counts` | A row count for each table that does exist |
| `charset_collate` | The charset and collation WordPress uses when creating tables |

The check covers sixteen tables:

`ambikly_products`, `ambikly_orders`, `ambikly_order_items`, `ambikly_customers`,
`ambikly_coupons`, `ambikly_shipping_zones`, `ambikly_tax_rates`, `ambikly_carts`,
`ambikly_downloads`, `ambikly_license_keys`, `ambikly_reviews`, `ambikly_tags`, `ambikly_brands`,
`ambikly_sessions`, `ambikly_wishlists`, `ambikly_addons`.

<div class="ui-warn"><strong>Careful:</strong> Ambikly installs 45 tables in total. This check verifies sixteen of them — the ones whose absence breaks something visible immediately. An empty <code>missing_tables</code> is good news, but it is not proof that every table exists.</div>

**What a missing table means.** Tables are created on activation and extended by migrations. A
table in `missing_tables` means activation did not complete, a migration failed, or something
dropped the table afterwards — a partial restore from backup is the usual culprit. The features
that depend on it will throw errors or silently return nothing.

The fix is to re-run the migration, which is idempotent and does not drop data:

```bash
wp ambikly upgrade-db
```

Deactivating and reactivating the plugin also re-runs table creation. If a table stays missing
afterwards, the database user probably lacks `CREATE TABLE` — ask your host.

**Reading row counts.** These are raw counts, useful as sanity checks rather than as reports:

| Table | What a surprising number tells you |
|---|---|
| `ambikly_products` | Zero on a store you thought had a catalog — check whether you are on the right database |
| `ambikly_orders` | Should track the Orders screen; a large gap suggests you are looking at the wrong install |
| `ambikly_carts` and `ambikly_sessions` | Grow with traffic; large numbers are normal on a busy store |
| `ambikly_downloads` | One row per grant (order item × file), not per product |
| `ambikly_addons` | One row per add-on ever enabled, including ones since disabled |

For what each table holds, see [Database schema](/developers/database).

### `commerce`

The core store settings as the server reads them — which is not always what a settings screen
appears to show.

| Field | What it means | Bad value looks like |
|---|---|---|
| `currency` | The store currency code | Not the currency you configured — the Store tab was never saved |
| `store_country` | The store's country | Empty, which weakens address defaults at checkout |
| `taxes_enabled` | Whether tax calculation is switched on | `false` while you expect tax to be charged — no rate will ever apply |
| `available_gateways` | The gateway ids currently available at checkout | Missing a gateway you enabled, or listing one you meant to disable |

`taxes_enabled` and `available_gateways` are the two fields most worth checking against your
expectations, because both are read at checkout time and both silently change the customer's
total. If `taxes_enabled` is `false`, no tax is charged regardless of how many rates are
configured. See [Tax](/tax) and [Payments overview](/payments).

Remember that PayPal appearing in `available_gateways` does not mean it is taking real money — it
runs against PayPal's sandbox until its `mode` setting is changed in the database, and there is no
switch for that in the admin. See [PayPal](/payments-paypal).

### `addons`

One entry per add-on row in `ambikly_addons`, sorted by slug:

| Field | What it means |
|---|---|
| `slug` | The add-on's identifier, matching its page at `/addons/{slug}` |
| `version` | The version recorded the last time it was enabled or refreshed |
| `enabled` | Whether its enabled flag is set |

This list is empty when the `ambikly_addons` table does not exist — which is itself a signal, not
a statement that no add-ons are installed.

<div class="ui-warn"><strong>Careful:</strong> <code>enabled: true</code> means the flag is set in the database, not that the add-on is currently running. Enabled add-ons are re-checked against the license on every request; if the license is not valid, they stay flagged as enabled but none of their hooks or routes register. The report will show them as enabled while nothing they do actually happens. Check <span class="screen-path">Ambikly → License</span> alongside this list.</div>

See [Managing add-ons](/addons-manage) and [All add-ons](/addons/).

## Copying the report

The **Copy** button copies the loaded report to your clipboard as pretty-printed JSON — the
`data` object exactly as it appears in the panel, indented two spaces. If the browser refuses
clipboard access, which happens on non-HTTPS origins and in some privacy configurations, you will
see a message telling you to select and copy manually. The report stays on screen, so select the
text in the panel and copy it that way.

The copied text contains your `home_url` and `site_url`, your currency and country, table row
counts and add-on slugs. It does **not** contain payment credentials, API keys, license keys or
customer data.

## What to include in a support request

The system status report answers roughly half the questions a first support reply would otherwise
have to ask. Send it, and alongside it:

| Include | Why |
|---|---|
| The full system status JSON | Versions, environment, tables, gateways, add-ons — all at once |
| What you expected and what happened | Two sentences, in that order |
| The exact error text | Copied, not paraphrased or summarized |
| The order number | If an order is involved |
| Steps to reproduce | Numbered, starting from a page anyone can open |
| The failed job or webhook delivery entry | If the problem is background work — see below |

See [Support](/support) for where to send it and what support does and does not cover.

## Companion diagnostics: the job queue

The status report does not include background-job health. Two read-only endpoints cover that, and
they are worth checking any time something that should have happened in the background did not.

| Method | Route | Permission | Notes |
|---|---|---|---|
| `GET` | `/ambikly/v1/jobs/status` | Store view | Pending, running and failed counts |
| `GET` | `/ambikly/v1/jobs/failed` | Store view | Up to 200 failed jobs, newest first |
| `POST` | `/ambikly/v1/jobs/{id}/retry` | Store manage | Re-queues one failed job |

There is no admin screen for the job queue — these endpoints are the interface.

**Reading `/jobs/status`.** It returns three counts:

```json
{ "pending": 4, "running": 1, "failed": 0 }
```

A steady handful of pending jobs is normal. A pending count that only grows means the queue is not
being drained — check that WP-Cron is running, since the queue ticks once a minute and WP-Cron
only fires on incoming requests. A `running` count that stays high is unusual; jobs stuck in
`running` are reclaimed back to pending after 10 minutes, so a stale worker costs a delay rather
than the work.

There is no `completed` count, and that is by design: a job that succeeds is deleted. An almost
empty table is a healthy table.

**Reading `/jobs/failed`.** Each row carries `id`, `hook`, `group_slug`, `attempts`,
`max_attempts`, `last_error`, `run_at` and `updated_at`. A row appears here only once its attempts
are exhausted — five by default, eight for webhook deliveries — across a backoff schedule of
1 minute, 5 minutes, 30 minutes, 2 hours, 6 hours and then daily. So a failed row represents a job
that has been failing for a while, not a single bad moment.

`last_error` is the text to quote in a support request. One value has a specific meaning:
`No handler registered for job hook: {hook}` means nothing was listening for that job type, almost
always because a Pro add-on is disabled or the license lapsed.

**Retrying.** `POST /ambikly/v1/jobs/{id}/retry` resets the job to pending with its attempt counter
back at zero, so it gets the full attempt budget again. Fix the cause first — retrying a job whose
receiver is still down just burns the budget again. A `404` from this route means there is no
*failed* job with that id; jobs that are pending or running cannot be retried.

For webhook-specific diagnosis, the per-webhook delivery log under
<span class="screen-path">Ambikly → Webhooks</span> shows status code, duration, error and
truncated bodies for the last 200 attempts. See [Webhooks](/developers/webhooks).

## Next

- Symptom-first fixes: [Troubleshooting](/troubleshooting)
- Common questions: [FAQ](/faq)
- Getting help: [Support](/support)
