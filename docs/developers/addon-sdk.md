---
title: Addon SDK
description: The Ambikly Pro Addon base class, its settings schema and coercion rules, discovery and registration through ambikly_pro_addons, the license gate, and the shared durable job queue.
prev:
  text: Payment gateway API
  link: /developers/payment-gateways
next:
  text: Troubleshooting
  link: /troubleshooting
---

# Addon SDK <span class="pro-pill">PRO</span>

Ambikly Pro is a container for add-ons. All 35 shipped add-ons extend the same public `Addon` base class you can extend, and the class gives you settings storage, a rendered settings form, an enable/disable lifecycle, and a license gate — none of which you have to build.

This page is the contract. It assumes Ambikly Pro is installed and licensed.

## The `Addon` base class

```php
namespace AmbiklyPro\Addon;

abstract class Addon
{
    public $slug;
    public $name;
    public $description  = '';
    public $category     = 'store';
    public $version      = '1.0.0';
    public $icon         = 'dashicons-admin-plugins';
    public $coming_soon  = false;
    public $pro_only     = true;

    abstract public function boot();

    public function activate()   {}
    public function deactivate() {}
    public function uninstall()  {}

    public function settingsSchema() { return []; }
    public function settings()       { /* … */ }
    public function get($key, $default = null) { /* … */ }
    public function updateSettings(array $values) { /* … */ }
    public function getLastAdjustments() { /* … */ }
    public function isEnabled() { /* … */ }
    public function toArray()   { /* … */ }
    public function maskSecrets(array $settings) { /* … */ }
}
```

### Properties

| Property | Type | Required | Default | Purpose |
|---|---|---|---|---|
| `$slug` | string | **Yes** | none | kebab-case, unique. The primary key in `ambikly_addons` and the `{slug}` in every REST route |
| `$name` | string | **Yes** | none | Human label on the Addons screen |
| `$description` | string | Recommended | `''` | One or two sentences on the add-on card |
| `$category` | string | No | `'store'` | One of `store`, `marketing`, `checkout`, `digital`, `physical`, `customer`, `admin`, `ai`. Groups the card |
| `$version` | string | No | `'1.0.0'` | SemVer. Compared against `ambikly_addons.version` to detect an upgrade |
| `$icon` | string | No | `'dashicons-admin-plugins'` | A Dashicons class |
| `$coming_soon` | bool | No | `false` | Shows the card as a roadmap preview. A coming-soon add-on cannot be enabled |
| `$pro_only` | bool | No | `true` | Hides the add-on on a free-only install |

Set them in your constructor. The slug and the namespace must correspond: `my-feature` maps to `AmbiklyPro\Addons\MyFeature\Addon`.

### `boot()` — the one abstract method

```php
abstract public function boot();
```

Called on every request where the add-on is enabled **and** the license is valid. Register your hooks, shortcodes, REST routes and assets here.

Three rules:

- `boot()` runs on `plugins_loaded`. Do not assume the query, the current user, or `wp_head` state.
- Do **no** network calls from `boot()`. Defer them to an action or a cron handler.
- Keep it cheap. It runs on every front-end request, every admin request and every REST request.

### Lifecycle methods

| Method | Called by `AddonManager` | When | Use for |
|---|---|---|---|
| `boot()` | Yes, every request | The add-on is enabled and licensed | Registering hooks |
| `activate()` | Yes, once | The add-on is enabled | Creating tables with `dbDelta()`, seeding defaults, scheduling cron |
| `deactivate()` | Yes, once | The add-on is disabled | Unscheduling cron, clearing caches |
| `uninstall()` | **Never** | — | See the warning below |

On enable, `AddonManager` writes `enabled = 1`, calls `activate()`, calls `boot()`, then fires `ambikly_addon_activated` with your slug. On disable it writes `enabled = 0`, calls `deactivate()`, then fires `ambikly_addon_deactivated`.

::: danger `uninstall()` is never called
The base class defines `uninstall()` and the Pro developer guide describes it as running "one-time on full uninstall", but **nothing in `AddonManager` ever invokes it**. There is no code path that calls it — not disable, not plugin deactivation, not plugin deletion.

Practical consequences:

- A table you create in `activate()` survives forever. Nothing drops it.
- Any cleanup you put in `uninstall()` never runs.

Write against `activate()`, `deactivate()` and `boot()` only. If your add-on needs real teardown, do it in `deactivate()` or expose your own command, and document that the table has to be dropped by hand.
:::

