---
title: WP-CLI
description: Ambikly's three WP-CLI commands — upgrade-db, export and recompute — with every flag, which subcommand each applies to, and real examples.
prev:
  text: Webhooks
  link: /developers/webhooks
next:
  text: Database schema
  link: /developers/database
---

# WP-CLI

Ambikly registers three commands under the `wp ambikly` namespace. They are useful for deploys, scheduled exports, and repairing denormalized totals after a bulk database change.

The commands load only when `WP_CLI` is defined, so they add nothing to a normal page load.

```bash
wp ambikly --help
```

| Command | What it does |
|---|---|
| `wp ambikly upgrade-db` | Runs any pending database migrations |
| `wp ambikly export <products\\|orders>` | Writes a CSV to stdout or to a file |
| `wp ambikly recompute customer-totals` | Rebuilds each customer's order count, lifetime spend and last order date |

All three run as the CLI user, which WP-CLI treats as an administrator. There is no capability check — filesystem access to the site is the authorization.

## `wp ambikly upgrade-db`

Runs `Schema::migrate()`, which applies every `CREATE TABLE` through `dbDelta()` plus the explicit `ALTER TABLE` steps, then writes the current version to the `ambikly_db_version` option.

```bash
wp ambikly upgrade-db
```

```text
Success: Migrated database: 2.9.0 → 2.11.0.
```

If nothing was pending:

```text
Success: Database already at version 2.11.0.
```

The command takes no flags and no positional arguments. It is idempotent — running it twice is harmless.

Run it after any deploy that ships a new plugin version, particularly on a site where an admin page load might not happen soon. Migrations otherwise run on `admin_init` and `plugins_loaded`, so a site nobody logs into can sit on an old schema.

```bash
# Typical deploy step
wp plugin update ambikly && wp ambikly upgrade-db
```

