---
title: "Download Analytics"
description: "Logs every digital download and reports counts, unique customers and daily trends. Listens to the core ambikly_download_served action and inserts a row into its own…"
prev:
  text: "CRM Sync"
  link: /addons/crm-sync
next:
  text: "Dynamic Pricing"
  link: /addons/dynamic-pricing
---

# Download Analytics <span class="pro-pill">PRO</span>

> Logs every digital download and reports counts, unique customers and daily trends.

<p><strong>Category:</strong> Digital · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Download Analytics</span></p>

## What it does

Listens to the core ambikly_download_served action and inserts a row into its own ambikly_download_log table for every file served: order, customer and product ids, file name, byte count, a SHA-256 hash of the IP salted with AUTH_SALT, a truncated user agent and a site-local timestamp. GET /ambikly-pro/v1/download-analytics, readable by anyone with the view-store capability, returns the top 100 files by download count with unique customers, plus a per-day series for the requested date range, defaulting to the last 30 days. A daily WP-Cron job deletes rows older than the retention setting, and uninstalling clears the schedule.

## Capabilities

- Logs every download the core serves
- Own ambikly_download_log table, indexed by product, customer and date
- IP stored only as a salted SHA-256 hash
- Per-file report: downloads and unique customers, top 100
- Per-day series over any from/to range
- Default range is the last 30 days
- Daily prune to the retention window; 0 keeps forever
- Report readable by view-store roles such as Support Agent

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Download Analytics</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Download Analytics</span>.

- **Retention in days (default 365; 0 keeps rows forever)**

## Where it appears

**In the admin**

- Download report endpoint with per-file table and daily series
- from and to query parameters to set the date range

## When to use it

### Course sellers checking engagement

A store selling video courses as multiple downloadable files wants to know which lessons customers actually fetch. The per-file report shows counts and unique customers, revealing modules that are downloaded once and never revisited, which guides where to improve.

### Spotting shared download links

A stock-asset store notices one file with far more downloads than unique customers. That ratio in the report prompts a check of the order behind it, and pairs well with PDF Stamping so any copy that surfaces can be traced.

### Planning bandwidth after a launch

A store releasing a large software bundle watches the daily series in the weeks after launch. The curve shows when download traffic settles, informing hosting and CDN decisions with real numbers rather than guesses about demand.

## For developers

**REST routes**

- `GET /ambikly-pro/v1/download-analytics`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `ambikly_download_served`
- `ambikly_pro_download_log_prune`
- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Does Download Analytics store personal data?

Only ids that already exist in your orders table, the file name, a truncated user-agent string and a SHA-256 hash of the IP address salted with your site's AUTH_SALT. The raw IP is never written, so a log row cannot be traced back to an address.

### How long is download history kept?

For the number of days in the Retention setting, 365 by default. A WP-Cron event runs daily and deletes older rows. Setting retention to 0 disables pruning and keeps every row until you clear the table yourself.

### Who can view the download report?

Anyone with the ambikly_view_store capability or manage_options, which covers Administrators, Store Managers and the Support Agent role. The endpoint is read-only; nothing in the add-on lets a request modify or delete log rows.

### Can I see which files are downloaded most?

Yes. The report groups the log by product and file name, returning the download count and distinct customers for the top 100 files in the date range, sorted by downloads. A second series gives daily totals for charting trends.

## Works well with

[PDF Stamping](/addons/pdf-stamping) · [Software Licensing Pro](/addons/license-pro)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Download Analytics is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