Beware that `activate()` runs on **every** enable, not only the first. Make it idempotent — `dbDelta()` already is, and seeding defaults should check before writing.

### Provided helpers

| Method | Returns | Notes |
|---|---|---|
| `settings()` | array | Schema defaults merged with saved values. Cached per request |
| `get($key, $default = null)` | mixed | One setting. Returns `$default` only when the key is absent from the merged array |
| `updateSettings(array $values)` | array | Unmasks secrets, sanitizes, merges, persists, returns the merged array |
| `getLastAdjustments()` | array | Fields the last `updateSettings()` call had to clamp. Read immediately after; it is not a history |
| `isEnabled()` | bool | Live read of `ambikly_addons.enabled` |
| `toArray()` | array | Full serialization for the REST API, with secrets masked |
| `maskSecrets(array $settings)` | array | Replaces `secret` and `password` values with `••••••••` |

Settings are stored as a single JSON blob in `ambikly_addons.settings`, keyed by your slug. There is no per-key row and no option per setting.

## The settings schema

`settingsSchema()` returns an associative array keyed by setting name. The Addons screen renders a form from it, and `updateSettings()` validates against it.

```php
public function settingsSchema()
{
    return [
        'enabled_for' => [
            'type'    => 'enum',
            'options' => ['everyone', 'logged_in'],
            'default' => 'everyone',
            'label'   => __('Show to', 'my-feature'),
        ],
        'delay_seconds' => [
            'type'    => 'int',
            'default' => 5,
            'min'     => 1,
            'max'     => 600,
            'label'   => __('Delay before showing', 'my-feature'),
        ],
        'show_on_mobile' => [
            'type'    => 'bool',
            'default' => true,
            'label'   => __('Show on mobile', 'my-feature'),
        ],
        'headline' => [
            'type'    => 'string',
            'default' => 'Wait!',
            'label'   => __('Headline', 'my-feature'),
        ],
        'api_key' => [
            'type'    => 'secret',
            'default' => '',
            'label'   => __('API key', 'my-feature'),
        ],
    ];
}
```

| Definition key | Applies to | Effect |
|---|---|---|
| `type` | all | Drives coercion and rendering |
| `default` | all | Used when nothing is saved. A missing `default` is `null` |
| `label` | all | Field label in the admin, and the name used in an adjustment notice |
| `options` | `enum` | The allowed values |
| `min` | `int` | Lower bound. **Defaults to 0** |
| `max` | `int` | Upper bound. Optional |

### Coercion rules

`sanitizeSettings()` runs on every save. Only three types are coerced.

| `type` | On save |
|---|---|
| `bool` | Cast with `(bool)`. `"0"`, `""`, `0` and `false` all become `false` |
| `int` | Cast with `(int)`, then clamped to `max($def['min'] ?? 0, $n)` and, when `max` is set, `min($def['max'], $n)`. A clamp is recorded in `getLastAdjustments()` |
| `enum` | Compared against `options` with strict `in_array(..., true)`. An invalid value is **unset**, leaving whatever was already stored |
| anything else | Passed through **untouched** |

::: warning `int` has an implicit minimum of 0
`min` defaults to `0`, so an `int` field that omits `min` can never hold a negative number. Submit `-15` and it is stored as `0`. That is deliberate — every declared int field in the shipped add-ons is a count, a duration or a percentage — but if your setting legitimately needs negatives (a temperature offset, a price adjustment), you must set `'min' => -1000` or similar explicitly.

A clamp is reported rather than hidden. `POST /addons/{slug}/settings` returns an `adjusted` key listing each clamped field with its label, the value submitted and the value stored, so the admin sees "we changed your number" rather than a generic success.
:::

### Types with no coercion

`string`, `float`, `json`, `secret` and `password` are passed through exactly as submitted — and so is any type name the schema does not recognize. This is deliberate: several string fields are free text or raw JSON, and generic sanitizing would corrupt them. **Validate and escape those yourself**, both on save and at the point of output.

### Unknown keys are silently dropped

Before coercion, `sanitizeSettings()` runs `array_intersect_key($values, $this->settingsSchema())`. Any key not declared in the schema is discarded with no error and no notice.

This means a typo in a field name, a renamed setting from an older schema version, or a stale form field simply does not save. If a setting is not persisting, check the spelling against your schema first.

### Secret handling

Declare a credential as `type => 'secret'` or `'password'` and two protections engage automatically:

