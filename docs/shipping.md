---
title: Shipping
description: Ambikly shipping zones, regions and the three method types — how a zone is matched to an address, how each method's cost is computed, and what has no admin field.
prev:
  text: Offline payment methods
  link: /payments-offline
next:
  text: Tax
  link: /tax
---

# Shipping

Ambikly calculates shipping from zones. A zone covers a set of regions and holds a set of methods. When a customer enters a destination address, Ambikly finds the zone that covers it and offers that zone's methods with their computed costs. This page covers the screen, the exact matching rules, and the cost formula for each method type.

## Where shipping lives

Everything is on one tab: <span class="screen-path">Ambikly → Settings → Shipping</span>. The tab contains the zones editor and nothing else — there is no separate "shipping options" section, because the zones and their methods are the only inputs the checkout calculation uses.

## What a fresh install starts with

The setup wizard seeds one zone so a new store is not broken:

| Zone | Position | Regions | Methods |
|---|---|---|---|
| Rest of World | 100 | Any country, any state | Flat rate at $10.00; Free shipping over $100 |

Currency examples on this page use $; your store's currency is set in <span class="screen-path">Ambikly → Settings → Store Settings</span>.

## Zones

A zone has a name, a position, and a list of regions.

| Field | What it does |
|---|---|
| Name | Label only. Shown in the admin, never to customers |
| Regions | One or more country/state pairs the zone covers |
| Position | Sort order. Lower positions are evaluated first |

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Settings → Shipping</span> and click <strong>Add zone</strong>.</li>
  <li>Type a name — "Europe", "US West", "Domestic" — and click <strong>Save</strong>.</li>
  <li>The new zone is created covering any country and any state. Click the triangle to expand it, then <strong>Edit</strong>.</li>
  <li>Remove the wildcard region with its × if you want the zone to be specific, then add the real ones.</li>
  <li>Click <strong>Save</strong> on the zone header.</li>
</ol>

### Regions

Each region is a country code and an optional state.

| Field | Format | Notes |
|---|---|---|
| Country code | Two-letter code such as `US`, `GB`, `DE`, or `*` for any country | Uppercased on save; matched case-insensitively |
| State | A state or province code, or `*` for any | Left blank, it is stored as `*` |

Regions are chips in the zone's expanded view. A chip for `*` reads "Any country"; a chip with a state reads `US / CA`.

There is no country picker or bulk continent selector on this screen — you type the codes. Add as many regions to a zone as you need.

### Deleting a zone

Deleting a zone removes every shipping method under it. Orders already placed are not affected — an order stores its shipping method title as text, not a reference.

## The three method types

Add a method from the buttons inside an expanded zone: **+ Flat rate**, **+ Free shipping**, **+ Local pickup**. A new flat rate or local pickup is created at $10.00; free shipping is created at 0.

| Method | ID | Cost formula |
|---|---|---|
| Flat rate | `flat_rate` | `Cost + (per-item × total units in the cart)` |
| Free shipping | `free_shipping` | Always 0, but hidden entirely when the cart subtotal is below the method's minimum |
| Local pickup | `local_pickup` | `Cost` — the per-item value is ignored |

Any method whose type is not recognized falls through to the flat-rate formula.

### The fields you can edit

The methods table inside a zone has four columns:

| Column | Type | Notes |
|---|---|---|
| Method | Read-only | Flat rate, Free shipping or Local pickup — set when you add the method and not changeable afterwards |
| Title | Text | What the customer sees at checkout. Edit in place; saved as you type |
| Cost | Number | The base cost. Cannot be negative — the server rejects a negative cost |
| Enabled | Checkbox | An unchecked method is never offered at checkout |

Removing a method takes it out of checkout immediately. You can re-add it later; it gets a new ID, so any cart holding the old selection will be told to choose again.

### Fields that exist but have no input

Three values are part of a shipping method's data and are used by the calculation, yet have no field on this screen:

| Value | Stored default | Effect | How to change it |
|---|---|---|---|
| `per_item` | `0` on every flat rate you create | Multiplied by the total units in the cart and added to the base cost | No admin field at all — see below |
| `min_amount` | `0` on every free shipping you create | Below this subtotal, the method is hidden from checkout | No admin field; the seeded "Free shipping (over 100)" method has `100` because the wizard wrote it |
| `tax_status` | `taxable` | When `none`, the shipping cost is excluded from the tax base | No admin field |

::: warning Flat rate per-item cost has no admin field
A flat rate is created with a per-item cost of `0` and there is no input anywhere in the admin that sets it. Only **Title**, **Cost** and **Enabled** are editable. In practice every flat rate you create through the admin is a single fixed charge, not a per-unit one, and the per-item half of the formula always contributes zero.
:::

The same applies to the free-shipping minimum: create the method through the admin and its threshold is `0`, meaning free shipping is offered on every cart in that zone regardless of value. The only method with a real threshold is the one the setup wizard seeded. To set any of these three values you have to write them to the method row's `settings` JSON (or `tax_status` column) directly, or create the method through the REST API, which does accept them.

## How a zone is matched to an address

This is the exact algorithm. It runs every time the cart recalculates and every time the checkout page asks for methods.

<ol class="step-list">
  <li>Load every zone, ordered by <strong>position ascending</strong>, then by ID ascending.</li>
  <li>Walk them in that order. For each zone, walk its regions in the order they were added.</li>
  <li>A region matches when <strong>the country matches</strong> — the region's country is <code>*</code>, or it equals the address country — <strong>and the state matches</strong> — the region's state is <code>*</code>, or it equals the address state, <strong>or the address has no state at all</strong>.</li>
  <li>The <strong>first zone with any matching region wins</strong>. No further zones are considered.</li>
  <li>If no zone matched, the <strong>last zone in that ordered list</strong> is used as the fallback.</li>
  <li>If there are no zones at all, no shipping methods are available.</li>
