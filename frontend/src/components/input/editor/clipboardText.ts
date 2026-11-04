import type {Fragment, Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

// ProseMirror's default plain-text copy drops list structure, so a copied bullet list
// arrives in other apps as bare lines. Keep the markers so the text still reads as a list.

const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList'])

export function sliceToPlainText(slice: Slice): string {
	return blocksToText(slice.content)
}

function blocksToText(fragment: Fragment): string {
	const blocks: string[] = []
	fragment.forEach(node => blocks.push(nodeToText(node)))
	return blocks.join('\n\n')
}

function nodeToText(node: ProseMirrorNode): string {
	if (LIST_TYPES.has(node.type.name)) {
		return listToText(node)
	}

	if (node.isTextblock || node.isLeaf) {
		return node.textContent
	}

	return blocksToText(node.content)
}

function listToText(list: ProseMirrorNode): string {
	const lines: string[] = []
	let index = 1

	list.forEach(item => {
		const marker = list.type.name === 'orderedList' ? `${index++}. ` : '- '
		const [first = '', ...rest] = itemToText(item).split('\n')
		lines.push(marker + first)
		rest.forEach(line => lines.push(line === '' ? '' : '  ' + line))
	})

	return lines.join('\n')
}

// A list item holds paragraphs and nested lists; the lines are joined so nested lists stay
// on their own lines under the parent item.
function itemToText(item: ProseMirrorNode): string {
	const parts: string[] = []
	item.forEach(child => parts.push(nodeToText(child)))
	return parts.join('\n')
}
