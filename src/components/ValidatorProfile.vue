<template lang="pug">
	#validator(:class="{ active }")
		#header.flex-wrap
			#name.flex.space-items-horz
				img.icon(:src="validator.denom.icon")
				div
					h2 {{ validator.chainName }}
					h5.denom.label {{ validator.denom.symbol }}
				a.hover-opacity(href="https://trustednode.medium.com/1-million-tnode-airdrop-alert-f44310d7818" target="_blank")
					img.small(v-if="validator.promotion" src="~/assets/img/tiger-node.png")
			#menu-toggle.mobile.cursor-pointer(type="button" @click="toggleActive" v-html="menuIcon")
		#contents.grow(:class="{ active }")
			.css-grid
				.field.flex-column#delegated
					//.label.small AMOUNT DELEGATED
					//.flex
					//	LoadingValue(:value="validator.totalDelegated" #default="{ value }")
					//		span {{ value | floorToDP(0) }}&nbsp;
					//	span {{ validator.denom.symbol }}
					.label.small AMOUNT DELEGATED
					.flex
						LoadingValue(:value="userDelegated", :loading="loadingPersonalInfo" #default="{ value }")
							span {{ value | floorToDP(6) }}
						span &nbsp;{{ validator.denom.symbol }}
				.field.flex-column#staked
					.label.small YOUR REWARDS
					.flex
						LoadingValue(:value="userRewards", :loading="loadingPersonalInfo" #default="{ value }")
							span {{ value | floorToDP(6) }}
						span &nbsp;{{ validator.denom.symbol }}
				.field.flex#claimrewards
					.button.bare.flex.space-items-horz.no-padding(@click="!!account && openModal('claimRewards')")
						.img-outer.inline-middle(v-html="!!account ? claimIcon : claimGrayIcon")
						span(v-if="!!account") CLAIM REWARDS
						span.disable(v-else) CLAIM REWARDS
				.field.flex#k
					.button.bare.flex.space-items-horz.no-padding(v-if="!account" @click="connectWallet") CONNECT WALLET
					.account.flex.space-items-horz(v-else)
						img.icon(:src="wallet.icon")
						p {{ account.address | accountAddress }}

				.field.flex#discon(v-if="account")
					.button.bare.flex.space-items-horz.no-padding
						div(v-html="disconIcon")
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"

import { max, toLink } from "~/_utils"
import { Validator, Account, Delegation } from "~/_types"
import LoadingValue from "~/components/LoadingValue.vue"
import Modal from "~/components/Modal.vue"
import MaxInput from "~/components/MaxInput.vue"
import StakeRow from "~/components/common/StakeRow.vue"

type TransactionType = "delegate" | "undelegate" | "claimRewards" | "redelegate"

export default Vue.extend({
	components: {
		LoadingValue,
		Modal,
		MaxInput,
		StakeRow,
	},
	filters: {
		realValue(amount: bn | null, price: bn | null) {
			return amount === null || price === null
				? null
				: amount.times(price)
		},
	},
	props: {
		validator: {
			type: Object as Vue.PropType<Validator>,
			required: true,
		},
	},
	data() {
		return {
			crossIcon: require("~/assets/svg/ui/cross.svg?raw"),
			disconIcon: require("~/assets/svg/discon.svg?raw"),
			claimIcon: require("~/assets/svg/claim_rewards.svg?raw"),
			claimGrayIcon: require("~/assets/svg/claim_gray.svg?raw"),
			kIcon: require("~/assets/svg/k.svg?raw"),
			optionsIcon: require("~/assets/svg/ui/options.svg?raw"),
			actionIcon: {
				delegate: require("~/assets/svg/ui/delegate-icon.svg?raw"),
				undelegate: require("~/assets/svg/ui/undelegate-icon.svg?raw"),
				claimRewards: require("~/assets/svg/ui/claimRewards-icon.svg?raw"),
			},
			arrowRightIcon: require("~/assets/svg/ui/arrow-right.svg?raw"),
			linkIcon: require("~/assets/svg/ui/link.svg?raw"),
			infoIcon: require("~/assets/svg/ui/info-icon.svg?raw"),
			refreshIcon: require("~/assets/svg/ui/refresh.svg?raw"),
			active: false,
			modalLoaded: false,
			statusMessage: null as string | null,
			amount: null as string | null,
			balance: null as bn | null,
			delegations: [] as Delegation[],
			srcDelegation: null as Delegation | null,
			usingMax: false,
			claimingRewards: false,
			transactionType: "delegate" as TransactionType | null,
			transactionAmount: null as string | null,
			transactionHash: null as string | null,
			transactionStatus: null as "success" | "pending" | null,
			walletInstalled: false,
			userDelegatedSetter: null as null | NodeJS.Timer,
			userRewardsSetter: null as null | NodeJS.Timer,
		}
	},
	computed: {
		menuIcon() {
			return this.$data.active ? this.$data.crossIcon : this.$data.optionsIcon
		},
		loaded(): boolean {
			return this.$store.getters.loaded
		},
		account(): Account | undefined {
			const accounts = this.$store.getters[
				this.walletModuleName("accounts")
			] as Account[]
			return accounts.find(a => a.chainId === this.validator.chainId)
		},
		wallet(): any {
			return this.$store.getters[
				this.walletModuleName("wallet")
			]
		},
		connectingWalletError() {
			return this.$store.getters["staking/connectingWalletError"]
		},
		transactionTitle(): string {
			if (!this.transactionType) {
				return ""
			}
			return {
				delegate: `Stake ${this.validator.denom.symbol}`,
				redelegate: `Restake ${this.validator.denom.symbol}`,
				undelegate: `Unstake ${this.validator.denom.symbol}`,
				claimRewards: `Claim ${this.validator.denom.symbol} rewards`,
			}[this.transactionType]
		},
		userDelegated(): bn | null {
			return this.$store.getters["staking/userDelegated"](this.validator)
		},
		loadingPersonalInfo(): boolean {
			return this.$store.getters["staking/loadingPersonalInfo"](this.validator)
		},
		userRewards(): bn | null {
			return this.$store.getters["staking/userRewards"](this.validator)
		},
		totalDelegation(): bn {
			if (this.delegations && this.delegations.length > 0) {
				return this.delegations.reduce((acc, del) =>
					del.amount.add(acc)
				, bn(0))
			}
			return bn(0)
		},
	},
	watch: {
		async account(val, oldVal) {
			if (val?.address === oldVal?.address) {
				return
			}
			await this.loadPersonalInfo()
		},
		amount() {
			this.usingMax = false
		},
		userDelegated(newVal) {
			if (newVal !== null && bn(newVal).eq(0)) {
				if (this.userRewardsSetter !== null) {
					clearInterval(this.userRewardsSetter)
				}
				if (this.userDelegatedSetter !== null) {
					clearInterval(this.userDelegatedSetter)
				}
				return
			}
			this.monitorRewards()
		},
	},
	async mounted() {
		if (!this.account) {
			return
		}
		await this.loadPersonalInfo()
	},
	destroyed() {
		if (this.userDelegatedSetter !== null) {
			clearInterval(this.userDelegatedSetter)
		}
		if (this.userRewardsSetter !== null) {
			clearInterval(this.userRewardsSetter)
		}
	},
	methods: {
		toLink,
		async loadPersonalInfo() {
			try {
				this.$store.commit("staking/loadingPersonalInfo", { chainId: this.validator.chainId, loadingPersonalInfo: true })
				await this.$store.dispatch(
					`staking/ecosystems/${this.validator.ecosystemId}/getRewards`,
					this.validator,
				)
				await this.$store.dispatch(
					`staking/ecosystems/${this.validator.ecosystemId}/getDelegated`,
					this.validator,
				)
			}
			catch (e) {
				this.handleError(e)
			}
			finally {
				this.$store.commit("staking/loadingPersonalInfo", { chainId: this.validator.chainId, loadingPersonalInfo: false })
			}
		},
		toggleActive() {
			this.active = !this.active
		},
		walletModuleName(route: string): string {
			return `staking/wallets/${this.validator.walletId}/${route}`
		},
		async connectWallet() {
			this.$modal.show("connecting-staking-wallet")
			this.$store.commit("staking/connectingWalletId", this.wallet.id)
			await this.$store.dispatch(
				this.walletModuleName("getAccount"),
				this.validator.chainId,
			)
			this.walletInstalled = await this.$store.dispatch(
				this.walletModuleName("installed"),
			)
			if (this.walletInstalled && !this.connectingWalletError) {
				this.$modal.hide("connecting-staking-wallet")
			}
		},

		async openModal(type: TransactionType) {
			this.modalLoaded = false
			await this.connectWallet()
			if (!this.account) {
				return
			}
			this.usingMax = false
			this.statusMessage = null
			this.amount = null
			if (type !== "claimRewards") {
				this.$modal.show(`${type}-${this.validator.chainId}`)
			}

			try {
				switch (type) {
					case "delegate": {
						this.$modal.hide(`redelegate-${this.validator.chainId}`)
						this.balance = await this.$store.dispatch(`staking/ecosystems/${this.validator.ecosystemId}/getBalance`, this.validator) as bn
						this.delegations = await this.$store.dispatch(`staking/ecosystems/${this.validator.ecosystemId}/getDelegations`, this.validator) as Delegation[]
						break
					}
					case "undelegate": {
						this.$store.commit("staking/loadingPersonalInfo", { chainId: this.validator.chainId, loadingPersonalInfo: true })
						this.$store.commit("staking/userDelegated", { chainId: this.validator.chainId, userDelegated: null })
						await this.$store.dispatch(`staking/ecosystems/${this.validator.ecosystemId}/getDelegated`, this.validator)
						break
					}
					case "claimRewards": {
						this.claimingRewards = true
						await this.$store.dispatch(`staking/ecosystems/${this.validator.ecosystemId}/getRewards`, this.validator)
						const userRewards = this.$store.getters["staking/userRewards"](this.validator)
						this.amount = userRewards !== null
							? userRewards.toString()
							: null
						await this.claimRewards()
						break
					}
					case "redelegate": {
						this.srcDelegation = null
						this.$modal.hide(`delegate-${this.validator.chainId}`)
						break
					}
				}
			}
			catch (e) {
				this.handleError(e)
			}
			finally {
				this.$store.commit("staking/loadingPersonalInfo", { chainId: this.validator.chainId, loadingPersonalInfo: false })
			}
			this.modalLoaded = true
		},
		async setMaxWithoutFee() {
			const withoutFee = bn(this.balance ?? 0).minus(this.validator.transactionFee)
			this.amount = max(withoutFee, 0).toString()
			await this.$nextTick
			this.usingMax = true
		},
		validate(input: string | null, minAmount?: number | null) {
			if (input === null) {
				this.statusMessage = "please enter a valid amount"
				return false
			}
			const number = Number(input)
			if (isNaN(number) || number === 0) {
				this.statusMessage = "please enter a valid amount"
				return false
			}
			const symbol = this.validator.denom.symbol
			if (minAmount && bn(number).lt(minAmount)) {
				this.statusMessage = `please stake at least ${minAmount} ${symbol}`
				return false
			}
			this.statusMessage = null
			return true
		},
		async delegate() {
			const minAmount = this.validator.minimumStakingAmount
			if (!this.validate(this.amount, minAmount) || this.amount === null) {
				return
			}
			if (this.balance !== null) {
				if (this.balance.lt(this.amount)) {
					this.statusMessage = "insufficient funds"
					return
				}
			}
			else {
				this.statusMessage = "no balance"
				return
			}
			this.statusMessage = "staking..."
			const response = await this.$store.dispatch(
				`staking/ecosystems/${this.validator.ecosystemId}/delegate`,
				{
					amount: this.amount,
					validator: this.validator,
				},
			)
			this.handleResponse("delegate", response)
			this.monitorDelegation()
		},
		async redelegate() {
			if (!this.validate(this.amount) || this.amount === null || this.srcDelegation === null) {
				return
			}
			if (this.balance !== null) {
				if (this.srcDelegation!.amount.lt(this.amount)) {
					this.statusMessage = "insufficient delegation"
					return
				}
			}
			else {
				this.statusMessage = "no balance for fees"
				return
			}
			this.statusMessage = "restaking..."
			const response = await this.$store.dispatch(
				`staking/ecosystems/${this.validator.ecosystemId}/redelegate`,
				{
					amount: this.amount,
					validator: this.validator,
					delegation: this.srcDelegation,
				},
			)
			this.handleResponse("redelegate", response)
		},
		async undelegate() {
			if (!this.validate(this.amount) || this.amount === null) {
				return
			}
			if (bn(this.userDelegated || 0).lt(this.amount)) {
				this.statusMessage = "insufficient funds"
				return
			}
			this.statusMessage = "unstaking..."
			const response = await this.$store.dispatch(
				`staking/ecosystems/${this.validator.ecosystemId}/undelegate`,
				{
					amount: this.amount,
					validator: this.validator,
				},
			)
			this.handleResponse("undelegate", response)
			this.monitorDelegation()
		},
		async claimRewards() {
			this.statusMessage = "claiming rewards..."
			const response = await this.$store.dispatch(
				`staking/ecosystems/${this.validator.ecosystemId}/claimRewards`,
				this.validator,
			)
			this.claimingRewards = false
			this.handleResponse("claimRewards", response)
		},
		handleError(error: Error) {
			this.statusMessage = error.message
			if (error.message === "Data is invalid : Unexpected characters") {
				this.statusMessage
						= "Unable to execute..\nAre you connected to a hardware wallet like a Ledger Nano? These are not currently supported."
			}
			else if (
				error.message
						=== "Query failed with (18): delegation does not exist: invalid request"
			) {
				this.statusMessage = null
				this.$store.commit("staking/userRewards", { chainId: this.validator.chainId, userRewards: null })
				return
			}
			// eslint-disable-next-line no-console
			console.error(error)
			// eslint-disable-next-line no-console
			console.error({ message: error.message })
		},
		handleResponse(type: TransactionType, response) {
			// eslint-disable-next-line no-console
			console.log({ response })
			const { message, hash, status } = response
			if (message) {
				this.$modal.show(`${type}-${this.validator.chainId}`)
				this.statusMessage = message
			}
			else if (hash && status) {
				this.$modal.hide(`${type}-${this.validator.chainId}`)
				this.transactionType = type
				this.transactionAmount = this.amount
				this.transactionHash = hash
				this.transactionStatus = status
				this.$modal.show(`transaction-${this.validator.chainId}`)
			}
		},
		transactionClosed() {
			this.transactionType = null
			this.transactionAmount = null
			this.transactionHash = null
			this.transactionStatus = null
		},
		closeTransactionModal() {
			this.$modal.hide(`transaction-${this.validator.chainId}`)
		},
		monitorDelegation() {
			if (this.userDelegatedSetter !== null) {
				clearInterval(this.userDelegatedSetter)
			}
			this.userDelegatedSetter = setInterval(
				() => this.setUserDelegated(),
				5 * 1000,
			)
		},
		async setUserDelegated() {
			await this.$store.dispatch(`staking/ecosystems/${this.validator.ecosystemId}/getDelegated`, this.validator)
		},
		monitorRewards() {
			if (this.userRewardsSetter !== null) {
				clearInterval(this.userRewardsSetter)
			}
			this.userRewardsSetter = setInterval(
				() => this.setUserRewards(),
				5 * 1000,
			)
		},
		async setUserRewards() {
			await this.$store.dispatch(`staking/ecosystems/${this.validator.ecosystemId}/getRewards`, this.validator)
		},
	},
})
</script>

<style lang="sass" scoped>
.tnode-ui >>> .flex
	display: flex
	align-items: center
@mixin closeOnActive
	overflow: hidden
	@include transition(max-height)
	max-height: $unit10
	&.active
		max-height: 0
@mixin openOnActive
	overflow: hidden
	@include transition(max-height)
	max-height: $unit10
	&:not(.active)
		max-height: 0

#validator
	@media (min-width: $breakpoint-mobile-upper)
		display: table-row
		> *
			display: table-cell
			vertical-align: middle
	#header
		background: $bg-1
		padding: $space
		padding-left: $space-medium
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-right-radius: 0
			border-bottom-right-radius: 0
			#name
				@media (max-width: $breakpoint-tablet)
					margin-bottom: $space-big
			#apr
				margin-left: $space
				a
					@include hover-scale-opacity
					img.small
						transform: scale(0.8)
		@media (max-width: $breakpoint-mobile)
			border-bottom-left-radius: 0
			border-bottom-right-radius: 0
			display: flex
			justify-content: space-between
			align-items: center
		#menu-toggle
			width: $unit3
			text-align: center
			@include hover-opacity
	#contents
		background: $bg
		padding: $space
		padding-right: $space-medium
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-left-radius: 0
			border-bottom-left-radius: 0
			width: 99%
		@media (max-width: $breakpoint-mobile)
			border-top-left-radius: 0
			border-top-right-radius: 0
		.css-grid
			.field
				display: flex
				justify-content: center
				@media (max-width: $breakpoint-tablet)
					justify-content: flex-start
					padding-top: $unit1
			> *:last-child
				text-align: center
				@media (max-width: $breakpoint-tablet)
					text-align: left
			display: grid
			button
				background: $bg
			#delegated
				grid-area: delegated
			#staked
				grid-area: staked
			#claimrewards
				grid-area: claimrewards
				.disable
					color: #3f505a
			#k
				grid-area: k
			#discon
				grid-area: discon
			grid-template-columns: auto auto auto auto auto
			grid-template-areas: "delegated staked claimrewards k discon"
			@media (max-width: $breakpoint-tablet)
				grid-template-columns: auto auto $unit15
				grid-template-areas: "delegated staked claimrewards" "k discon wallet"
			@media (max-width: $breakpoint-mobile)
				grid-template-columns: auto auto
				grid-template-areas: "delegated staked" "claimrewards k" "discon wallet"
	@media (max-width: $breakpoint-tablet)
		.label
			font-size: $unit-2
			letter-spacing: 0
	.wrap
		word-wrap: break-word
	.explorer-link
		padding: $unit-9
		display: inline-block
		transform: translateY(5%)
		@include hover-opacity
		/deep/
			svg
				width: $unit1!important
				height: $unit1!important
				path
					fill: $fg2!important
	img.icon
		max-width: unset // weird css thing, table doesn't size properly without it

	/deep/
		#claim-rewards-error
			height: 100%
			padding-bottom: $unit6
		.form
			#alert
				color: $fg3
				align-items: flex-start
				a
					@include hover-opacity
					text-decoration: underline
		.redelegation-form
			background-color: $bg2
			margin-left: -$space-big
			margin-right: -$space-big
			padding: $unit1 $space-big
		.buttons
			display: flex
			justify-content: flex-end
			align-items: center
			text-align: right
			p.status-message
				white-space: pre-line
				margin-right: $unit5
				text-align: left

</style>
