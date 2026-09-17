---
title: Install & activate a license
description: Install Ambikly Pro beside the free core, activate your license key, understand each license state, and fix activation problems and paused add-ons.
prev:
  text: What Pro adds
  link: /pro
next:
  text: Managing add-ons
  link: /addons-manage
---

# Install & activate a license

Ambikly Pro installs as a second plugin next to the free core. This page covers getting it onto the site, activating your license, and what each license state means.

## Before you start

| Requirement | Detail |
|---|---|
| Free core installed and active | Ambikly **0.0.10 or newer** |
| WordPress | 5.4 or newer |
| PHP | 7.4 or newer |
| An administrator account | License management requires `manage_options` |
| Outbound HTTPS | The site must be able to reach `store.ambikly.com` |

### The free core must come first

Pro checks for the free plugin twice, and neither check is advisory.

**At activation.** If the free core's schema class is not present, Pro deactivates itself immediately and stops with:

> Ambikly Pro requires the free Ambikly plugin. Please install and activate Ambikly first.

**On every page load.** If the free core's main class or version constant is missing, Pro does nothing except show an admin notice with a link to install Ambikly. If the free core is present but older than **0.0.10**, Pro also does nothing and shows:

> **Ambikly Pro** requires **Ambikly 0.0.10** or higher. Please update the free plugin.

In both cases Pro is loaded but inert — no add-ons, no REST routes, no admin screens. It is not a fatal error and nothing is damaged. Install or update the free core and Pro picks up on the next request.

## Install Ambikly Pro

<ol class="step-list">
  <li>Sign in at <a href="https://store.ambikly.com/account/">store.ambikly.com/account</a> and download the <strong>Ambikly Pro</strong> zip. Copy your license key from the same page.</li>
  <li>Confirm the free Ambikly plugin is installed and active, and that it is version 0.0.10 or newer. Check under <span class="screen-path">Plugins → Installed Plugins</span>.</li>
  <li>Go to <span class="screen-path">Plugins → Add New → Upload Plugin</span>, choose the zip and click <strong>Install Now</strong>.</li>
  <li>Click <strong>Activate Plugin</strong>. Activation runs the free core's database migration, so any new tables an add-on needs are created.</li>
  <li>Confirm <span class="screen-path">Ambikly → Add-ons</span> now lists the full catalog with toggles rather than a locked preview.</li>
</ol>

Pro adds **no** entries to the WordPress admin menu. Everything lives inside the existing Ambikly screens.

## Activate your license

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Paste your key into the license field. It has the shape <code>XXXX-XXXX-XXXX-XXXX-XXXX</code>.</li>
  <li>Click <strong>Save &amp; Activate</strong>. Pressing Enter in the field does the same thing.</li>
  <li>Wait for the status badge to read <strong>Active</strong>. You should see "License activated successfully."</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span> and switch on the add-ons you want. See <a href="/addons-manage">Managing add-ons</a>.</li>
</ol>

Activation calls the license server at `store.ambikly.com` with your key and this site's URL, then stores the response. The request has a 15-second timeout.

### What the License screen shows

Once a key is activated, the screen displays:

| Field | What it means |
|---|---|
| Status | Active, Expired, Invalid or Disabled. See the table below. |
| License key | Masked — first four characters, then bullets, then the last four. The full key is never sent back to the browser. |
| Expires | The renewal date, or `lifetime` for a one-time license. |
| Customer name and email | Who the license belongs to, from the license server. |
| Site count / License limit | How many of your seats are in use. Pro is 1 site, Agency is 10. |
| Activations left | Seats remaining. |
| Account link | Opens your license account at store.ambikly.com. |

Three buttons are available: **Save & Activate**, **Deactivate License**, and a status refresh that re-checks the license server without changing anything.

## License states

The status comes straight from the license server and is stored locally.

| Status | Badge | What it means | What to do |
|---|---|---|---|
| `valid` | Active | The license is activated on this site and in good standing. Add-ons boot normally. | Nothing. |
| `expired` | Expired | The license was valid but the term has ended. Add-ons are paused. | Renew from your account, then refresh the status. |
| `invalid` | Invalid | The key is not recognized, or is not activated for this site URL. | Check the key for typos. If the site URL changed, deactivate and re-activate. |
| `disabled` | Disabled | The license was revoked or refunded. | Contact support. |
| *(empty or other)* | Unknown | No key has been activated yet, or the server returned something unexpected. | Enter your key and activate. |

Only `valid` counts as licensed. Every other state pauses add-ons — see [What Pro adds](/pro) for exactly what that does and does not affect.

## Daily revalidation

Pro schedules a WordPress cron event named `ambikly_pro_daily_license_check` that runs **once a day**. It reads the stored key and asks the license server for its current status, then updates the stored details.

Two things follow from this:

- **A renewal picks itself up.** You do not have to re-enter anything after renewing. The next daily check flips the status back to Active, or you can force it immediately with the refresh button on the License screen.
- **A revoked or expired license takes effect within a day.** Nothing in Pro calls the license server on a normal page load — the per-request check that gates add-ons is a cached option read, which is why it costs nothing.

The scheduled event is removed when the Pro plugin is deactivated, along with the cached plugin-update data.

<div class="ui-tip"><strong>Tip:</strong> WordPress cron only fires when the site gets traffic. On a very quiet site the daily check can lag. The refresh button on the License screen always runs immediately.</div>

## Moving a license to another site

Each license covers a fixed number of sites. To move a seat, free it on the old site first.

