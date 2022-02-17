<template lang="pug">
	Modal(
		:name="`addLiquidity-${vaultAddress}`"
		title="Add Liquidity"
		height="auto"
		@close="close"
	)
		.form.flex.flex-column.flex-stretch
			.space-items-bigger
				p Add liquidity to receive LP tokens
				.space-items-medium
					MaxInput(
						v-model="busdAmount"
						@input="onBusdChange"
						:max="busdDenom.userBalance"
						:symbol="busdDenom.symbol"
						:symbolIcon="busdDenom.icon"
						placeholder="Enter amount"
						:showUsingMax="false"
					)
						span balance: {{ busdDenom.userBalance | floorToDP(6) }} {{ busdDenom.symbol }}
					.center(v-html="plusIcon")
					MaxInput(
						v-model="tnodeAmount"
						@input="onTNodeChange"
						:max="tnodeDenom.userBalance"
						:symbol="tnodeDenom.symbol"
						:symbolIcon="tnodeDenom.icon"
						placeholder="Enter amount"
						:showUsingMax="false"
					)
						span balance: {{ tnodeDenom.userBalance | floorToDP(6) }} {{ tnodeDenom.symbol }}
				.prices.space-before
					.container.center
						table
							tbody
								tr
									td.bare.right-text {{ ratio2 }}
									td TNODE per BUSD
								tr
									td.bare.right-text {{ ratio1 }}
									td BUSD per TNODE
				StatusMessage(:message="status")
				.flex-end.space-before
					button.bare.big-text(@click="addLiquidity") ADD LIQUIDITY
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import Modal from "~/components/Modal.vue"
import MaxInput from "~/components/MaxInput.vue"
import StatusMessage from "~/components/StatusMessage.vue"
import { ERC20Denom, EVMAccount } from "~/_types"

const DECIMAL = 5

export default Vue.extend({
	components: {
		Modal,
		MaxInput,
		StatusMessage,
	},
	props: {
		vaultAddress: {
			type: String as Vue.PropType<string>,
			required: true,
		},
	},
	data() {
		return {
			busdAmount: "",
			tnodeAmount: "",
			status: null as string | null,
			plusIcon: require("~/assets/svg/ui/plus-circle.svg?raw"),
			errorIcon: require("~/assets/svg/ui/error_accent.svg?raw"),
		}
	},
	computed: {
		account(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
		busdDenom(): ERC20Denom {
			return this.$store.getters["denoms/erc20"].find(e => e.id === "busd")
		},
		tnodeDenom(): ERC20Denom {
			return this.$store.getters["denoms/erc20"].find(e => e.id === "tnode")
		},
		ratio1(): string {
			if (!this.tnodeDenom.price) {
				return ""
			}
			return this.tnodeDenom.price.toFixed(DECIMAL)
		},
		ratio2(): string {
			if (!this.tnodeDenom.price) {
				return ""
			}
			return bn(1).div(this.tnodeDenom.price).toFixed(DECIMAL)
		},
	},
	methods: {
		reset() {
			this.busdAmount = ""
			this.tnodeAmount = ""
			this.status = null
		},
		close() {
			this.$modal.show(`stake-${this.vaultAddress}`)
		},
		onBusdChange(value: string) {
			if (!this.tnodeDenom.price) {
				return
			}
			try {
				const amount = parseFloat(value)
				this.tnodeAmount = bn(amount).div(this.tnodeDenom.price).toFixed(DECIMAL)
				this.status = ""
			}
			catch {
				this.tnodeAmount = "0"
			}
		},
		onTNodeChange(value: string) {
			if (!this.tnodeDenom.price) {
				return
			}
			try {
				const amount = parseFloat(value)
				this.busdAmount = this.tnodeDenom.price.times(amount).toFixed(DECIMAL)
				this.status = ""
			}
			catch {
				this.busdAmount = "0"
			}
		},
		async addLiquidity() {
			if (!this.busdDenom || !this.busdDenom.userBalance || !this.tnodeDenom || !this.tnodeDenom.userBalance) {
				this.status = "could not find balance"
				return
			}
			let busdValue = bn(0)
			let tnodeValue = bn(0)
			try {
				busdValue = bn(this.busdAmount)
				tnodeValue = bn(this.tnodeAmount)
			}
			catch (e) {
				this.status = "please enter valid amounts"
				return
			}
			if (this.busdDenom.userBalance.lt(busdValue)) {
				this.status = "insufficient BUSD"
				return
			}
			if (this.tnodeDenom.userBalance.lt(tnodeValue)) {
				this.status = "insufficient TNODE"
				return
			}
			try {
				const response = await this.$store.dispatch("denoms/addLiquidity", {
					tokenA: this.busdDenom,
					tokenB: this.tnodeDenom,
					amountA: this.busdAmount,
					amountB: this.tnodeAmount,
				})
				this.$emit("response", {
					response,
					amounts: [
						this.busdAmount,
						this.tnodeAmount,
					],
				})
			}
			catch (e) {
				// eslint-disable-next-line no-console
				console.error(e)
				this.status = e.message
			}
		},
	},
})
</script>

<style lang="sass" scoped>
	.error
		display: flex
		align-items: center
		.error-icon
			width: $unit3
			height: $unit3
			margin-right: $unit-3
		.error-content
			color: $fg2-accent
	.prices
		margin-left: -$space-big
		margin-right: -$space-big
		padding: $unit2 0
		background: $violet-transparent
		.line
			margin: 5px 0
		.bare
			color: $fg
		table
			tr
				td:first-child
					padding-right: $space
</style>
