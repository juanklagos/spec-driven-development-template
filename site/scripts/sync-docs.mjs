#!/usr/bin/env node
// Sync ../docs/{en,es}/*.md into src/content/docs/{en,es}/guides/ for Starlight:
// - publish both locales under the SAME file name (the English one, paired by guide number),
//   because Starlight matches translations by file path: with different names it treats the
//   Spanish and English guide as two pages and lists both in every sidebar
// - inject frontmatter title from the first H1 (then strip it)
// - drop the "back to index" badge line and the language-pair section header noise
// - rewrite links so nothing 404s on the site:
//     same-folder guide links  -> ../<slug>/
//     cross-locale guide links -> ../../../<locale>/guides/<slug>/
//     image links (![](../…))  -> raw.githubusercontent URL (blob pages break <img>)
//     anything else in-repo    -> GitHub blob URL

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGuidesAreCovered, publishedSlugs } from '../src/guides.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = normalize(join(here, '..', '..'));
const GITHUB = 'https://github.com/juanklagos/spec-driven-development-template/blob/main';
const RAW = 'https://raw.githubusercontent.com/juanklagos/spec-driven-development-template/main';

// Every guide must have a counterpart in the other locale and a home in exactly one sidebar
// group. Throwing here beats publishing a guide nobody can reach from the menu.
const guideCount = assertGuidesAreCovered();
const slugOf = publishedSlugs();

// Curated learning-level map (guide number -> level). Everything else = reference.
const LEVELS = {
	beginner: ['00', '02', '04', '05', '13', '18', '23'],
	intermediate: ['11', '12', '14', '19', '21', '22', '25', '26', '30'],
	advanced: ['08', '15', '16', '17', '20', '24', '27', '28', '29', '33', '36', '40', '41', '43', '44', '45', '47', '48', '49'],
};
const BADGE = {
	en: { beginner: ['Beginner', 'success'], intermediate: ['Intermediate', 'caution'], advanced: ['Advanced', 'danger'], reference: ['Reference', 'note'] },
	es: { beginner: ['Básico', 'success'], intermediate: ['Intermedio', 'caution'], advanced: ['Avanzado', 'danger'], reference: ['Referencia', 'note'] },
};
function levelOf(file) {
	const n = file.slice(0, 2);
	for (const [lvl, nums] of Object.entries(LEVELS)) if (nums.includes(n)) return lvl;
	return 'reference';
}

// A link resolved by one rule must be invisible to the rules that follow. Without this the
// last rule re-captures the output of the first: ](./19-guia.md) becomes ](../19-guide/) and
// then a GitHub URL for a path that does not exist. The marker uses NUL, which never appears
// in the source markdown, and no later rule can match it — they all require ./ or ../
const HOLD = '\u0000';

function transform(src, locale, file) {
	let text = readFileSync(src, 'utf8');
	const resolved = [];
	const hold = (link) => `${HOLD}${resolved.push(link) - 1}${HOLD}`;

	// Title from first H1 (strip emoji-leading spaces, escape quotes)
	const h1 = text.match(/^# (.+)$/m);
	const title = (h1 ? h1[1] : slugOf(file)).trim().replace(/"/g, '\\"');
	if (h1) text = text.replace(/^# .+$\n?/m, '');

	// Drop "back to index" badge lines
	text = text
		.split('\n')
		.filter((l) => !/Back_to_index|Volver_al_índice/.test(l))
		.join('\n');

	// Same-folder guide links: ](./NN-xxx.md) or ](NN-xxx.md)
	text = text.replace(/\]\((?:\.\/)?(\d{2}-[^)#\s]+\.md)(#[^)]*)?\)/g, (_, f, hash = '') => `](${hold(`../${slugOf(f)}/${hash}`)})`);

	// Cross-locale guide links: ](../es/NN-xxx.md) / ](../en/NN-xxx.md)
	text = text.replace(/\]\(\.\.\/(en|es)\/([^)#\s]+\.md)(#[^)]*)?\)/g, (_, loc, f, hash = '') => `](${hold(`../../../${loc}/guides/${slugOf(f)}/${hash}`)})`);

	// Image links -> raw.githubusercontent (blob HTML pages would break <img>),
	// resolved from docs/<locale>/ (e.g. ../assets/builder/canvas.png -> docs/assets/…)
	text = text.replace(/!\[([^\]]*)\]\((\.\.?\/[^)\s]+)\)/g, (m, alt, rel) => {
		const resolved = normalize(join('docs', locale, rel)).replace(/\\/g, '/');
		if (resolved.startsWith('..')) return m; // outside repo? leave untouched
		return `![${alt}](${RAW}/${resolved})`;
	});

	// Any other relative link -> GitHub, resolved from docs/<locale>/
	text = text.replace(/\]\((\.\.?\/[^)\s]+)\)/g, (m, rel) => {
		if (rel.startsWith('./') && !rel.includes('..')) rel = rel.slice(2);
		const resolved = normalize(join('docs', locale, rel)).replace(/\\/g, '/');
		if (resolved.startsWith('..')) return m; // outside repo? leave untouched
		return `](${GITHUB}/${resolved})`;
	});

	// Raw HTML anchors and images inside the markdown. The rules above only match markdown
	// syntax, so an <a href="../../AI_START_HERE.md"> badge reached the site as-is and 404'd
	// against the page URL it was resolved from.
	text = text.replace(/(<(?:a|img)\b[^>]*?\b(?:href|src)=")(\.\.?\/[^"]+)(")/g, (m, open, rel, close) => {
		const target = normalize(join('docs', locale, rel)).replace(/\\/g, '/');
		if (target.startsWith('..')) return m; // outside repo? leave untouched
		const base = open.startsWith('<img') ? RAW : GITHUB;
		return `${open}${base}/${target}${close}`;
	});

	// Put the resolved links back now that no rule can touch them.
	text = text.replace(new RegExp(`${HOLD}(\\d+)${HOLD}`, 'g'), (_, i) => resolved[Number(i)]);
	if (text.includes(HOLD)) {
		throw new Error(`${file}: a link marker survived the rewrites — the page would show raw markers`);
	}

	const [badgeText, badgeVariant] = BADGE[locale][levelOf(file)];
	return `---\ntitle: "${title}"\nsidebar:\n  badge:\n    text: ${badgeText}\n    variant: ${badgeVariant}\n---\n\n${text}`;
}

for (const locale of ['en', 'es']) {
	const srcDir = join(repoRoot, 'docs', locale);
	const outDir = join(here, '..', 'src', 'content', 'docs', locale, 'guides');
	rmSync(outDir, { recursive: true, force: true });
	mkdirSync(outDir, { recursive: true });
	const files = readdirSync(srcDir).filter((f) => f.endsWith('.md'));
	for (const f of files) {
		// Published under the shared (English) name so Starlight pairs the two locales.
		writeFileSync(join(outDir, `${slugOf(f)}.md`), transform(join(srcDir, f), locale, f));
	}
	console.log(`${locale}: ${files.length} guides synced`);
}
console.log(`${guideCount} guides paired across locales and covered by the sidebar`);
