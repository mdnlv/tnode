import type { GetterTree, ActionTree, MutationTree } from "vuex"

import BN from "bn.js"
import bn from "big.js"
import { BN_MILLION, BN_ZERO } from "@polkadot/util"
import type { DeriveStakerReward, DeriveStakingQuery } from "@polkadot/api-derive/types"

import {
	EcosystemModule,
	UserActionResponse,
	Account,
	Validator,
} from "~/_types"

import { RootState } from "~/store"
import { times10toPow, divBy10toPow } from "~/_utils"

const defaultState = { id: "polkadot" }

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	...Object.keys(defaultState).reduce((acc, prop) => ({
		...acc,
		[prop]: state => state[prop],
	}), {}),
} as EcosystemModule["getters"]

export const mutations: MutationTree<LocalState> = {}

export const actions: ActionTree<LocalState, RootState> = {
	async setTotalDelegated({ dispatch, commit }, validator: Validator): Promise<void> {
		const client = await dispatch("_getClient", validator)

		const electedInfo = await client.derive.staking.electedInfo({ withController: true, withExposure: true, withPrefs: true, withLedger: true })
		const waitingInfo = await client.derive.staking.waitingInfo({ withController: true, withPrefs: true, withLedger: true })

		const TnodeValidator: DeriveStakingQuery | undefined = [
			...electedInfo.info,
			...waitingInfo.info,
		].find(
			(info: DeriveStakingQuery) => info.accountId.toString().toLowerCase() === validator.address.toLowerCase(),
		)

		commit("staking/setTotalDelegated", {
			chainId: validator.chainId,
			totalDelegated: TnodeValidator
				? divBy10toPow(
					TnodeValidator.exposure.total && !TnodeValidator.exposure.total.unwrap().isZero()
						? TnodeValidator.exposure.total.toString()
						: TnodeValidator.stakingLedger.total?.toString(),
					validator.denom.decimals,
				)
				: null,
		}, { root: true })
	},
	async setAPR({ dispatch, commit }, validator: Validator): Promise<void> {
		const client = await dispatch("_getClient", validator)
		const totalStaked = await dispatch("_getTotalDelegated", validator)

		const { auctionAdjust, auctionMax, falloff, maxInflation, minInflation, stakeTarget } = this.$getInflationParams(client)
		const totalIssuance = await client.query.balances?.totalIssuance()
		const auctionCounter = await client.query.auctions?.auctionCounter()
		const numAuctions = auctionCounter || BN_ZERO

		const stakedFraction = totalStaked.isZero() || totalIssuance.isZero() ? 0 : totalStaked.mul(BN_MILLION).div(totalIssuance).toNumber() / BN_MILLION.toNumber()
		const idealStake = stakeTarget - (Math.min(auctionMax, numAuctions.toNumber()) * auctionAdjust)
		const idealInterest = maxInflation / idealStake
		const inflation = 100 * (minInflation + (
			stakedFraction <= idealStake
				? (stakedFraction * (idealInterest - (minInflation / idealStake)))
				: (((idealInterest * idealStake) - minInflation) * Math.pow(2, (idealStake - stakedFraction) / falloff))
		))

		commit("staking/setAPR", {
			chainId: validator.chainId,
			apr: stakedFraction ? (inflation / stakedFraction) : 0,
		}, { root: true })
	},
	async getBalance({ dispatch }, validator: Validator): Promise<bn> {
		const client = await dispatch("_getClient", validator)
		const account : Account = await dispatch("_getAccount", validator)
		const { data: { free, miscFrozen } } = await client!.query.system.account(account.address)
		const usableBalance: BN = free.sub(miscFrozen)
		return divBy10toPow(usableBalance.toString(), validator.denom.decimals)
	},
	async getDelegated({ dispatch, commit }, validator: Validator) {
		const client = await dispatch("_getClient", validator)
		const account : Account = await dispatch("_getAccount", validator)
		const [bonded] = await client.derive.staking?.accounts([account.address])
		const bondedAmount = bonded.stakingLedger?.active?.unwrap() || null

		const userDelegated = bondedAmount
			? divBy10toPow(bondedAmount.toString(), validator.denom.decimals)
			: bn(0)
		commit("staking/userDelegated", { ...validator, userDelegated }, { root: true })
	},
	async getRewards({ dispatch, commit }, validator: Validator) {
		const client = await dispatch("_getClient", validator)
		const account : Account = await dispatch("_getAccount", validator)

		const allEras = await client.derive.staking?.erasHistoric()
		const [bonded] = await client.derive.staking?.accounts([account.address])
		const rewardEras = allEras
			.filter(era => !bonded.stakingLedger.claimedRewards.includes(era))
			.slice(1)
		const [stakerRewards] : [DeriveStakerReward[]] = await client.derive.staking?.stakerRewardsMultiEras([account.address], rewardEras)

		if (!stakerRewards) {
			return null
		}
		const rewardTotal: BN = stakerRewards
			.filter(reward => !reward.eraReward.isZero())
			.reduce((result: BN, reward) =>
				Object.values(reward.validators,
				).reduce((result: BN, { value }) => result.iadd(value), result)
			, new BN(0),
			)

		const userRewards = divBy10toPow(rewardTotal.toString(), validator.denom.decimals)
		commit("staking/userRewards", { ...validator, userRewards }, { root: true })
	},
	async getDelegations(_) {
		return await null
	},
	async delegate({ dispatch }, { amount, validator }: {amount: number, validator: Validator}) {
		try {
			const account : Account = await dispatch("_getAccount", validator)
			const injector = await this.$polkadotJsExtension.web3FromAddress(account.address)
			const client = await dispatch("_getClient", validator)
			const [bonded] = await client.derive.staking?.accounts([account.address])
			const bondedAmount: number | undefined = bonded.stakingLedger?.active?.unwrap().toNumber()
			const unlockingAmount: number | undefined = bonded.stakingLedger?.unlocking[0]?.get("value").unwrap().toNumber()
			const isChilled = (!!bondedAmount || !!unlockingAmount) && !bonded.nominators.length // User has bonded funds but is not nominating
			const isBondingAndNominating = !!bondedAmount && !!bonded.nominators.length
			const isNotBondedAndNotNominating = !bondedAmount && !bonded.nominators.length && !unlockingAmount
			const uAmount = new BN(times10toPow(amount, validator.denom.decimals, true))
			if (isChilled) {
				const bondExtraTx = client.tx.staking.bondExtra(uAmount)
				const nominatorTx = client.tx.staking.nominate([validator.address])
				const Txs = [bondExtraTx, nominatorTx]
				// eslint-disable-next-line promise/param-names
				const TxHash = await new Promise((resolve, _reject) => {
					client.tx.utility
						.batchAll(Txs)
						.signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
							if (status.isInBlock) { resolve(status.asInBlock.toString()) }
						})
				})
				return {
					hash: TxHash,
					status: "DELEGATION IN PROGRESS",
				}
			}

			if (isNotBondedAndNotNominating) {
				const bondTx = client.tx.staking.bond(account.address, uAmount, "Stash")
				const nominatorTx = client.tx.staking.nominate([validator.address])
				const Txs = [bondTx, nominatorTx]
				// eslint-disable-next-line promise/param-names
				const TxHash = await new Promise((resolve, _reject) => {
					client.tx.utility
						.batchAll(Txs)
						.signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
							if (status.isInBlock) { resolve(status.asInBlock.toString()) }
						})
				})
				return {
					hash: TxHash,
					status: "DELEGATION IN PROGRESS",
				}
			}

			if (isBondingAndNominating) {
				// eslint-disable-next-line promise/param-names
				const TxHash = await new Promise((resolve, _reject) => {
					client.tx.staking.bondExtra(uAmount)
						.signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
							if (status.isInBlock) { resolve(status.asInBlock.toString()) }
						})
				})
				return {
					hash: TxHash,
					status: "DELEGATION IN PROGRESS",
				}
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "DELEGATION" })
		}
	},
	async undelegate({ dispatch }, { amount, validator }: {amount: number, validator: Validator}) {
		try {
			const account = await dispatch("_getAccount", validator)
			const injector = await this.$polkadotJsExtension.web3FromAddress(account.address)
			const client = await dispatch("_getClient", validator)

			const uAmount = new BN(times10toPow(amount, validator.denom.decimals).toString())
			const unbondTx = await client.tx.staking.unbond(uAmount)
			const Txs = [unbondTx]
			// eslint-disable-next-line promise/param-names
			const TxHash = await new Promise((resolve, _reject) => {
				client.tx.utility
					.batchAll(Txs)
					.signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
						if (status.isInBlock) { resolve(status.asInBlock.toString()) }
					})
			})
			return {
				hash: TxHash,
				status: "UNDELEGATION IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "UNDELEGATION" })
		}
	},
	async claimRewards({ dispatch, getters }, validator: Validator) {
		try {
			await dispatch("getRewards", validator)
			const userRewards = getters["staking/userRewards"](validator)
			if (!userRewards) {
				return {
					message: "No rewards available",
				}
			}
			const account = await dispatch("_getAccount", validator)
			const client = await dispatch("_getClient", validator)
			const injector = await this.$polkadotJsExtension.web3FromAddress(account.address)
			const allEras = await client.derive.staking?.erasHistoric()
			const [bonded] = await client.derive.staking?.accounts([account.address])
			const rewardTxs = allEras
				.filter(era => !bonded.stakingLedger.claimedRewards.includes(era))
				.slice(1)
				.map(era => client!.tx.staking.payoutStakers(validator.address, era))

			// eslint-disable-next-line promise/param-names
			const TxHash = await new Promise((resolve, _reject) => {
				client.tx.utility
					.batch(rewardTxs)
					.signAndSend(account.address, { signer: injector.signer }, ({ status }) => {
						if (status.isInBlock) { resolve(status.isInBlock.toString()) }
					})
			})

			return {
				hash: TxHash,
				status: "REWARDS CLAIM IN PROGRESS",
			}
		}
		catch (error) {
			return dispatch("_handleError", { error, statusPrefix: "REWARDS CLAIM" })
		}
	},
	async redelegate() {
		return await { message: "not implemented" }
	},
	async _getTotalDelegated({ dispatch }, validator: Validator): Promise<BN | null> {
		const client = await dispatch("_getClient", validator)
		const emptyExposure = await client.createType("Exposure")
		const withLedger = false
		const DEFAULT_FLAGS_ELECTED = { withController: true, withExposure: true, withPrefs: true }
		const electedInfo = await client.derive.staking.electedInfo({ ...DEFAULT_FLAGS_ELECTED, withLedger })

		return electedInfo.info.map(({ exposure = emptyExposure, stakingLedger }) => {
			let bondTotal = exposure.total ? exposure.total.unwrap() : BN_ZERO
			if (bondTotal.isZero()) {
				bondTotal = stakingLedger.total?.unwrap() || BN_ZERO
			}
			return { bondTotal, isActive: !bondTotal.isZero() }
		}).filter(({ isActive }) => isActive)
			.map(({ bondTotal }) => bondTotal)
			.reduce((total: BN, value : BN) => total.iadd(value), new BN(0))
	},
	async _getClient(_, validator: Validator) {
		const wsProvider = new this.$polkadotAPI.WsProvider(validator.rpcEndpoint)
		const client = await this.$polkadotAPI.ApiPromise.create({ provider: wsProvider })
		await this.$polkadotJsExtension.web3Enable("Trusted Node")
		return client
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
