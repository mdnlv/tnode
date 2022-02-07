import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { RootState } from "~/store"
import { Network } from "~/_types"
import { times10toPow } from "~/_utils"

export const state = () => ({
	all: [
		{
			chainId: `0x${Number(56).toString(16)}`,
			chainName: "Binance Smart Chain Mainnet",
			rpcUrls: [
				// "https://bsc-node.hydrogenx.tk/",
				"https://withered-delicate-glade.bsc.quiknode.pro/04e9d09f53688b9dbb9e94c9aebb926e981bcc88/",
				"https://bsc-dataseed.binance.org",
				"https://bsc-dataseed1.defibit.io/",
				"https://bsc-dataseed1.ninicoin.io/",
				"https://bsc-dataseed2.defibit.io/",
				"https://bsc-dataseed3.defibit.io/",
				"https://bsc-dataseed4.defibit.io/",
				"https://bsc-dataseed2.ninicoin.io/",
				"https://bsc-dataseed3.ninicoin.io/",
				"https://bsc-dataseed4.ninicoin.io/",
				"https://bsc-dataseed1.binance.org/",
				"https://bsc-dataseed2.binance.org/",
				"https://bsc-dataseed3.binance.org/",
				"https://bsc-dataseed4.binance.org/",
			],
			nativeCurrency: {
				name: "Binance Coin",
				symbol: "BNB",
				decimals: 18,
			},
			blockExplorerUrls: [
				"https://bscscan.com",
			],
			gasConfig: {
				gasPrice: times10toPow(0.000000007, 18, true),
				gasLimit: 200000,
			},
		},
		{
			chainId: `0x${Number(97).toString(16)}`,
			chainName: "Binance Smart Chain Testnet",
			rpcUrls: [
				"https://data-seed-prebsc-2-s3.binance.org:8545/",
				"https://data-seed-prebsc-1-s3.binance.org:8545/",
				"https://data-seed-prebsc-2-s2.binance.org:8545/",
				"https://data-seed-prebsc-1-s2.binance.org:8545/",
				"https://data-seed-prebsc-2-s1.binance.org:8545/",
				"https://data-seed-prebsc-1-s1.binance.org:8545/",
			],
			nativeCurrency: {
				name: "Binance Coin",
				symbol: "BNB",
				decimals: 18,
			},
			blockExplorerUrls: [
				"https://testnet.bscscan.com",
			],
			gasConfig: {
				gasPrice: times10toPow(0.00000001, 18, true),
				gasLimit: 200000,
			},
		},
		{
			chainId: `0x${Number(4).toString(16)}`,
			chainName: "Ethereum Testnet Rinkeby",
			rpcUrls: [
				"https://rinkeby-light.eth.linkpool.io/",
			],
			nativeCurrency: {
				name: "Rinkeby Ether",
				symbol: "RIN",
				decimals: 18,
			},
			blockExplorerUrls: [
				"https://rinkeby.etherscan.io/",
			],
			gasConfig: {
				gasPrice: times10toPow(0.00000015, 18, true),
				gasLimit: 1000000,
			},
		},
	] as Network[],
})

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	all: state => state.all,
}

export const mutations: MutationTree<LocalState> = {
}

export const actions: ActionTree<LocalState, RootState> = {
}
