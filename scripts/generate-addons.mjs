#!/usr/bin/env node
/**
 * Generates docs/addons/{slug}.md — one reference page per Ambikly Pro
 * add-on — plus docs/addons/index.md, from data/addons.json.
 *
 * The data file is exported from the plugin's own add-on records, so the
 * pages can never claim a setting, route or hook the add-on does not have.
 * Run `npm run addons` after updating data/addons.json; `npm run build`
 * runs it for you.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const { addons, categories } = JSON.parse(readFileSync(resolve(root, 'data/addons.json'), 'utf8'))
const outDir = resolve(root, 'docs/addons')
mkdirSync(outDir, { recursive: true })

const PRICE = { yearly: '199', lifetime: '549' }

/** Escape for a YAML double-quoted scalar. */
const yaml = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')

/** Trim to a word boundary so a meta description never ends mid-word. */
const clamp = (s, max) => {
  const t = String(s).trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\s]+$/, '') + '…'
}

/** First sentence, for a meta description. */
const firstSentence = (s) => {
  const m = String(s).match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : String(s)).trim()
}

const sorted = [...addons].sort((a, b) => a.name.localeCompare(b.name))

sorted.forEach((a, i) => {
  const prev = sorted[i - 1]
  const next = sorted[i + 1]
  const cat = a.categoryLabel || categories[a.category] || ''
  const desc = clamp(`${a.tagline} ${firstSentence(a.overview)}`.replace(/\s+/g, ' ').trim(), 175)

  let md = `---
title: ${JSON.stringify(a.name)}
description: "${yaml(desc)}"
`
  if (prev) md += `prev:\n  text: ${JSON.stringify(prev.name)}\n  link: /addons/${prev.slug}\n`
  else md += `prev:\n  text: "All add-ons"\n  link: /addons/\n`
  if (next) md += `next:\n  text: ${JSON.stringify(next.name)}\n  link: /addons/${next.slug}\n`
  // Last add-on hands the reader on to the developer section.
  else md += `next:\n  text: "Developer overview"\n  link: /developers/\n`
  md += `---\n\n`

  md += `# ${a.name} <span class="pro-pill">PRO</span>\n\n`
  md += `> ${a.tagline}\n\n`
  if (cat) {
    md += `<p><strong>Category:</strong> ${cat} · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → ${a.name}</span></p>\n\n`
  }

  md += `## What it does\n\n${a.overview}\n\n`

  if (a.features?.length) {
    md += `## Capabilities\n\n`
    a.features.forEach((f) => (md += `- ${f}\n`))
    md += `\n`
  }

  md += `## Turn it on\n\n<ol class="step-list">\n`
  md += `  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>\n`
  md += `  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>${a.name}</strong> and switch it on. There is nothing else to install.</li>\n`
  if (a.settings?.length) {
    md += `  <li>Open its settings panel and set the options listed below.</li>\n`
  }
  if (a.storefront?.length) {
    md += `  <li>Visit your storefront to confirm the new surface appears: ${a.storefront[0].toLowerCase()}.</li>\n`
  }
  md += `</ol>\n\n`

  if (a.settings?.length) {
    // Some records carry "Label — what it does"; others are bare labels.
    // A table with a filler second column reads worse than a plain list.
    const described = a.settings.filter((s) => /\s+—\s+|:\s+/.test(s))
    md += `## Settings\n\n`
    md += `Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → ${a.name}</span>.\n\n`
    if (described.length === a.settings.length) {
      md += `| Setting | What it controls |\n| --- | --- |\n`
      a.settings.forEach((s) => {
        const [label, ...rest] = s.split(/\s+—\s+|:\s+/)
        md += `| **${label.trim()}** | ${rest.join(' — ').trim()} |\n`
      })
    } else {
      a.settings.forEach((s) => (md += `- **${s}**\n`))
    }
    md += `\n`
  } else {
    md += `## Settings\n\nThis add-on has no settings — turning it on is the whole configuration.\n\n`
  }

  if (a.storefront?.length || a.admin?.length) {
    md += `## Where it appears\n\n`
    if (a.storefront?.length) {
      md += `**On the storefront**\n\n`
      a.storefront.forEach((s) => (md += `- ${s}\n`))
      md += `\n`
    }
    if (a.admin?.length) {
      md += `**In the admin**\n\n`
      a.admin.forEach((s) => (md += `- ${s}\n`))
      md += `\n`
    }
  }

  if (a.scenarios?.length) {
    md += `## When to use it\n\n`
    a.scenarios.forEach((s) => (md += `### ${s.title}\n\n${s.body}\n\n`))
  }

  if (a.integrations?.length) {
    md += `## Third-party services\n\n`
    md += `This add-on talks to:\n\n`
    a.integrations.forEach((s) => (md += `- ${s}\n`))
    md += `\nYou supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.\n\n`
  }

  if (a.rest_routes?.length || a.hooks_used?.length) {
    md += `## For developers\n\n`
    if (a.rest_routes?.length) {
      md += `**REST routes**\n\n`
      a.rest_routes.forEach((r) => (md += `- \`${r}\`\n`))
      md += `\nEvery route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).\n\n`
    }
    if (a.hooks_used?.length) {
      md += `**Core hooks it listens to**\n\n`
      a.hooks_used.forEach((h) => (md += `- \`${h}\`\n`))
      md += `\nThe full list is in the [hooks reference](/developers/hooks).\n\n`
    }
  }

  if (a.faq?.length) {
    md += `## Questions\n\n`
    a.faq.forEach((q) => (md += `### ${q.q}\n\n${q.a}\n\n`))
  }

  if (a.works_with?.length) {
    const links = a.works_with
      .map((slug) => addons.find((x) => x.slug === slug))
      .filter(Boolean)
      .map((x) => `[${x.name}](/addons/${x.slug})`)
    if (links.length) md += `## Works well with\n\n${links.join(' · ')}\n\n`
  }

  md += `## Turning it off\n\n`
  md += `Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.\n\n`

  md += `<div class="pro-callout">\n  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">${a.name} is part of Ambikly Pro</span></div>\n  <p class="pro-callout__desc">One license covers all ${addons.length} add-ons — $${PRICE.yearly} a year or $${PRICE.lifetime} once for a single site. Nothing here is sold separately.</p>\n  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>\n</div>\n`

  writeFileSync(resolve(outDir, `${a.slug}.md`), md)
})

