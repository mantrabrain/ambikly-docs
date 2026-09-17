#!/usr/bin/env node
/**
 * Writes dist/_headers with a Content-Security-Policy for the built site.
 *
 * Why this exists: Netlify injects a "Powered by Netlify" badge into every
 * page of a Free-plan project by loading /.netlify/scripts/hud. Netlify's own
 * docs state the badge cannot render when the site's CSP omits
 * 'unsafe-inline' from script-src. VitePress needs four inline scripts
 * (dark-mode preflight, macOS class, the route hash map, the JSON-LD block),
 * and the hash map changes on every build — so the allow-list is computed
 * here, after `vitepress build`, from the actual output.
 *
 * Runs as the last step of `npm run build`. Netlify reads `_headers` from the
 * publish directory and merges it with netlify.toml.
 */
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dist = resolve(here, '../docs/.vitepress/dist')
if (!existsSync(join(dist, 'index.html'))) {
  console.error('csp: dist/index.html not found — run vitepress build first')
  process.exit(1)
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (e.endsWith('.html')) out.push(p)
  }
  return out
}

// Collect the sha256 of every inline <script> body across every page. All
// pages currently share the same set; scanning them all keeps this correct
// if a page ever adds its own.
const hashes = new Set()
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g
for (const file of walk(dist)) {
  const html = readFileSync(file, 'utf8')
  for (const m of html.matchAll(re)) {
    if (!m[1].trim()) continue
    hashes.add("'sha256-" + createHash('sha256').update(m[1]).digest('base64') + "'")
  }
}

const csp = [
  "default-src 'self'",
  // No 'unsafe-inline': that is the line that keeps the Netlify badge out.
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  // VitePress and medium-zoom set inline styles at runtime.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

writeFileSync(join(dist, '_headers'), `/*\n  Content-Security-Policy: ${csp}\n`)
console.log(`csp: wrote dist/_headers with ${hashes.size} inline-script hashes`)
