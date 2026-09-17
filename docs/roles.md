---
title: Roles & permissions
description: Ambikly's two capabilities and two roles, exactly what Store Manager and Support Agent can reach, what stays Administrator-only, and how to assign a role.
prev:
  text: "Customers"
  link: /customers
next:
  text: "B2B companies & Net Terms"
  link: /b2b-companies
---

# Roles & permissions

Ambikly adds two capabilities and two roles so you can give a bookkeeper, a support agent or a contractor access to the store without making them a WordPress Administrator.

## The two capabilities

| Capability | Grants |
|---|---|
| `ambikly_manage_store` | Full create, edit and delete on store operations: orders, customers, products, variations, attributes, categories, coupons, reviews, shipping, tax, companies and the job queue. |
| `ambikly_view_store` | Read-only equivalent — list and view, no writes. Also required to see the Ambikly menu item at all. |

Neither capability covers Settings, Payments, Webhooks, System Status, Import/Export, Email Templates or the Setup wizard. Those remain `manage_options`.

## The two roles

| Role | Slug | Capabilities |
|---|---|---|
| Store Manager | `ambikly_store_manager` | `read`, `upload_files`, `ambikly_manage_store`, `ambikly_view_store` |
| Support Agent | `ambikly_support_agent` | `read`, `ambikly_view_store` |

Administrators are also granted both Ambikly capabilities directly — not by inheritance — so an Administrator can reach everything either role can, plus everything neither can.

`upload_files` is on Store Manager because the product image and gallery picker needs it. Support Agent does not get it, and does not need it.

## What each role can reach

Read access is enough for a screen to load; write access is checked separately on every save.

| Area | Administrator | Store Manager | Support Agent |
|---|---|---|---|
| Ambikly menu and Dashboard | Full | Full | View |
| Products, variations, attributes | Full | Full | View |
| Categories, tags, brands | Full | Full | View |
| Reviews | Full | Full | View |
| Orders | Full | Full | View |
| Refunds and record-payment | Yes | Yes | No |
| Customers and addresses | Full | Full | View |
| Coupons | Full | Full | View |
| B2B companies and buyers | Full | Full | View |
| Reports | Yes | Yes | Yes |
| Invoices and packing slips | Yes | Yes | Yes |
| Shipping zones and methods | Full | Full | No |
| Tax rates | Full | Full | No |
| Job queue | Full | Retry/manage | View |
| **Settings** (every tab) | Full | **No** | **No** |
| **Payments** | Full | **No** | **No** |
| **Webhooks** | Full | **No** | **No** |
| **System Status** | Full | **No** | **No** |
| **Import / Export** | Full | **No** | **No** |
| **Email Templates** | Full | **No** | **No** |
| **Setup wizard** | Full | **No** | **No** |

Shipping and tax are an asymmetric case worth noting: their routes require `ambikly_manage_store` even for reading, so a Support Agent cannot view them at all, while a Store Manager has full access.

### Why those seven stay Administrator-only

Each of the seven is `manage_options` for a specific reason, not by oversight:

- **Settings** and **Payments** — gateway API keys and secrets are returned in full to whoever can read them. Widening that audience needs key masking first.
- **Webhooks** — configuring an external endpoint and its signing secret means being able to exfiltrate store events.
- **System Status** — server diagnostics.
- **Import / Export** — bulk access to every product and order in one request.
- **Email Templates** — raw HTML editing.
- **Setup** — re-running store bootstrap.

Neither custom role can reach any of them, through the UI or through the REST API. A Store Manager who opens <span class="screen-path">Ambikly → Settings</span> gets a screen that cannot load its data.

## Capabilities by REST namespace

Every admin route in `ambikly/v1` gates on exactly one of three checks.

