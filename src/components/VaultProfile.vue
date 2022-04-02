<template lang="pug">
	.vault
		.header.flex
			.title.flex
				.image
					template(v-if="vault.icon")
						.icon(v-html="vault.icon")
					template(v-else)
						.icon
							img.small(:src="vault.stakeDenom.icon")
					img.small(:src="vault.rewardDenom.icon")
				h4 {{ name[0] }}
					br
					span.secondary {{ name[1] }}
		.contents.grow
			.css-grid
				.field.flex-column#total-delegated
					.label.small AMOUNT STAKED
					.flex
						LoadingValue(:value="vault.userStaked" #default="{ value }" size="medium", :loading="userStakedLoading !== null ? userStakedLoading : !vault.userStaked")
							span.number {{ value | floorToDPorE(1) }}&nbsp;
						span {{ vault.stakeDenom.symbol }}
				.field.flex-column#staked
					.label.small YOUR REWARDS
					.flex
						LoadingValue(:value="vault.userRewards" #default="{ value }" size="medium")
							span.number {{ value | floorToDPorE(1) }}&nbsp;
						span {{ vault.rewardDenom.symbol }}
				.field.flex#claimrewards
					ClaimRewards(active @click="openModal('claimRewards')")
				.field.flex#k
					ConnectedWallet(no-copy)
				.field.flex#discon
					.button.bare.flex.space-items-horz.no-padding
						div(v-html="disconIcon")
		VaultModals(
			:loaded="loaded"
			:modalLoaded="modalLoaded"
			:vault="vault"
			:openModal="openModal"
			:stake="stake"
			:transactionHash="transactionHash"
			:txLinkTemplate="txLinkTemplate"
			:transactionStatus="transactionStatus"
			:transactionTitle="transactionTitle"
			:closeTransactionModal="closeTransactionModal"
			:statusMessage="statusMessage"
			:unstake="unstake"
			:amount="amount"
			:transactionType="transactionType"
			:transactionAmount="transactionAmount"
		)
		AddLiquidityModal(
			v-if="loaded && vault.stakeDenom.denoms"
			:vault="vault"
			@response="handleResponse('addLiquidity', $event.response, $event.amounts)"
			ref="addLiquidityModal"
		)
</template>

<script lang="ts">
import Vue from "vue"
import { differenceInSeconds } from "date-fns"
import cn from "comma-number"
import bn from "big.js"
import { isEqual } from "lodash"
import { Vault, EVMAccount, Network, DropdownOption } from "~/_types"
import { toLink } from "~/_utils"
import LoadingValue from "~/components/LoadingValue.vue"
import MaxInput from "~/components/MaxInput.vue"
import StatusMessage from "~/components/StatusMessage.vue"
import AddLiquidityModal from "~/components/AddLiquidityModal.vue"
import VaultModals from "~/components/VaultModals.vue"
import ConnectedWallet from "~/components/common/ConnectedWallet.vue"
import ClaimRewards from "~/components/common/ClaimRewards.vue"

type TransactionType = "stake" | "unstake" | "claimRewards" | "addLiquidity"
type CountdownUnit = {
	unit: "DAYS" | "HRS" | "MIN"
	value: number
}

export default Vue.extend({
	components: {
		LoadingValue,
		MaxInput,
		StatusMessage,
		AddLiquidityModal,
		ConnectedWallet,
		ClaimRewards,
		VaultModals,
	},
	filters: {
		renderProperty(property: Vault["properties"][number], vault: Vault) {
			const { type, value } = property
			return {
				limit: `Limited to ${cn(value)} ${vault.stakeDenom.symbol}`,
				reset: `Resets every ${value} days`,
				maxRewards: `Max. Rewards: ${cn(value)} ${vault.rewardDenom.symbol}`,
				lockup: `${value} days lockup`,
				compounding: "Monthly compounded APY",
			}[type]
		},
	},
	props: {
		vault: {
			type: Object as Vue.PropType<Vault>,
			required: true,
		},
		networks: {
			type: Array as Vue.PropType<DropdownOption[]>,
			required: true,
		},
	},
	data() {
		return {
			disconIcon: require("~/assets/svg/discon.svg?raw"),
			arrowRightIcon: require("~/assets/svg/ui/arrow-right.svg?raw"),
			linkIcon: require("~/assets/svg/ui/link.svg?raw"),
			auditIcon: require("~/assets/svg/ui/audit.svg?raw"),
			timeUntilClose: null as CountdownUnit[] | null,
			timeUntilCloseSetter: null as null | NodeJS.Timer,
			aprSetter: null as null | NodeJS.Timer,
			tvlSetter: null as null | NodeJS.Timer,
			balanceSetter: null as null | NodeJS.Timer,
			stakedSetter: null as null | NodeJS.Timer,
			userStakedLoading: null as boolean | null,
			rewardsSetter: null as null | NodeJS.Timer,
			modalLoaded: false,
			provider: null as any | null,
			amount: "" as string,
			claimingRewards: false,
			statusMessage: "" as string,
			transactionType: "stake" as TransactionType | null,
			transactionAmount: null as string | string[] | null,
			transactionHash: "" as string,
			transactionStatus: "" as "success" | "pending",
		}
	},
	computed: {
		loaded(): boolean {
			return this.$store.getters.loaded
		},
		name(): string[] {
			return this.vault.name.split("\n")
		},
		network(): DropdownOption {
			return this.networks.find(n => n.value === this.vault.networkName)!
		},
		wallet(): any {
			return this.$store.getters[
				this.walletModuleName("wallet")
			]
		},
		account(): EVMAccount | null {
			return this.$store.getters[this.walletModuleName("account")] as EVMAccount
		},
		tvl(): bn | null {
			if (this.vault.tvl === null) {
				return null
			}
			return this.vault.stakeDenom.price
				? this.vault.tvl.times(this.vault.stakeDenom.price)
				: null
		},
		prices(): (bn | null)[] {
			return [
				this.vault.stakeDenom.price,
				this.vault.rewardDenom.price,
			]
		},
		transactionTitle(): string {
			if (!this.transactionType) {
				return ""
			}
			return {
				stake: `Stake ${this.vault.stakeDenom.symbol}`,
				unstake: `Unstake ${this.vault.stakeDenom.symbol}`,
				claimRewards: `Claim ${this.vault.rewardDenom.symbol} rewards`,
				addLiquidity: "Add Liquidity",
			}[this.transactionType]
		},
		transactionDenom(): string | string[] {
			if (!this.transactionType) {
				return ""
			}
			return {
				stake: this.vault.stakeDenom.symbol,
				unstake: this.vault.stakeDenom.symbol,
				claimRewards: this.vault.rewardDenom.symbol,
				addLiquidity: "denoms" in this.vault.stakeDenom ? this.vault.stakeDenom.denoms.map(d => d.symbol) : [],
			}[this.transactionType]
		},
		txLinkTemplate(): string {
			const networks = this.$store.getters["networks/all"] as Network[]
			const network = networks.find(n => n.chainName === this.vault.networkName)
			return network!.txLinkTemplate
		},
	},
	watch: {
		account: {
			async handler(account: EVMAccount | null) {
				if (!account) {
					return
				}
				await this.$store.dispatch("vaults/setStaked", this.vault)
				await this.$store.dispatch("vaults/setRewards", this.vault)
			},
			immediate: true,
		},
		"vault.closesAt"() {
			this.setTimeUntilClose()
		},
		"vault.userStaked"(newVal, oldVal) {
			if (!newVal || bn(newVal).eq(0)) {
				if (this.rewardsSetter !== null) {
					clearInterval(this.rewardsSetter)
				}
				if (this.stakedSetter !== null) {
					clearInterval(this.stakedSetter)
				}
				return
			}
			if (newVal !== null && oldVal !== null && !bn(newVal).eq(oldVal)) {
				this.userStakedLoading = null
				if (this.stakedSetter !== null) {
					clearInterval(this.stakedSetter)
				}
			}
			this.monitorRewards()
		},
		"vault.userBalance"(newVal, oldVal) {
			if (newVal !== null && oldVal !== null && !bn(newVal).eq(oldVal)) {
				if (this.balanceSetter !== null) {
					clearInterval(this.balanceSetter)
				}
			}
		},
		prices(newVal, oldVal) {
			if (isEqual(newVal, oldVal)) {
				return
			}
			this.$store.dispatch("vaults/setAPR", this.vault)
			this.$store.dispatch("vaults/setTVL", this.vault)
		},
	},
	mounted() {
		this.setClosesAt()
		this.setAPR()
		this.setTVL()
		this.setTimeUntilClose()
		this.timeUntilCloseSetter = setInterval(
			() => this.setTimeUntilClose(),
			60 * 1000,
		)
		this.aprSetter = setInterval(
			() => this.setAPR(),
			10 * 1000,
		)
		this.tvlSetter = setInterval(
			() => this.setTVL(),
			30 * 1000,
		)
	},
	destroyed() {
		if (this.timeUntilCloseSetter !== null) {
			clearInterval(this.timeUntilCloseSetter)
		}
		if (this.aprSetter !== null) {
			clearInterval(this.aprSetter)
		}
		if (this.tvlSetter !== null) {
			clearInterval(this.tvlSetter)
		}
		if (this.stakedSetter !== null) {
			clearInterval(this.stakedSetter)
		}
		if (this.rewardsSetter !== null) {
			clearInterval(this.rewardsSetter)
		}
		if (this.balanceSetter !== null) {
			clearInterval(this.balanceSetter)
		}
	},
	methods: {
		toLink,
		async setClosesAt() {
			await this.$store.dispatch("vaults/setClosesAt", this.vault)
		},
		async setAPR() {
			await this.$store.dispatch("vaults/setAPR", this.vault)
		},
		async setTVL() {
			await this.$store.dispatch("vaults/setTVL", this.vault)
		},
		setTimeUntilClose() {
			if (this.vault.closesAt === null) {
				return
			}
			const diff = differenceInSeconds(this.vault.closesAt!, new Date())
			if (diff < 0) {
				this.timeUntilClose = []
				return
			}
			const minute = 60
			const hour = minute * 60
			const day = hour * 24
			const week = day * 7
			const unitOrEmpty = (diff: number, value: number, unit: CountdownUnit["unit"]): CountdownUnit => ({
				unit,
				value: Math.floor(diff / value),
			})
			this.timeUntilClose = [
				unitOrEmpty(diff % week, day, "DAYS"),
				unitOrEmpty(diff % day, hour, "HRS"),
				unitOrEmpty(diff % hour, minute, "MIN"),
			]
		},
		walletModuleName(route: string): string {
			return `web3/${route}`
		},
		async connectWallet() {
			await this.$store.dispatch("web3/connectWallet", this)
		},
		async setStaked() {
			await this.$store.dispatch("vaults/setStaked", this.vault)
		},
		monitorStake() {
			if (this.stakedSetter !== null) {
				clearInterval(this.stakedSetter)
			}
			this.stakedSetter = setInterval(
				() => this.setStaked(),
				5 * 1000,
			)
		},
		async getRewards() {
			await this.$store.dispatch("vaults/setRewards", this.vault)
		},
		monitorRewards() {
			if (this.rewardsSetter !== null) {
				clearInterval(this.rewardsSetter)
			}
			this.rewardsSetter = setInterval(
				() => this.getRewards(),
				5 * 1000,
			)
		},
		monitorBalance() {
			if (this.balanceSetter !== null) {
				clearInterval(this.balanceSetter)
			}
			this.balanceSetter = setInterval(
				() => this.setBalance(),
				5 * 1000,
			)
		},
		async setBalance() {
			await this.$store.dispatch("vaults/setBalance", this.vault)
		},
		async openModal(type: TransactionType) {
			if (!this.account) {
				await this.connectWallet()
			}
			if (!this.account) {
				return
			}
			this.modalLoaded = false
			this.statusMessage = ""
			this.amount = ""
			if (type !== "claimRewards") {
				this.$modal.show(`${type}-${this.vault.address}`)
			}

			try {
				switch (type) {
					case "stake": {
						await this.setBalance()
						break
					}
					case "unstake": {
						await this.setStaked()
						break
					}
					case "claimRewards": {
						this.claimingRewards = true
						await this.getRewards()
						this.amount = this.vault.userRewards?.toString() ?? ""
						await this.claimRewards()
						break
					}
					case "addLiquidity": {
						;(this.$refs.addLiquidityModal as any).reset()
						await this.setStaked()
						this.$modal.hide(`stake-${this.vault.address}`)
						await this.$store.dispatch("denoms/setBalance")
						break
					}
				}
			}
			catch (e) {
				this.handleError(e)
			}
			this.modalLoaded = true
		},
		validate(input) {
			if (input === null) {
				this.statusMessage = "please enter a valid amount"
				return false
			}
			this.statusMessage = ""
			const number = Number(input)
			if (isNaN(number) || number === 0) {
				this.statusMessage = "please enter a valid amount"
				return false
			}
			return true
		},
		async stake() {
			if (!this.validate(this.amount)) {
				return
			}
			// check against balance
			this.statusMessage = "Confirming transaction..."
			const response = await this.$store.dispatch("vaults/stake", {
				vault: this.vault,
				amount: this.amount,
			})
			this.handleResponse("stake", response)
			this.monitorStake()
		},
		async unstake() {
			if (!this.validate(this.amount)) {
				return
			}
			const response = await this.$store.dispatch("vaults/unstake", {
				vault: this.vault,
				amount: this.amount,
			})
			this.handleResponse("unstake", response)
			this.monitorStake()
		},
		async claimRewards() {
			const response = await this.$store.dispatch("vaults/claimRewards", this.vault)
			this.claimingRewards = false
			this.handleResponse("claimRewards", response)
		},
		handleResponse(type: TransactionType, response, amounts?: string[]) {
			// eslint-disable-next-line no-console
			console.log({ response })
			const { message, hash, status } = response
			if (message) {
				this.$modal.show(`${type}-${this.vault.address}`)
				this.statusMessage = message
			}
			else if (hash && status) {
				this.$modal.hide(`${type}-${this.vault.address}`)
				this.transactionType = type
				this.transactionAmount = amounts ?? this.amount
				this.transactionHash = hash
				this.transactionStatus = status
				this.$modal.show(`transaction-${this.vault.address}`)
			}
		},
		closeTransactionModal() {
			this.$modal.hide(`transaction-${this.vault.address}`)
			if (this.transactionType === "addLiquidity") {
				this.monitorBalance()
				this.openModal("stake")
			}
		},
		handleError(_e: Error) {
			// TODO: handle known errors
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
.vault
	@media (min-width: $breakpoint-mobile-upper)
		display: table-row
		> *
			display: table-cell
			vertical-align: middle
	.title
		width: $unit16
		.image
			position: relative
			margin-right: $unit7
			> *
				border-radius: $unit10
				@include box-shadow
			> .icon:first-child
				img
					padding: $unit-10
					border: solid $color 2px
					border-radius: $unit10
			img
				position: relative
			.icon
				top: 50%
				left: 50%
				width: 100%
				height: 100%
				position: absolute
				transform: translate(-50%, -50%) translateX(70%)
				padding: 1px
				/deep/
					svg
						height: 100%
						width: 100%
	.header
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
	.contents
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
			> *:last-child
				text-align: center
				@media (max-width: $breakpoint-tablet)
					text-align: left
			display: grid
			button
				background: $bg
			@media (max-width: $breakpoint-tablet)
				row-gap: $space-medium
			#delegated
				grid-area: delegated
			#staked
				grid-area: staked
			#claimrewards
				grid-area: claimrewards
			#k
				grid-area: k
			#discon
				grid-area: discon
			#wallet
				grid-area: wallet
				@media (max-width: $breakpoint-mobile)
					&.active
						display: none
			#stake-unstake
				grid-area: stake-unstake
				.button-outer
					width: 100%
				@media (min-width: $breakpoint-mobile-upper)
					display: flex
					@include spaceHorz
				@media (max-width: $breakpoint-mobile)
					grid-area: wallet
					.button-outer:first-child
						button
							margin-bottom: $space-medium
					.button-outer
						max-height: $unit10
						@include openOnActive
			#claim-rewards
				grid-area: claim-rewards
				@media (max-width: $breakpoint-mobile)
					button
						width: 100%
					.button-outer
						@include openOnActive
			grid-template-columns: auto auto auto auto auto
			grid-template-areas: "delegated staked claimrewards k discon"
			@media (max-width: $breakpoint-tablet)
				grid-template-columns: auto auto auto
				grid-template-areas: "delegated staked claimrewards" "k discon"
			@media (max-width: $breakpoint-mobile)
				grid-template-columns: auto auto
				grid-template-areas: "delegated staked" "claimrewards k"  "discon"
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
