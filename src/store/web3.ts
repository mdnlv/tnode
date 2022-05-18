import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { ethers } from "ethers"
import Web3Modal from "web3modal"
import * as evmChains from "evm-chains"
import { omit } from "lodash"

import { RootState } from "~/store"
import { EVMAccount, EVMWallet, Network } from "~/_types"
import Web3 from "web3"

const defaultState = {
	// TODO: add firefox link
	account: null as EVMAccount | null,
	connectingWalletId: null as string | null,
	connectingWalletError: null as string | null,
	wallets: [
		{
			id: "metamask",
			name: "Metamask",
			icon: require("~/assets/img/metamask-icon.png"),
			link: "https://metamask.io/download.html",
		},
		{
			id: "walletconnect",
			name: "WalletConnect",
			icon: require("~/assets/img/walletconnect-icon.png"),
			link: "https://walletconnect.com/",
		},
		{
			id: "onto",
			name: "Onto",
			icon: require("~/assets/img/onto.png"),
			link: "https://onto.app/",
		},
	] as EVMWallet[],
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	account: state => state.account,
	connectingWalletId: state => state.connectingWalletId,
	connectingWalletError: state => state.connectingWalletError,
	wallets: state => state.wallets,
}

export const mutations: MutationTree<LocalState> = {
	account: (state, account) => { state.account = account },
	connectingWalletId: (state, connectingWalletId) => { state.connectingWalletId = connectingWalletId },
	connectingWalletError: (state, connectingWalletError) => { state.connectingWalletError = connectingWalletError },
}

