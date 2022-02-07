<template lang="pug">
	#web3
		VueModal(
			v-if="loaded"
			name="connecting-web3-wallet"
			:adaptive="true"
			height="auto"
			@before-open="startConnecting"
			@closed="doneConnecting"
		)
			.message
				.space-items-big(v-if="!connectingWalletId")
					h3 Choose your wallet:
					.center
						.wallet-choices.flex.flex-start.space-items-horz-big
							.wallet-choice.space-items-small.center(
								v-for="wallet of wallets"
								@click="connectWallet(wallet.id)"
							)
								.img-outer.center
									img(:src="wallet.icon")
								p {{ wallet.name }}
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
import { Wallet } from "~/_types"

export default Vue.extend({
	data() {
		return {
			installed: false,
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
		startConnecting() {
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
		},
		doneConnecting() {
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
		},
	},
})
</script>

<style lang="sass">
#web3
	.wallet-choices
		align-items: stretch
		.wallet-choice
			cursor: pointer
			@include hover-scale-opacity
			justify-content: space-between
			.img-outer
				flex-grow: 1
				width: $unit8
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
	.connected-wallet
		img
			width: $unit4
</style>
