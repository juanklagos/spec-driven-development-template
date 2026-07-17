// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://juanklagos.github.io',
	base: '/spec-driven-development-template',
	redirects: {
		'/': '/spec-driven-development-template/en/',
	},
	integrations: [
		starlight({
			title: 'SDD Template',
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
			sidebar: [
				{
					label: 'Guides / Guías',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
			],
		}),
	],
});
