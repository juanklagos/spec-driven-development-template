// Single source of truth for how the 52 guides are named and grouped on the site.
// Imported by both scripts/sync-docs.mjs (which writes the pages) and astro.config.mjs
// (which builds the sidebar and the redirects), so the two can never drift apart.
//
// Starlight pairs translations by FILE PATH, not by guide number: es/guides/00-introduccion
// and en/guides/00-introduction reduce to different paths, so it treats them as two pages and
// puts both in every sidebar. That is why every guide is published under its English file name
// in both locales, and why the old Spanish URLs need redirects.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { slug as githubSlug } from 'github-slugger';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(here, '..', '..', 'docs');

export const LOCALES = ['en', 'es'];

/** Guide numbers per sidebar group, in the order they should be read. */
export const GROUPS = [
	{
		label: 'Start here',
		es: 'Empieza aquí',
		collapsed: false,
		guides: ['00', '13', '23', '02', '04', '05'],
	},
	{
		label: 'Learn SDD',
		es: 'Aprende SDD',
		guides: ['18', '14', '15', '25', '12', '11', '21', '20'],
	},
	{
		label: 'Work with AI agents',
		es: 'Trabaja con agentes de IA',
		guides: ['03', '10', '19', '26', '30', '49', '16', '17'],
	},
	{
		label: 'Visual builder & MCP',
		es: 'Builder visual y MCP',
		guides: ['51', '33', '43', '41', '44', '45', '47', '48', '36'],
	},
	{
		label: 'Real projects',
		es: 'Proyectos reales',
		guides: ['01', '42', '27', '22', '28', '29', '07', '08'],
	},
	{
		label: 'Reference',
		es: 'Referencia',
		guides: ['06', '40', '24', '37', '09', '31'],
	},
	{
		label: 'Project & releases',
		es: 'Proyecto y lanzamientos',
		guides: ['35', '34', '38', '39', '46', '32', '50'],
	},
];

const numberOf = (file) => file.slice(0, 2);
const slugOf = (file) => file.replace(/\.md$/, '').toLowerCase();

// The URL segment Astro derives from a file name. Not always the file name itself:
// github-slugger drops the dots, so 39-v1.2.0-preparation.md is served at 39-v120-preparation.
// Using the same function Astro uses beats hardcoding the two guides that differ today.
export const urlSlugOf = (file) => githubSlug(slugOf(file));

/** { en: { '00': '00-introduction', … }, es: { '00': '00-introduccion', … } } */
export function readGuideSlugs() {
	const byLocale = {};
	for (const locale of LOCALES) {
		const slugs = {};
		for (const file of readdirSync(join(docsRoot, locale)).filter((f) => f.endsWith('.md'))) {
			slugs[numberOf(file)] = slugOf(file);
		}
		byLocale[locale] = slugs;
	}
	return byLocale;
}

/**
 * The name a guide is published under, in every locale: its English file name.
 * Falls back to the source name for anything that is not a numbered guide.
 */
export function publishedSlugs() {
	const { en } = readGuideSlugs();
	return (file) => en[numberOf(file)] ?? slugOf(file);
}

/**
 * Fails loudly rather than silently dropping a guide from the site.
 * A guide with no counterpart in the other locale would be served untranslated under both
 * languages; a guide missing from GROUPS would exist but never appear in the sidebar.
 */
export function assertGuidesAreCovered() {
	const slugs = readGuideSlugs();
	const problems = [];

	const numbers = new Set(LOCALES.flatMap((l) => Object.keys(slugs[l])));
	for (const n of [...numbers].sort()) {
		const missing = LOCALES.filter((l) => !slugs[l][n]);
		if (missing.length) problems.push(`guide ${n} has no ${missing.join(' / ')} counterpart`);
	}

	const grouped = GROUPS.flatMap((g) => g.guides);
	for (const n of [...numbers].sort()) {
		const times = grouped.filter((g) => g === n).length;
		if (times !== 1) problems.push(`guide ${n} (${slugs.en[n] ?? '?'}) appears in ${times} sidebar groups, expected exactly 1`);
	}
	for (const n of grouped) {
		if (!numbers.has(n)) problems.push(`sidebar group references guide ${n}, which does not exist in docs/`);
	}

	if (problems.length) {
		throw new Error(`site/src/guides.mjs is out of sync with docs/:\n  - ${problems.join('\n  - ')}`);
	}
	return numbers.size;
}

/**
 * Standalone pages: authored directly under site/src/content/docs/<locale>/,
 * not synced from docs/. They sit above the guide groups because they are
 * destinations rather than reading, and scripts/sync-docs.mjs only ever wipes
 * <locale>/guides/, so hand-authored siblings survive a sync.
 */
const PAGES = [{ slug: 'download', label: 'Download SDD Desk', es: 'Descargar SDD Desk' }];

/** Starlight sidebar: curated groups, labels translated, guides resolved per locale by slug. */
export function buildSidebar() {
	assertGuidesAreCovered();
	const { en } = readGuideSlugs();
	return [
		...PAGES.map((page) => ({
			label: page.label,
			translations: { es: page.es },
			link: page.slug,
		})),
		...GROUPS.map((group) => ({
			label: group.label,
			translations: { es: group.es },
			collapsed: group.collapsed !== false,
			items: group.guides.map((n) => `guides/${urlSlugOf(en[n])}`),
		})),
	];
}

/**
 * Old Spanish URLs -> the unified ones, so nothing that was already published 404s.
 * Generated from the file names themselves, so it cannot go stale.
 */
export function buildLegacyRedirects(base) {
	const { en, es } = readGuideSlugs();
	const redirects = {};
	for (const [n, spanish] of Object.entries(es)) {
		const from = urlSlugOf(spanish);
		const to = en[n] && urlSlugOf(en[n]);
		if (!to || to === from) continue;
		redirects[`/es/guides/${from}`] = `${base}/es/guides/${to}/`;
	}
	return redirects;
}
