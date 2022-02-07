<template lang="pug">
	#searchbox
		.input-outer.form
			input(:class="{ active: isActive, inactive: !isActive }" @input="handleChange")
			.search-icon.center(@click="toggleActive" alt="Toggle search bar" v-html="searchIcon")
</template>

<script lang="ts">
import Vue from "vue"
type ISearchBox = {
	isActive: boolean
	searchIcon: string
}
export default Vue.extend({
	props: {
		amount: {
			type: Number,
			default: 0,
		},
	},
	data(): ISearchBox {
		return {
			isActive: false,
			searchIcon: require("~/assets/svg/search-icon.svg?raw"),
		}
	},
	methods: {
		toggleActive() {
			this.isActive = !this.isActive
		},

		handleChange(e: InputEvent) {
			this.$emit("search", (e.target as HTMLInputElement).value)
		},
	},
})
</script>

<style lang="sass" scoped>
#searchbox
	max-width: 100%
	.input-outer
		position: relative
		input
			padding-left: $unit7
			width: $unit20
		.search-icon
			position: absolute
			top: 50%
			left: $unit1
			transform: translateY(-50%) scale(0.9) translateY(2px)
</style>
