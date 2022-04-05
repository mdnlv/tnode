import type { GetterTree, ActionTree, MutationTree } from "vuex"
import sleep from "await-sleep"
import {
	getChainOptions,
	WalletController,
	ConnectType,
} from "@terra-money/wallet-controller"
import { RootState } from "~/store"
import { Account, Validator } from "~/_types"

const defaultState = {
	id: "terra-station",
	name: "Terra Station",
	icon: require("~/assets/img/terra-station-icon.png"),
	link: "https://chrome.google.com/webstore/detail/terra-station/aiifbnbfobpmeekipheeijimdpnlpgpp?hl=en",
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
	installed: () => new Promise(resolve => {
		(async () => {
			try {
				const chainOptions = await getChainOptions()
				const instance = new WalletController({
					...chainOptions,
				})
				instance.availableConnectTypes().subscribe(types => {
					if (types.includes(ConnectType.EXTENSION)) {
						resolve(true)
					}
				})
				await sleep(4000)
				resolve(false)
			}
			catch (e) {
				resolve(false)
			}
		})()
	}), // used by component
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
			localStorage.removeItem(`${lsKey}-${chainId}-unlocked`)
			await dispatch("getAccount", chainId)
		}
	},
	async getAccount({ commit, rootGetters, dispatch }, chainId: string) {
		const lsKey = rootGetters.lsKey

		const installed = await dispatch("installed") as boolean
		if (!installed) {
			return
		}

		commit("_addAccount", {
			chainId,
			address: (await dispatch("getSigner")).terraAddress,
			pubKey: null,
		} as Account)
		localStorage.setItem(`${lsKey}-${chainId}-unlocked`, "true")
	},
	getSigner() {
		return new Promise((resolve, reject) => {
			(async () => {
				try {
					const chainOptions = await getChainOptions()
					const instance = new WalletController({ ...chainOptions })
					instance.availableConnectTypes().subscribe(async types => {
						if (!types.includes(ConnectType.EXTENSION)) {
							return
						}
						await sleep()
						instance.connect(ConnectType.EXTENSION)
					})
					instance.connectedWallet().subscribe(wallet => {
						if (wallet) {
							resolve(wallet)
						}
					})
				}
				catch (err) {
					reject(err)
				}
			})()
		})
	},
}
