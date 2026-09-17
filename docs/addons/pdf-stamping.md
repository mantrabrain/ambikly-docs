---
title: "PDF Stamping"
description: "Watermarks delivered PDFs with the buyer’s name and order number so leaks are traceable. When ambikly_order_paid fires, the add-on finds every product file on the order whose…"
prev:
  text: "Order Bumps"
  link: /addons/order-bumps
next:
  text: "Popup Campaigns"
  link: /addons/popup-campaigns
---

# PDF Stamping <span class="pro-pill">PRO</span>

> Watermarks delivered PDFs with the buyer’s name and order number so leaks are traceable.

<p><strong>Category:</strong> Digital · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → PDF Stamping</span></p>

## What it does

When ambikly_order_paid fires, the add-on finds every product file on the order whose URL resolves to a local PDF and writes a stamped copy into uploads/ambikly-pro/stamped under a random 64-character name, caching the order-and-file to stamped-URL mapping in a transient for seven days. The ambikly_download_file_url filter swaps the customer's download link for that copy, re-stamping on demand if the cache has expired, so the plain original is not served. With setasign FPDI via TCPDF installed, every page receives the watermark at the configured opacity and font size; otherwise a dependency-free fallback appends the note to a copy. Stamped files older than seven days are pruned.

## Capabilities

- Stamps at payment; serves the stamped copy on download
- Re-stamps on demand after the seven-day cache expires
- Per-page watermark via FPDI with configurable opacity and size
- Dependency-free fallback when no PDF library is installed
- Template with {customer_name} and {order_id} placeholders
- Customer name taken from the billing address
- Stamped files named from 32 random bytes
- Daily prune of stamped files older than seven days

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>PDF Stamping</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: download links resolve to the stamped copy.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → PDF Stamping</span>.

- **Watermark template with {customer_name} and {order_id}**
- **Position (footer, header or both)**
- **Opacity from 1 to 100 (default 35)**
- **Font size in points (default 10)**

## Where it appears

**On the storefront**

- Download links resolve to the stamped copy

## When to use it

### Ebook and report publishers

An independent publisher sells PDF guides. Each paid order gets a copy stamped with the buyer's name and order number, so a file that turns up on a sharing site can be traced back to the order and the customer contacted about it.

### Sheet music and sewing patterns

A store selling patterns or scores licenses a single buyer per copy. The visible footer on every page acts as a reminder of that license and discourages casual forwarding, without blocking the legitimate printing the buyer paid for.

### Training materials sold to teams

A consultancy sells workbooks to companies. Stamping the purchaser's name and order id on each page makes it clear which client a copy belongs to, which is useful when the same material is licensed to several organizations at once.

## Third-party services

This add-on talks to:

- setasign/FPDI via TCPDF (optional)

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**Core hooks it listens to**

- `ambikly_order_paid`
- `ambikly_download_file_url`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Do I need to install a PDF library for stamping to work?

No. If the setasign FPDI class for TCPDF is autoloadable, each page is imported and the watermark drawn on it at your opacity and font size. Without it the add-on copies the file and appends a watermark comment, which keeps the file valid but is not visible on the page.

### Is the original PDF modified?

No. The source file is only read. A stamped copy is written to uploads/ambikly-pro/stamped with a random file name, and the download filter points the customer at that copy. Deleting stamped copies never affects your master file.

### Do stamped files pile up on disk?

No. Every stamp operation triggers a prune at most once a day that deletes stamped files older than seven days, matching the transient cache lifetime. If a customer downloads later, a fresh copy is stamped and cached for another seven days.

### Whose name appears in the watermark?

The first and last name from the order's billing address. If the billing address has no name, the customer's email is used, and 'Customer' as a last resort. The order id comes from the same order, so the default template reads 'Licensed to Jane Doe • Order #1234'.

## Works well with

[Download Analytics](/addons/download-analytics)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">PDF Stamping is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
