import type { GetterTree, ActionTree, MutationTree } from "vuex"
import bn from "big.js"
import { uniq } from "lodash"
import axios from "axios"
import { RootState } from "~/store"
import {
	Validator,
	ValidatorComingSoon,
	NativeDenom,
	SupportedNetworks,
} from "~/_types"

import { divBy10toPow } from "~/_utils"

// for dev: set this to match the chainName of a validator to show only that validator
const onlyValidator = null

const defaultState = {
	connectingWalletId: null as string | null,
	connectingWalletError: null as string | null,
	validators: [
		{
			chainName: "Polkadot",
			chainId: "polkadot",
			rpcEndpoint: "wss://polkadot.api.onfinality.io/ws?apikey=ab573353-74ac-4e40-bddf-530b4134e85a", // TNODE endpoint?
			linkTemplate: "https://polkascan.io/polkadot/account/###",
			txLinkTemplate: "https://polkascan.io/polkadot/transaction/###",
			address: "14B2ArWoQKrZy6mcHF6St6GKajTX1WzUAqpQhiVs7Bkq8n7W",
			operatorName: "MANTRA DAO",
			ecosystemId: "polkadot",
			totalDelegated: null,
			apr: null,
			denomId: "dot",
			gas: 200000,
			transactionFee: 0.01,
			minimumStakingAmount: 160, // polkadot
			walletId: "polkadotjs",
			disclaimer: null,
			unstakingDays: 28,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: false,
		},
		{
			chainName: "Polygon",
			chainId: SupportedNetworks.ETH_MAINNET,
			rpcEndpoint: "https://rpc.ankr.com/eth/486f6d938d85e35aeacf83a59afd95c4fab739093c8f919adb258799d81d51bf",
			linkTemplate: "https://etherscan.io/address/###",
			txLinkTemplate: "https://etherscan.io/tx/###",
			address: "0x8735a1a9c44118b4957e4dd36478438795e74a38",
			operatorName: "MANTRA DAO",
			ecosystemId: "polygon",
			totalDelegated: null,
			apr: bn(9.6),
			denomId: "matic",
			gas: 2500000000,
			transactionFee: null,
			walletId: "metamask",
			disclaimer: null,
			unstakingDays: 4,
			minimumStakingAmount: null,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: false,
		},
		{
			chainName: "Sentinel",
			chainId: "sentinelhub-2",
			rpcEndpoint: "https://dvpn-rpc.hydrogenx.tk",
			linkTemplate: "https://www.mintscan.io/sentinel/validators/###",
			txLinkTemplate: "https://www.mintscan.io/sentinel/txs/###",
			address: "sentvaloper1tc35afn4xpem9cp97rc5lfu22efnx0y8fa7hlr",
			operatorName: "Trusted Node",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "dvpn",
			gas: 500000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			chainName: "Regen",
			chainId: "regen-1",
			rpcEndpoint: "https://regen-rpc.hydrogenx.tk/",
			linkTemplate: "https://www.mintscan.io/regen/validators/###",
			txLinkTemplate: "https://www.mintscan.io/regen/txs/###",
			address: "regenvaloper1zppjyal5emta5cquje8ndkpz0rs046m7zqxrpp",
			operatorName: "Tavis Digital",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "regen",
			gas: 500000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			chainName: "Persistence",
			chainId: "core-1",
			rpcEndpoint: "https://persistence-rpc.hydrogenx.tk",
			linkTemplate: "https://www.mintscan.io/persistence/validators/###",
			txLinkTemplate: "https://www.mintscan.io/persistence/txs/###",
			address: "persistencevaloper155e333y5pvv3q7h2c9cf620lsc04m2vmvh2wtx",
			operatorName: "Tavis Digital",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "xprt",
			gas: 500000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			chainName: "Iris",
			chainId: "irishub-1",
			rpcEndpoint: "https://iris-rpc.trustednode.io",
			linkTemplate: "https://www.mintscan.io/iris/validators/###",
			txLinkTemplate: "https://www.mintscan.io/iris/txs/###",
			address: "iva10f9wkd6vdspac05djyfwfx0uxcqxapnqj5gnmz",
			operatorName: "Tavis Digital",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: 4,
			denomId: "iris",
			gas: 500000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			chainName: "Cosmos",
			chainId: "cosmoshub-4",
			rpcEndpoint: "https://cosmos-rpc.trustednode.io",
			linkTemplate: "https://www.mintscan.io/cosmos/validators/###",
			txLinkTemplate: "https://www.mintscan.io/cosmos/txs/###",
			address: "cosmosvaloper10f9wkd6vdspac05djyfwfx0uxcqxapnqhnkcg8",
			operatorName: "Tavis Digital",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "atom",
			gas: 500000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			chainName: "Terra",
			chainId: "columbus-5",
			rpcEndpoint: "https://terra-api.hydrogenx.tk",
			linkTemplate: "https://finder.terra.money/mainnet/validator/###",
			txLinkTemplate: "https://finder.terra.money/columbus-5/tx/###", // refactor to txLink
			address: "terravaloper1chscwnxzcnd8qvk76efjd6dd73gf945dh4qryr",
			operatorName: "MANTRA DAO",
			ecosystemId: "terra",
			totalDelegated: null,
			apr: null,
			denomId: "luna",
			gas: 200000,
			transactionFee: 0.1,
			minimumStakingAmount: null,
			walletId: "terra-station",
			disclaimer: null,
			unstakingDays: 21,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: false,
		},
		{
			chainName: "Sifchain",
			chainId: "sifchain-1",
			rpcEndpoint: "https://sifchain-rpc.hydrogenx.tk",
			linkTemplate: "https://www.mintscan.io/sifchain/validators/###",
			txLinkTemplate: "https://www.mintscan.io/sifchain/txs/###",
			address: "sifvaloper1wa8fykgshxkf3u5jh3mnfhd0lx0rzf4tthpph3",
			operatorName: "Trusted Node",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "rowan",
			gas: 500000,
			transactionFee: 0.25,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			minimumStakingAmount: null,
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		// {
		// 	chainName: "Polygon Test",
		// 	chainId: SupportedNetworks.ETH_GOERLI,
		// 	rpcEndpoint: "https://rpc.goerli.mudit.blog/",
		// 	linkTemplate: "https://goerli.etherscan.io/address/###",
		// 	txLinkTemplate: "https://goerli.etherscan.io/tx/###",
		// 	address: "0xbe188d6641e8b680743a4815dfa0f6208038960f",
		// 	operatorName: "MANTRA DAO",
		// 	ecosystemId: "polygon",
		// 	totalDelegated: null,
		// 	apr: bn(9.6),
		// 	denomId: "matic",
		// 	gas: 2500000000,
		// 	transactionFee: null,
		// 	walletId: "metamask",
		// 	disclaimer: null,
		// 	unstakingDays: 4,
		// 	minimumStakingAmount: null,
		// 	userDelegated: null,
		// 	loadingPersonalInfo: false,
		// 	userRewards: null,
		// 	promotion: false,
		// },
	] as (Omit<Validator, "denom"> & { denomId: string })[],
	validatorsComingSoon: [
		{ chainName: "Osmosis", denomName: "OSMO", icon: require("~/assets/img/osmo-icon.png") },
		{ chainName: "Juno", denomName: "JUNO", icon: require("~/assets/img/juno-icon.png") },
		{ chainName: "Certik", denomName: "CTK", icon: require("~/assets/img/certik-icon.png") },
		{ chainName: "Fantom", denomName: "FTM", icon: require("~/assets/img/fantom-icon.png") },
		{ chainName: "Nodle", denomName: "NODL", icon: require("~/assets/img/nodle-icon.png") },
		{ chainName: "Velas", denomName: "VLX", icon: require("~/assets/img/velas-icon.png") },
		{ chainName: "Centrifuge", denomName: "CFG", icon: require("~/assets/img/centrifuge-icon.png") },
		{ chainName: "Altair", denomName: "AIR", icon: require("~/assets/img/altair-icon.png") },
		{ chainName: "Darwinia", denomName: "RING", icon: require("~/assets/img/darwinia-icon.png") },
		{ chainName: "Solana", denomName: "SOL", icon: require("~/assets/img/solana-badge-black-icon.png") },
		{ chainName: "Algorand", denomName: "ALGO", icon: require("~/assets/img/algorand_logo_mark_white.png") },
		// { chainName: "Cardano", denomName: "ADA", icon: require("~/assets/img/cardano-icon.webp") },
		// { chainName: "Avalanche", denomName: "AVAX", icon: require("~/assets/img/avalanche-icon.png") },
		// { chainName: "Moonriver", denomName: "MOVR", icon: require("~/assets/img/moonriver-icon.png") },
		// { chainName: "HydraDX", denomName: "XHDX", icon: require("~/assets/svg/hydradx.svg") },
		// { chainName: "Kusama", denomName: "KSM", icon: require("~/assets/img/Kusama-icon.png") },
		// { chainName: "Ethereum", denomName: "ETH", icon: require("~/assets/img/ethereum-icon.png") },
		// { chainName: "MINA", denomName: "MINA", icon: require("~/assets/img/mina-icon.png") },
		// { chainName: "CRO Chain", denomName: "CRO", icon: require("~/assets/img/cro-chain.png") },
		// { chainName: "The Graph", denomName: "GRT", icon: require("~/assets/img/graph-logo.png") },
		// { chainName: "Radix", denomName: "EXRD", icon: require("~/assets/img/radix-icon.png") },
		// { chainName: "Tezos", denomName: "XTZ", icon: require("~/assets/img/tezos-blue-logo-icon.png") },
	] as ValidatorComingSoon[],
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	connectingWalletId: state => state.connectingWalletId,
	connectingWalletError: state => state.connectingWalletError,
	validators(state, _getters, _rootState, rootGetters): Validator[] {
		const denoms = rootGetters["denoms/native"] as NativeDenom[]
		return state.validators
			.filter(v => !onlyValidator || onlyValidator === v.chainName)
			.map(v => ({
				...v,
				denomId: undefined,
				denom: denoms.find(d => d.id === v.denomId)!,
			}))
	},
	validatorsComingSoon: state => state.validatorsComingSoon,
	walletIds: state => uniq(state.validators.map(v => v.walletId)),
	userDelegated: state => ({ chainId }) => state.validators.find(v => v.chainId === chainId)?.userDelegated ?? null,
	totalDelegated(_state, getters) {
		return getters.validators.reduce(
			(acc, val) => val.userDelegated && val.denom.price
				? acc.plus(bn(val.userDelegated).times(val.denom.price) || bn(0))
				: acc,
			bn(0),
		)
	},
	loadingPersonalInfo: state => ({ chainId }) => state.validators.find(v => v.chainId === chainId)?.loadingPersonalInfo,
	userRewards: state => ({ chainId }) => state.validators.find(v => v.chainId === chainId)?.userRewards ?? null,
}

export const mutations: MutationTree<LocalState> = {
	connectingWalletId: (state, connectingWalletId) => { state.connectingWalletId = connectingWalletId },
	connectingWalletError: (state, connectingWalletError) => { state.connectingWalletError = connectingWalletError },
	setTotalDelegated: (state, { chainId, totalDelegated }: {chainId: string, totalDelegated: bn}) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		if (!validator) {
			return
		}
		validator.totalDelegated = totalDelegated
	},
	setAPR: (state, { chainId, apr }: {chainId: string, apr: bn}) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		if (!validator) {
			return
		}
		validator.apr = apr
	},
	userDelegated: (state, { chainId, userDelegated }: { chainId: string, userDelegated: bn }) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		if (!validator) {
			return
		}
		validator.userDelegated = userDelegated
	},
	loadingPersonalInfo: (state, { chainId, loadingPersonalInfo }: { chainId: string, loadingPersonalInfo: boolean }) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		if (!validator) {
			return
		}
		validator.loadingPersonalInfo = loadingPersonalInfo
	},
	userRewards: (state, { chainId, userRewards }: { chainId: string, userRewards: bn }) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		if (!validator) {
			return
		}
		validator.userRewards = userRewards
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	async getAllValidatorInfo({ commit, getters }) {
		const validatorInfoURL = `${this.app.$config.backendUrl}/validator-info/`
		try {
			const { data } = await axios.get(validatorInfoURL)
			const aprResults = data?.latestAprValues || []
			const totalStakedResults = data?.latestTotalStakedValues || []

			for (const aprResult of aprResults) {
				commit("setAPR", { chainId: aprResult.chain_id, apr: aprResult.value })
			}

			for (const totalStakedResult of totalStakedResults) {
				const validators = getters.validators
				const validator = validators.find(v => v.chainId === totalStakedResult.chain_id)
				if (validator) {
					commit("setTotalDelegated", {
						chainId: totalStakedResult.chain_id,
						totalDelegated: divBy10toPow(totalStakedResult.value, validator.denom.decimals),
					})
				}
			}
		}
		catch (e: any) {
			if (e.message !== "Network Error" || e.config.url !== validatorInfoURL) {
				// eslint-disable-next-line no-console
				console.error(e)
			}
		}
		// for any values that were not gotten from the backend, fetch manually
		const validators = getters.validators
		const requests = validators.map(
			validator => [
				validator.apr === null
					? [this.dispatch(
						`staking/ecosystems/${validator.ecosystemId}/setAPR`,
						validator,
					)]
					: [],
				validator.totalDelegated === null
					? [this.dispatch(
						`staking/ecosystems/${validator.ecosystemId}/setTotalDelegated`,
						validator,
					)]
					: [],
			].flat(),
		).flat()
		await Promise.all(requests)
	},
}
