#!/usr/bin/env node
/**
 * Generates public/llms.txt and public/llms-full.txt from the built docs.
 *
 * llms.txt      — the index: what Ambikly is, plus every page with its description.
 * llms-full.txt — the entire documentation as one plain-text file, so a model can
 *                 be handed the whole manual in a single fetch.
 *
 * Runs before `vitepress build` (see package.json), so both files are copied into
 * dist/ as ordinary public assets.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const docsDir = resolve(root, 'docs')
const outDir = resolve(docsDir, 'public')
const SITE = 'https://docs.ambikly.com'

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (entry.endsWith('.md')) out.push(full)
  }
  return out
}

/** Split front matter from body without pulling in a YAML dependency. */
function parse(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw }
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (!v) continue // nested block (prev/next) — not needed here
    v = v.replace(/^["'](.*)["']$/, '$1')
    data[kv[1]] = v
  }
  return { data, body: m[2] }
}

/** Markdown → readable plain text. Keeps headings and list structure. */
function toText(md) {
  return md
    .replace(/```[\s\S]*?```/g, (b) => b.replace(/```\w*\n?/g, '').trimEnd()) // keep code, drop fences
    .replace(/<div class="pro-callout">[\s\S]*?<\/div>/g, '')
    .replace(/<ol class="step-list">([\s\S]*?)<\/ol>/g, (_, inner) =>
      inner
        .split(/<li>/)
        .slice(1)
        .map((li, i) => `${i + 1}. ${li.replace(/<\/li>\s*/g, '').trim()}`)
        .join('\n')
    )
    .replace(/<span class="screen-path">(.*?)<\/span>/g, '$1')
    .replace(/<span class="(?:pro|free)-pill">(.*?)<\/span>/g, '[$1]')
    .replace(/<[^>]+>/g, '')
    .replace(/:::\s*\w+\s*(.*)/g, '$1')
    .replace(/:::/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const files = walk(docsDir).sort()
const pages = files.map((file) => {
  const rel = relative(docsDir, file).replace(/\\/g, '/')
  const route = '/' + rel.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')
  const { data, body } = parse(readFileSync(file, 'utf8'))
  return {
    route,
    url: SITE + (route === '/' ? '/' : route),
    title: data.title || rel,
    description: data.description || '',
    body,
  }
})

const order = (r) =>
  r === '/' ? 0 : r.startsWith('/developers') ? 2 : r.startsWith('/addons') ? 3 : 1
pages.sort((a, b) => order(a.route) - order(b.route) || a.route.localeCompare(b.route))

// ---------- llms.txt ----------
let idx = `# Ambikly Documentation

> Official documentation for Ambikly, a WordPress eCommerce plugin. The free core sells physical
> products, digital downloads and variable products from one product table, one cart and one admin,
> with Stripe, PayPal and five offline payment methods, coupons, tax, shipping zones, customer
> accounts, invoices, a REST API, webhooks and WP-CLI. Ambikly Pro adds 35 add-ons on one license.
> Self-hosted on your own WordPress site. No transaction fees on any plan.

Documentation site: ${SITE}
Product site: https://ambikly.com
Free plugin: https://wordpress.org/plugins/ambikly/
Full plain-text documentation: ${SITE}/llms-full.txt

`

const groups = [
  ['Guide', (p) => order(p.route) <= 1],
  ['Developer reference', (p) => p.route.startsWith('/developers')],
  ['Add-on reference', (p) => p.route.startsWith('/addons')],
]
for (const [label, test] of groups) {
  const list = pages.filter(test)
  if (!list.length) continue
  idx += `## ${label}\n\n`
  for (const p of list) {
    idx += `- [${p.title}](${p.url})${p.description ? ': ' + p.description : ''}\n`
  }
  idx += '\n'
}

writeFileSync(resolve(outDir, 'llms.txt'), idx)

// ---------- llms-full.txt ----------
let full = idx + '\n\n---\n\n# Full documentation\n\n'
for (const p of pages) {
  full += `\n\n================================================================\n`
  full += `# ${p.title}\nURL: ${p.url}\n`
  if (p.description) full += `${p.description}\n`
  full += `================================================================\n\n`
  full += toText(p.body) + '\n'
}
full += `\n\nGenerated ${new Date().toISOString().slice(0, 10)} from ${pages.length} pages.\n`

writeFileSync(resolve(outDir, 'llms-full.txt'), full)

console.log(
  `generate-llms: ${pages.length} pages → public/llms.txt (${(idx.length / 1024).toFixed(1)} KB) ` +
    `and public/llms-full.txt (${(full.length / 1024).toFixed(0)} KB)`
)
