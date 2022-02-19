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
				VDropdown.nostyle.dropdown(:classes="classes")
					template(v-slot:trigger)
						.flex.space-items-horz
							.connect-wallet
								button.no-mobile.pill CONNECT WALLET
								.mobile(style="cursor: pointer")
									img(src="~/assets/svg/wallet.svg")
							.flex
								.flex.dropdown-icon-expand(v-html="dropDownIconExpand")
								.flex.dropdown-icon-collapse(v-html="dropDownIconCollapse")
					template(v-slot:default)
						Web3
						a.center.buy-tnode(href="https://pancakeswap.finance/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x7f12a37b6921ffac11fab16338b3ae67ee0c462b" target="_blank")
							button
								.flex.space-items-horz-small
									img(src="~/assets/img/tnode-icon-2.png")
									span BUY TNODE NOW
		Wallets
		ConnectModal
</template>

<script lang="ts">
import Vue from "vue"
import { VDropdown } from "vuetensils/src/components"
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
		VDropdown,
		ConnectModal,
	},
	data() {
		return {
			logoImage: require("~/assets/svg/logo.svg?raw"),
			classes: {
			},
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

#header
	header
		position: fixed
		width: 100%
		background: $header-bg
		padding: $header-padding 0
		// padding-right: $space-medium
		// @media (max-width: $breakpoint-mobile)
		// 	padding-left: 0
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
					padding-right: $space-medium
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
				img
					--price-img-mr: #{$unit1}
					border-radius: $unit10
					width: $unit4
					margin-right: var(--price-img-mr)
				@media (max-width: $breakpoint-mobile)
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

			.connect-wallet
				.button
					display: flex
					img
						height: $unit2
					span
						transform: translateY(1px)

	/deep/
	.vts-dropdown__trigger
		min-height: 50px
		border: none
		color: $white
		padding: 0 $unit3
		font-size: $unit2
		font-family: $font
		font-weight: $font-weight-header
		.icon svg
			width: 24px
		.dropdown-icon-collapse
			display: none
			max-height: 24px
	.vts-dropdown__trigger[aria-expanded]
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
	.vts-dropdown__content
		width: 500px
		heigt: 800px
		transform: translateX(-228px)
		background-color: $bg-1
		@include box-shadow
		.dropdown-item
			padding: $unit-5 $unit3
			cursor: pointer
			.icon svg
				width: 24px
		.dropdown-item:last-child
			border-radius: 0 0 20px 20px
		.dropdown-item:hover
			background: $fg
		@media (max-width: $breakpoint-mobile)
			transform: translateX(-380px)
		a.buy-tnode
			align-self: center
			margin-bottom: 1em
			width: 100%
	.vts-dropdown__content:not(:hover)
		.dropdown-item.selected
			background: $fg

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