**On the way out.** `toArray()` — which backs `GET /addons` and `GET /addons/{slug}` — replaces a non-empty secret with `••••••••`. The real value never reaches the browser. An unset secret stays `''`, so the UI can still distinguish "not configured" from "something is set".

**On the way in.** The settings form resubmits every field, including the mask. `unmaskSecrets()` strips any field whose submitted value is exactly the mask, so saving an unrelated checkbox does not overwrite your API key with eight bullet characters. An explicitly submitted empty string is left alone — that is the admin clearing the secret on purpose.

## Discovery and registration

`AddonManager::boot()` runs once per request on `plugins_loaded` and does three things in order: `discover()`, `syncRegistry()`, `bootEnabled()`.

### `discover()`

1. `glob()`s `addons/*/Addon.php` and `require_once`s **every** matching file.
2. Builds the first-party list by instantiating a **hardcoded array of 35 class names**, plus the coming-soon stubs from `ComingSoonManifest`.
3. Passes that list through `apply_filters('ambikly_pro_addons', $list)`.
4. Sorts the result: `coming_soon` entries go to a separate list, everything else into the live registry, keyed by slug.

::: danger Dropping a folder in `addons/` is not enough
Step 1 loads your file. Step 2 only instantiates classes from a **hardcoded list inside `AddonManager`**, and your class is not on it. A third-party add-on dropped into `addons/my-feature/Addon.php` therefore has its file loaded and its class defined — and is then never instantiated, never registered, never shown on the Addons screen and never booted.

**A third-party add-on must register itself through the `ambikly_pro_addons` filter.** That is the only supported mechanism.
:::

### Registering a third-party add-on

```php
add_filter('ambikly_pro_addons', function (array $addons) {
    $addons[] = new \AcmePro\Addons\MyFeature\Addon();
    return $addons;
});
```

Rules the registry enforces:

- Anything in the returned array that is not an `Addon` instance is skipped.
- Entries are keyed by `$slug`. A duplicate slug **replaces** the earlier entry — which is how you would override a shipped add-on.
- The filter runs inside `AddonManager::boot()` on `plugins_loaded`, so register at the top level of your plugin file or on an earlier hook.

::: warning The filter is `ambikly_pro_addons`
The free core's `src/Support/Hooks.php` docblock names a filter called `ambikly_addon_registry`. **No such filter exists.** The real name is `ambikly_pro_addons`, and it lives in Ambikly Pro. See [Hooks & filters](/developers/hooks#documented-but-not-present).
:::

Registering from outside the `addons/` folder — your own plugin — is fine and is the cleaner arrangement, because your code then survives a Pro update that rewrites the `addons/` directory.

### `syncRegistry()`

For each registered add-on, `AddonManager` inserts a row into `ambikly_addons` with `enabled = 0` if it has never seen the slug, and updates the stored `version` when your `$version` has changed.

That version comparison is your migration signal. Bump `$version`, then detect the transition in `activate()` by reading `ambikly_addons.version` before the sync overwrites it — or keep your own schema-version option, which is simpler and less order-dependent.

### `bootEnabled()` and the license gate

`bootEnabled()` reads `License::has_valid_license()` once, then, for each add-on whose `enabled` flag is set:

- **Licensed** — calls `boot()` inside a try/catch. A `Throwable` from your `boot()` is logged with your slug and swallowed, so a broken add-on cannot fatal the site.
- **Not licensed** — skips `boot()` and increments a suppressed count. Store staff see an admin notice naming how many add-ons are paused.

An unlicensed site therefore keeps every `enabled` flag and every setting exactly as they were. Nothing is disabled or deleted; only whether hooks and routes register *for this request* changes. Activating a valid license resumes everything on the very next request.

`has_valid_license()` is a cached option read, not a network call — it checks whether the stored license details say `license === 'valid'`. The real revalidation happens once a day on the `ambikly_pro_daily_license_check` cron event against `https://store.ambikly.com/edd-sl-api/`.

`enable()` refuses outright without a valid license, returning a `WP_Error` with code `license_required` and status 403.

::: tip `License::deactivate()` leaves the key in place
Deactivating a license clears the cached details and the stored server response but keeps `ambikly_pro_license_key`. The key is still in the database after deactivation, which is convenient for reactivating and worth knowing if you are wiping a staging site.
:::

### Re-entry guard

`AddonManager::boot()` sets a `$booted` flag on its first call and returns immediately on every later one. Without it, a second call would run every enabled add-on's `boot()` again — and because a typical `boot()` registers `add_filter($hook, [new Handler($this), 'method'])` with a freshly constructed object, WordPress's callback-identity dedup would not recognize the duplicate. Every hook side effect would fire twice per request. Do not call `AddonManager::instance()->boot()` from your own code.

