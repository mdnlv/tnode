<template lang="pug">
	#max-input
		.amount-input-outer(:class="{ 'with-icon': symbolIcon }")
			input.full(
				:value="value"
				@input="input($event.target.value)"
				:placeholder="placeholder"
			)
			#symbol.flex-space-between
				img.symbol-icon(v-if="symbolIcon", :src="symbolIcon")
				span(v-else) &nbsp;
				span {{ symbol }}
			#max-button-outer
				button.pill.big-text.nohover(@click="setMaxWithoutFee") MAX
		p.small.message-above.light-text(v-if="$slots.default")
			slot
		p.smaller.message-below.light-text(v-if="usingMax")
			span Using max balance minus {{ fees }} {{ symbol }} for transaction fees
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"

import { max } from "~/_utils"

export default Vue.extend({
	props: {
		value: {
			type: String as Vue.PropType<string>,
			default: null,
		},
		max: {
			type: bn as Vue.PropType<bn>,
			default: null,
		},
		fees: {
			type: Number as Vue.PropType<number>,
			default: null,
		},
		symbol: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		symbolIcon: {
			type: String as Vue.PropType<string>,
			default: null,
		},
		placeholder: {
			type: String as Vue.PropType<string>,
			default: "Amount",
		},
	},
	data() {
		return {
			usingMax: false,
		}
	},
	watch: {
		amount() {
			this.usingMax = false
		},
	},
	methods: {
		async setMaxWithoutFee() {
			if (this.fees === null) {
				this.$emit("input", this.max.toString())
			}
			else {
				const withoutFee = bn(this.max ?? 0).minus(this.fees)
				this.$emit("input", max(withoutFee, 0).toString())
				await this.$nextTick
				this.usingMax = true
			}
		},
		input(value: string) {
			this.$emit("input", value)
		},
	},
})
</script>

<style lang="sass" scoped>

#max-input
	position: relative
	.message-above,
	.message-below
		position: absolute
		right: $unit-2
	.message-above
		top: -$unit4
	.message-below
		bottom: -$unit3
	.amount-input-outer
		position: relative
		&:not(.with-icon)
			$denom-width: $unit11
			input
				padding-left: $denom-width + $unit1
			#symbol
				width: $denom-width
		&.with-icon
			$denom-width: $unit12
			input
				padding-left: $denom-width + $unit1
			#symbol
				width: $denom-width
		input
			@include border-inline($fg, 2px)
		> *:not(input)
			position: absolute
			top: 50%
			transform: translateY(-50%)
		#symbol
			left: 0
			&:after
				content: ""
				position: absolute
				top: 50%
				right: -1px
				transform: translate(50%, -50%)
				height: $unit4
				width: 2px
				background: $fg
			padding-left: $unit-5
			padding-right: $unit1

			.symbol-icon
				width: $unit5
				height: $unit5
				border-radius: 50%
		#max-button-outer
			$margin: 3px
			right: $margin
			height: calc(100% - #{$margin * 2})
			button
				@include hover-opacity
				padding: 0 $unit4
				height: 100%
				background: $fg

</style>
