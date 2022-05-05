import { init, track } from "@amplitude/analytics-browser"
import { Plugin } from "@nuxt/types"

declare module "vue/types/vue" {
	interface Vue {
		$amplitude: any
	}
}

declare module "@nuxt/types" {
	interface NuxtAppOptions {
		$amplitude: any
	}
	interface Context {
		$amplitude: any
	}
}

init("a6d8304cb5338bda52ac92e06de842d9")

const plugin: Plugin = (_context, inject) => {
	inject("amplitude", (eventName: string, eventProperties: any) => track(eventName, eventProperties))
}

export default plugin
