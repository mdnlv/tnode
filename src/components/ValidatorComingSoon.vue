<template lang="pug">
	#validator
		#header
			.flex.space-items-horz
				img.icon(:src="validator.icon")
				div
					h2 {{ validator.name }}
					h5.denom.label {{ validator.denomName }}
		#contents
			p Coming Soon...
</template>

<script lang="ts">
import Vue from "vue"

import { ValidatorComingSoon } from "~/_types"

export default Vue.extend({
	props: {
		validator: {
			type: Object as Vue.PropType<ValidatorComingSoon>,
			required: true,
		},
	},
})
</script>

<style lang='sass' scoped>

#validator
	@media (min-width: $breakpoint-mobile-upper)
		display: table-row
		> *
			display: table-cell
			vertical-align: middle
	img.icon
		max-width: unset // weird css thing, table doesn't size properly without it
	#header
		padding: $space
		padding-left: $space-medium
		background: $bg
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
		background: $bg--1
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-left-radius: 0
			border-bottom-left-radius: 0
		@media (max-width: $breakpoint-mobile)
			border-top-left-radius: 0
			border-top-right-radius: 0
</style>