::: warning One option, two owners
`Schema` and `Install` both write the same `ambikly_db_version` option from different version numbers. `upgrade-db` only runs `Schema::migrate()`. See [Database schema](/developers/database#the-shared-version-option) for what that means in practice.
:::

## `wp ambikly export`

```bash
wp ambikly export <type> [--status=<status>] [--type=<type>] [--from=<date>] [--to=<date>] [--file=<path>]
```

`<type>` is required and must be `products` or `orders`. Anything else exits with a usage error.

### Flags

| Flag | Applies to | Value | Effect |
|---|---|---|---|
| `--status=<status>` | Both | A status string | Filters rows by status |
| `--type=<type>` | `products` only | A product type | Filters by product type |
| `--from=<date>` | `orders` only | `YYYY-MM-DD` | Earliest order date |
| `--to=<date>` | `orders` only | `YYYY-MM-DD` | Latest order date |
| `--file=<path>` | Both | A writable path | Writes there instead of stdout |

::: warning Irrelevant flags are silently dropped
Each subcommand keeps only the flags that apply to it — `products` keeps `status` and `type`, `orders` keeps `status`, `from` and `to`. Everything else is discarded without a warning. `wp ambikly export products --from=2026-01-01` runs happily and exports **every** product, because `--from` is not a product flag. `wp ambikly export orders --type=digital` exports every order. Neither one errors, so check your output row count when a filter appears to have done nothing.
:::

### Output

Without `--file`, the CSV goes to stdout. That makes redirection and piping the natural way to use it.

```bash
# Redirect to a file
wp ambikly export products --status=published > products.csv

# Write directly, with a success message on completion
wp ambikly export orders --from=2026-01-01 --file=orders.csv
```

```text
Success: Exported orders to orders.csv.
```

The success message is printed **only** when `--file` is used. A stdout export prints the CSV and nothing else, which keeps it safe to pipe.

```bash
# Count exported rows
wp ambikly export products | wc -l

# Filter with standard tools
wp ambikly export orders --status=completed | grep 'AMB-10'

# Compress on the fly
wp ambikly export orders --from=2026-01-01 --to=2026-03-31 | gzip > q1-orders.csv.gz

# Nightly backup to a dated file
wp ambikly export orders --file="/backups/orders-$(date +%F).csv"
```

If the output path cannot be opened, the command errors out rather than falling back to stdout:

```text
Error: Could not open output stream (/root/orders.csv).
```

### Remote sites

Both flags work through WP-CLI's SSH support, but redirection happens on the machine running `wp`:

```bash
# CSV arrives on your local machine
wp @production ambikly export orders --status=completed > local-orders.csv

# CSV is written on the remote server
wp @production ambikly export orders --status=completed --file=/tmp/orders.csv
```

### What is not exported

Only products and orders have exporters. Customers, coupons, categories and reviews have no CLI export — use `GET /customers`, `GET /coupons` and so on from the [REST API](/developers/endpoints).

The same two exports are also available over REST as `GET /export/products` and `GET /export/orders`, and from <span class="screen-path">Ambikly → Tools</span>. Those accept an `ids` parameter the CLI does not.

## `wp ambikly recompute customer-totals`

```bash
wp ambikly recompute <what> [--id=<id>]
```

`<what>` must be `customer-totals`. It is the only supported value; anything else exits with a usage error.

| Flag | Value | Effect |
|---|---|---|
| `--id=<id>` | A customer id | Recompute one customer instead of all of them |

### What it recalculates

Three denormalized columns on `ambikly_customers`, derived from `ambikly_orders`:

| Column | Recomputed as |
|---|---|
| `total_orders` | `COUNT(*)` of that customer's counted orders |
| `total_spent` | `SUM(total - total_refunded)` across those orders |
| `last_order_at` | `MAX(created_at)` across those orders |

### Which orders are excluded

An order is counted only when it has a real `customer_id` (not null, greater than zero) **and** its status is not one of:

- `cancelled`
- `refunded`
- `failed`

Everything else counts, including `pending` and `processing`. A partially refunded order still counts, with its refunded amount subtracted from `total_spent` via `total - total_refunded`.

::: tip Guest orders never count
An order placed without a customer record has a null `customer_id` and contributes to nobody's totals. That is why the store's revenue reports and the sum of customer lifetime values can legitimately differ.
:::

### Zeroing

Before writing the recomputed values, the command zeroes the target rows so a customer whose only order was later cancelled ends at zero rather than keeping a stale figure.

- Without `--id`, **every** row in `ambikly_customers` is zeroed first, then the computed rows are written back.
- With `--id`, only that one row is zeroed.

This is why the full run is not incremental. It is a rebuild, and a customer whose orders were all excluded correctly ends at `total_orders = 0`, `total_spent = 0`, `last_order_at = NULL`.

### Examples

```bash
# Rebuild every customer's totals
wp ambikly recompute customer-totals
```

```text
Recomputing customers  100% [==============================] 0:03 / 0:03
Success: Recomputed totals for 1284 customer(s).
```

```bash
# Repair one customer after a manual database edit
wp ambikly recompute customer-totals --id=42
```

The count in the success message is the number of customers that had at least one counted order — not the number of rows touched. A full run also zeroes every other customer.

### When to run it

| Situation | Why |
|---|---|
| After importing orders directly into the database | Nothing fired the hooks that maintain these columns |
| After a bulk status change made with SQL | Same reason |
| After restoring a partial backup | Orders and customers can be out of step |
| When a customer's lifetime value looks wrong | The fastest way to prove or disprove drift |
| On a schedule, weekly | Cheap insurance against undetected drift |

Normal store operation keeps these columns current. You should not need this command routinely.

```bash
# Weekly, via system cron
0 4 * * 0 cd /var/www/example.com && wp ambikly recompute customer-totals --quiet
```

::: warning Runtime scales with customer count
The command loads one grouped result set and issues one `UPDATE` per customer with an order, plus a table-wide zeroing `UPDATE`. On a store with hundreds of thousands of customers, run it off-peak.
:::

## Scripting notes

- WP-CLI's global flags all work: `--path=`, `--url=`, `--quiet`, `--allow-root`, `--skip-plugins` (do not skip Ambikly itself).
- Exit codes follow WP-CLI convention: 0 on success, non-zero on `WP_CLI::error()`.
- `--quiet` suppresses the success messages but not the CSV on stdout.
- The progress bar on `recompute` writes to stderr, so it does not contaminate a piped stdout.

## Next

[Database schema](/developers/database) covers the tables these commands operate on, and the migration mechanism behind `upgrade-db`.
