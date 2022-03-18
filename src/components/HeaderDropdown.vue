<template lang="pug">
	.header-dropdown
		button.header-dropdown__trigger(:aria-expanded="!!isFocused" @click="onClick")
			slot(name="trigger") {{ text }}
		transition(:name="transition")
			.header-dropdown__content(v-if="isFocused" ref="dropdown" v-click-outside="onClick")
				slot
</template>

<script lang="ts">
import Vue from "vue"
import vClickOutside from "v-click-outside"

export default Vue.extend({
	name: "VDrawer",
	directives: {
		clickOutside: vClickOutside.directive,
	},
	props: {

		text: {
			type: String,
			default: "",
		},

		transition: {
			type: String,
			default: "",
		},
	},

	data: () => ({
		isFocused: false,
	}),

	/*
	computed: {
		isFocused() : boolean {
			return this.$store.getters["web3/dropdownVisible"]
		},
	},
	*/

	methods: {
		onClick() {
			// this.$store.commit("web3/changeDropdownVisible")
			this.isFocused = !this.isFocused
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
		},
	},
})
</script>

<style lang="sass">
.header-dropdown
	display: inline-block
	position: relative

.header-dropdown__content
	position: absolute
	z-index: 5
	right: -$unit9
	min-inline-size: 100%
	margin-top: $unit2
	@media (max-width: $breakpoint-mobile)
		margin-top: $unit2
</style>