export const actions: ActionTree<LocalState, RootState> = {
	installed: ({ rootGetters }) => rootGetters.connectingWallet === "metamask"
		? !!window.ethereum
		: true,
	name({ rootGetters }) {
		const connectingWallet = rootGetters.connectingWallet
		return rootGetters.evmWallets.find(w => w.id === connectingWallet)!.name
	},
	link({ rootGetters }) {
		const connectingWallet = rootGetters.connectingWallet
		return rootGetters.evmWallets.find(w => w.id === connectingWallet)!.link
	},
	async _setNetwork({ rootGetters }, networkName: string) {
		const network = evmChains.getChainByKeyValue("name", networkName)
		try {
			await window.ethereum?.request!({
				method: "wallet_switchEthereumChain",
				params: [{
					chainId: `0x${network.chainId.toString(16)}`,
				}],
			})
		}
		catch (e) {
			if (e.code !== 4902) {
				return
			}
			const networks = rootGetters["networks/all"] as Network[]
			await window.ethereum?.request!({
				method: "wallet_addEthereumChain",
				params: [
					omit(
						networks.find(n => n.chainName === networkName),
						[
							"gasConfig",
							"txLinkTemplate",
							"swapRouterAddress",
						],
					),
				],
			})
		}
	},
	_getWalletIds({ state }) {
		const evmWallets: EVMWallet[] = state.wallets
		return evmWallets.map(v => v.id)
	},
	async onLoad({ dispatch, rootGetters }) {
		const walletIds = await dispatch("_getWalletIds") as string[]
		for (const walletId of walletIds) {
			const lsKey = rootGetters.lsKey
			const previouslyUnlocked = localStorage.getItem(`${lsKey}-${walletId}-unlocked`)
			if (!previouslyUnlocked) {
				continue
			}
			await dispatch("getAccount", { walletId })
		}
	},
	connectWallet({ state }, ctx: any) { // only implemented for this wallet
		return new Promise((resolve, reject) => {
			try {
				ctx.$modal.show("connecting-web3-wallet")
				const waited = 0
				const interval = 100
				const timeout = 10 * 60 * 1000
				const intervalInstance = setInterval(() => {
					if (state.account) {
						clearInterval(intervalInstance)
						resolve("successfully connected")
					}
					if (waited > timeout) {
						throw new Error("waited 10 minutes for user with no response")
					}
				}, interval)
			}
			catch (e) {
				reject(e)
			}
		})
	},
	async disconnect({ commit, rootGetters, dispatch }) {
		const lsKey = rootGetters.lsKey
		commit("account", null)
		const walletIds = await dispatch("_getWalletIds") as string[]
		for (const walletId of walletIds) {
			localStorage.removeItem(`${lsKey}-${walletId}-unlocked`)
		}
	},
	async getAccount({ commit, rootGetters, dispatch }, { walletId, networkName }: { walletId?: string, networkName?: string }) {
		walletId = walletId ?? rootGetters.connectingWallet
		const installed = await dispatch("installed")
		if (!walletId || !installed) {
			return
		}
		const lsKey = rootGetters.lsKey

		async function commitAccount() {
			const offlineSigner = await dispatch("getOfflineSigner", { walletId, networkName }) as ethers.providers.JsonRpcSigner
			const address = await offlineSigner.getAddress()
			commit("account", {
				walletId,
				address,
			} as EVMAccount)
			dispatch("denoms/setBalance", undefined, { root: true })
		}

		try {
			if(this.getters["web3/connectingWalletId"] === "onto") {
				const web3 = new Web3(window.onto)
				web3.eth.requestAccounts().then((res) => {
					console.log(res[0])
				})
			} else {
				await commitAccount()
			}

			localStorage.setItem(`${lsKey}-${walletId}-unlocked`, "true")
			window.ethereum?.on("accountsChanged", accounts => {
				if (accounts.length) {
					commitAccount()
				}
				else {
					dispatch("disconnect")
				}
			})
			window.onto.on("accountsChanged", (e) => {
				console.log(e.accounts[0]);
			});
		}
		catch (e) {
			// eslint-disable-next-line no-console
			console.error(e)
			const connectingWalletError = walletId === "metamask" && !window.ethereum?.isMetaMask ? "metamaskConnectionError" : "requestRejected"
			commit("web3/connectingWalletError", connectingWalletError, { root: true })
			// window.ethereum?.on("connect", connectInfo => {
			// 	commit("web3/connectingWalletId", null)
			// 	commit("web3/connectingWalletError", null)
			// })
			dispatch("disconnect")
		}
	},
	async getOfflineSigner({ dispatch }, { walletId, networkName, switchNetwork }: { walletId?: string, networkName?: string, switchNetwork?: boolean }): Promise<ethers.providers.JsonRpcSigner> {
		const providerOptions = {
			walletconnect: {
				package: this.$wallets.walletconnect,
				options: {
					rpc: {
						56: "https://withered-delicate-glade.bsc.quiknode.pro/04e9d09f53688b9dbb9e94c9aebb926e981bcc88/",
					},
					network: "binance",
				},
			},
			onto: {
				package: this.$wallets.onto,
				options: {
					rpc: {
						56: "https://withered-delicate-glade.bsc.quiknode.pro/04e9d09f53688b9dbb9e94c9aebb926e981bcc88/",
					},
					network: "binance",
				},
			}
		}
		const web3Modal = new Web3Modal({
			network: networkName,
			cacheProvider: true,
			providerOptions,
			theme: {
				background: "rgb(39, 49, 56)",
				main: "rgb(199, 199, 199)",
				secondary: "rgb(136, 136, 136)",
				border: "rgba(195, 195, 195, 0.14)",
				hover: "rgb(255, 128, 0)",
			},
		})
		const customProvider = walletId
			? await web3Modal.connectTo(providerOptions[walletId] ? walletId : "injected")
			: await web3Modal.connect()
		if (!customProvider) {
			throw new Error("couldn't connect to wallet")
		}
		if (networkName && switchNetwork) {
			await dispatch("_setNetwork", networkName)
		}
		const provider = new ethers.providers.Web3Provider(customProvider)
		return provider.getSigner()
	},
}
