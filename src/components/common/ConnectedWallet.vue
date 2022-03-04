<template lang="pug">
	button#connected-wallet.bare
		img.wallet-icon(:src="connectedEVMWallet.icon")
		.flex
			.flex-column.flex-start
				span.green CONNECTED WALLET
				span.color-f(v-if="longAddress") {{ account.address }}
				span.color-f(v-else) {{ account.address | accountAddress }}
			.img-copy(v-if="!noCopy" v-html="copyIcon")
</template>

<script lang="ts">
import Vue from "vue"
import { EVMAccount, EVMWallet } from "~/_types"

export default Vue.extend({
	props: {
		longAddress: {
			type: Boolean,
			required: false,
			default: false,
		},
		noCopy: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	data() {
		return {
			copyIcon: require("~/assets/svg/copy.svg?raw"),
		}
	},
	computed: {
		account(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
		connectedEVMWallet(): EVMWallet | null {
			return this.$store.getters["web3/wallets"].find(w => w.id === this.account?.walletId) ?? null
		},
	},
})
</script>

<style lang="sass" scoped>
.tnode-ui >>> button
	padding: 0

#connected-wallet
	padding: 0
	> :last-child
		margin-left: $unit1
	display: flex
	align-items: enter
	.wallet-icon
		padding-top: 4px
		height: $unit4
	.green
		color: $fg3
		font-size: 0.60em
	.color-f
		font-size: $unit1
		text-align: left
	.img-copy
		margin-left: $unit6
</style>
