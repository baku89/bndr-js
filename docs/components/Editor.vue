<script lang="ts" setup>
import {useMutationObserver} from '@vueuse/core'
import {type editor} from 'monaco-editor'
import DarkTheme from 'monaco-themes/themes/Clouds Midnight.json'
import LightTheme from 'monaco-themes/themes/Clouds.json'
import {defineAsyncComponent, ref} from 'vue'

defineProps<{
	code: string
}>()

const emit = defineEmits<{
	'update:code': [code: string]
}>()

DarkTheme.rules[1].foreground = '777777'

const MonacoEditor = defineAsyncComponent(() => import('monaco-editor-vue3'))

const monaco = ref<null | {editor: editor.IStandaloneCodeEditor}>(null)

const theme = ref<'LightTheme' | 'DarkTheme'>(
	document.documentElement.classList.contains('dark')
		? 'DarkTheme'
		: 'LightTheme'
)

useMutationObserver(
	document.documentElement,
	() => {
		theme.value = document.documentElement.classList.contains('dark')
			? 'DarkTheme'
			: 'LightTheme'
	},
	{attributeFilter: ['class']}
)

const options = {
	language: 'javascript',
	'bracketPairColorization.enabled': false,
	fontLigatures: true,
	fontFamily: 'IBM Plex Mono',
	folding: false,
	lineNumbers: 'off',
	lineDecorationsWidth: 0,
	lineNumbersMinChars: 0,
	minimap: {
		enabled: false,
	},
	overviewRulerLanes: 0,
	renderIndentGuides: false,
	renderLineHighlight: 'none',
	scrollBeyondLastLine: false,
	automaticLayout: true,
	scrollbar: {
		vertical: 'hidden',
	},
	tabSize: 2,
	wordWrap: 'on',
}

function onEditorWillMount(monaco: typeof import('monaco-editor')) {
	monaco.editor.defineTheme('LightTheme', LightTheme as any)
	monaco.editor.defineTheme('DarkTheme', DarkTheme as any)
}
</script>

<template>
	<MonacoEditor
		ref="monaco"
		class="Editor"
		:theme="theme"
		:value="code"
		:options="options"
		@update:value="emit('update:code', $event)"
		@editorWillMount="onEditorWillMount"
	/>
</template>

<style lang="stylus">
.monaco-editor, .monaco-editor-background,
.monaco-editor .inputarea.ime-input
	background transparent !important
</style>
