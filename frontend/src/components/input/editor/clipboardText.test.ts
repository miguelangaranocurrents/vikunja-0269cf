import {describe, it, expect, afterEach, beforeEach} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {ref} from 'vue'
import {Editor} from '@tiptap/core'

import {createEditorExtensions, type EditorExtensionDeps} from './editorExtensions'

window.API_URL = 'http://localhost:3456'

function createEditor(content: string) {
	const holder = document.createElement('div')
	document.body.appendChild(holder)

	let editor: Editor
	const deps: EditorExtensionDeps = {
		t: key => key,
		isEditing: ref(true),
		isEditEnabled: () => true,
		placeholder: '',
		contentHasChanged: ref(false),
		bubbleSave: () => {},
		getEditor: () => editor,
		uploadCallback: undefined,
		uploadAndInsertFiles: () => {},
	}

	editor = new Editor({element: holder, extensions: createEditorExtensions(deps), content})

	return editor
}

describe('copy as plain text', () => {
	let editor: Editor

	beforeEach(() => {
		setActivePinia(createPinia())
	})

	afterEach(() => {
		editor?.destroy()
		document.body.innerHTML = ''
	})

	function copiedText(html: string) {
		editor = createEditor(html)
		const {doc} = editor.state
		return editor.view.someProp('clipboardTextSerializer', fn => fn)?.(doc.slice(0, doc.content.size), editor.view)
	}

	it('keeps bullet markers and separates blocks with blank lines', () => {
		expect(copiedText('<p>start</p><ul><li><p>this</p></li><li><p>is</p></li></ul><p>end</p>'))
			.toBe('start\n\n- this\n- is\n\nend')
	})

	it('numbers ordered list items', () => {
		expect(copiedText('<ol><li><p>one</p></li><li><p>two</p></li></ol>')).toBe('1. one\n2. two')
	})

	it('indents nested lists under their parent item', () => {
		expect(copiedText('<ul><li><p>outer</p><ul><li><p>inner</p></li></ul></li></ul>'))
			.toBe('- outer\n  - inner')
	})
})
