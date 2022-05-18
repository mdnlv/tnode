import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { ethers, utils } from "ethers"
import bn from "big.js"
import { omit } from "lodash"
import sleep from "await-sleep"

import { RootState } from "~/store"
import {
	Vault,
	EVMAccount,
	UserActionResponse,
	ETHProvider,
	ETHContract,
	ERC20Denom,
	LPDenom,
	Network,
	SupportedNetworks,
} from "~/_types"
import { divBy10toPow, max, times10toPow } from "~/_utils"

const defaultState = {
	all: [
		{
			name: "TNODE\nVAULT",
			address: "0x98386F210af731ECbeE7cbbA12C47A8E65bC8856",
			networkName: SupportedNetworks.BSC_MAINNET,
			icon: require("~/assets/svg/vaults/maxi-vault.svg?raw"),
			auditLink: "/obelisk-tnode-vaults-audit.pdf",
			apr: null,
			tvl: null,
			lockup: null,
			promotional: true,
			userStaked: null,
			userBalance: null,
			userRewards: null,
			stakeDenomId: "tnode",
			rewardDenomId: "tnode",
			properties: [],
			expired: false,
		},
		{
			name: "BSC LIQUIDITY VAULT\nTNODE/BUSD",
			address: "0x44dC7FE8e51076De1B9f863138107148b441853C",
			networkName: SupportedNetworks.BSC_MAINNET,
			icon: null,
			auditLink: "/obelisk-tnode-vaults-audit.pdf",
			apr: null,
			tvl: null,
			lockup: null,
			promotional: false,
			userStaked: null,
			userBalance: null,
			userRewards: null,
			stakeDenomId: "tnode-busd",
			rewardDenomId: "tnode",
			properties: [],
			expired: false,
		},
		{
			name: "FTM LIQUIDITY VAULT\nTNODE/USDC",
			address: "0xe056aba40572f64d98a8c8e717c34e96056c4aad",
			networkName: SupportedNetworks.FTM_MAINNET,
			icon: null,
			auditLink: "/obelisk-tnode-vaults-audit.pdf",
			apr: null,
			tvl: null,
			lockup: null,
			promotional: false,
			userStaked: null,
			userBalance: null,
			userRewards: null,
			stakeDenomId: "tnode-usdc",
			rewardDenomId: "ftm-tnode",
			properties: [],
			expired: false,
		},
	] as {
		name: string
		address: string
		networkName: string
		icon: any | null
		auditLink: string | null
		apr: bn | null
		tvl: bn | null
		closesAt?: Date | null
		lockup: bn | null
		promotional: boolean
		userStaked: bn | null
		userBalance: bn | null
		userRewards: bn | null
		stakeDenomId: string
		rewardDenomId: string
		properties: Vault["properties"]
		expired: boolean
	}[],
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	all(state, _getters, _rootState, rootGetters): Vault[] {
		return state.all.map(v => ({
			...omit(v, ["stakeDenomId", "rewardDenomId"]),
			stakeDenom: rootGetters["denoms/all"].find(d => d.id === v.stakeDenomId),
			rewardDenom: rootGetters["denoms/all"].find(d => d.id === v.rewardDenomId),
		}))
	},
}