## The job queue

The free core ships a durable job queue at `Ambikly\Services\JobQueue` and `JobRunner`, available to any add-on. Reach for it whenever a lost attempt would be a real problem — money movement, outbound integrations, anything with a side effect that must not silently never happen.

Do **not** use it for routine polling that already tolerates re-scanning from scratch each tick. A cron scan that rebuilds its own view every run does not benefit.

### Enqueueing

```php
$jobId = (new \Ambikly\Services\JobQueue())->enqueue('acme_sync', [
    'order_id' => $orderId,
], [
    'max_attempts' => 5,
    'group'        => 'acme',
    'unique_key'   => 'acme-sync-' . $orderId,
    'kick'         => true,
]);
```

| Option | Default | Effect |
|---|---|---|
| `run_at` | now | MySQL datetime in UTC. When the job becomes eligible |
| `max_attempts` | `5` | Attempts before the job is marked failed. Minimum 1 |
| `group` | `null` | Free-form label for filtering and reporting |
| `unique_key` | `null` | If a `pending` or `running` job already has this key, `enqueue()` returns that job's id instead of creating a duplicate |
| `kick` | `false` | Fires a non-blocking loopback request so the queue runs now instead of waiting up to a minute |

`$args` is JSON round-tripped, so pass scalars and plain arrays — not objects, not closures, not resources. Pass an id and re-fetch the record in your handler; state may have changed between enqueue and execution.

`enqueue()` returns the job id, which is the existing id when a `unique_key` deduplicated it.

### The `ambikly_job_{hook}` handler

Register a listener for `ambikly_job_` plus your job type:

```php
add_action('ambikly_job_acme_sync', function (array $args, array $job) {
    $order = \Ambikly\Models\Order::find((int) ($args['order_id'] ?? 0));
    if (!$order) {
        return; // Deleted since enqueue — nothing to retry toward.
    }

    $ok = acme_push_to_crm($order);
    if (!$ok) {
        throw new \RuntimeException('CRM push failed for order ' . $order->id);
    }
    // Returning normally completes the job.
}, 10, 2);
```

| Argument | Contains |
|---|---|
| `$args` | Exactly what you passed to `enqueue()`, JSON round-tripped |
| `$job` | The raw row: `id`, `hook`, `group_slug`, `unique_key`, `status`, `attempts`, `max_attempts`, `run_at`, `last_error` |

Register the handler in `boot()`, so it exists on every request where the queue might run.

### Throw to retry

The contract is one sentence: **return normally to complete, throw to retry.**

| Outcome | What happens |
|---|---|
| Handler returns | `complete()` deletes the row. There is no `completed` status — successful jobs leave no trace |
| Handler throws | `fail()` increments `attempts`, stores the message (first 2000 characters) in `last_error`, and either schedules a backoff retry or marks the job `failed` |
| No handler registered | Failed immediately with "No handler registered for job hook: {hook}". Retrying cannot help, but it still respects `max_attempts` so it stays visible instead of vanishing |

Any `Throwable` counts, including a `TypeError` from your own bug. A handler that throws on malformed input will burn through its whole attempt budget before going quiet, so validate and return early for input that can never succeed.

### Backoff

Delay after each failed attempt:

| Attempt | Next retry in |
|---|---|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 30 minutes |
| 4 | 2 hours |
| 5 | 6 hours |
| 6 and beyond | 24 hours |

A daily ceiling means a long-broken receiver keeps getting retried rather than the delay growing without bound.

### How the queue runs

| Property | Value |
|---|---|
| Table | `ambikly_jobs` |
| Cron hook | `ambikly_jobs_tick` |
| Schedule | Every minute, on the `ambikly_minute` interval |
| Batch size | 25 jobs per tick |
| Overlap guard | A 50-second transient lock so two ticks do not run a batch at once |
| Stale lock reclaim | A `running` job untouched for 10 minutes returns to `pending` and is retried |
| Kick endpoint | `wp_ajax_ambikly_jobs_kick` / `wp_ajax_nopriv_ambikly_jobs_kick` |

Claiming is one atomic `UPDATE ... ORDER BY run_at LIMIT 25` writing a random lock token, so two overlapping workers can never claim the same row.

Two caveats worth planning around. WP-Cron only fires on an incoming request, so a low-traffic site processes the queue slower than once a minute regardless of the schedule. And `kick()` is best-effort — some hosts block loopback requests, and when the kick fails the job still runs on the next tick. It is a latency optimization, not the delivery guarantee.