| Check | Passes for | Used by |
|---|---|---|
| `store_view_permission` | `ambikly_view_store`, `ambikly_manage_store`, `manage_options` | All list and read endpoints for orders, customers, products, categories, coupons, reviews, companies, reports, jobs |
| `store_permission` | `ambikly_manage_store`, `manage_options` | All create, update, delete endpoints; refunds; record-payment; shipping; tax |
| `admin_permission` | `manage_options` only | Settings, Payments, Webhooks, System Status, Import/Export, Email Templates, Setup |

Because `store_view_permission` falls through to `store_permission`, anyone who can write can always read. See [Endpoint reference](/developers/endpoints).

## Assigning a role

There is no role-assignment UI inside Ambikly. Use the normal WordPress Users screen.

<ol class="step-list">
  <li>Go to <span class="screen-path">Users → All Users</span> in the WordPress admin.</li>
  <li>Click <strong>Edit</strong> on the user, or use <strong>Add New</strong> for someone new.</li>
  <li>Set <strong>Role</strong> to <strong>Store Manager</strong> or <strong>Support Agent</strong>.</li>
  <li>Save. The user can now see the <strong>Ambikly</strong> item in the WordPress admin menu.</li>
</ol>

The two roles appear in WordPress's own role dropdown alongside Subscriber, Contributor and the rest, because they are registered as real WordPress roles.

<div class="ui-tip"><strong>Tip:</strong> A user can hold more than one role if you use a plugin that supports it, or you can add a single Ambikly capability to an existing role with <code>get_role('editor')->add_cap('ambikly_view_store')</code>. Capabilities are what the plugin actually checks — the roles are just convenient bundles.</div>

## Self-healing on `admin_init`

The roles are registered when the plugin is activated, and re-checked on every `admin_init`. If a role has gone missing — a plugin conflict, a botched multisite step, a user-management plugin that rebuilt the role table — it is recreated on the next admin page load.

The same pass re-grants `ambikly_manage_store` and `ambikly_view_store` to the Administrator role. Both operations are no-ops when the role and capability already exist, so this costs effectively nothing.

Practical consequence: **you cannot permanently remove either capability from Administrator**. Strip it and it comes back on the next admin request. Restrict access by moving people off the Administrator role instead.

The same is true of the two roles themselves. Deleting `ambikly_store_manager` with a role editor recreates it, with its original capability set, on the next admin load — so a role editor cannot be used to narrow what Store Manager can do.

## Removing the roles

The roles and the Administrator's capabilities are removed only by uninstalling the plugin **and** only when you have opted into full data removal via the `ambikly_remove_data_on_uninstall` option. That option defaults to false and has no admin field.

Deactivating the plugin leaves both roles in place. Users keep the role assignment, and it takes effect again the moment the plugin is reactivated.

::: warning The Settings → Roles and Permissions tab is inert
<span class="screen-path">Ambikly → Settings → Roles and Permissions</span> shows three controls — a default customer role, role-based pricing, and role-based access. **None of them are read by anything.** Changing them saves a value into the database that no part of the plugin ever looks at.

Everything on this page is controlled by the two capabilities and the two roles described above, assigned through the WordPress Users screen. Ignore that Settings tab.
:::

## These roles are not the same as B2B buyer roles

Ambikly uses the word "role" in two unrelated places, and they do not interact.

| | WordPress roles | Company buyer roles |
|---|---|---|
| Names | Store Manager, Support Agent | Owner, Buyer |
| Where they live | The WordPress user table | `ambikly_company_users` |
| Who they describe | Your staff | Your B2B customers |
| Assigned from | <span class="screen-path">Users → All Users</span> | The company's Buyers panel, or an invitation |
| What they grant | Access to the Ambikly admin | The ability to order on a company's credit line, and for an owner, to invite other buyers |

A company owner has no WordPress capability of any kind beyond being logged in. Their self-service routes check membership of that specific company directly, because there is no WordPress capability for "owns company #4". See [B2B companies & Net Terms](/b2b-companies).

## Choosing between the roles

**Support Agent** suits anyone who answers customer questions: they can look up an order, read its notes, see a customer's history and open an invoice, but they cannot change a status, issue a refund, or edit a product. It is a genuinely safe read-only seat.

