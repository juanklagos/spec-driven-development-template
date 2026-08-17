// Single source of truth for how the guides are named and grouped on the site.
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

/**
 * Spec 033 — the single source of what each guide IS.
 *
 * Four needs from Diátaxis (https://diataxis.fr/) plus one for repository
 * material that is not product documentation. Both the sidebar and the header
 * block that scripts/sync-doc-types.mjs writes into every guide read from
 * here, so a guide cannot be one type in the menu and another on the page.
 *
 * Order inside each type is reading order, not numeric order.
 */
export const GUIDE_TYPES = [
	{
		id: 'tutorial',
		label: 'Learn by doing',
		es: 'Aprende haciendo',
		badge: 'Tutorial',
		esBadge: 'Tutorial',
		intent: 'A guided lesson. Follow it start to finish and you will have built something.',
		esIntent: 'Una lección guiada. Síguela de principio a fin y habrás construido algo.',
		collapsed: false,
		guides: ['13', '23', '18', '25', '14', '15'],
	},
	{
		id: 'how-to',
		label: 'Get something done',
		es: 'Consigue algo concreto',
		badge: 'How-to',
		esBadge: 'Cómo hacer',
		intent: 'Steps for one specific job. Assumes you already know the basics.',
		esIntent: 'Pasos para una tarea concreta. Da por sabido lo básico.',
		guides: ['03', '51', '52', '33', '36', '43', '44', '47', '48', '12', '11', '21', '22', '27', '28', '29', '16', '17', '08', '07', '09'],
	},
	{
		id: 'reference',
		label: 'Look something up',
		es: 'Consulta un dato',
		badge: 'Reference',
		esBadge: 'Referencia',
		intent: 'Facts to consult while you work. Not meant to be read end to end.',
		esIntent: 'Datos para consultar mientras trabajas. No está pensada para leerse entera.',
		guides: ['04', '41', '54', '40', '01', '42', '06', '10', '19', '26', '30', '49', '45', '37', '53', '31', '05'],
	},
	{
		id: 'explanation',
		label: 'Understand why',
		es: 'Entiende por qué',
		badge: 'Explanation',
		esBadge: 'Explicación',
		intent: 'Background and reasoning. No instructions here.',
		esIntent: 'Contexto y razones. Aquí no hay instrucciones.',
		guides: ['00', '02', '20', '24', '50'],
	},
	{
		id: 'project',
		label: 'About this project',
		es: 'Sobre este proyecto',
		badge: 'Project',
		esBadge: 'Proyecto',
		intent: 'Repository material: roadmap, releases and audits. Not product documentation.',
		esIntent: 'Material del repositorio: roadmap, lanzamientos y auditorías. No es documentación de producto.',
		guides: ['35', '34', '38', '39', '46', '32'],
	},
];

/** Back-compat: everything that used GROUPS reads the same data. */
export const GROUPS = GUIDE_TYPES;

/** { '13': 'tutorial', '51': 'how-to', … } */
export function typeByGuide() {
	const map = {};
	for (const type of GUIDE_TYPES) {
		for (const n of type.guides) map[n] = type;
	}
	return map;
}

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
		// Spec 035: el contador va en la etiqueta del grupo y sale de GUIDE_TYPES,
		// no escrito a mano. Dice cuánto hay detrás antes de desplegar.
		...GUIDE_TYPES.map((group) => ({
			label: `${group.label} · ${group.guides.length}`,
			translations: { es: `${group.es} · ${group.guides.length}` },
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
