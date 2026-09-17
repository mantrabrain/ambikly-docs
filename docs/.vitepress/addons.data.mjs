/**
 * Sidebar entries for the 35 add-on reference pages, read from the same
 * data file that generates the pages themselves (scripts/generate-addons.mjs).
 * Adding an add-on to data/addons.json puts it in the sidebar automatically.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(resolve(here, '../../data/addons.json'), 'utf8'))

export const addons = data.addons
export const categories = data.categories

export const addonSidebar = [
  { text: 'All add-ons', link: '/addons/' },
  ...[...data.addons]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((a) => ({ text: a.name, link: `/addons/${a.slug}` })),
]
