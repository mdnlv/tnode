import { Plugin } from "@nuxt/types"

import * as polkadotJsExtension from "@polkadot/extension-dapp"
import * as polkadotAPI from "@polkadot/api"
import { getInflationParams } from "@polkadot/apps-config"

declare module "vue/types/vue" {
	interface Vue {
		$polkadotJsExtension: typeof polkadotJsExtension
		}
   }

declare module "@nuxt/types" {
	interface NuxtAppOptions {
		$polkadotJsExtension: typeof polkadotJsExtension
	}
	interface Context {
		$polkadotJsExtension: typeof polkadotJsExtension
	}
}

declare module "vuex/types/index" {
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	interface Store<S> {
		$polkadotJsExtension: typeof polkadotJsExtension
	}
}

declare module "vue/types/vue" {
	interface Vue {
		$polkadotAPI: typeof polkadotAPI
		}
   }

declare module "@nuxt/types" {
	interface NuxtAppOptions {
		$polkadotAPI: typeof polkadotAPI
	}
	interface Context {
		$polkadotAPI: typeof polkadotAPI
	}
}

declare module "vuex/types/index" {
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	interface Store<S> {
		$polkadotAPI: typeof polkadotAPI
	}
}

declare module "vue/types/vue" {
	interface Vue {
		$getInflationParams: typeof getInflationParams
		}
   }

declare module "@nuxt/types" {
	interface NuxtAppOptions {
		$getInflationParams: typeof getInflationParams
	}
	interface Context {
		$getInflationParams: typeof getInflationParams
	}
}

declare module "vuex/types/index" {
	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	interface Store<S> {
		$getInflationParams: typeof getInflationParams
	}
}

const plugin: Plugin = (_context, inject) => {
	inject("polkadotJsExtension", polkadotJsExtension)
	inject("polkadotAPI", polkadotAPI)
	inject("getInflationParams", getInflationParams)
}

export default plugin
