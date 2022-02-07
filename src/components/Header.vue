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
					img(src="~/assets/img/tnode-icon-2.png")
					LoadingValue(:value="tnodePrice" #default="{ value }")
						p.bold
							span.number ${{ value | floorToDPorE(4) }}
				.divider.no-mobile
				a.buy-tnode(href="https://pancakeswap.finance/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x7f12a37b6921ffac11fab16338b3ae67ee0c462b" target="_blank")
					button
						.flex.space-items-horz-small
							img(src="~/assets/img/tnode-icon-2.png")
							span BUY TNODE NOW
				.divider.no-mobile
				.connect-wallet
					button.pill(v-if="!account" @click="connectWallet") CONNECT WALLET
					.button.pill.flex.space-items-horz(
						v-else
						@click="disconnect"
					)
						img(:src="connectedEVMWallet.icon")
						span {{ account.address | accountAddress }}
		Wallets
		Web3
</template>

<script lang="ts">
import Vue from "vue"
import Wallets from "~/components/Wallets.vue"
import Web3 from "~/components/Web3.vue"
import Hamburger from "~/components/Hamburger.vue"
import LoadingValue from "~/components/LoadingValue.vue"

import { EVMAccount, EVMWallet } from "~/_types"

export default Vue.extend({
	components: {
		Wallets,
		Web3,
		Hamburger,
		LoadingValue,
	},
	data() {
		return {
			logoImage: require("~/assets/svg/logo.svg?raw"),
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

<style lang="sass" scoped>

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
				cursor: pointer
				@include hover-scale-opacity
				--price-mr: #{$space-big}
				margin-right: var(--price-mr)
				img
					--price-img-mr: #{$unit1}
					border-radius: $unit10
					width: $unit4
					margin-right: var(--price-img-mr)
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
