<template lang="pug">
	#vault.space-items-small(:class="{ promotional: vault.promotional }")
		.network.flex
			span Chain:
			.icon.center(v-html="network.icon")
			span {{ network.label }}
		.space-items
			.content.space-items
				header.flex-space-between.flex-wrap.wrap-space.space-items-horz
					.title.flex.flex-wrap.wrap-space
						.image
							template(v-if="vault.icon")
								.icon(v-html="vault.icon")
							template(v-else)
								.icon
									img.small(:src="vault.stakeDenom.icon")
							img.small(:src="vault.rewardDenom.icon")
						h2 {{ name[0] }}
							br
							span.secondary {{ name[1] }}
					.audit-link(v-if="vault.auditLink")
						a.space-items-horz-small.small.flex(:href="vault.auditLink" target="_blank")
							.center(v-html="auditIcon")
							span AUDITED
				.css-grid
					.apr.space-items-small
						.label.small APR
						.h2
							LoadingValue(:value="vault.apr" #default="{ value }" size="medium")
								span.number {{ value | floorToDPorE(1) }}%
					.tvl.space-items-small
						.label.small TVL
						.h2
							LoadingValue(:value="tvl" #default="{ value }" size="medium")
								span.number ${{ value | humanNumber(1) }}&nbsp;
					.closes-at
						.countdown.space-items-small(v-if="vault.closesAt !== undefined")
							.label.small VAULT CLOSING IN:
							.h2
								LoadingValue(:value="timeUntilClose" #default="{ value }" size="medium")
									.countdown-display.flex.space-items-horz(v-if="value.length")
										template(v-for="(unit, index) of value")
											.divider(v-if="index")
											.center
												span {{ unit.value }}
												span.unit.small {{ unit.unit }}
									span(v-else) Closed
						.lockup(v-else-if="vault.lockup")
							span.label.small &nbsp;
							.h2 {{ vault.lockup }} months lockup
					template(v-if="account")
						.stake.space-items-small
							.label.small YOUR STAKE
							.h3
								LoadingValue(:value="vault.userStaked" #default="{ value }" size="medium", :loading="userStakedLoading !== null ? userStakedLoading : !vault.userStaked")
									span.number {{ value | floorToDPorE(1) }}&nbsp;
								span {{ vault.stakeDenom.symbol }}
								template(v-if="vault.stakeDenom.denoms && vault.userStaked && vault.userStaked.eq(0)")
									span.add-liquidity-link.smaller.cursor-pointer(@click="openModal('addLiquidity')") get LP tokens
						.rewards.space-items-small
							.label.small YOUR REWARDS
							.h3
								LoadingValue(:value="vault.userRewards" #default="{ value }" size="medium")
									span.number {{ value | floorToDPorE(1) }}&nbsp;
								span {{ vault.rewardDenom.symbol }}
				.properties.space-items-small
					.property(v-for="property of vault.properties")
						|{{ property | renderProperty(vault) }}
			.buttons.space-before.space-items-horz.grid
				.third
					button.full.cta(
						@click="openModal('stake')"
						:class="{ disabled: vault.expired }"
						:disabled="vault.expired"
					) STAKE
				.third
					button.full(@click="openModal('unstake')") UNSTAKE
				.third
					button.full.flex.space-items-horz-small(@click="openModal('claimRewards')")
						img.loading-small(v-if="claimingRewards" src="~/assets/gif/loading-3.gif")
						span CLAIM REWARDS
		VaultModals(
			:loaded="loaded"
			:modalLoaded="modalLoaded"
			:vault="vault"
			:openModal="openModal"
			:stake="stake"
			:closeTransactionModal="closeTransactionModal"
			:statusMessage="statusMessage"
			:unstake="unstake"
			:amount="amount"
			:transactionType="transactionType"
			:transactionAmount="transactionAmount"
			:transactionHash="transactionHash"
			:transactionStatus="transactionStatus"
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
import StatusMessage from "~/components/StatusMessage.vue"
import AddLiquidityModal from "~/components/AddLiquidityModal.vue"
import VaultModals from "~/components/VaultModals.vue"

type TransactionType = "stake" | "unstake" | "claimRewards" | "addLiquidity"
type CountdownUnit = {
	unit: "DAYS" | "HRS" | "MIN"
	value: number
}

export default Vue.extend({
	components: {
		LoadingValue,
		StatusMessage,
		AddLiquidityModal,
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
			transactionType: "stake" as TransactionType,
			transactionAmount: "" as string | string[],
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
			if (type === "stake" && this.vault.expired) {
				return
			}
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

#vault
	> .space-items
		background: $bg
		padding: $unit3 $unit5
		@include rounded-big
		min-height: $unit18
		display: flex
		flex-direction: column
		justify-content: space-between
	&.promotional
		> .space-items
			position: relative
			&:after
				content: "PROMOTIONAL VAULT"
				position: absolute
				background: $fg2
				padding: $unit-6 $unit3
				top: -$unit-2
				right: -$unit1
				border-radius: $unit10
				color: $bg-1
			.button
				opacity: $opacity1
				pointer-events: none
	.network
		.icon
			transform: scale(0.7)
	header
		.title
			.image
				position: relative
				margin-right: $unit9
				> *
					border-radius: $unit10
					@include box-shadow
				> .icon:first-child
					img
						padding: 3px
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
		.audit-link
			a
				@include hover-scale-opacity
				.center
					transform: translateY(-1px)
					/deep/
						svg
							width: $unit1
							height: $unit1
	.countdown
		/deep/
			.countdown-display
				font-size: $unit1
				line-height: initial
				.divider
					width: 1px
					height: $unit6
					background: $fg
				.unit
					font-weight: $font-weight
					font-family: $font
					color: $fg
	.css-grid
		display: grid
		column-gap: $space-big
		row-gap: $space-big
		justify-content: space-between
		> *
			overflow: hidden
		> .apr
			grid-area: apr
		> .tvl
			grid-area: tvl
		> .closes-at
			grid-area: closes-at
		> .stake
			grid-area: stake
		> .rewards
			grid-area: rewards
		grid-template-areas: "apr tvl closes-at" "stake rewards rewards"
		@media (max-width: $breakpoint-mobile-small)
			column-gap: $space
			row-gap: $space
			grid-template-areas: "apr tvl" "closes-at closes-at" "stake rewards"
	.property
		padding-left: $unit3
		position: relative
		&:after
			content: ""
			width: $unit-1
			height: $unit-1
			top: 50%
			left: 0
			transform: translateY(-50%)
			background: $color
			@include rounded-big
			position: absolute
	.buttons
		button
			@include rounded-small

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
		border-radius: $unit10

	.add-liquidity-link
		margin-left: $unit-1
		font-weight: normal
		font-family: $font
		color: $fg
		border: 1px solid $fg
		padding: $unit-10 $unit-1
		@include rounded
		@include hover-opacity

	/deep/
		#claim-rewards-error
			height: 100%
			padding-top: $unit2
		#buttons
			display: flex
			justify-content: flex-end
			align-items: center
			text-align: right
			p.status-message
				white-space: pre-line
				margin-right: $unit5
				text-align: left

</style>
