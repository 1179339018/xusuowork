import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { getDefaultShareConfig, getDefaultShareTimelineConfig } from './utils/share'

export function createApp() {
	const app = createSSRApp(App)
	const pinia = createPinia()

	app.config.globalProperties.$getDefaultShareConfig = getDefaultShareConfig
	app.config.globalProperties.$getDefaultShareTimelineConfig = getDefaultShareTimelineConfig

	app.use(pinia)
	return {
		app
	}
}
