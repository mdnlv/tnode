import type { GetterTree, ActionTree, MutationTree } from "vuex"
import bn from "big.js"
import { uniq } from "lodash"
import axios from "axios"
import { RootState } from "~/store"
import { Validator, ValidatorComingSoon, NativeDenom } from "~/_types"

import { divBy10toPow } from "~/_utils"

const defaultState = {
	connectingWalletId: null as string | null,
	connectingWalletError: null as string | null,
	validators: [
		{
			name: "Polkadot",
			chainId: "polkadot",
			rpcEndpoint: "wss://polkadot.api.onfinality.io/ws?apikey=ab573353-74ac-4e40-bddf-530b4134e85a", // TNODE endpoint?
			explorerLink: "https://polkascan.io/polkadot/transaction/###",
			validatorAddress: "14B2ArWoQKrZy6mcHF6St6GKajTX1WzUAqpQhiVs7Bkq8n7W",
			ecosystemId: "polkadot",
			totalDelegated: null,
			apr: null,
			denomId: "dot",
			gas: 200000,
			transactionFee: 0.01,
			minimumStakingAmount: 120, // polkadot
			walletId: "polkadotjs",
			disclaimer: null,
			unstakingDays: 28,
			operator: {
				name: "MANTRA DAO",
				link: "https://polkascan.io/polkadot/account/14B2ArWoQKrZy6mcHF6St6GKajTX1WzUAqpQhiVs7Bkq8n7W",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: false,
		},
		{
			name: "Sentinel",
			chainId: "sentinelhub-2",
			rpcEndpoint: "https://sentinel-rpc.trustednode.io",
			explorerLink: "https://www.mintscan.io/sentinel/txs/###",
			validatorAddress: "sentvaloper1tc35afn4xpem9cp97rc5lfu22efnx0y8fa7hlr",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "dvpn",
			gas: 200000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			operator: {
				name: "Trusted Node",
				link: "https://www.mintscan.io/sentinel/validators/sentvaloper1tc35afn4xpem9cp97rc5lfu22efnx0y8fa7hlr",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			name: "Regen",
			chainId: "regen-1",
			rpcEndpoint: "https://regen-rpc.hydrogenx.tk/",
			explorerLink: "https://www.mintscan.io/regen/txs/###",
			validatorAddress: "regenvaloper1zppjyal5emta5cquje8ndkpz0rs046m7zqxrpp",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "regen",
			gas: 300000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			operator: {
				name: "Tavis Digital",
				link: "https://regen.aneka.io/validators/regenvaloper1zppjyal5emta5cquje8ndkpz0rs046m7zqxrpp",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			name: "Persistence",
			chainId: "core-1",
			rpcEndpoint: "https://persistence-rpc.trustednode.io",
			explorerLink: "https://www.mintscan.io/persistence/txs/###",
			validatorAddress: "persistencevaloper155e333y5pvv3q7h2c9cf620lsc04m2vmvh2wtx",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "xprt",
			gas: 200000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			operator: {
				name: "Tavis Digital",
				link: "https://www.mintscan.io/persistence/validators/persistencevaloper155e333y5pvv3q7h2c9cf620lsc04m2vmvh2wtx",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			name: "Iris",
			chainId: "irishub-1",
			rpcEndpoint: "https://iris-rpc.trustednode.io",
			explorerLink: "https://www.mintscan.io/iris/txs/###",
			validatorAddress: "iva10f9wkd6vdspac05djyfwfx0uxcqxapnqj5gnmz",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: 4,
			denomId: "iris",
			gas: 200000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			operator: {
				name: "Tavis Digital",
				link: "https://www.mintscan.io/iris/validators/iva10f9wkd6vdspac05djyfwfx0uxcqxapnqj5gnmz",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			name: "Cosmos",
			chainId: "cosmoshub-4",
			rpcEndpoint: "https://cosmos-rpc.trustednode.io",
			explorerLink: "https://www.mintscan.io/cosmos/txs/###",
			validatorAddress: "cosmosvaloper10f9wkd6vdspac05djyfwfx0uxcqxapnqhnkcg8",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "atom",
			gas: 200000,
			transactionFee: 0.25,
			minimumStakingAmount: null,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			operator: {
				name: "Tavis Digital",
				link: "https://www.mintscan.io/cosmos/validators/cosmosvaloper10f9wkd6vdspac05djyfwfx0uxcqxapnqhnkcg8",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
		{
			name: "Terra",
			chainId: "columbus-5",
			rpcEndpoint: "https://terra-rpc.trustednode.io",
			explorerLink: "https://finder.terra.money/columbus-5/tx/###",
			validatorAddress: "terravaloper1chscwnxzcnd8qvk76efjd6dd73gf945dh4qryr",
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
			operator: {
				name: "MANTRA DAO",
				link: "https://finder.terra.money/mainnet/validator/terravaloper1chscwnxzcnd8qvk76efjd6dd73gf945dh4qryr",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: false,
		},
		{
			name: "Sifchain",
			chainId: "sifchain-1",
			rpcEndpoint: "https://sifchain-rpc.trustednode.io",
			explorerLink: "https://www.mintscan.io/sifchain/txs/###",
			validatorAddress: "sifvaloper1wa8fykgshxkf3u5jh3mnfhd0lx0rzf4tthpph3",
			ecosystemId: "cosmos",
			totalDelegated: null,
			apr: null,
			denomId: "rowan",
			gas: 200000,
			transactionFee: 0.25,
			walletId: "keplr",
			disclaimer: "(Note: Keplr with Ledger Nano is not currently supported)",
			unstakingDays: 21,
			operator: {
				name: "Trusted Node",
				link: "https://www.mintscan.io/sifchain/validators/sifvaloper1wa8fykgshxkf3u5jh3mnfhd0lx0rzf4tthpph3",
			},
			userDelegated: null,
			loadingPersonalInfo: false,
			userRewards: null,
			promotion: true,
		},
	] as (Omit<Validator, "denom"> & { denomId: string })[],
	validatorsComingSoon: [
		{ name: "Polygon", denomName: "MATIC", icon: require("~/assets/img/polygon-inverted-icon.webp") },
		{ name: "Osmosis", denomName: "OSMO", icon: require("~/assets/img/osmo-icon.png") },
		{ name: "Juno", denomName: "JUNO", icon: require("~/assets/img/juno-icon.png") },
		{ name: "Certik", denomName: "CTK", icon: require("~/assets/img/certik-icon.png") },
		{ name: "Fantom", denomName: "FTM", icon: require("~/assets/img/fantom-icon.png") },
		{ name: "Nodle", denomName: "NODL", icon: require("~/assets/img/nodle-icon.png") },
		{ name: "Velas", denomName: "VLX", icon: require("~/assets/img/velas-icon.png") },
		{ name: "Centrifuge", denomName: "CFG", icon: require("~/assets/img/centrifuge-icon.png") },
		{ name: "Altair", denomName: "AIR", icon: require("~/assets/img/altair-icon.png") },
		{ name: "Darwinia", denomName: "RING", icon: require("~/assets/img/darwinia-icon.png") },
		{ name: "Solana", denomName: "SOL", icon: require("~/assets/img/solana-badge-black-icon.png") },
		{ name: "Algorand", denomName: "ALGO", icon: require("~/assets/img/algorand_logo_mark_white.png") },
		// { name: "Cardano", denomName: "ADA", icon: require("~/assets/img/cardano-icon.webp") },
		// { name: "Avalanche", denomName: "AVAX", icon: require("~/assets/img/avalanche-icon.png") },
		// { name: "Moonriver", denomName: "MOVR", icon: require("~/assets/img/moonriver-icon.png") },
		// { name: "HydraDX", denomName: "XHDX", icon: require("~/assets/svg/hydradx.svg") },
		// { name: "Kusama", denomName: "KSM", icon: require("~/assets/img/Kusama-icon.png") },
		// { name: "Ethereum", denomName: "ETH", icon: require("~/assets/img/ethereum-icon.png") },
		// { name: "MINA", denomName: "MINA", icon: require("~/assets/img/mina-icon.png") },
		// { name: "CRO Chain", denomName: "CRO", icon: require("~/assets/img/cro-chain.png") },
		// { name: "The Graph", denomName: "GRT", icon: require("~/assets/img/graph-logo.png") },
		// { name: "Radix", denomName: "EXRD", icon: require("~/assets/img/radix-icon.png") },
		// { name: "Tezos", denomName: "XTZ", icon: require("~/assets/img/tezos-blue-logo-icon.png") },
	] as ValidatorComingSoon[],
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	connectingWalletId: state => state.connectingWalletId,
	connectingWalletError: state => state.connectingWalletError,
	validators(state, _getters, _rootState, rootGetters): Validator[] {
		const denoms = rootGetters["denoms/native"] as NativeDenom[]
		return state.validators.map(v => ({
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
		validator.totalDelegated = totalDelegated
	},
	setAPR: (state, { chainId, apr }: {chainId: string, apr: bn}) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		validator.apr = apr
	},
	userDelegated: (state, { chainId, userDelegated }: { chainId: string, userDelegated: bn }) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		validator.userDelegated = userDelegated
	},
	loadingPersonalInfo: (state, { chainId, loadingPersonalInfo }: { chainId: string, loadingPersonalInfo: boolean }) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		validator.loadingPersonalInfo = loadingPersonalInfo
	},
	userRewards: (state, { chainId, userRewards }: { chainId: string, userRewards: bn }) => {
		const validator = state.validators.find(v => v.chainId === chainId)!
		validator.userRewards = userRewards
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	async getAllValidatorInfo({ commit, getters }) {
		try {
			const apiURL = this.app.$config.backendUrl || "http://localhost:8080/api"
			const { data } = await axios.get(`${apiURL}/validator-info/`)
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
		catch (e) {
			// eslint-disable-next-line no-console
			console.error(e)
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
