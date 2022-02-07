<template lang="pug">
	#wallet
		VueModal(
			v-if="loaded"
			name="connecting-staking-wallet"
			:adaptive="true"
			height="auto"
			@before-open="startConnecting"
			@closed="doneConnecting"
		)
			.message
				.space-items
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
		connectingWalletId(): string | null {
			return this.$store.getters["staking/connectingWalletId"]
		},
		connectingWalletError(): string | null {
			return this.$store.getters["staking/connectingWalletError"]
		},
		link(): string | null {
			return this.$store.getters[`staking/wallets/${this.connectingWalletId}/link`]
		},
		name(): string | null {
			return this.$store.getters[`staking/wallets/${this.connectingWalletId}/name`]
		},
	},
	watch: {
		async connectingWalletId(id: string) {
			if (!id) {
				this.installed = false
			}
			else {
				this.installed = await this.$store.dispatch(`staking/wallets/${this.connectingWalletId}/installed`)
			}
		},
	},
	methods: {
		startConnecting() {
			this.$store.commit("staking/connectingWalletId", null)
			this.$store.commit("staking/connectingWalletError", null)
		},
		doneConnecting() {
			this.$store.commit("staking/connectingWalletId", null)
			this.$store.commit("staking/connectingWalletError", null)
		},
	},
})
</script>

<style lang="sass">
#wallet
</style>