<ol class="step-list">
  <li>On the old site, go to <span class="screen-path">Ambikly → Settings → License</span> and click <strong>Deactivate License</strong>.</li>
  <li>Confirm the prompt: "Deactivate this license on the current site?"</li>
  <li>Wait for the success message. The seat is released on the license server and <strong>Activations left</strong> goes up by one.</li>
  <li>On the new site, install Ambikly Pro and activate the same key with <strong>Save &amp; Activate</strong>.</li>
</ol>

<div class="ui-warn"><strong>Careful:</strong> Deactivating does <strong>not</strong> remove your license key from the site. It clears the cached license details and the raw server response, but the stored key stays in place. That is convenient for re-activating later, and it also means the key is still in the database — remove it manually if you are handing the site over to someone else.</div>

Nothing else changes when you deactivate. Add-ons stay enabled in the database and their settings and data are untouched; they simply stop booting until a valid license is present again.

## What gets stored

Pro keeps license data in three WordPress options:

| Option | Contents |
|---|---|
| `ambikly_pro_license_key` | The raw key string. Survives deactivation. |
| `ambikly_pro_license_details` | The parsed status fields — status, expiry, customer, seat counts. Cleared on deactivation. |
| `ambikly_pro_license_server_response` | The full raw response from the license server. Cleared on deactivation. |

## REST routes

The License screen uses five routes. All of them require `manage_options`.

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/ambikly-pro/v1/license` | `manage_options` | Current status. The key comes back masked. |
| POST | `/ambikly-pro/v1/license` | `manage_options` | Saves a key **without** activating it. `license_key` is required. |
| POST | `/ambikly-pro/v1/license/activate` | `manage_options` | Saves and activates. Uses the stored key if none is sent. |
| POST | `/ambikly-pro/v1/license/deactivate` | `manage_options` | Releases the seat. Keeps the stored key. |
| POST | `/ambikly-pro/v1/license/check` | `manage_options` | Refreshes status from the license server. |

Error responses you may see: `400 missing_key` / `400 no_key` when there is no key to work with, `422 activation_failed` or `422 check_failed` when the license server rejects the request, and `502 deactivation_failed` when the license server cannot be reached at all.

---

## Troubleshooting

### The license will not activate

Work through these in order.

<ol class="step-list">
  <li><strong>Check the key.</strong> Copy it again from <a href="https://store.ambikly.com/account/">your account</a>. Watch for a trailing space or a line break picked up by the copy.</li>
  <li><strong>Check the site URL.</strong> A license is activated against the site's home URL. If you moved from <code>http</code> to <code>https</code>, or added or removed <code>www</code>, the license server sees a different site. Deactivate and re-activate.</li>
  <li><strong>Check outbound HTTPS.</strong> The site must be able to POST to <code>store.ambikly.com</code>. A firewall, a security plugin blocking outbound requests, or a locked-down host will break this. The request times out after 15 seconds.</li>
  <li><strong>Read the message.</strong> "Activation failed: Expired" means the license term has ended, not that the key is wrong. "Activation failed: No Site Limit" or a similar seat error means you are out of activations — see below.</li>
  <li><strong>Could not reach the license server</strong> on deactivation is a network problem, not a license problem. Retry once the site can reach the server.</li>
</ol>

### Add-ons are paused

You will see an admin notice like:

> **Ambikly Pro:** your license isn't active, so 6 enabled add-ons are currently paused (their settings are untouched and they resume instantly once the license is valid).

This means add-ons are still enabled in the database but are not booting, because the stored license status is not `valid`. Nothing has been deleted or switched off.

<ol class="step-list">
  <li>Open <span class="screen-path">Ambikly → Settings → License</span> and read the status badge.</li>
  <li>If it says <strong>Expired</strong>, renew from your account, then click the refresh button to re-check immediately.</li>
  <li>If it says <strong>Invalid</strong>, the site URL probably changed. Deactivate and re-activate the key.</li>
  <li>If it says <strong>Active</strong> but add-ons are still paused, the page you are looking at may be cached. Reload wp-admin.</li>
</ol>

The most common cause outside renewal is **cloning a site**. A database copied from a licensed site carries the licensed status with it, but the license server is checked daily against the new site's own URL, so the clone flips to invalid within a day. Activate the clone with its own seat, or leave it running on the free core.

### Activation limit reached

**Activations left** on the License screen is zero and activation is refused.

<ol class="step-list">
  <li>Open <a href="https://store.ambikly.com/account/">your license account</a> and look at the list of activated sites.</li>
  <li>Deactivate a site you no longer use — ideally from that site's own License screen, so the seat is released cleanly.</li>
  <li>If the old site is gone and you cannot reach its admin, release the seat from your account page instead.</li>
  <li>Retry <strong>Save &amp; Activate</strong> on the new site.</li>
</ol>

Staging and development copies each consume a seat. If you run a staging site permanently, an Agency license covers ten sites.

### Pro is installed but nothing appears

Check <span class="screen-path">Plugins → Installed Plugins</span>. If Ambikly Pro is active but the Add-ons screen still shows the locked free preview, the free core is almost certainly older than 0.0.10 — look for the admin notice naming the required version, and update the free plugin.

For anything else, see [Troubleshooting](/troubleshooting) and [System status](/system-status).

## Where to go next

- [Managing add-ons](/addons-manage) — enabling, disabling and configuring the 35 add-ons.
- [All add-ons](/addons/) — the full catalog.
- [What Pro adds](/pro) — the free-versus-Pro boundary and pricing.
