import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { toBase64 } from "@cosmjs/encoding"
import { RootState } from "~/store"
import { Account, Validator, WalletModule } from "~/_types"

const defaultState = {
	id: "keplr",
	name: "Keplr",
	icon: require("~/assets/img/keplr-icon.png"),
	link: "https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap/related?hl=en",
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
	installed: () => new Promise(resolve => resolve(!!window.getOfflineSigner && !!window.keplr)), // used by component
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
			const offlineSigner = await dispatch("getOfflineSigner", chainId)
			const [account] = await offlineSigner.getAccounts()
			commit("_addAccount", {
				chainId,
				address: account.address,
				pubKey: {
					type: {
						secp256k1: "tendermint/PubKeySecp256k1",
					}[account.algo],
					value: toBase64(account.pubkey),
				},
			} as Account)
			localStorage.setItem(`${lsKey}-${chainId}-unlocked`, "true")
		}
		catch (e) {
			if (e.message === "key doesn't exist") {
				commit("staking/connectingWalletError", "accountNotFound", { root: true })
			}
			if (e.message === "Request rejected") {
				commit("staking/connectingWalletError", "requestRejected", { root: true })
			}
			// eslint-disable-next-line no-console
			console.error(e)
			localStorage.removeItem(`${lsKey}-${chainId}-unlocked`)
		}
	},
	async getOfflineSigner(_, chainId: string) {
		await window.keplr!.enable(chainId)
		return window.getOfflineSigner!(chainId)
	},
	async signArbitrary({ getters }, { chainId, message }: {chainId: string, message: string}) {
		const accounts = getters.accounts as Account[]
		const account = accounts.find(a => a.chainId === chainId)!
		try {
			const response = await window.keplr!.signAmino(chainId, account.address, {
				chain_id: "",
				account_number: "0",
				sequence: "0",
				fee: {
					gas: "0",
					amount: [],
				},
				msgs: [
					{
						type: "sign/MsgSignData",
						value: {
							signer: account.address,
							data: btoa(message.toLowerCase()),
						},
					},
				],
				memo: "",
			})
			return response
		}
		catch (e) {
			// eslint-disable-next-line no-console
			console.error(e)
			return {
				error: e.message,
			}
		}
	},
} as WalletModule["actions"]