</ol>

Two consequences follow:

- **Order your zones from most specific to least specific.** A zone covering "any country" placed at position 0 swallows every address, and no zone after it is ever reached.
- **The last zone is always the fallback**, whether or not you meant it to be. Give your most general zone the highest position number so it sits last, and it becomes both the intended catch-all and the fallback. The seeded "Rest of World" zone is at position 100 for exactly this reason.

Also note the state rule: an address with **no state entered** matches a region that names a specific state. A customer in a country without states will match a region such as `GB / ENG`. If you rely on state-level zones, expect them to catch stateless addresses in the same country too.

Countries are compared case-insensitively; states are compared exactly as stored.

## How the customer chooses

At checkout, the shipping method selector appears only when at least one cart line requires shipping. As soon as a usable destination address is entered, the storefront posts it and renders the matching methods.

Each method is identified by a key of the form `{method_id}:{row id}` — `flat_rate:3`, for example. That key is stored on the cart. On every totals run Ambikly re-resolves it against the currently available methods:

- If it still resolves, its cost and title are used and the shipping is marked resolved.
- If it does not — the method was deleted, disabled, or the address changed zone — the total falls back to zero **but the cart is flagged as unresolved**, and checkout refuses the order with `Please select a valid shipping method before placing your order.` A stale or tampered method key can never produce free shipping by accident.

A coupon that grants free shipping forces the shipping total to 0 while keeping the chosen method's title, so the customer still sees which service they are getting.

## Worked examples

### A store shipping US domestic, EU, and everywhere else

| Position | Zone | Regions | Methods |
|---|---|---|---|
| 0 | US Domestic | `US / *` | Flat rate $6.00; Free shipping (min 75, set via API) |
| 1 | Europe | `DE / *`, `FR / *`, `IT / *`, `ES / *` | Flat rate $18.00 |
| 100 | Rest of World | `* / *` | Flat rate $35.00 |

- An address in Texas hits **US Domestic** at position 0. Subtotal $40 → only the $6.00 flat rate is offered, because free shipping's minimum is not met. Subtotal $90 → both are offered, and the customer picks free.
- An address in Berlin skips US Domestic (country does not match) and hits **Europe** → one option at $18.00.
- An address in Japan matches no region and falls through to the last zone, **Rest of World** → $35.00.
- If someone later adds a "Canada" zone at position 200, it sits after Rest of World and **is never reached** — Rest of World's wildcard matches first. Give it position 2 instead.

### Flat rate with a per-item component

A flat rate with a base cost of $5.00 and a per-item cost of $2.00, on a cart of 3 units:

```
5.00 + (2.00 × 3) = 11.00
```

The per-item value has to be set outside the admin, as described above. Through the admin alone, the same method costs a flat $5.00 no matter how many units are in the cart.

### Local pickup

A local pickup method priced at $0.00 gives the customer a no-charge collection option. Priced at, say, $3.00, it becomes a handling fee. Local pickup ignores the per-item value entirely, so its cost never varies with cart size.

## Shipping and tax

Whether shipping is taxed depends on the **shipping method's** own tax status, not on the tax rate table. A method whose tax status is `taxable` — every method created through the admin — has its cost added to the amount tax is calculated on. A method whose tax status is `none` is excluded. The tax rate table's own "Shipping" checkbox does not drive this. See [Tax](/tax).

## Product shipping classes

The product editor shows a shipping class selector. That list is hard-coded and the shipping engine never reads it, so assigning a class to a product has no effect on the rate a customer is quoted. Ignore the field, or use Pro's conditional rate rules for class-like behavior.

## Shipping REST endpoints

All of these require store-manage permission.

| Method | Route | Notes |
|---|---|---|
| GET | `/shipping/zones` | Zones with decoded regions, ordered by position |
| POST | `/shipping/zones` | `name`, `regions`, `position` |
| PUT | `/shipping/zones/{id}` | Partial update |
| DELETE | `/shipping/zones/{id}` | Also deletes the zone's methods |
| GET | `/shipping/zones/{id}/methods` | Enabled and disabled methods for a zone |
| POST | `/shipping/zones/{id}/methods` | `method_id`, `title`, `cost`, `tax_status`, `settings`, `enabled` |
| PUT | `/shipping/methods/{id}` | Partial update |
| DELETE | `/shipping/methods/{id}` | Remove a method |
| POST | `/checkout/shipping` | Public: methods and costs for an address |

The create and update routes are how you set `per_item`, `min_amount` and `tax_status`, since the admin has no field for them. Only `flat_rate`, `free_shipping` and `local_pickup` are accepted as a method type; anything else is rejected with `Unknown shipping method.`

## Extending the rates

Add-ons can add methods to whatever the zone matching produced, through the `ambikly_shipping_rates` filter. Injected methods must use the same `{method_id}:{id}` key shape so the cart's selection matching works on them identically. The filter receives the cart subtotal, total quantity, total weight, the line items and the destination address.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">More than flat rates</span></div>
  <p class="pro-callout__desc">Advanced Shipping adds conditional rate rules — weight and price bands, per-class charges and table rates — on top of the zones you already have. Shipment Tracking adds tracking numbers, carrier links and customer-facing tracking on the order.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

- [Advanced shipping](/addons/advanced-shipping)
- [Shipment tracking](/addons/shipment-tracking)

## Next

[Tax](/tax) — rate tables, matching rules, and how tax is applied to a cart.