**Store Manager** suits anyone who runs day-to-day operations: fulfilling orders, issuing refunds, editing the catalog, managing coupons and shipping. They cannot touch payment credentials, webhooks or the store's configuration.

If someone needs to change a payment gateway or an email template, they need Administrator. There is no middle tier for that.

## The menu itself is capability-gated

The **Ambikly** item in the WordPress admin menu, and the page it opens, both require `ambikly_view_store`. That is the lowest of the three checks, so everyone who can do anything in the store can at least see the menu.

Legacy `?page=ambikly-{module}` links are redirected to the single-page app's own route, carrying any `action` and `id` parameters across, so an old bookmark still lands on the right screen for whichever role follows it.

## Common setups

**A support desk.** Give every agent the Support Agent role. They can answer "where is my order", read notes, look up a customer's history and open an invoice, and cannot accidentally change anything. Escalate status changes and refunds to a Store Manager.

**A warehouse or fulfillment contractor.** Store Manager. They can move orders to Completed, print packing slips and manage stock, and they cannot reach your gateway credentials. If you want them read-only on the catalog too, there is no finer tier — Store Manager is all-or-nothing across store operations.

**A bookkeeper.** Support Agent covers reports, order totals and invoices without any write access. If they also need to record B2B invoice payments or issue refunds, they need Store Manager.

**An agency or developer.** Administrator, because Settings, Payments and Webhooks are all `manage_options`. There is no way to grant those without full WordPress administration.

## Troubleshooting

| Symptom | Cause |
|---|---|
| A new Store Manager sees no Ambikly menu | The role was assigned but the page was cached. Reload the admin; the capability check runs per request. |
| A Store Manager gets an empty Settings screen | Expected. Settings is `manage_options` and neither custom role has it. |
| A Support Agent cannot open Shipping or Tax | Expected. Those routes require `ambikly_manage_store` even to read. |
| A capability removed from Administrator keeps coming back | Expected. Both capabilities are re-granted to Administrator on every `admin_init`. |
| A role deleted with a role-editor plugin reappears | Expected. Both roles are recreated on every `admin_init` if missing. |
| Roles are missing entirely after a migration | Load any admin page. The self-heal pass recreates them. |
| A Store Manager cannot upload a product image | Check that the role still carries `upload_files` — a role-editor plugin may have stripped it before the self-heal recreated only a missing role, not a modified one. |

## What a Support Agent cannot see on an order

Order transactions carry the gateway's full, unredacted payload — the complete Stripe payment intent or PayPal capture, including gateway customer ids, payer name and address, and the receipt email. Those two fields are stripped from the order response before it is sent, for every caller. The admin UI never rendered them, so nothing is lost, and a read-only role is not handed raw payment-gateway internals.

## For developers

Check capabilities directly rather than checking for a role:

```php
if (current_user_can('ambikly_manage_store')) {
    // create, update, delete
}
if (current_user_can('ambikly_view_store')) {
    // list, view
}
```

The constants are `Ambikly\Services\Capabilities::MANAGE_STORE`, `::VIEW_STORE`, `::ROLE_STORE_MANAGER` and `::ROLE_SUPPORT_AGENT`.

When adding your own REST route, gate it with the same helpers the core controllers use — `store_permission()` for writes, `store_view_permission()` for reads, `admin_permission()` for anything that exposes credentials. See [REST API](/developers/rest-api) and [Addon SDK](/developers/addon-sdk).

<div class="ui-warn"><strong>Careful:</strong> A Pro add-on that registers its own routes is responsible for its own gating. <code>GET /ambikly-pro/v1/shipments</code>, for instance, is open to any logged-in user.</div>

## Where to go next

- [B2B companies & Net Terms](/b2b-companies) — company accounts and buyer roles, which are separate from these WordPress roles.
- [Customers](/customers) — what a Support Agent can look up.
- [Settings reference](/settings) — the Administrator-only tabs.
- [Endpoint reference](/developers/endpoints) — per-route permissions.