// ---- catalog index -------------------------------------------------------
const byCat = {}
addons.forEach((a) => {
  const key = a.categoryLabel || categories[a.category] || 'Other'
  ;(byCat[key] ||= []).push(a)
})
const order = ['Marketing', 'Store', 'Checkout', 'Physical', 'Digital', 'Customer', 'Admin', 'AI', 'Merchandising']
const catKeys = Object.keys(byCat).sort((a, b) => {
  const ia = order.indexOf(a)
  const ib = order.indexOf(b)
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
})

let idx = `---
title: "All add-ons"
description: "Every Ambikly Pro add-on, grouped by what it does. All ${addons.length} are included in one license — enable any of them from Ambikly → Add-ons."
prev:
  text: "Managing add-ons"
  link: /addons-manage
next:
  text: ${JSON.stringify(sorted[0].name)}
  link: /addons/${sorted[0].slug}
---

# All add-ons

Ambikly Pro ships **${addons.length} add-ons**. They are not separate plugins: they live inside Ambikly Pro, run on the same engine and database as the free core, and are switched on one at a time from <span class="screen-path">Ambikly → Add-ons</span>.

One license covers every add-on on this page. See [what Pro adds](/pro) for the difference between the free core and Pro, or [managing add-ons](/addons-manage) for how enabling and disabling behaves.

`

catKeys.forEach((cat) => {
  const list = [...byCat[cat]].sort((a, b) => a.name.localeCompare(b.name))
  idx += `## ${cat}\n\n<div class="ak-addon-grid">\n`
  list.forEach((a) => {
    idx += `<a class="ak-addon" href="/addons/${a.slug}"><strong>${a.name}</strong><span>${a.card || a.tagline}</span></a>\n`
  })
  idx += `</div>\n\n`
})

idx += `## Every add-on, alphabetically\n\n| Add-on | Category | What it does |\n| --- | --- | --- |\n`
sorted.forEach((a) => {
  idx += `| [${a.name}](/addons/${a.slug}) | ${a.categoryLabel || categories[a.category] || ''} | ${(a.card || a.tagline).replace(/\|/g, '\\|')} |\n`
})
idx += `\n`

writeFileSync(resolve(outDir, 'index.md'), idx)

console.log(`generate-addons: wrote ${sorted.length} add-on pages + index to docs/addons/`)
