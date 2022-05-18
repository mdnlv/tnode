import type { GetterTree, ActionTree, MutationTree } from "vuex"
import sleep from "await-sleep"
import axios from "axios"
import bn, { BigSource } from "big.js"
import { uniq } from "lodash"
import { ethers, utils } from "ethers"
import { addMinutes } from "date-fns"
import { floorToDP } from "~/plugins/filters"
import {
	NativeDenom,
	ERC20Denom,
	ETHContract,
	EVMAccount,
	Denom,
	LPDenom,
	ETHProvider,
	Network,
	UserActionResponse,
	SupportedNetworks,
} from "~/_types"
import { RootState } from "~/store"
import { times10toPow, divBy10toPow } from "~/_utils"

export const state = () => ({
	native: [
		{
			id: "dvpn",
			symbol: "DVPN",
			min: "udvpn",
			decimals: 6,
			coinGeckoId: "sentinel",
			price: null,
			icon: require("~/assets/img/sentinel-icon.png"),
		},
		{
			id: "regen",
			symbol: "REGEN",
			min: "uregen",
			decimals: 6,
			coinGeckoId: "regen",
			price: null,
			icon: require("~/assets/img/regen-icon.png"),
		},
		{
			id: "xprt",
			symbol: "XPRT",
			min: "uxprt",
			decimals: 6,
			coinGeckoId: "persistence",
			price: null,
			icon: require("~/assets/img/persistence-icon.png"),
		},
		{
			id: "iris",
			symbol: "IRIS",
			min: "uiris",
			decimals: 6,
			coinGeckoId: "iris-network",
			price: null,
			icon: require("~/assets/img/iris-icon.png"),
		},
		{
			id: "atom",
			symbol: "ATOM",
			min: "uatom",
			decimals: 6,
			coinGeckoId: "cosmos",
			price: null,
			icon: require("~/assets/img/cosmo-atom-icon.png"),
		},
		{
			id: "juno",
			symbol: "JUNO",
			min: "ujuno",
			decimals: 6,
			coinGeckoId: "juno-network",
			price: null,
			icon: require("~/assets/img/juno-icon.png"),
		},
		{
			id: "lum",
			symbol: "LUM",
			min: "ulum",
			decimals: 6,
			coinGeckoId: "lum-network",
			price: null,
			icon: require("~/assets/img/lum-icon.png"),
		},
		{
			id: "rowan",
			symbol: "ROWAN",
			min: "rowan",
			decimals: 18,
			coinGeckoId: "sifchain",
			price: null,
			icon: require("~/assets/img/rowan-icon.png"),
		},
		{
			id: "luna",
			symbol: "LUNA",
			min: "uluna",
			decimals: 6,
			coinGeckoId: "terra-luna",
			price: null,
			icon: require("~/assets/img/terra-logo.png"),
		},
		{
			id: "secret",
			symbol: "SCRT",
			min: "uscrt",
			decimals: 6,
			coinGeckoId: "secret",
			price: null,
			icon: require("~/assets/img/secret-icon.png"),
		},
		{
			id: "dot",
			symbol: "DOT",
			min: "udot",
			decimals: 10, // polkadot
			coinGeckoId: "polkadot",
			price: null,
			icon: require("~/assets/img/polkadot-icon.png"),
		},
		{
			id: "wnd",
			symbol: "WND",
			min: "uwnd",
			decimals: 12, // westend
			coinGeckoId: "polkadot",
			price: null,
			icon: require("~/assets/img/polkadot-icon.png"),
		},
		{
			id: "matic",
			symbol: "MATIC",
			min: "matic",
			decimals: 18,
			coinGeckoId: "matic-network",
			price: null,
			icon: require("~/assets/img/polygon-inverted-icon.webp"),
		},
		{
			id: "osmo",
			symbol: "OSMO",
			min: "uosmo",
			decimals: 6,
			coinGeckoId: "osmosis",
			price: null,
			icon: require("~/assets/img/osmo-icon.png"),
		},
		{
			id: "ctk",
			symbol: "CTK",
			min: "uctk",
			decimals: 6,
			coinGeckoId: "certik",
			price: null,
			icon: require("~/assets/img/certik-icon.png"),
		},
		{
			id: "akt",
			symbol: "AKT",
			min: "uakt",
			decimals: 18,
			coinGeckoId: "akash-network",
			price: null,
			icon: require("~/assets/img/akash-icon.png"),
		},
	] as NativeDenom[],
	erc20: [
		{
			id: "busd",
			symbol: "BUSD",
			decimals: 18,
			price: bn(1),
			stable: true,
			icon: require("~/assets/img/busd-icon.png"),
			contractAddress: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
			networkName: SupportedNetworks.BSC_MAINNET,
			userBalance: null,
		},
		{
			id: "tnode",
			symbol: "TNODE",
			decimals: 18,
			price: null,
			stable: false,
			icon: require("~/assets/img/tnode-icon-2.png"),
			contractAddress: "0x7f12a37b6921ffac11fab16338b3ae67ee0c462b",
			networkName: SupportedNetworks.BSC_MAINNET,
			lpId: "tnode-busd",
			userBalance: null,
		},
		{
			id: "usdc",
			symbol: "USDC",
			decimals: 6,
			price: bn(1),
			stable: true,
			icon: require("~/assets/img/usdc-icon.png"),
			contractAddress: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
			networkName: SupportedNetworks.FTM_MAINNET,
			userBalance: null,
		},
		{
			id: "ftm-tnode",
			symbol: "TNODE",
			decimals: 18,
			price: null,
			stable: false,
			icon: require("~/assets/img/tnode-icon-2.png"),
			contractAddress: "0x7FC5670B2041d34414B0b2178Fc660b1E1faF801",
			networkName: SupportedNetworks.FTM_MAINNET,
			userBalance: null,
		},
	] as ERC20Denom[],
	lp: [
		{
			id: "tnode-busd",
			symbol: "LP",
			price: null as bn | null,
			icon: require("~/assets/img/busd-icon.png"),
			contractAddress: "0x562C0c707984D40b98cCba889C6847DE274E5d57", // LP token
			networkName: SupportedNetworks.BSC_MAINNET,
			decimals: 18,
			denomIds: [
				"busd",
				"tnode",
			],
		},
		{
			id: "tnode-usdc",
			symbol: "LP",
			price: null as bn | null,
			icon: require("~/assets/img/usdc-icon.png"),
			contractAddress: "0x9206444A1820c508FbA5bF815713451Ee540B3c8", // LP token
			networkName: SupportedNetworks.FTM_MAINNET,
			decimals: 18,
			denomIds: [
				"usdc",
				"ftm-tnode",
			],
		},
	],
})