### Operator routes

| Method | Route | Permission |
|---|---|---|
| GET | `/ambikly/v1/jobs/status` | `store_view_permission()` |
| GET | `/ambikly/v1/jobs/failed` | `store_view_permission()` |
| POST | `/ambikly/v1/jobs/{id}/retry` | `store_permission()` |

`/jobs/status` returns `{ pending, running, failed }` counts. `/jobs/failed` returns the most recent 200 exhausted jobs with `hook`, `group_slug`, `attempts`, `max_attempts`, `last_error`, `run_at` and `updated_at`. `/jobs/{id}/retry` resets `attempts` to 0 and requeues, giving the job its full budget again; it only affects a job in `failed` status and returns 404 otherwise.

Use `group` on your jobs so failures are attributable to your add-on in that list.

## A complete minimal add-on

A working add-on that tags every paid order in an external CRM, with settings, a table, a REST route and a queued job.

```php
<?php
/**
 * Plugin Name: Acme CRM Tagger for Ambikly Pro
 * Description: Tags paid orders in the Acme CRM.
 */

namespace AcmePro\Addons\CrmTagger;

use AmbiklyPro\Addon\Addon as BaseAddon;

if (!defined('ABSPATH')) {
    exit;
}

class Addon extends BaseAddon
{
    public function __construct()
    {
        $this->slug        = 'acme-crm-tagger';
        $this->name        = __('Acme CRM Tagger', 'acme-crm');
        $this->description = __('Tags every paid order in your Acme CRM workspace.', 'acme-crm');
        $this->category    = 'admin';
        $this->icon        = 'dashicons-tag';
        $this->version     = '1.0.0';
    }

    public function settingsSchema()
    {
        return [
            'api_key' => [
                'type'    => 'secret',
                'default' => '',
                'label'   => __('Acme CRM API key', 'acme-crm'),
            ],
            'tag' => [
                'type'    => 'string',
                'default' => 'ambikly-customer',
                'label'   => __('Tag to apply', 'acme-crm'),
            ],
            'min_order_total' => [
                'type'    => 'int',
                'default' => 0,
                'min'     => 0,
                'max'     => 100000,
                'label'   => __('Only tag orders above', 'acme-crm'),
            ],
            'include_guests' => [
                'type'    => 'bool',
                'default' => false,
                'label'   => __('Include guest checkouts', 'acme-crm'),
            ],
        ];
    }

    /**
     * Runs once when the add-on is enabled. Idempotent — dbDelta()
     * handles a table that already exists, and activate() fires on
     * every enable, not only the first.
     */
    public function activate()
    {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        dbDelta("CREATE TABLE {$wpdb->prefix}acme_crm_log (
            id          bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            order_id    bigint(20) UNSIGNED NOT NULL,
            tag         varchar(100) NOT NULL,
            succeeded   tinyint(1) DEFAULT 0,
            error       text DEFAULT NULL,
            created_at  datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY order_id (order_id)
        ) {$wpdb->get_charset_collate()};");
    }

    public function deactivate()
    {
        // uninstall() is never called, so any real teardown belongs here.
        wp_clear_scheduled_hook('acme_crm_daily_digest');
    }

    /**
     * Runs on every request while enabled and licensed.
     * Registration only — no network calls, no heavy work.
     */
    public function boot()
    {
        add_action('ambikly_order_paid', [$this, 'onOrderPaid']);
        add_action('ambikly_job_acme_crm_tag', [$this, 'handleJob'], 10, 2);
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function onOrderPaid($order)
    {
        if ((float) $order->total < (float) $this->get('min_order_total', 0)) {
            return;
        }
        if (!$this->get('include_guests') && empty($order->customer_id)) {
            return;
        }
        if ($this->get('api_key', '') === '') {
            return; // Not configured yet.
        }

        // Queue rather than calling the CRM inline — a slow CRM must
        // never add latency to the request that marked the order paid.
        (new \Ambikly\Services\JobQueue())->enqueue('acme_crm_tag', [
            'order_id' => (int) $order->id,
        ], [
            'max_attempts' => 5,
            'group'        => $this->slug,
            'unique_key'   => 'acme-crm-tag-' . (int) $order->id,
            'kick'         => true,
        ]);
    }

    /**
     * Throw to schedule a backoff retry. Return to complete.
     */
    public function handleJob(array $args, array $job)
    {
        global $wpdb;

        $order = \Ambikly\Models\Order::find((int) ($args['order_id'] ?? 0));
        if (!$order) {
            return; // Deleted since enqueue. Nothing to retry toward.
        }

        $tag = (string) $this->get('tag', 'ambikly-customer');

        $response = wp_remote_post('https://api.acme-crm.example/v1/tags', [
            'timeout' => 10,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->get('api_key', ''),
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode([
                'email' => $order->customer_email,
                'tag'   => $tag,
            ]),
        ]);

        $code  = is_wp_error($response) ? 0 : (int) wp_remote_retrieve_response_code($response);
        $ok    = $code >= 200 && $code < 300;
        $error = is_wp_error($response) ? $response->get_error_message() : ($ok ? null : 'HTTP ' . $code);

        $wpdb->insert($wpdb->prefix . 'acme_crm_log', [
            'order_id'   => (int) $order->id,
            'tag'        => $tag,
            'succeeded'  => $ok ? 1 : 0,
            'error'      => $error,
            'created_at' => current_time('mysql'),
        ]);

        if (!$ok) {
            throw new \RuntimeException('Acme CRM tagging failed: ' . $error);
        }
    }

    public function registerRoutes()
    {
        register_rest_route('ambikly-pro/v1', '/acme-crm/log', [
            'methods'             => 'GET',
            'permission_callback' => function () {
                return current_user_can('ambikly_view_store')
                    || current_user_can('manage_options');
            },
            'callback'            => function () {
                global $wpdb;
                $rows = $wpdb->get_results(
                    "SELECT * FROM {$wpdb->prefix}acme_crm_log
                      ORDER BY id DESC LIMIT 100",
                    ARRAY_A
                );
                return rest_ensure_response(['success' => true, 'data' => $rows ?: []]);
            },
        ]);
    }
}

// The only supported registration mechanism for a third-party add-on.
add_filter('ambikly_pro_addons', function (array $addons) {
    $addons[] = new Addon();
    return $addons;
});
```

