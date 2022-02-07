import { Plugin } from "@nuxt/types"

import WalletConnectProvider from "@walletconnect/web3-provider"

const wallets = {
	walletconnect: WalletConnectProvider,
}

declare module "vue/types/vue" {
	interface Vue {
		$wallets: typeof wallets
	}
}

declare module "@nuxt/types" {
	interface NuxtAppOptions {
		$wallets: typeof wallets
	}
	interface Context {
		$wallets: typeof wallets
	}
}

declare module "vuex/types/index" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
	interface Store<S> {
		$wallets: typeof wallets
	}
}

const plugin: Plugin = (_context, inject) => {
	inject("wallets", wallets)
}

export default plugin
