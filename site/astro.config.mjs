// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { buildLegacyRedirects, buildSidebar } from './src/guides.mjs';

const base = '/spec-driven-development-template';

// https://astro.build/config
export default defineConfig({
	site: 'https://juanklagos.github.io',
	base,
	redirects: {
		'/': `${base}/en/`,
		// Guides used to be published under their Spanish file name; they now share the
		// English one so Starlight pairs the locales. Keep the old URLs alive.
		...buildLegacyRedirects(base),
	},
	integrations: [
		starlight({
			title: 'SDD Template',
			// Tema propio (spec 026): estilo delphitools + colores SDD.
			customCss: ['./src/styles/theme.css'],
			// Two fixed files instead of one adaptive SVG: embedded as an image, the logo
			// cannot see the site's data-theme, so prefers-color-scheme inside it would
			// follow the operating system and vanish against the opposite site theme.
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				alt: 'SDD Template',
			},
			description:
				'Learn Spec-Driven Development and apply it to real projects with AI agents. / Aprende SDD y aplícalo en proyectos reales con agentes de IA.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/juanklagos/spec-driven-development-template',
				},
			],
			defaultLocale: 'en',
			locales: {
				en: { label: 'English', lang: 'en' },
				es: { label: 'Español', lang: 'es' },
			},
			sidebar: buildSidebar(),
		}),
	],
});
