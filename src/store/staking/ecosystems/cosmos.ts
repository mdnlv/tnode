import type { GetterTree, ActionTree, MutationTree } from "vuex"
import bn from "big.js"

import {
	Coin,
} from "cosmjs-types/cosmos/base/v1beta1/coin"
import {
	coin,
	SigningStargateClient,
	QueryClient,
	setupDistributionExtension,
	DistributionExtension,
	setupStakingExtension,
	BankExtension,
	setupBankExtension,
	StakingExtension,
	calculateFee,
	GasPrice,
	StdFee,
} from "@cosmjs/stargate"
import {
	Tendermint34Client,
} from "@cosmjs/tendermint-rpc"
import {
	QueryClientImpl,
} from "cosmjs-types/cosmos/mint/v1beta1/query"
import {
	times10toPow,
	divBy10toPow,
} from "~/_utils"
import {
	EcosystemModule,
	UserActionResponse,
	Account,
	Validator,
} from "~/_types"
import { RootState } from "~/store"

interface BalanceCoin extends Coin {
	amount: string
	denom: string
}

const setupMintExtension = base => {
	const queryService = new QueryClientImpl({
		request: (service, method, data) => {
			const path = `/${service}/${method}`
			return base.queryUnverified(path, data)
		},
	})
	return {
		mint: {
			inflation: async () => {
				const { inflation } = await queryService.Inflation({})
				return inflation
			},
		},
	}
}

type TMClient = QueryClient
	& DistributionExtension
	& StakingExtension
	& BankExtension
	& ReturnType<typeof setupMintExtension>

const defaultState = {
	id: "cosmos",
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	...Object.keys(defaultState).reduce((acc, prop) => ({
		...acc,
		[prop]: state => state[prop],
	}), {}),
	id: state => state.id,
} as EcosystemModule["getters"]

export const mutations: MutationTree<LocalState> = {
}

