import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { RootState } from "~/store"
import {
	Network,
	SupportedNetworks,
} from "~/_types"
import { times10toPow } from "~/_utils"

export const state = () => ({
	all: [
		{
			chainId: `0x${Number(56).toString(16)}`,
			chainName: SupportedNetworks.BSC_MAINNET,
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
			txLinkTemplate: "https://bscscan.com/tx/###",
			swapRouterAddress: "0x10ed43c718714eb63d5aa57b78b54704e256024e", // pancakeswap
		},
		{
			chainId: `0x${Number(97).toString(16)}`,
			chainName: SupportedNetworks.BSC_TESTNET,
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
			txLinkTemplate: "https://testnet.bscscan.com/tx/###",
			swapRouterAddress: null,
		},
		{
			chainId: `0x${Number(4).toString(16)}`,
			chainName: SupportedNetworks.ETH_RINKEBY,
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
			txLinkTemplate: "https://rinkeby.etherscan.io/tx/###",
			swapRouterAddress: null,
		},
		{
			chainId: `0x${Number(5).toString(16)}`,
			chainName: SupportedNetworks.ETH_GOERLI,
			rpcUrls: [
				"https://rpc.goerli.mudit.blog/",
				"https://rpc.slock.it/goerli ",
				"https://goerli.prylabs.net/",
			],
			nativeCurrency: {
				name: "Görli Ether",
				symbol: "GOR",
				decimals: 18,
			},
			blockExplorerUrls: [
				"https://goerli.etherscan.io",
			],
			gasConfig: {
				gasPrice: times10toPow(0.00000015, 18, true),
				gasLimit: 1000000,
			},
			txLinkTemplate: "https://goerli.etherscan.io/tx/###",
			swapRouterAddress: null,
		},
		{
			chainId: `0x${Number(250).toString(16)}`,
			chainName: SupportedNetworks.FTM_MAINNET,
			rpcUrls: [
				"https://rpc.ftm.tools",
				"https://rpc.fantom.network",
				"https://rpcapi.fantom.network",
				"https://rpc2.fantom.network",
				"https://rpc3.fantom.network",
				"https://rpc.fantom.network",
				"https://fantomscan.io/rpc",
			],
			nativeCurrency: {
				name: "Fantom",
				symbol: "FTM",
				decimals: 18,
			},
			blockExplorerUrls: [
				"https://ftmscan.com",
			],
			gasConfig: {
				gasPrice: times10toPow(0.0000005, 18, true),
				gasLimit: 2000000,
			},
			txLinkTemplate: "https://ftmscan.com/tx/###",
			swapRouterAddress: "0xF491e7B69E4244ad4002BC14e878a34207E38c29", // spookyswap
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
