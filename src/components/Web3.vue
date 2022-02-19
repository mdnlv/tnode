<template lang="pug">
#web3
	.message
		.space-items-big(v-if="!connectingWalletId")
			#header.flex-space-between
				h3 Choose your wallet:
				#close-button.cursor-pointer(@click="_close" v-html="crossIcon")
			.wallet-choices.flex-column.flex-start
				.wallet-choice.space-items(
					v-for="wallet of wallets"
					@click="connectWallet(wallet.id)"
				)
					.button.flex.pill.space-items-horz(v-if="!account")
						img.img-outer(:src="wallet.icon")
						span Connect {{ wallet.name }}
					.button.pill.flex.space-items-horz(v-else)
						img.img-outer(:src="wallet.icon")
						span {{ account.address | accountAddress }}
		.space-items(v-else)
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
import { Wallet, EVMAccount } from "~/_types"

export default Vue.extend({
	data() {
		return {
			installed: false,
			crossIcon: require("~/assets/svg/ui/cross.svg?raw"),
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
			}
		},
		_close() {
			this.$modal.hide("connecting-web3-wallet")
		},
	},
})
</script>

<style lang="sass">
#connect-modal, #web3
	.space-items-big
		width: 100%
	.wallet-choices
		align-items: stretch
		width: 100%
		.wallet-choice
			width: 100%
			cursor: pointer
			margin-bottom: 1em
			@include hover-scale-opacity
			justify-content: space-between
			.img-outer
				height: $unit6
	.divider
		position: relative
		color: $fg-1
		span
			display: inline-block
			padding: 0 $unit-3
			background: $bg
			position: relative
		&:before
			content: ""
			position: absolute
			width: $unit12
			height: $border-width
			background: $fg-1
			top: 50%
			left: 50%
			transform: translate(-50%, -50%)
	.flex
		display: flex
		width: 100%
</style>