export const actions: ActionTree<LocalState, RootState> = {
	async setTotalDelegated({ dispatch, commit }, validator: Validator): Promise<void> {
		const tmClient = await dispatch("_getTmClient", validator) as TMClient
		const { delegationResponses } = await tmClient.staking.validatorDelegations(validator.validatorAddress)
		const totalDelegated = delegationResponses.reduce((acc, delegation) => acc + (Number(delegation.balance?.amount) || 0), 0)
		commit("staking/setTotalDelegated", {
			chainId: validator.chainId,
			totalDelegated: divBy10toPow(totalDelegated, validator.denom.decimals),
		}, { root: true })
	},
	async setAPR({ dispatch, commit }, validator: Validator): Promise<void> {
		const tmClient = await dispatch("_getTmClient", validator) as TMClient
		const inflationRes = await tmClient.mint.inflation()
		const inflation = divBy10toPow(new TextDecoder().decode(inflationRes), 16)
		const poolRes = await tmClient.staking.pool()
		const pool = poolRes.pool!
		const totalStaked = bn(pool.bondedTokens).plus(pool.notBondedTokens)
		const totalSupplyRes = await tmClient.bank.totalSupply()
		const totalSupply = totalSupplyRes.find(ts => ts.denom === validator.denom.min)!.amount
		commit("staking/setAPR", {
			chainId: validator.chainId,
			apr: bn(inflation)
				.times(totalSupply)
				.div(totalStaked),
		}, { root: true })
	},
	async getBalance({ dispatch }, validator: Validator): Promise<bn> {
		const signer = await dispatch("_getSigner", validator) as SigningStargateClient
		const account: Account = await dispatch("_getAccount", validator)
		const balance: BalanceCoin = await signer.getBalance(account.address, validator.denom.min)
		return balance !== null
			? divBy10toPow(balance.amount, validator.denom.decimals)
			: bn(0)
	},
	async getDelegated({ dispatch, commit }, validator: Validator) {
		const signer = await dispatch("_getSigner", validator) as SigningStargateClient
		const account: Account = await dispatch("_getAccount", validator)
		const delegation: BalanceCoin | null = await signer.getDelegation(
			account.address,
			validator.validatorAddress,
		)
		const userDelegated = delegation
			? divBy10toPow(delegation.amount, validator.denom.decimals)
			: bn(0)
		commit("staking/userDelegated", { ...validator, userDelegated }, { root: true })
	},
	async getRewards({ dispatch, commit }, validator: Validator) {
		const tmClient = await dispatch("_getTmClient", validator) as TMClient
		const account: Account = await dispatch("_getAccount", validator)
		const { rewards } = await tmClient!.distribution.delegationRewards(
			account.address,
			validator.validatorAddress,
		)
		const userRewards = rewards.length
			? divBy10toPow(rewards[0].amount, 18 + validator.denom.decimals)
			: null
		commit("staking/userRewards", { ...validator, userRewards }, { root: true })
	},
	async delegate({ dispatch }, { amount, validator }: {amount: number, validator: Validator}) {
		try {
			const signer = await dispatch("_getSigner", validator)
			const account: Account = await dispatch("_getAccount", validator)
			const response = await signer.delegateTokens(
				account.address,
				validator.validatorAddress,
				coin(
					times10toPow(amount, validator.denom.decimals, true),
					validator.denom.min,
				),
				await dispatch("_sendFee", validator),
				`delegating ${validator.denom.symbol} via trustednode.io`,
			)
			return {
				hash: response.transactionHash,
				status: "DELEGATION SUCCESSFUL",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "DELEGATION" })
		}
	},
	async undelegate({ dispatch }, { amount, validator }: {amount: number, validator: Validator}) {
		try {
			const signer = await dispatch("_getSigner", validator)
			const account: Account = await dispatch("_getAccount", validator)
			const response = await signer.undelegateTokens(
				account.address,
				validator.validatorAddress,
				coin(
					times10toPow(amount, validator.denom.decimals, true),
					validator.denom.min,
				),
				await dispatch("_sendFee", validator),
				`undelegating ${validator.denom.symbol} via trustednode.io`,
			)
			return {
				hash: response.transactionHash,
				status: "UNDELEGATION SUCCESSFUL",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "UNDELEGATION" })
		}
	},
	async claimRewards({ dispatch }, validator: Validator) {
		try {
			const signer = await dispatch("_getSigner", validator)
			const account: Account = await dispatch("_getAccount", validator)
			const response = await signer.withdrawRewards(
				account.address,
				validator.validatorAddress,
				await dispatch("_sendFee", validator),
				`claiming ${validator.denom.symbol} rewards via trustednode.io`,
			)
			return {
				hash: response.transactionHash,
				status: "REWARDS CLAIM SUCCESSFUL",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "REWARDS CLAIM" })
		}
	},
	async _getSigner(_, validator: Validator) {
		const offlineSigner = await this.dispatch(`staking/wallets/${validator.walletId}/getOfflineSigner`, validator.chainId)
		return await SigningStargateClient.connectWithSigner(
			validator.rpcEndpoint,
			offlineSigner,
			{ broadcastPollIntervalMs: 300, broadcastTimeoutMs: 8000 },
		)
	},
	async _getTmClient(_, validator: Validator) {
		return QueryClient.withExtensions(
			await Tendermint34Client.connect(validator.rpcEndpoint),
			setupDistributionExtension,
			setupStakingExtension,
			setupBankExtension,
			// creating custom mint extension, TODO: submit PR to @cosmjs/stargate with this
			setupMintExtension,
		)
	},
	_getAccount({ rootGetters }, validator: Validator): Account | undefined {
		const accounts = rootGetters[`staking/wallets/${validator.walletId}/accounts`] as Account[]
		return accounts.find(a => a.chainId === validator.chainId)
	},
	_sendFee(_, validator: Validator): StdFee {
		return calculateFee(
			validator.gas,
			GasPrice.fromString(`0.01${validator.denom.min}`), // actually chosen by the user in Keplr
		)
	},
	_handleError(_, { error, statusPrefix }: { error: Error, statusPrefix: string }): UserActionResponse {
		// eslint-disable-next-line no-console
		const match = error.message.match(/Transaction with ID ([A-Z0-9]+) was submitted but was not yet found on the chain\. You might want to check later\./)
		if (match) {
			return {
				hash: match[1],
				status: `${statusPrefix} IN PROGRESS`,
			}
		}
		// eslint-disable-next-line no-console
		console.error(error)
		if (error.message === "Data is invalid : Unexpected characters") {
			return {
				message: "Unable to execute..\nAre you connected to a hardware wallet like a Ledger Nano? These are not currently supported.",
			}
		}
		return { message: error.message }
	},
} as EcosystemModule["actions"]