export const mutations: MutationTree<LocalState> = {
	closesAt: (state, { address, closesAt }: {address: string, closesAt: Date}) => {
		const vault = state.all.find(v => v.address === address)!
		vault.closesAt = closesAt
	},
	apr: (state, { address, apr }: {address: string, apr: bn}) => {
		const vault = state.all.find(v => v.address === address)!
		vault.apr = apr
	},
	tvl: (state, { address, tvl }: {address: string, tvl: bn}) => {
		const vault = state.all.find(v => v.address === address)!
		vault.tvl = tvl
	},
	userStaked: (state, { address, userStaked }: {address: string, userStaked: bn}) => {
		const vault = state.all.find(v => v.address === address)!
		vault.userStaked = userStaked
	},
	userBalance: (state, { address, userBalance }: {address: string, userBalance: bn}) => {
		const vault = state.all.find(v => v.address === address)!
		vault.userBalance = userBalance
	},
	userRewards: (state, { address, userRewards }: {address: string, userRewards: bn}) => {
		const vault = state.all.find(v => v.address === address)!
		vault.userRewards = userRewards
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	async _getTokenContract({ dispatch }, { vault, denom }: { vault: Vault, denom: ERC20Denom | LPDenom }): Promise<ETHContract> {
		const tokenAbi = [
			"function approve(address, uint) returns (bool)",
			"function balanceOf(address owner) view returns (uint256)",
			"function allowance(address, address) view returns(uint256)",
			"function totalSupply() view returns (uint256)",
		]
		const provider = await dispatch("_getViewProvider", vault.networkName) as ETHProvider
		return new ethers.Contract(denom.contractAddress, tokenAbi, provider)
	},
	_getGasConfig({ rootGetters }, vault: Vault): Network["gasConfig"] {
		const networks = rootGetters["networks/all"] as Network[]
		const network = networks.find(n => n.chainName === vault.networkName)!
		return network.gasConfig
	},
	_getViewProvider({ rootGetters }, networkName: string): ETHProvider {
		const networks = rootGetters["networks/all"] as Network[]
		const network = networks.find(n => n.chainName === networkName)!
		const rpcUrls = [...network.privateRpcUrls, ...network.rpcUrls]
		for (const rpcUrl of rpcUrls) {
			try {
				return new ethers.providers.JsonRpcProvider(rpcUrl)
			}
			catch (e) {
				// eslint-disable-next-line no-console
				console.warn("couldn't connect to rpcUrl, trying next")
			}
		}
		return new ethers.providers.Web3Provider(window.ethereum!)
	},
	async _getStakingRewardsContractView({ dispatch }, vault: Vault): Promise<ETHContract> {
		const stakingRewardsAbi = [
			"function balanceOf(address) view returns (uint)",
			"function lastTimeRewardApplicable() view returns (uint)",
			"function rewardPerToken() view returns (uint)",
			"function earned(address)  view returns (uint)",
			"function getRewardForDuration() view returns (uint)",
			"function rewardRate() view returns (uint)",
			"function viewLockingTimeStamp() view returns (uint)",
			"function periodFinish() view returns (uint)",
			"function totalSupply() view returns (uint)",
		]
		const provider = await dispatch("_getViewProvider", vault.networkName) as ETHProvider
		return new ethers.Contract(
			vault.address,
			stakingRewardsAbi,
			provider,
		)
	},
	async setClosesAt({ dispatch, commit }, vault: Vault): Promise<void> {
		if (vault.closesAt === undefined) {
			return
		}
		const stakingRewardsContract = await dispatch("_getStakingRewardsContractView", vault) as ETHContract
		const periodFinish = await stakingRewardsContract.periodFinish() as { toString: () => string }
		commit(
			"closesAt",
			{
				address: vault.address,
				closesAt: new Date(bn(periodFinish.toString()).times(1000).toNumber()),
			},
		)
	},
	async setAPR({ dispatch, commit }, vault: Vault): Promise<void> {
		if (!vault.stakeDenom.price || !vault.rewardDenom.price) {
			return
		}
		const stakingRewardsContract = await dispatch("_getStakingRewardsContractView", vault) as ETHContract
		const periodFinish = await stakingRewardsContract.periodFinish() as { toString: () => string }
		const now = (new Date()).valueOf()
		if (times10toPow(periodFinish.toString(), 3).lt(now)) {
			commit(
				"apr",
				{
					address: vault.address,
					apr: 0,
				},
			)
			return
		}
		const rewardRate = await stakingRewardsContract.rewardRate() as { toString: () => string }
		const rewardRateReal = divBy10toPow(rewardRate.toString(), vault.rewardDenom.decimals)
		const rewardRateUSD = bn(rewardRateReal.toString()).times(vault.rewardDenom.price)
		const totalSupply = await stakingRewardsContract.totalSupply() as { toString: () => string }
		const totalSupplyReal = divBy10toPow(totalSupply.toString(), vault.stakeDenom.decimals)
		const tvlUSD = totalSupplyReal.times(vault.stakeDenom.price)
		const secondsInYear = bn(60).times(60).times(24).times(365.25)
		const apr = rewardRateUSD
			.times(secondsInYear)
			.div(max(tvlUSD, 0.01))
			.times(100)
		commit(
			"apr",
			{ address: vault.address, apr },
		)
	},
	async setTVL({ dispatch, commit }, vault: Vault): Promise<void> {
		const stakingRewardsContract = await dispatch("_getStakingRewardsContractView", vault) as ETHContract
		const totalSupply = await stakingRewardsContract.totalSupply() as { toString: () => string }
		commit(
			"tvl",
			{
				address: vault.address,
				tvl: divBy10toPow(totalSupply.toString(), vault.stakeDenom.decimals),
			},
		)
	},
	async _getStakingRewardsContract({ dispatch }, vault: Vault): Promise<ETHContract> {
		const stakingRewardsAbi = [
			"function stake(uint)",
			"function stakeTransferWithBalance(uint, uint)",
			"function withdraw(uint)",
			"function getReward()",
			"function quit()",
			"function totalSupply() view returns (uint)",
			"function balanceOf(address) view returns (uint)",
			"function lastTimeRewardApplicable() view returns (uint)",
			"function rewardPerToken() view returns (uint)",
			"function earned(address)  view returns (uint)",
			"function getRewardForDuration() view returns (uint)",
			"function viewLockingTimeStamp() view returns (uint)",
			"function periodFinish() view returns (uint)",
		]
		const provider = await dispatch("_getViewProvider", vault.networkName) as ETHProvider
		return new ethers.Contract(
			vault.address,
			stakingRewardsAbi,
			provider,
		)
	},
	async setBalance({ dispatch, commit }, vault: Vault): Promise<void> {
		const account = await dispatch("_getAccount", vault) as EVMAccount
		const tokenContract = await dispatch("_getTokenContract", { vault, denom: vault.stakeDenom }) as ETHContract
		const balance = await tokenContract.balanceOf(account.address)
		commit("userBalance", {
			address: vault.address,
			userBalance: divBy10toPow(balance.toString(), vault.stakeDenom.decimals),
		})
	},
	async setStaked({ dispatch, commit }, vault: Vault): Promise<void> {
		const account = await dispatch("_getAccount", vault) as EVMAccount
		const stakingRewardsContract = await dispatch("_getStakingRewardsContract", vault)
		const staked = await stakingRewardsContract.balanceOf(account.address)
		commit("userStaked", {
			address: vault.address,
			userStaked: divBy10toPow(staked.toString(), vault.stakeDenom.decimals),
		})
	},
	async setRewards({ dispatch, commit }, vault: Vault): Promise<void> {
		const account = await dispatch("_getAccount", vault) as EVMAccount
		const stakingRewardsContract = await dispatch("_getStakingRewardsContract", vault)
		const rewards = await stakingRewardsContract.earned(account.address) as { toString: () => string }
		commit("userRewards", {
			address: vault.address,
			userRewards: divBy10toPow(rewards.toString(), vault.stakeDenom.decimals),
		})
	},
	async stake({ dispatch }, { vault, amount }: {vault: Vault, amount: number}): Promise<UserActionResponse> {
		try {
			const stakingRewardsContract = await dispatch("_getStakingRewardsContract", vault)
			const tokenContract = await dispatch("_getTokenContract", { vault, denom: vault.stakeDenom }) as ETHContract
			const offlineSigner = await this.dispatch("web3/getOfflineSigner", { networkName: vault.networkName, switchNetwork: true }) as ethers.providers.JsonRpcSigner
			const gasConfig = await dispatch("_getGasConfig", vault) as Network["gasConfig"]

			const account = await dispatch("_getAccount", vault) as EVMAccount
			const allowance = await tokenContract.allowance(account.address, vault.address) as { toString: () => string }
			const totalSupply = await tokenContract.totalSupply() as { toString: () => string }
			if (bn(totalSupply.toString()).gt(allowance.toString())) {
				const tokenContractSigner = tokenContract.connect(offlineSigner)
				const approved = await tokenContractSigner.approve(
					vault.address,
					utils.parseUnits(
						totalSupply.toString(),
					),
					gasConfig,
				)
				// eslint-disable-next-line no-console
				console.log({ approved })
				await sleep(1000)
			}

			const stakingRewardsContractSigner = await stakingRewardsContract.connect(offlineSigner)
			const response = await stakingRewardsContractSigner.stake(utils.parseUnits(
				amount.toString(),
			), gasConfig)
			return {
				hash: response.hash,
				status: "STAKING IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "STAKING" })
		}
	},
	async unstake({ dispatch }, { vault, amount }: {vault: Vault, amount: number}): Promise<UserActionResponse> {
		try {
			const stakingRewardsContract = await dispatch("_getStakingRewardsContract", vault)
			const offlineSigner = await this.dispatch("web3/getOfflineSigner", { networkName: vault.networkName, switchNetwork: true }) as ethers.providers.JsonRpcSigner

			// if user is withdrawing whole balance, call quit()
			const account = await dispatch("_getAccount", vault) as EVMAccount
			const balance = await stakingRewardsContract.balanceOf(account.address) as { toString: () => string }
			let response
			const stakingRewardsContractSigner = await stakingRewardsContract.connect(offlineSigner)
			if (divBy10toPow(balance.toString(), vault.stakeDenom.decimals).eq(amount)) {
				response = await stakingRewardsContractSigner.quit()
			}
			else {
				response = await stakingRewardsContractSigner.withdraw(utils.parseUnits(
					amount.toString(),
				))
			}
			return {
				hash: response.hash,
				status: "UNSTAKING IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "UNSTAKING" })
		}
	},
	async claimRewards({ dispatch }, vault: Vault): Promise<UserActionResponse> {
		try {
			const stakingRewardsContract = await dispatch("_getStakingRewardsContract", vault)
			const offlineSigner = await this.dispatch("web3/getOfflineSigner", { networkName: vault.networkName, switchNetwork: true }) as ethers.providers.JsonRpcSigner
			const stakingRewardsContractSigner = await stakingRewardsContract.connect(offlineSigner)
			const response = await stakingRewardsContractSigner.getReward()
			return {
				hash: response.hash,
				status: "REWARDS CLAIM IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "REWARDS CLAIM" })
		}
	},
	_handleError(_, { error, _statusPrefix }: { error: Error, _statusPrefix: string }): UserActionResponse {
		// TODO: handle errors
		// eslint-disable-next-line no-console
		console.error(error)
		return { message: error.message }
	},
	_getAccount({ rootGetters }): EVMAccount | undefined {
		return rootGetters["web3/account"] as EVMAccount
	},
}
