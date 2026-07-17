#!/usr/bin/env node
// Sync ../docs/{en,es}/*.md into src/content/docs/{en,es}/guides/ for Starlight:
// - inject frontmatter title from the first H1 (then strip it)
// - drop the "back to index" badge line and the language-pair section header noise
// - rewrite links so nothing 404s on the site:
//     same-folder guide links  -> ../<slug>/
//     cross-locale guide links -> ../../../<locale>/guides/<slug>/
//     anything else in-repo    -> GitHub blob URL

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = normalize(join(here, '..', '..'));
const GITHUB = 'https://github.com/juanklagos/spec-driven-development-template/blob/main';

const slugOf = (file) => file.replace(/\.md$/, '').toLowerCase();

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

function transform(src, locale, file) {
	let text = readFileSync(src, 'utf8');

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
	text = text.replace(/\]\((?:\.\/)?(\d{2}-[^)#\s]+\.md)(#[^)]*)?\)/g, (_, f, hash = '') => `](../${slugOf(f)}/${hash})`);

	// Cross-locale guide links: ](../es/NN-xxx.md) / ](../en/NN-xxx.md)
	text = text.replace(/\]\(\.\.\/(en|es)\/([^)#\s]+\.md)(#[^)]*)?\)/g, (_, loc, f, hash = '') => `](../../../${loc}/guides/${slugOf(f)}/${hash})`);

	// Any other relative link -> GitHub, resolved from docs/<locale>/
	text = text.replace(/\]\((\.\.?\/[^)\s]+)\)/g, (m, rel) => {
		if (rel.startsWith('./') && !rel.includes('..')) rel = rel.slice(2);
		const resolved = normalize(join('docs', locale, rel)).replace(/\\/g, '/');
		if (resolved.startsWith('..')) return m; // outside repo? leave untouched
		return `](${GITHUB}/${resolved})`;
	});

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
		writeFileSync(join(outDir, f.toLowerCase()), transform(join(srcDir, f), locale, f));
	}
	console.log(`${locale}: ${files.length} guides synced`);
}
