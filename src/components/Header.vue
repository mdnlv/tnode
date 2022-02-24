<template lang="pug">
#header
	header
		.flex.space-items-horz.flex-wrap.wrap-space
			.flex.space-items-horz
				Hamburger.mobile
				.logo
					nuxt-link.logo-link(:to="'/'" v-html="logoImage")
			.flex.space-items-horz-big.buttons.flex-wrap.wrap-space
				.price.flex.space-items-horz(@click="addToMetamask")
					.price-icon
						img(src="~/assets/img/tnode-icon-2.png")
					LoadingValue(:value="tnodePrice" #default="{ value }")
						p.bold
							span.number ${{ value | floorToDPorE(4) }}
				.divider.no-mobile
				a.no-mobile.buy-tnode(href="https://pancakeswap.finance/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x7f12a37b6921ffac11fab16338b3ae67ee0c462b" target="_blank")
					button
						.flex.space-items-horz-small
							img(src="~/assets/img/tnode-icon-2.png")
							span BUY TNODE NOW
				.divider
				HeaderDropdown.nostyle.dropdown
					template(v-slot:trigger)
						.flex.space-items-horz
							.connect-wallet
								.mobile(style="cursor: pointer")
									.flex.space-items-horz(v-if="!account")
										img(src="~/assets/svg/wallet.svg")
										.flex.dropdown-icons
											.flex.dropdown-icon-expand(v-html="dropDownIconExpand")
											.flex.dropdown-icon-collapse(v-html="dropDownIconCollapse")
									.flex.space-items-horz.wallet(v-else)
										img(:src="connectedEVMWallet.icon")
										.flex(v-html="dropDownIconExpand")
								button.no-mobile.pill
									.flex.space-items-horz(v-if="!account")
										img(src="~/assets/svg/wallet.svg")
										span CONNECT WALLET
										.flex.dropdown-icons
											.flex.dropdown-icon-expand(v-html="dropDownIconExpand")
											.flex.dropdown-icon-collapse(v-html="dropDownIconCollapse")
									.flex.space-items-horz(v-else)
										img(:src="connectedEVMWallet.icon")
										span {{ account.address | accountAddress }}
										.flex(v-html="dropDownIconExpand")
					template(v-slot:default)
						.opacity-line
						.no-opacity.center
							h3(v-if="!account") Connect your wallet
						Web3
						.no-opacity
		Wallets
		ConnectModal
</template>

<script lang="ts">
import Vue from "vue"
import HeaderDropdown from "~/components/HeaderDropdown.vue"
import Wallets from "~/components/Wallets.vue"
import Web3 from "~/components/Web3.vue"
import Hamburger from "~/components/Hamburger.vue"
import LoadingValue from "~/components/LoadingValue.vue"
import ConnectModal from "~/components/ConnectModal.vue"

import { EVMAccount, EVMWallet } from "~/_types"

export default Vue.extend({
	components: {
		Wallets,
		Web3,
		Hamburger,
		LoadingValue,
		HeaderDropdown,
		ConnectModal,
	},
	data() {
		return {
			logoImage: require("~/assets/svg/logo.svg?raw"),
			dropDownIconCollapse: require("~/assets/svg/ui/arrow_drop_down_collapse.svg?raw"),
			dropDownIconExpand: require("~/assets/svg/ui/arrow_drop_down_expand.svg?raw"),
		}
	},
	computed: {
		account(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
		connectedEVMWallet(): EVMWallet | null {
			return this.$store.getters["web3/wallets"].find(w => w.id === this.account?.walletId) ?? null
		},
		tnodePrice(): number | null {
			return this.$store.getters["denoms/all"].find(d => d.id === "tnode")!.price
		},
	},
	mounted() {
		this.$store.commit("web3/connectingWalletId", null)
		this.$store.commit("web3/connectingWalletError", null)
	},
	methods: {
		async connectWallet() {
			await this.$store.dispatch("web3/connectWallet", this)
		},
		async addToMetamask() {
			await this.$store.dispatch("denoms/addToMetamask")
		},
		async disconnect() {
			await this.$store.dispatch("web3/disconnect")
		},
	},
})
</script>

<style lang="sass">

.logo-link
	display: flex
	align-items: center

tnode-ui >>> .space-items-horz-big >>> :not(:last-child)
	margin-right: 0

.tnode-ui >>> .flex
	/deep/
	.mobile
		display: none
		@media (max-width: $breakpoint-mobile)
			display: flex
	.no-mobile
		@media (max-width: $breakpoint-mobile)
			display: none
	.no-tablet
		@media (max-width: $breakpoint-tablet)
			display: none

#header
	header
		position: fixed
		width: 100%
		background: $header-bg
		padding: $header-padding 0
		.buttons
			padding-left: $unit2
		> .flex
			display: flex
			justify-content: space-between
			flex-wrap: wrap
			align-items: stretch
			> *:first-child
				padding-left: $space-big
				@media (max-width: $breakpoint-mobile)
					padding-left: $space-medium
			> *:last-child
				padding-right: $space-big
				@media (max-width: $breakpoint-mobile)
					padding: 0
			.logo
				// height: $header-height
				position: relative
				// background-color: red
				a
					transition: 0.3s
					height: 100%
					img
						height: 100%
						position: relative
						transform: translateX(0.85rem) translateY(0.35rem)
						@include hover-opacity
			.yield-boost
				@include hover-opacity
				img
					width: $unit4
				b
					color: $fg2
			.price
				display: flex
				flex-direction: row
				justify-content: center
				cursor: pointer
				@include hover-scale-opacity
				--price-mr: #{$space-big}
				margin-right: var(--price-mr)
				font-size: 0.9rem
				@media (max-width: $breakpoint-mobile-small)
					font-size: 0.7rem
				img
					--price-img-mr: #{$unit1}
					border-radius: $unit10
					width: $unit4
				@media (max-width: $breakpoint-mobile)
					--price-mr: #{$space}
					flex-direction: column
					.price-icon
						margin-right: 0
						margin-bottom: 0.2em
						width: $unit3
						img
							margin-right: 0
			.buy-tnode
				img
					border-radius: $unit10
					width: $unit4
			.insurance
				border: 1px solid $fg
				padding: $unit-3 $unit2
				@include hover-opacity
				img
					width: $unit-1
			.divider
				border-left: 1px solid $color
				height: $unit5
				@media (max-width: $breakpoint-mobile)
					margin-right: 0

			.connect-wallet
				.button
					display: flex
					img
						height: $unit2
					span
						transform: translateY(1px)
				img
					height: $unit3
				.wallet
					margin-right: 0.4rem

	.header-dropdown__trigger
		min-height: 50px
		border: none
		color: $white
		padding: 0 $unit1
		font-size: $unit2
		font-family: $font
		font-weight: $font-weight-header
		@media (max-width: $breakpoint-mobile-small)
			padding: 0 0.8rem
		.icon svg
			width: 24px
		.dropdown-icon-collapse
			display: none
			max-height: 24px
	.header-dropdown__trigger[aria-expanded]
		.trigger-text
			text-indent: -9999px
			line-height: 0
		.trigger-text::after
			content: "Select Chain"
			text-indent: 0
			line-height: unset
		.icon svg
			display: none
		.dropdown-icon-expand
			display: none
		.dropdown-icon-collapse
			display: block
	.header-dropdown__content
		width: 440px
		height: 1200px
		transform: translateX(-160px)
		@include box-shadow
		@media (max-width: $breakpoint-mobile)
			transform: translateX(0px)
			position: fixed
			top: 70px
			left: 0
			width: 100%
			height: calc(100% - 72px)
		a.buy-tnode
			align-self: center
			width: 100%
	.header-dropdown
		@media (max-width: $breakpoint-mobile)
			display: block
	.opacity-line
		background-color: (0,0,0,0)
		width: 100%;
		height: 16px;
		@media (max-width: $breakpoint-mobile)
			height: 28px;
	.no-opacity
		padding: 3em
		background-color: $bg2-1
	.dropdown-icons
		width: 28px
		overflow: hidden

//TODO: Handle tablet size
// @media (max-width: $breakpoint-tablet)
// 	#header
// 		header
// 			> .flex

// @media (max-width: $breakpoint-mobile)
// 	#header
// 		header
// 			> .flex
// 				.price
// 					--price-mr: #{$unit4}
// 					img
// 						--price-img-mr: #{$unit-3}
</style>