export type LocalState = ReturnType<typeof state>

export type AddLiquidityPayload = {
	tokenA: ERC20Denom,
	tokenB: ERC20Denom,
	amountA: BigSource,
	amountB: BigSource,
}

export const getters: GetterTree<LocalState, RootState> = {
	coinGeckoIds: state => uniq([
		...state.native.map(d => d.coinGeckoId),
		...state.erc20.map(d => d.coinGeckoId),
	]).filter(v => v),
	all(state): Denom[] {
		return [
			...state.native,
			...state.erc20,
			...state.lp.map(
				denom => ({
					...denom,
					denoms: denom.denomIds.map(
						id => state.erc20.find(d => d.id === id)!,
					),
				}),
			),
		]
	},
	native: (state): NativeDenom[] => state.native,
	erc20: state => state.erc20,
}

export const mutations: MutationTree<LocalState> = {
	nativePrice: (state, { coinGeckoId, price }: {coinGeckoId: string, price: number}) => {
		const denoms = [
			...state.native,
			...state.erc20,
		]
		for (const denom of denoms) {
			if (denom.coinGeckoId === coinGeckoId) {
				denom.price = bn(price)
			}
		}
	},
	lpPrice: (state, { lpDenomId, price }: { lpDenomId: string, price: bn }) => {
		const lpDenom = state.lp.find(d => d.id === lpDenomId)!
		lpDenom.price = price
	},
	erc20Price: (state, { erc20DenomId, price }: { erc20DenomId: string, price: bn }) => {
		const erc20Denom = state.erc20.find(d => d.id === erc20DenomId)!
		erc20Denom.price = price
	},
	userBalance: (state, { denomId, userBalance }: {denomId: string, userBalance: bn}) => {
		const denom = state.erc20.find(d => d.id === denomId)!
		denom.userBalance = userBalance
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	async getCoinGeckoPrices({ getters, commit }) {
		const coinGeckoIds = getters.coinGeckoIds
		const url = new URL("https://api.coingecko.com/api/v3/simple/price")
		url.search = new URLSearchParams({
			ids: coinGeckoIds.join(","),
			vs_currencies: "usd",
		}).toString()
		try {
			const { data } = await axios.get(url.toString())
			const entries = Object.entries(data) as [string, {usd: number}][]
			entries.forEach(([coinGeckoId, price]) => commit("nativePrice", { coinGeckoId, price: price.usd }))
			// TODO: make sure vault APR, TVL update properly (taken care of by component)
		}
		catch (e) {
			// eslint-disable-next-line no-console
			console.error(e)
		}
	},
	async getLPPrices({ getters, commit, rootGetters }) {
		const denoms = getters.all as Denom[]
		const lpDenoms = denoms.filter(d => "denoms" in d) as LPDenom[]
		const validatorInfoURL = `${this.app.$config.backendUrl}/denom-prices`
		const { data } = await axios.get(validatorInfoURL)

		for (const lpDenom of lpDenoms) {
			try {
				const otherToken = lpDenom.denoms.find(d => !d.stable)!
				const lpData = data.find(d => d.denom_id === lpDenom.id)
				const ercData = data.find(d => d.denom_id === otherToken.id)

				if (lpData && ercData) {
					commit("erc20Price", {
						erc20DenomId: otherToken.id,
						price: bn(ercData.price),
					})
					commit("lpPrice", {
						lpDenomId: lpDenom.id,
						price: bn(lpData.price),
					})
				}
				else {
					const provider = await this.dispatch("vaults/_getViewProvider", lpDenom.networkName) as ETHProvider
					const contract = new ethers.Contract(lpDenom.contractAddress, [
						"function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
						"function token0() external view returns (address)",
						"function token1() external view returns (address)",
						"function totalSupply() view returns (uint256)",
					], provider)
					const tokenAddresses = await Promise.all([
						contract.token0(),
						contract.token1(),
					]) as string[]
					const baseToken = lpDenom.denoms.find(d => d.stable)!
					const baseTokenIndex = tokenAddresses.findIndex(ta => ta.toLowerCase() === baseToken.contractAddress.toLowerCase())
					const otherTokenIndex = tokenAddresses.findIndex(ta => ta.toLowerCase() === otherToken.contractAddress.toLowerCase())

					const reserves = await contract.getReserves() as { toString: () => string }[]
					const baseTokenReserves = reserves[baseTokenIndex]
					const otherTokenReserves = reserves[otherTokenIndex]
					if (!baseToken.price) {
						return
					}

					const allReservesValue = divBy10toPow(
						bn(baseTokenReserves.toString()).times(baseToken.price).times(2),
						baseToken.decimals,
					)
					const totalSupplyResponse = await contract.totalSupply() as { toString: () => string }
					const totalSupply = divBy10toPow(
						totalSupplyResponse.toString(),
						lpDenom.decimals,
					)
					const lpPrice = allReservesValue.div(totalSupply)

					commit("erc20Price", {
						erc20DenomId: otherToken.id,
						price: allReservesValue.div(2).div(
							divBy10toPow(
								otherTokenReserves.toString(),
								otherToken.decimals,
							),
						),
					})
					commit("lpPrice", {
						lpDenomId: lpDenom.id,
						price: lpPrice,
					})
				}
				const vault = rootGetters["vaults/all"].find(v => v.stakeDenom.id === lpDenom.id)
				if (vault) {
					this.dispatch("vaults/setAPR", vault)
				}
			}
			catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
			}
		}
	},
	async addToMetamask({ state }) {
		const erc20Denom = state.erc20.find(d => d.id === "tnode")
		if (!window.ethereum || !erc20Denom) {
			return
		}
		await this.dispatch("web3/_setNetwork", erc20Denom.networkName)
		await sleep(500)
		await window.ethereum.request!({
			method: "wallet_watchAsset",
			params: {
				type: "ERC20",
				options: {
					address: erc20Denom.contractAddress,
					symbol: erc20Denom.symbol,
					decimals: erc20Denom.decimals,
					image: "https://app.trustednode.io/_nuxt/img/tnode-icon-2_f9440e2.png",
				},
			} as any,
		})
	},
	async setBalance({ getters, rootGetters, dispatch, commit }): Promise<void> {
		const denoms = getters.erc20
		for (const denom of denoms) {
			const account = rootGetters["web3/account"] as EVMAccount
			const tokenContract = await dispatch("_getTokenContract", { denom }) as ETHContract
			const balance = await tokenContract.balanceOf(account.address)
			commit("userBalance", {
				denomId: denom.id,
				userBalance: divBy10toPow(balance.toString(), denom.decimals),
			})
		}
	},
	_getGasConfig({ rootGetters }, networkName: string): Network["gasConfig"] {
		const networks = rootGetters["networks/all"] as Network[]
		const network = networks.find(n => n.chainName === networkName)!
		return network.gasConfig
	},
	async _getTokenContract(_, { denom }: { denom: ERC20Denom | LPDenom }): Promise<ETHContract> {
		const tokenAbi = [
			"function approve(address, uint) returns (bool)",
			"function balanceOf(address owner) view returns (uint256)",
			"function allowance(address, address) view returns(uint256)",
			"function totalSupply() view returns (uint256)",
		]
		const provider = await this.dispatch("vaults/_getViewProvider", denom.networkName) as ETHProvider
		return new ethers.Contract(
			denom.contractAddress,
			tokenAbi,
			provider,
		)
	},
	async addLiquidity({ dispatch, rootGetters }, { tokenA, tokenB, amountA, amountB }: AddLiquidityPayload): Promise<UserActionResponse> {
		const uniswapContractSigner = await dispatch("_getUniswapContractSigner", { networkName: tokenA.networkName }) as ETHContract
		const account = rootGetters["web3/account"] as EVMAccount
		await dispatch("_approveUsage", { account, token: tokenA })
		await dispatch("_approveUsage", { account, token: tokenB })
		const deadline = Math.floor(addMinutes(new Date(), 20).getTime() / 1000)
		const swapResult = await uniswapContractSigner.addLiquidity(
			tokenA.contractAddress,
			tokenB.contractAddress,
			times10toPow(amountA, tokenA.decimals, true),
			times10toPow(amountB, tokenB.decimals, true),
			times10toPow(
				floorToDP(
					bn(amountA).mul(0.995),
					tokenA.decimals,
				),
				tokenA.decimals,
				true,
			),
			times10toPow(
				floorToDP(
					bn(amountB).mul(0.995),
					tokenB.decimals,
				),
				tokenB.decimals,
				true,
			),
			account.address,
			deadline,
		)
		// eslint-disable-next-line no-console
		return {
			hash: swapResult.hash,
			status: "pending",
		}
	},
	async _getUniswapContractSigner({ rootGetters }, { networkName }: {networkName: string}): Promise<ETHContract> {
		const poolImmutablesAbi = [
			"function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)",
		]
		const offlineSigner = await this.dispatch("web3/getOfflineSigner", { networkName, switchNetwork: true }) as ethers.providers.JsonRpcSigner
		const networks = rootGetters["networks/all"] as Network[]
		const network = networks.find(n => n.chainName === networkName)!
		return new ethers.Contract(
			network.swapRouterAddress,
			poolImmutablesAbi,
			offlineSigner,
		)
	},
	async _approveUsage({ dispatch, rootGetters }, { account, token }: {account: EVMAccount, token: ERC20Denom}) {
		const tokenContract = await dispatch("_getTokenContract", { denom: token }) as ETHContract
		const offlineSigner = await this.dispatch("web3/getOfflineSigner", { networkName: token.networkName, switchNetwork: true }) as ethers.providers.JsonRpcSigner
		const tokenContractSigner = tokenContract.connect(offlineSigner)
		const networks = rootGetters["networks/all"] as Network[]
		const network = networks.find(n => n.chainName === token.networkName)!
		const allowance = await tokenContractSigner.allowance(account.address, network.swapRouterAddress) as { toString: () => string }
		const totalSupply = await tokenContractSigner.totalSupply() as { toString: () => string }
		if (bn(totalSupply.toString()).gt(allowance.toString())) {
			const gasConfig = await dispatch("_getGasConfig", token.networkName) as Network["gasConfig"]
			await tokenContractSigner.approve(
				network.swapRouterAddress,
				utils.parseUnits(
					totalSupply.toString(),
				),
				gasConfig,
			)
		}
	},
}
