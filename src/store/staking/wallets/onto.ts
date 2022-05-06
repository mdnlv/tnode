import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { RootState } from "~/store"
import { Account, WalletModule, Validator } from "~/_types"

const defaultState = {
	id: "metamask",
	name: "Metamask",
	icon: require("~/assets/img/metamask-icon.png"),
	link: "https://metamask.io/download.html",
	accounts: [] as Account[],
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	...Object.keys(defaultState).reduce((acc, prop) => ({
		...acc,
		[prop]: state => state[prop],
	}), {}),
	id: state => state.id,
	wallet: state => Object.keys(defaultState).reduce((acc, prop) => ({
		...acc,
		[prop]: state[prop],
	}), {}),
} as WalletModule["getters"]

export const mutations: MutationTree<LocalState> = {
	_addAccount(state, account: Account) {
		const index = state.accounts.findIndex(a => a.chainId === account.chainId)
		if (index !== -1) {
			state.accounts.splice(index, 1)
		}
		state.accounts.push(account)
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	installed: () => !!window.ethereum,
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

		const installed = await dispatch("installed")
		if (!installed) {
			return
		}

		try {
			await this.dispatch("web3/getAccount", { walletId: "metamask" })
			const account = rootGetters["web3/account"]
			commit("_addAccount", {
				address: account.address,
				chainId,
				pubKey: null,
			})
			localStorage.setItem(`${lsKey}-${chainId}-unlocked`, "true")
		}
		catch (e) {
			// eslint-disable-next-line no-console
			console.error(e)
			localStorage.removeItem(`${lsKey}-${chainId}-unlocked`)
		}
	},
	async getOfflineSigner(_, chainId: string) {
		return await this.dispatch("web3/getOfflineSigner", { walletId: "metamask", networkName: chainId, switchNetwork: true })
	},
}
