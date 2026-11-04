// TEMPORARY DIAGNOSTIC — remove before finishing.
import {test} from '../../support/fixtures'
import {BucketFactory} from '../../factories/bucket'
import {ProjectFactory} from '../../factories/project'
import {TaskFactory} from '../../factories/task'
import {ProjectViewFactory} from '../../factories/project_view'
import {TaskBucketFactory} from '../../factories/task_buckets'

test('DEBUG kanban autoscroll', async ({authenticatedPage: page}) => {
	const projects = await ProjectFactory.create(1)
	await ProjectViewFactory.create(1, {id: 4, project_id: projects[0].id, view_kind: 3, bucket_configuration_mode: 1})
	const buckets = await BucketFactory.create(2, {project_view_id: 4})
	const moreBuckets = await BucketFactory.create(6, {id: (i: number) => buckets.length + i, project_view_id: 4}, false)
	const lastBucket = moreBuckets[moreBuckets.length - 1]
	const tasks = await TaskFactory.create(1, {project_id: 1})
	await TaskBucketFactory.create(1, {task_id: tasks[0].id, bucket_id: buckets[0].id, project_view_id: 4}, false)

	await page.goto('/projects/1/4')
	await page.locator(`.kanban .bucket[data-bucket-id="${lastBucket.id}"]`).waitFor({state: 'attached'})
	await page.waitForLoadState('networkidle')

	const info = await page.evaluate(() => {
		const out: string[] = []
		let el: HTMLElement | null = document.querySelector('.kanban')
		while (el) {
			const cs = getComputedStyle(el)
			out.push(`${el.tagName}.${el.className.toString().slice(0, 60)} ox=${cs.overflowX} oy=${cs.overflowY} cw=${el.clientWidth} sw=${el.scrollWidth} sl=${el.scrollLeft}`)
			el = el.parentElement
		}
		return out
	})
	console.log('DEBUG chain:\n' + info.join('\n'))

	const board = page.locator('.kanban')
	const boardBox = await board.boundingBox()
	const taskBox = await page.locator('.kanban .bucket .tasks .task').first().boundingBox()
	const edge = {x: boardBox!.x + boardBox!.width - 60, y: boardBox!.y + boardBox!.height / 2}
	console.log('DEBUG boardBox', JSON.stringify(boardBox), 'taskBox', JSON.stringify(taskBox), 'edge', JSON.stringify(edge), 'vw', page.viewportSize()?.width)

	await page.mouse.move(taskBox!.x + 20, taskBox!.y + 10)
	await page.mouse.down()
	await page.mouse.move(edge.x, edge.y, {steps: 20})
	for (let i = 0; i < 10; i++) {
		await page.mouse.move(edge.x + 1, edge.y)
		await page.mouse.move(edge.x, edge.y)
	}
	await page.waitForTimeout(1500)

	const during = await page.evaluate(([x, y]) => {
		const at = document.elementFromPoint(x, y) as HTMLElement | null
		const chain: string[] = []
		let el: HTMLElement | null = at
		for (let i = 0; i < 6 && el; i++) {
			chain.push(`${el.tagName}.${el.className.toString().slice(0, 50)}`)
			el = el.parentElement
		}
		const kanban = document.querySelector('.kanban') as HTMLElement
		return {
			at: chain.join(' < '),
			ghost: !!document.querySelector('.ghost'),
			draggingClass: kanban.className,
			scrollLeft: kanban.scrollLeft,
			scrollWidth: kanban.scrollWidth,
			clientWidth: kanban.clientWidth,
		}
	}, [edge.x, edge.y] as const)
	console.log('DEBUG during', JSON.stringify(during))

	await page.mouse.up()
})
