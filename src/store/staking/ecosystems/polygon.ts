import type { GetterTree, ActionTree, MutationTree } from "vuex"
import bn from "big.js"
import { ethers } from "ethers"
import MetaNetwork from "@maticnetwork/meta/network"
import { RootState } from "~/store"
import {
	EcosystemModule,
	UserActionResponse,
	Validator,
	SupportedNetworks,
} from "~/_types"
import { divBy10toPow, times10toPow } from "~/_utils"
import { floorToDP } from "~/plugins/filters"

const defaultState = {
	id: "polygon",
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	id: state => state.id,
} as EcosystemModule["getters"]

export const mutations: MutationTree<LocalState> = {
}

export const actions: ActionTree<LocalState, RootState> = {
	async setTotalDelegated({ dispatch, commit }, validator: Validator) {
		const network = await dispatch("_getNetwork", validator)
		const provider = await dispatch("_getProvider", validator)
		const stakeManagerContract = await dispatch("_getStakeManagerContract", validator)
		const stakingInfoContract = new ethers.Contract(
			network.Main.Contracts.StakingInfo,
			network.abi("StakingInfo"),
			provider,
		)
		const validatorId = await stakeManagerContract.getValidatorId(validator.address)
		const totalStake = await stakingInfoContract.totalValidatorStake(validatorId)
		commit("staking/setTotalDelegated", {
			chainId: validator.chainId,
			totalDelegated: divBy10toPow(totalStake, validator.denom.decimals),
		}, { root: true })
	},
	async setAPR({ dispatch, commit }, validator: Validator) {
		const stakeManagerContract = await dispatch("_getStakeManagerContract", validator)
		const validatorId = await stakeManagerContract.getValidatorId(validator.address)
		const validatorStake = await stakeManagerContract.validatorStake(validatorId)
		const totalSupply = await stakeManagerContract.validatorStake(validatorId)
		const inflation = 0.1
		commit("staking/setAPR", {
			chainId: validator.chainId,
			apr: bn(inflation)
				.times(totalSupply)
				.div(validatorStake),
		}, { root: true })
	},
	async getBalance({ dispatch, rootGetters }, validator: Validator): Promise<bn> {
		const [account] = rootGetters["staking/wallets/metamask/accounts"]
		const tokenContract = await dispatch("_getTokenContract", validator)
		const balance = await tokenContract.balanceOf(account.address) as bn
		return divBy10toPow(balance, validator.denom.decimals)
	},
	async getDelegated({ dispatch, rootGetters, commit }, validator: Validator) {
		const [account] = rootGetters["staking/wallets/metamask/accounts"]
		const validatorShareContract = await dispatch("_getValidatorShareContract", validator)
		const [stake] = await validatorShareContract.getTotalStake(account.address)
		if (!stake) {
			return
		}
		commit("staking/userDelegated", { ...validator, userDelegated: divBy10toPow(stake, validator.denom.decimals) }, { root: true })
	},
	async getRewards({ dispatch, rootGetters, commit }, validator: Validator) {
		const [account] = rootGetters["staking/wallets/metamask/accounts"]
		const validatorShareContract = await dispatch("_getValidatorShareContract", validator)
		const rewardTotal = await validatorShareContract.getLiquidRewards(account.address)
		const userRewards = divBy10toPow(rewardTotal, validator.denom.decimals)
		commit("staking/userRewards", { ...validator, userRewards }, { root: true })
	},
	async getDelegations(_) {
		return await null
	},
	async delegate({ dispatch, rootGetters }, { amount, validator }: {amount: number, validator: Validator}) {
		try {
			const [account] = rootGetters["staking/wallets/metamask/accounts"]
			const network = await dispatch("_getNetwork", validator)
			const tokenContract = await dispatch("_getTokenContract", validator)
			const validatorShareContract = await dispatch("_getValidatorShareContract", validator)
			const exchangeRate = await validatorShareContract.exchangeRate()
			const stakeAmount = times10toPow(amount, validator.denom.decimals)
			let minSharesToMint = bn(0)

			if (exchangeRate) {
				const slippageFactor = 0.95 // allow 5% slippage
				const shares = stakeAmount
					.times(100)
					.div(exchangeRate.toString())
				minSharesToMint = floorToDP(shares.times(slippageFactor), 0) // making zero decimal otherwise contract call fails
			}

			const maxAllowance = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
			const signer = await this.dispatch("staking/wallets/metamask/getOfflineSigner", validator.chainId) as ethers.providers.JsonRpcSigner
			const tokenContractSigner = tokenContract.connect(signer)
			const allowance = await tokenContract.allowance(
				account.address,
				network.Main.Contracts.StakeManagerProxy,
			)
			if (!bn(allowance.toString()).eq(maxAllowance)) {
				await tokenContractSigner.approve(
					network.Main.Contracts.StakeManagerProxy,
					maxAllowance,
				)
			}

			const validatorShareContractSigner = await validatorShareContract.connect(signer)
			const result = await validatorShareContractSigner.buyVoucher(
				`0x${stakeAmount.toNumber().toString(16)}`,
				`0x${minSharesToMint.toNumber().toString(16)}`,
			)
			return {
				hash: result.hash,
				status: "DELEGATION SUCCESSFUL",
			}
		}
		catch (e) {
			return await dispatch("_handleError", { error: e })
		}
	},
	async undelegate({ dispatch }, { amount, validator }: {amount: bn, validator: Validator}) {
		try {
			const validatorShareContract = await dispatch("_getValidatorShareContract", validator)
			const unbondAmount = times10toPow(amount, validator.denom.decimals)
			const exchangeRate = await validatorShareContract.exchangeRate()
			const shares = unbondAmount.times(1e29).div(exchangeRate)
			const signer = await this.dispatch("staking/wallets/metamask/getOfflineSigner", validator.chainId) as ethers.providers.JsonRpcSigner
			const validatorShareContractSigner = await validatorShareContract.connect(signer)

			const result = await validatorShareContractSigner.sellVoucher_new(
				`0x${unbondAmount.toNumber().toString(16)}`,
				`0x${shares.toNumber().toString(16)}`,
			)
			return {
				hash: result.hash,
				status: "UNDELEGATION SUCCESSFUL",
			}
		}
		catch (e) {
			return await dispatch("_handleError", { error: e })
		}
	},
	async claimRewards({ dispatch }, validator: Validator) {
		try {
			const validatorShareContract = await dispatch("_getValidatorShareContract", validator)
			const signer = await this.dispatch("staking/wallets/metamask/getOfflineSigner", validator.chainId) as ethers.providers.JsonRpcSigner
			const validatorShareContractSigner = await validatorShareContract.connect(signer)
			const result = await validatorShareContractSigner.withdrawRewards()
			return {
				hash: result.hash,
				status: "REWARDS CLAIM SUCCESSFUL",
			}
		}
		catch (e) {
			return await dispatch("_handleError", { error: e })
		}
	},
	async redelegate() {
		return await { message: "not implemented" }
	},
	_getProvider(_, validator: Validator) {
		return new ethers.providers.JsonRpcProvider(validator.rpcEndpoint)
	},
	async _getTokenContract({ dispatch }, validator: Validator) {
		const network = await dispatch("_getNetwork", validator)
		const provider = await dispatch("_getProvider", validator)
		return new ethers.Contract(
			network.Main.Contracts.Tokens.MaticToken,
			network.abi("TestToken"),
			provider,
		)
	},
	async _getStakeManagerContract({ dispatch }, validator: Validator) {
		const network = await dispatch("_getNetwork", validator)
		const provider = await dispatch("_getProvider", validator)
		return new ethers.Contract(
			network.Main.Contracts.StakeManagerProxy,
			network.abi("StakeManager"),
			provider,
		)
	},
	async _getValidatorShareContract({ dispatch }, validator: Validator) {
		const network = await dispatch("_getNetwork", validator)
		const provider = await dispatch("_getProvider", validator)
		const stakeManagerContract = await dispatch("_getStakeManagerContract", validator)
		const validatorId = await stakeManagerContract.getValidatorId(validator.address)
		const contractAddress = await stakeManagerContract.getValidatorContract(validatorId)
		return new ethers.Contract(
			contractAddress,
			network.abi("ValidatorShare"),
			provider,
		)
	},
	_getNetwork(_, validator: Validator) {
		return validator.chainId === SupportedNetworks.ETH_MAINNET
			? new MetaNetwork("mainnet", "v1")
			: new MetaNetwork("testnet", "mumbai")
	},
	_handleError(_, { error }: { error: Error, statusPrefix: string }): UserActionResponse {
		if ((error as any).error?.code === -32603) {
			return { message: "not enough rewards available to claim" }
		}
		// eslint-disable-next-line no-console
		console.error(error)
		return { message: error.message }
	},
}
