<template lang="pug">
VDropdown.nostyle.dropdown(:classes="classes")
	template(v-slot:trigger)
		.flex-space-between
			.flex.space-items-horz-small
				.flex-start.icon(v-html="selectedOption.icon")
				.flex-start.trigger-text {{ selectedOption.label }}
			.flex
				.flex.dropdown-icon-expand(v-html="dropDownIconExpand")
				.flex.dropdown-icon-collapse(v-html="dropDownIconCollapse")
	template(v-slot:default)
		div.dropdown-bg
			div.dropdown-item(v-for="option of options", :class="{ selected: option.value === selectedOption.value }", @click="selectOption(option)")
				.flex.space-items-horz-small
					.flex.start.icon(v-html="option.icon")
					.start {{ option.label }}
</template>

<script lang="ts">
import Vue from "vue"
import { VDropdown } from "vuetensils/src/components"
import { DropdownOption } from "~/_types"

export default Vue.extend({
	components: {
		VDropdown,
	},
	props: {
		options: {
			type: Array as Vue.PropType<DropdownOption[]>,
			required: true,
		},
	},
	data() {
		return {
			classes: {
				trigger: "vts-toggle__label",
			},
			selectedOption: this.options[0],
			dropDownIconCollapse: require("~/assets/svg/ui/arrow_drop_down_collapse.svg?raw"),
			dropDownIconExpand: require("~/assets/svg/ui/arrow_drop_down_expand.svg?raw"),
		}
	},
	methods: {
		selectOption(option) {
			this.selectedOption = option
			this.$emit("select", option)
		},
	},
})
</script>

<style lang="sass" scoped>
/deep/
	.vts-dropdown__trigger
		background: $bg-2
		min-width: $unit18
		@media (max-width: $breakpoint-mobile-small)
			min-width: $unit16
		min-height: 50px
		border-radius: 20px
		border: none
		color: $white
		padding: 0 $unit3
		font-size: $unit2
		font-family: $font
		font-weight: $font-weight-header
		.icon svg
			width: 24px
		.dropdown-icon-collapse
			display: none
			max-height: 24px
	.vts-dropdown__trigger[aria-expanded]
		border-radius: 20px 20px 0 0
		.trigger-text
			text-indent: -9999px
			line-height: 0
		.trigger-text::after
			content: "Select Chain"
			text-indent: 0
			line-height: unset
		.icon svg
			display: none
		.dropdown-icon-expand
			display: none
		.dropdown-icon-collapse
			display: block
	.vts-dropdown__content
		background-color: $bg-2
		border-radius: 0 0 20px 20px
		@include box-shadow
		.dropdown-item
			padding: $unit-5 $unit3
			cursor: pointer
			.icon svg
				width: 24px
		.dropdown-item:last-child
			border-radius: 0 0 20px 20px
		.dropdown-item:hover
			background: $fg
	.vts-dropdown__content:not(:hover)
		.dropdown-item.selected
			background: $fg
</style>
