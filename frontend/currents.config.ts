import type {CurrentsConfig} from '@currents/playwright'

const config: CurrentsConfig = {
	projectId: process.env.CURRENTS_PROJECT_ID ?? '',
	consoleOutput: 'detailed',
	outputFile: 'currents-report.json',
}

export default config
