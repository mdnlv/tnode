<template lang="pug">
#connect-modal
	VueModal(
		v-if="loaded"
		name="connecting-web3-wallet"
		:adaptive="true"
		height="auto"
		@before-open="startConnecting"
		@closed="doneConnecting"
	)
		.header.flex-space-between
			h3 Connect your wallet
			#close-button.cursor-pointer(@click="_close" v-html="crossIcon")
		Web3
</template>

<script lang="ts">
import Vue from "vue"
import Web3 from "~/components/Web3.vue"
import { Wallet } from "~/_types"

export default Vue.extend({
	components: {
		Web3,
	},
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
		_close() {
			this.$modal.hide("connecting-web3-wallet")
		},
	},
})
</script>

<style lang="sass" scoped>
	.header
		padding-bottom: 2.4em
</style>
