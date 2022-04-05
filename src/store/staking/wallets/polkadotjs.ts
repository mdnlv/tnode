import type { GetterTree, ActionTree, MutationTree } from "vuex"
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types"
import { RootState } from "~/store"
import { Account, Validator } from "~/_types"

const defaultState = {
	id: "polkadotjs",
	name: "Polkadot-js",
	icon: require("~/assets/img/polkadot-icon.png"),
	link: "https://polkadot.js.org/extension/",
	accounts: [] as Account[],
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	...Object.keys(defaultState).reduce((acc, prop) => ({
		...acc,
		[prop]: state => state[prop],
	}), {}),
	wallet: state => Object.keys(defaultState).reduce((acc, prop) => ({
		...acc,
		[prop]: state[prop],
	}), {}),
}

export const mutations: MutationTree<LocalState> = {
	_addAccount(state, account: Account) {
		state.accounts = [
			...state.accounts.filter(a => a.chainId !== account.chainId), // remove any accounts that have same chainId as arg
			account, // add arg
		]
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	async installed({ dispatch }) : Promise<number> {
		const offlineSigner = await dispatch("getOfflineSigner")
		return offlineSigner.length
	},
	_getChainIds({ state, rootGetters }) {
		const validators: Validator[] = rootGetters["staking/validators"]
		return validators
			.filter(v => v.walletId === state.id)
			.map(v => v.chainId)
	},
	async onLoad({ dispatch, rootGetters }) {
		const chainIds = await dispatch("_getChainIds") as string[]
		for (const chainId of chainIds) {
			const lsKey = rootGetters.lsKey
			const previouslyUnlocked = localStorage.getItem(`${lsKey}-${chainId}-unlocked`)
			if (!previouslyUnlocked) {
				continue
			}
			await dispatch("getAccount", chainId)
		}
	},
	async getAccount({ commit, rootGetters, dispatch }, chainId: string) {
		const lsKey = rootGetters.lsKey

		const installed = await dispatch("installed") as boolean
		if (!installed) {
			return
		}

		try {
			await this.$polkadotJsExtension!.web3Enable("Trusted Node")
			const accounts = await this.$polkadotJsExtension.web3Accounts()
			const account: InjectedAccountWithMeta | undefined = accounts[0]
			if (account !== undefined) {
				commit("_addAccount", {
					chainId,
					address: account.address,
					pubKey: null,
				} as Account)
				localStorage.setItem(`${lsKey}-${chainId}-unlocked`, "true")
			}
		}
		catch (e) {
			if (e.message === "key doesn't exist") {
				commit("connectingError", "accountNotFound", { root: true })
			}
			if (e.message === "Request rejected") {
				commit("connectingError", "requestRejected", { root: true })
			}
			// eslint-disable-next-line no-console
			console.error(e)
			localStorage.removeItem(`${lsKey}-${chainId}-unlocked`)
		}
	},
	async getOfflineSigner() {
		// no extension installed, or the user did not accept the authorization
		// in this case we should inform the use and give a link to the extension
		const extensions = await this.$polkadotJsExtension!.web3Enable("Trusted Node")
		return extensions
	},
}
