<template lang="pug">
#header
	header
		.flex-space-between.space-items-horz
			.flex.space-items-horz
				Hamburger.mobile
				.logo
					nuxt-link.logo-link(:to="'/'" v-html="logoImage")
			.flex.space-items-horz-big.buttons
				.price.flex.space-items-horz.cursor-pointer(@click="addToMetamask")
					.price-icon(v-if="tnodePrice !== null")
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
				HeaderDropdown.nostyle
					template(#trigger)
						.flex
							.connect-wallet
								.mobile.cursor-pointer
									.flex.space-items-horz
										template(v-if="!account")
											img(src="~/assets/svg/wallet.svg")
										template(v-else)
											img(:src="connectedEVMWallet.icon")
										.flex.dropdown-icons
											.flex.dropdown-icon-expand(v-html="dropDownIconExpand")
											.flex.dropdown-icon-collapse(v-html="dropDownIconCollapse")
								button.no-mobile.pill
									.flex.space-items-horz-small
										template(v-if="!account")
											img(src="~/assets/svg/wallet.svg")
											span CONNECT WALLET
										template(v-else)
											img(:src="connectedEVMWallet.icon")
											span {{ account.address | accountAddress }}
										.flex.dropdown-icons
											.flex.dropdown-icon-expand(v-html="dropDownIconExpand")
											.flex.dropdown-icon-collapse(v-html="dropDownIconCollapse")
					template(#default)
						.dropdown-title(v-if="!connectingWalletId")
							h3(v-if="!account") Connect your wallet
							h3(v-else) Connected wallet
						Web3
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
		connectingWalletId(): string | null {
			return this.$store.getters["web3/connectingWalletId"]
		},
	},
	mounted() {
		this.$store.commit("web3/connectingWalletId", null)
		this.$store.commit("web3/connectingWalletError", null)
	},
	methods: {
		async addToMetamask() {
			await this.$store.dispatch("denoms/addToMetamask")
		},
		async disconnect() {
			await this.$store.dispatch("web3/disconnect")
		},
	},
})
</script>

<style lang="sass" scoped>

#header
	header
		position: fixed
		width: 100%
		background: $header-bg
		padding: $header-padding 0
		.buttons
			margin-right: $unit7
			@media (max-width: $breakpoint-mobile-small)
					margin-right: $unit5
					padding-left: 0
		> .flex-space-between
			> *:first-child
				padding-left: $space-big
				@media (max-width: $breakpoint-mobile)
					padding-left: $space-medium
				@media (max-width: $breakpoint-mobile-small)
					padding-left: $space-small
			> *:last-child
				padding-right: $space-big
				@media (max-width: $breakpoint-mobile)
					padding: 0
			.logo
				// height: $header-height
				@media (max-width: $breakpoint-mobile-small)
					width: $unit10
				position: relative
				// background-color: red
				.logo-link
					display: flex
					align-items: center
				a
					height: 100%
					@include hover-opacity
			.yield-boost
				@include hover-opacity
				img
					width: $unit4
				b
					color: $fg2
			.price
				// justify-content: center
				@include hover-scale-opacity
				margin-right: $space-big
				font-size: $font-size-small
				@media (max-width: $breakpoint-mobile-small)
					font-size: $font-size-smaller
				@media (max-width: $breakpoint-mobile)
					margin-right: $space
					flex-direction: column
					padding-top: $unit-8
					.price-icon
						margin-right: 0
						width: $unit3
						img
							border-radius: none
							width: $unit1
				.price-icon
					img
						border-radius: $unit10
						width: $unit4
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

			/deep/
				.connect-wallet
					@media (max-width: $breakpoint-mobile)
						width: $unit8
					img
						width: $unit3
					.mobile
						img
							margin-right: $unit-2
							@media (max-width: $breakpoint-mobile-small)
								margin-right: $unit-8
					button.no-mobile
						width: calc(#{$unit16} - #{$unit3})
						img
							margin-right: $unit-3
						.space-items-horz-small
							justify-content: center
							padding-left: $unit-9

				.header-dropdown__trigger
					border: none
					@media (min-width: $breakpoint-mobile)
						padding: 0
					.dropdown-icon-collapse
						display: none
				.header-dropdown__trigger[aria-expanded]
					.dropdown-icon-expand
						display: none
					.dropdown-icon-collapse
						display: block
						max-height: 24px
				.header-dropdown__content
					width: $unit19
					@include box-shadow
					@media (max-width: $breakpoint-mobile)
						position: fixed
						top: $unit8
						left: 0
						width: 100%
					a.buy-tnode
						align-self: center
						width: 100%
				.header-dropdown
					@media (max-width: $breakpoint-mobile)
						display: block
				.dropdown-title
					padding: $unit7
					background-color: $bg2-1
				.dropdown-icons
					width: $unit2
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
