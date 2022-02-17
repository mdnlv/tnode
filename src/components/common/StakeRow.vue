<template lang="pug">
	#stake-row.flex-space-between
		div
			.label.small Staked to&nbsp;
				a(target="_blank", :href="toLink(address, validator.linkTemplate)") {{ this.address | accountAddress }}
			h6 {{ amount | floorToDP(6) }} {{ symbol }}
		button.bare.big-text(@click="$emit('setSrcDelegation')")
			span.icon(v-html="refreshIcon")
			| RESTAKE
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import { toLink } from "~/_utils"
import { Validator } from "~/_types"

export default Vue.extend({
	props: {
		validator: {
			type: Object as Vue.PropType<Validator>,
			required: true,
		},
		address: {
			type: String as Vue.PropType<string>,
			default: null,
		},
		amount: {
			type: bn as Vue.PropType<bn>,
			required: true,
		},
		symbol: {
			type: String as Vue.PropType<string>,
			required: true,
		},
	},
	data() {
		return {
			refreshIcon: require("~/assets/svg/ui/refresh.svg?raw"),
		}
	},
	methods: {
		toLink,
	},
})
</script>

<style lang="sass" scoped>
#stake-row
	margin-left: -$space-big
	margin-right: -$space-big
	padding: $unit1 $space-big

	a
		@include hover-opacity
		text-decoration: underline

	&.highlight
		background-color: $bg2
</style>
