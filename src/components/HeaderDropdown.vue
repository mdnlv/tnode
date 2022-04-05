<template lang="pug">
	.header-dropdown
		button.header-dropdown__trigger(:aria-expanded="!!isFocused" aria-haspopup="true", @click="onClick")
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
	methods: {
		onClick() {
			this.isFocused = !this.isFocused
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
		},
	},
})
</script>

<style lang="sass">
.header-dropdown
	position: relative

.header-dropdown__content
	position: absolute
	right: -$unit9
	min-width: 100%
	margin-top: $unit2
</style>
