<template lang="pug">
#web3
	.message
		.space-items-big(v-if="!connectingWalletId")
			.wallet-choices.flex-center(v-if="!account")
				.wallet-choice.space-items(v-for="wallet of wallets")
					.flex-column.center.space-items-horz(@click="connectWallet(wallet.id)")
						img.img-outer(:src="wallet.icon")
						span {{ wallet.name }}
			.flex-column.connected(v-else)
				.flex.wrap
					ConnectedWallet(long-address)
				NuxtLink.flex.space-items-horz.disconnect(to="profile" @click.native="changeDropdownVisible()")
					.img-outer(v-html="profileIcon")
					span YOUR PROFILE
				.button.bare.flex.space-items-horz.no-padding.disconnect(@click="disconnect")
					.img-outer(v-html="disconnectIcon")
					span DISCONNECT
			.gray-line.center
				.buy-tnode
					a.button(href="https://pancakeswap.finance/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x7f12a37b6921ffac11fab16338b3ae67ee0c462b" target="_blank")
						.flex.space-items-horz-small
							img.img-outer(src="~/assets/img/tnode-icon-2.png")
							span BUY TNODE NOW
		.space-items.errors(v-else)
			template(v-if="!installed")
				h3 {{ name }} Not Found
				p Please install the <a :href="link" target="_blank"> {{ name }} browser extension</a> and create an account to get started.
				p (Note: you may have to reload this page)
			template(v-else-if="connectingWalletError === 'accountNotFound'")
				h3 Account Not Found
				p Make sure you have created an account in {{ name }} first. If still unsuccessful, try reinstalling {{ name }}.
			template(v-else-if="connectingWalletError === 'requestRejected'")
				h3 Request Rejected
				p It seems that you've refused to connect your {{ name }} wallet. If unintentional, please click the connect button to try again.
			template(v-else-if="connectingWalletError === 'metamaskConnectionError'")
				h3 Unsupported Browser
				p If you are trying to connect using MetaMask on your mobile device then please try using MetaMask's internal browser.
			template(v-else)
				h3 Connecting...
				p Stuck connecting? Make sure you have created an account in {{ name }} first. If still unsuccessful, try reinstalling {{ name }}.
</template>

<script lang="ts">
import Vue from "vue"
import ConnectedWallet from "~/components/common/ConnectedWallet.vue"
import { Wallet, EVMAccount } from "~/_types"

export default Vue.extend({
	components: {
		ConnectedWallet,
	},
	data() {
		return {
			installed: false,
			disconnectIcon: require("~/assets/svg/disconnect.svg?raw"),
			profileIcon: require("~/assets/svg/profile.svg?raw"),
			copyIcon: require("~/assets/svg/copy.svg?raw"),
		}
	},
	computed: {
		loaded(): boolean {
			return this.$store.getters.loaded
		},
		wallets(): Wallet[] {
			return this.$store.getters["web3/wallets"]
		},
		connectingWalletId(): string | null {
			return this.$store.getters["web3/connectingWalletId"]
		},
		connectingWalletError(): string | null {
			return this.$store.getters["web3/connectingWalletError"]
		},
		link(): string | null {
			return this.$store.getters["web3/link"]
		},
		name(): string | null {
			return this.$store.getters["web3/name"]
		},
		account(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
	},
	watch: {
		async connectingWalletId(walletId: string) {
			if (walletId) {
				this.installed = await this.$store.dispatch("web3/installed")
			}
		},
	},
	methods: {
		connect() {
			this.$modal.show("connecting-web3-wallet")
		},
		async connectWallet(walletId: string) {
			this.$store.commit("web3/connectingWalletId", walletId)
			await this.$store.dispatch("web3/getAccount", {
				walletId,
			})
			if (!this.connectingWalletError) {
				this.$modal.hide("connecting-web3-wallet")
				this.$store.commit("web3/connectingWalletId", null)
			}
		},
		_close() {
			this.$modal.hide("connecting-web3-wallet")
		},
		async disconnect() {
			await this.$store.dispatch("web3/disconnect")
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
		},
		changeDropdownVisible(e) {
			this.$store.commit("web3/changeDropdownVisible")
		},
	},
})
</script>

<style lang="sass">
.wrap
	overflow-wrap: anywhere
	text-align: left
#web3
	padding-bottom: $unit4
	.message
		padding: 0
	background-color: $bg2-1
	@media (max-width: $breakpoint-mobile)
		height: 100%
	.errors
		text-align: left
		padding: 3em 2em
		h3
			padding-bottom: 1em
	.wallet-icon
		height: $unit3

#connect-modal
	#web3
		margin-left: -$space-big
		margin-right: -$space-big

#connect-modal, #web3
	.space-items-big
		width: 100%
	.disconnect
		margin-top: $unit1
		display: flex
		width: 100%
	.connected
		padding: 0 4em
		> *:not(:last-child)
			padding-bottom: $unit1
		.green
			color: $fg3
			font-size: 0.60em
		.img-copy
			margin-left: $unit3
	a
		text-decoration: none
		cursor: pointer
	.wallet-choices
		align-items: stretch
		width: 100%
		.wallet-choice
			cursor: pointer
			margin: 1em 0
			@include hover-scale-opacity
			.img-outer
				margin-bottom: 1em
				margin-right: 0
			.disconnect-img
				height: $unit3
			.disconnect-btn
				margin-bottom: $unit1
			div
				height: $unit6
			&:not(:last-child)
				margin-right: $unit10
	.gray-line
		width: 100%
		height: 100px
		background: $bg2
		line-height: auto
		justify-content: center
		a
			text-decoration: none
		@media (min-width: $breakpoint-mobile)
			display: none
	.buy-tnode
		align-self: center
		img
			border-radius: $unit10
			width: $unit2
</style>