### Installing and enabling it

<ol class="step-list">
  <li>Activate the plugin in <span class="screen-path">Plugins</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Addons</span> — your card appears alongside the 35 shipped add-ons, disabled.</li>
  <li>Click <strong>Enable</strong>. Without a valid Pro license this returns <code>license_required</code>.</li>
  <li>Open its settings, enter the API key and save.</li>
  <li>Place a test order and check <code>GET /wp-json/ambikly-pro/v1/acme-crm/log</code>.</li>
</ol>

If the card does not appear, the filter is the first thing to check — see [Discovery and registration](#discovery-and-registration).

## Storage

| For | Use |
|---|---|
| Settings | `settingsSchema()` plus `$this->get()`. Stored as JSON in `ambikly_addons.settings` |
| Larger structured data | Your own table, created in `activate()` with `dbDelta()` |
| Per-visitor session state | `\Ambikly\Services\SessionService::set($scope, $value)` |
| Site-wide flags outside the schema | A prefixed WordPress option |

Do not put large blobs in add-on settings. The whole JSON document is read and rewritten on every save.

## Conventions

- **Slug and namespace must match.** `my-feature` maps to `AmbiklyPro\Addons\MyFeature\Addon`. A third-party add-on outside `addons/` may use its own namespace, as the example above does.
- **Prepared statements everywhere.** Never interpolate into `$wpdb->query()`.
- **Sanitize on the way in, escape on the way out.** The schema does not do it for `string`, `float` or `json` types.
- **REST routes need a `permission_callback`.** Use `ambikly_manage_store` and `ambikly_view_store`, not a bare `manage_options` check, so the Store Manager and Support Agent roles work.
- **Register your routes under `ambikly-pro/v1`.** That is the convention for Pro and add-on routes.
- **Namespace your own hooks.** Do not add new `ambikly_`-prefixed hooks from third-party code.

::: warning The plugins' DEVELOPER.md files are stale in places
Both `ambikly/DEVELOPER.md` and `ambikly-pro/DEVELOPER.md` are useful background but out of date on several points documented here — the `uninstall()` lifecycle, whether dropping a folder in `addons/` is sufficient, the hook names in `Support/Hooks.php`, the claim that B2B companies have no admin screen, and a pointer to `addons/stripe/Addon.php` that does not exist. Where they disagree with the source, the source is right.
:::

## Next

[Troubleshooting](/troubleshooting) covers diagnosing a store that is not behaving, including add-ons that will not enable and a job queue that is not draining.
