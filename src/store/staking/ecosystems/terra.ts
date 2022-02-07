import type { GetterTree, ActionTree, MutationTree } from "vuex"
import bn from "big.js"
import axios from "axios"

import {
	LCDClient,
	Dec,
	Coin,
	Delegation,
	MsgDelegate,
	MsgUndelegate,
	MsgWithdrawDelegatorReward,
} from "@terra-money/terra.js"
import { RootState } from "~/store"
import {
	EcosystemModule,
	UserActionResponse,
	Account,
	Validator,
} from "~/_types"
import {
	times10toPow,
	divBy10toPow,
} from "~/_utils"

const defaultState = {
	id: "terra",
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
	async setTotalDelegated({ dispatch, commit }, validator: Validator) {
		const client = await dispatch("_getClient", validator) as LCDClient
		const delegations: Delegation[] = []
		let nextKey
		do {
			const [delegationsData, pagination] = await client.staking.delegations(undefined, validator.validatorAddress, {
				"pagination.limit": "100",
				"pagination.key": nextKey,
			})
			delegations.push(...delegationsData)
			nextKey = pagination?.next_key
		}
		while (nextKey)
		const totalDelegated = delegations.reduce((acc, delegation) => acc.add(parseFloat(delegation.balance.toString())), new Dec(0))
		commit("staking/setTotalDelegated", {
			chainId: validator.chainId,
			totalDelegated: divBy10toPow(totalDelegated.toString(), validator.denom.decimals),
		}, { root: true })
	},
	async setAPR({ commit }, validator: Validator) {
		const { data } = await axios.get(`${validator.rpcEndpoint}/v1/dashboard/staking_return`)
		const dailyReturns: { annualizedReturn: string }[] = data
		commit("staking/setAPR", {
			chainId: validator.chainId,
			apr: Number(dailyReturns.pop()?.annualizedReturn) * 100,
		}, { root: true })
	},
	async getBalance({ dispatch }, validator: Validator): Promise<bn> {
		const client = await dispatch("_getClient", validator) as LCDClient
		const account: Account = await dispatch("_getAccount", validator)
		const [balance] = await client.bank.balance(account.address)
		const coin = balance.toArray().find(coin => coin.denom === validator.denom.min)
		return coin !== undefined
			? divBy10toPow(coin.amount.toString(), validator.denom.decimals)
			: bn(0)
	},
	async getDelegated({ dispatch, commit }, validator: Validator) {
		const client = await dispatch("_getClient", validator) as LCDClient
		const account: Account = await dispatch("_getAccount", validator)
		const [delegations] = await client.staking.delegations(account.address)
		const delegation = delegations.find(del => del.validator_address === validator.validatorAddress)
		const userDelegated = delegation
			? divBy10toPow(delegation.balance.amount.toString(), validator.denom.decimals)
			: bn(0)
		commit("staking/userDelegated", { ...validator, userDelegated }, { root: true })
	},
	async getRewards({ dispatch, commit }, validator: Validator) {
		const client = await dispatch("_getClient", validator) as LCDClient
		const account: Account = await dispatch("_getAccount", validator)
		try {
			const { rewards } = await client.distribution.rewards(account.address)
			const validatorRewards = Object.entries(rewards).find(([validatorAddress, _coins]) => validatorAddress === validator.validatorAddress)
			if (!validatorRewards) {
				return bn(0)
			}
			const coins = validatorRewards[1]
			const coin = coins.toArray().find(coin => coin.denom === validator.denom.min)
			const userRewards = coin !== undefined
				? divBy10toPow(coin.amount.toString(), validator.denom.decimals)
				: bn(0)
			commit("staking/userRewards", { ...validator, userRewards }, { root: true })
		}
		catch (e) {
			// user has no delegation
			if (e.message === "Cannot read properties of null (reading 'length')") {
				commit("staking/userRewards", { ...validator, userRewards: bn(0) }, { root: true })
			}
			throw e
		}
	},
	async delegate({ dispatch }, { amount, validator }: {amount: bn, validator: Validator}) {
		try {
			const signer = await dispatch("_getSigner", validator)
			const account: Account = await dispatch("_getAccount", validator)
			const delegate = new MsgDelegate(
				account.address,
				validator.validatorAddress,
				new Coin(validator.denom.min, times10toPow(amount, validator.denom.decimals, true)),
			)
			const response = await signer.post({
				msgs: [delegate],
				memo: `delegating ${validator.denom.symbol} via trustednode.io`,
			})
			return {
				hash: response.result.txhash,
				status: "DELEGATION IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "DELEGATION" })
		}
	},
	async undelegate({ dispatch }, { amount, validator }: {amount: bn, validator: Validator}) {
		try {
			const signer = await dispatch("_getSigner", validator)
			const account: Account = await dispatch("_getAccount", validator)
			const undelegate = new MsgUndelegate(
				account.address,
				validator.validatorAddress,
				new Coin(validator.denom.min, times10toPow(amount, validator.denom.decimals, true)),
			)
			const response = await signer.post({
				msgs: [undelegate],
				memo: `undelegating ${validator.denom.symbol} via trustednode.io`,
			})
			return {
				hash: response.result.txhash,
				status: "UNDELEGATION IN PROGRESS",
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
			const withdrawDelegation = new MsgWithdrawDelegatorReward(
				account.address,
				validator.validatorAddress,
			)
			const response = await signer.post({
				msgs: [withdrawDelegation],
				memo: `claiming ${validator.denom.symbol} rewards via trustednode.io`,
			})
			return {
				hash: response.result.txhash,
				status: "REWARDS CLAIM IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "REWARDS CLAIM" })
		}
	},
	async _getSigner(_, validator: Validator) {
		return await this.dispatch(`staking/wallets/${validator.walletId}/getSigner`)
	},
	_getClient(_, validator: Validator) {
		return new LCDClient({
			URL: validator.rpcEndpoint,
			chainID: validator.chainId,
		})
	},
	_getAccount({ rootGetters }, validator: Validator): Account | undefined {
		const accounts = rootGetters[`staking/wallets/${validator.walletId}/accounts`] as Account[]
		return accounts.find(a => a.chainId === validator.chainId)
	},
	_handleError(_, { error }: { error: Error, statusPrefix: string }): UserActionResponse {
		// eslint-disable-next-line no-console
		console.error(error)
		return { message: error.message }
	},
} as EcosystemModule["actions"]
