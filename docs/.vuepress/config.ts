import {defineUserConfig} from 'vuepress'
import {path} from '@vuepress/utils'
import {defaultTheme} from '@vuepress/theme-default'
import {viteBundler} from '@vuepress/bundler-vite'
import monacoEditorPlugin, {
	type IMonacoEditorOpts,
} from 'vite-plugin-monaco-editor'

import {fileURLToPath} from 'url'

import eslint from 'vite-plugin-eslint'

const monacoEditorPluginDefault = (monacoEditorPlugin as any).default as (
	options: IMonacoEditorOpts
) => any

export default defineUserConfig({
	title: 'Bndr',
	base: '/bndr-js/',
	alias: {
		'bndr-js': path.resolve(__dirname, '../../src'),
	},
	head: [
		['link', {rel: 'icon', href: './logo.svg'}],
		['link', {rel: 'preconnect', href: 'https://fonts.googleapis.com'}],
		[
			'link',
			{rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true},
		],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&family=Work+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&display=swap',
			},
		],
		['link', {rel: 'icon', href: '/logo.svg'}],
		[
			'link',
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
			},
		],
	],
	theme: defaultTheme({
		navbar: [
			{
				text: 'Home',
				link: '/',
			},
			{
				text: 'Guide',
				link: '/guide',
			},
			{
				text: 'API',
				link: '/api',
			},
			{
				text: 'Sandbox',
				link: '/sandbox',
			},
		],
		logo: '/logo.svg',
		repo: 'baku89/bndr-js',
	}),
	locales: {
		'/': {
			lang: 'English',
			title: 'Bndr',
			description:
				'A monadic library designed to compose and filter events from various inputs devices',
		},
		'/ja/': {
			lang: '日本語',
			title: 'Bndr',
			description:
				'様々な入力デバイスからのイベントをモナドとして合成・フィルターするライブラリ',
		},
	},
	bundler: viteBundler({
		viteOptions: {
			plugins: [
				monacoEditorPluginDefault({
					languageWorkers: ['editorWorkerService', 'typescript'],
				}),
				eslint(),
			],
			resolve: {
				alias: [
					{
						find: 'bndr-js',
						replacement: fileURLToPath(new URL('../../src', import.meta.url)),
					},
				],
			},
		},
	}),
	markdown: {
		//@ts-ignore
		linkify: true,
		typographer: true,
		code: {
			lineNumbers: false,
		},
	},
})
