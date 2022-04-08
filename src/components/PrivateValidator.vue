<template lang="pug">
#private-validator
	#header
		.flex.space-items-horz
			img.icon(:src="privateValidator.icon")
			div
				h2 {{ privateValidator.chainName }}
				h5.denom.label {{ privateValidator.denomName }}
	#contents
		.flex-start.space-items-horz
			p(v-html="privateValidator.innerHtml")
			Tooltip
				template(#tooltip)
					p This node is not currently available for staking
				.icon-smallest.center.info-icon(v-html="infoIcon")
</template>

<script lang="ts">
import Vue from "vue"

import Tooltip from "~/components/ToolTip.vue"
import { PrivateValidator } from "~/_types"

export default Vue.extend({
	components: { Tooltip },
	props: {
		privateValidator: {
			type: Object as Vue.PropType<PrivateValidator>,
			required: true,
		},
	},
	data() {
		return {
			infoIcon: require("~/assets/svg/ui/info-icon.svg?raw"),
		}
	},
})
</script>

<style lang='sass' scoped>

#private-validator
	@media (min-width: $breakpoint-mobile-upper)
		display: table-row
		> *
			display: table-cell
			vertical-align: middle
	img.icon
		// weird css thing, table doesn't size properly without it
		max-width: unset
	#header
		padding: $space
		padding-left: $space-medium
		background: lighten($bg, 2%)
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-right-radius: 0
			border-bottom-right-radius: 0
		@media (max-width: $breakpoint-mobile)
			border-bottom-left-radius: 0
			border-bottom-right-radius: 0
	#contents
		padding: $space
		padding-right: $space-medium
		background: lighten($bg--1, 2%)
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-left-radius: 0
			border-bottom-left-radius: 0
		@media (max-width: $breakpoint-mobile)
			border-top-left-radius: 0
			border-top-right-radius: 0

	/deep/
		.vts-tooltip__content
			width: 410px
</style>
