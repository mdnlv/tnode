<template lang="pug">
	.validator(:class="{ active }")
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
		.contents.grow(:class="{ active }")
			.css-grid
				.field.flex-column#total-delegated
					.label.small AMOUNT STAKED
					.flex
						span &nbsp;{{ "" }}
				.field.flex-column#staked
					.label.small LIQUIDITY VAULTS
					.flex
						span &nbsp;{{ "" }}
				.field.flex#k
					ConnectedWallet(no-copy)
				.field.flex#discon
					.button.bare.flex.space-items-horz.no-padding
						div(v-html="disconIcon")
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"

import { toLink } from "~/_utils"
import { Delegation, Vault } from "~/_types"
import LoadingValue from "~/components/LoadingValue.vue"
import Modal from "~/components/Modal.vue"
import MaxInput from "~/components/MaxInput.vue"
import ConnectedWallet from "~/components/common/ConnectedWallet.vue"
import StakeRow from "~/components/common/StakeRow.vue"

type TransactionType = "delegate" | "undelegate" | "claimRewards" | "redelegate"

export default Vue.extend({
	components: {
		LoadingValue,
		Modal,
		MaxInput,
		ConnectedWallet,
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
		vault: {
			type: Object as Vue.PropType<Vault>,
			required: true,
		},
	},
	data() {
		return {
			crossIcon: require("~/assets/svg/ui/cross.svg?raw"),
			disconIcon: require("~/assets/svg/discon.svg?raw"),
			claimIcon: require("~/assets/svg/claim_rewards.svg?raw"),
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
		name(): string[] {
			return this.vault.name.split("\n")
		},

		connectingWalletError() {
			return this.$store.getters["staking/connectingWalletError"]
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

		amount() {
			this.usingMax = false
		},

	},
	async mounted() {

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

		toggleActive() {
			this.active = !this.active
		},

		transactionClosed() {
			this.transactionType = null
			this.transactionAmount = null
			this.transactionHash = null
			this.transactionStatus = null
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

.validator
	@media (min-width: $breakpoint-mobile-upper)
		display: table-row
		> *
			display: table-cell
			vertical-align: middle
	.title
		width: 300px
		.image
			position: relative
			margin-right: $unit7
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
			grid-template-columns: auto auto auto auto
			grid-template-areas: "delegated staked k discon"
			@media (max-width: $breakpoint-tablet)
				grid-template-columns: auto auto
				grid-template-areas: "delegated staked" "k discon"
			@media (max-width: $breakpoint-mobile)
				grid-template-columns: auto auto
				grid-template-areas: "delegated staked" "k discon"
	@media (max-width: $breakpoint-tablet)
		.label
			font-size: 0.8rem
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
