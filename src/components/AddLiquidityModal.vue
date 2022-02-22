<template lang="pug">
	Modal(
		:name="`addLiquidity-${vault.address}`"
		title="Add Liquidity"
		height="auto"
		@close="close"
	)
		.form.flex.flex-column.flex-stretch
			.space-items-bigger
				p Add liquidity to receive LP tokens
				.space-items-medium
					MaxInput(
						v-model="tokenAAmount"
						@input="onBusdChange"
						:max="tokenA.userBalance"
						:symbol="tokenA.symbol"
						:symbolIcon="tokenA.icon"
						placeholder="Enter amount"
						:showUsingMax="false"
					)
						span balance: {{ tokenA.userBalance | floorToDP(6) }} {{ tokenA.symbol }}
					.center(v-html="plusIcon")
					MaxInput(
						v-model="tokenBAmount"
						@input="onTNodeChange"
						:max="tokenB.userBalance"
						:symbol="tokenB.symbol"
						:symbolIcon="tokenB.icon"
						placeholder="Enter amount"
						:showUsingMax="false"
					)
						span balance: {{ tokenB.userBalance | floorToDP(6) }} {{ tokenB.symbol }}
				.prices.space-before
					.container.center
						table
							tbody
								tr
									td.bare.right-text {{ ratio2 | floorToDP(6) }}
									td {{ tokenB.symbol }} per {{ tokenA.symbol }}
								tr
									td.bare.right-text {{ ratio1 | floorToDP(6) }}
									td {{ tokenA.symbol }} per {{ tokenB.symbol }}
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
import { ERC20Denom, EVMAccount, Vault, LPDenom } from "~/_types"

const DECIMAL = 5

export default Vue.extend({
	components: {
		Modal,
		MaxInput,
		StatusMessage,
	},
	props: {
		vault: {
			type: Object as Vue.PropType<Vault>,
			required: true,
		},
	},
	data() {
		return {
			tokenAAmount: "",
			tokenBAmount: "",
			status: null as string | null,
			plusIcon: require("~/assets/svg/ui/plus-circle.svg?raw"),
			errorIcon: require("~/assets/svg/ui/error_accent.svg?raw"),
		}
	},
	computed: {
		account(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
		tokenA(): ERC20Denom | undefined {
			return this.$store.getters["denoms/erc20"].find(e => e.id === (this.vault.stakeDenom as LPDenom).denoms![0].id)
		},
		tokenB(): ERC20Denom {
			return this.$store.getters["denoms/erc20"].find(e => e.id === (this.vault.stakeDenom as LPDenom).denoms![1].id)
		},
		ratio1(): bn {
			if (!this.tokenB.price) {
				return bn(0)
			}
			return this.tokenB.price
		},
		ratio2(): bn {
			if (!this.tokenB.price) {
				return bn(0)
			}
			return bn(1).div(this.tokenB.price)
		},
	},
	methods: {
		reset() {
			this.tokenAAmount = ""
			this.tokenBAmount = ""
			this.status = null
		},
		close() {
			this.$modal.show(`stake-${this.vault.address}`)
		},
		onBusdChange(value: string) {
			if (!this.tokenB.price) {
				return
			}
			try {
				const amount = parseFloat(value)
				this.tokenBAmount = bn(amount).div(this.tokenB.price).toFixed(DECIMAL)
				this.status = ""
			}
			catch {
				this.tokenBAmount = "0"
			}
		},
		onTNodeChange(value: string) {
			if (!this.tokenB.price) {
				return
			}
			try {
				const amount = parseFloat(value)
				this.tokenAAmount = this.tokenB.price.times(amount).toFixed(DECIMAL)
				this.status = ""
			}
			catch {
				this.tokenAAmount = "0"
			}
		},
		async addLiquidity() {
			if (!this.tokenA || !this.tokenA.userBalance || !this.tokenB || !this.tokenB.userBalance) {
				this.status = "could not find balance"
				return
			}
			let tokenAValue = bn(0)
			let tokenBValue = bn(0)
			try {
				tokenAValue = bn(this.tokenAAmount)
				tokenBValue = bn(this.tokenBAmount)
			}
			catch (e) {
				this.status = "please enter valid amounts"
				return
			}
			if (this.tokenA.userBalance.lt(tokenAValue)) {
				this.status = `insufficient ${this.tokenA.symbol}`
				return
			}
			if (this.tokenB.userBalance.lt(tokenBValue)) {
				this.status = `insufficient ${this.tokenB.symbol}`
				return
			}
			try {
				const response = await this.$store.dispatch("denoms/addLiquidity", {
					tokenA: this.tokenA,
					tokenB: this.tokenB,
					amountA: this.tokenAAmount,
					amountB: this.tokenBAmount,
				})
				this.$emit("response", {
					response,
					amounts: [
						this.tokenAAmount,
						this.tokenBAmount,
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
