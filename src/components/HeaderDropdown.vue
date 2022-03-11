<template lang="pug">
	.header-dropdown(@focusout="onFocusout" tabindex="0")
		button.header-dropdown__trigger(:aria-expanded="!!isFocused" aria-haspopup="true", @click="onClick")
			slot(name="trigger") {{ text }}
		transition(:name="transition")
			.header-dropdown__content(v-if="isFocused" @focus="onFocus" @focusout="onFocusout" tabindex="-1")
				slot
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
	name: "VDrawer",
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
			console.log("click")
		},
		onFocus() {
			this.isFocused = true
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
			console.log("focus")
		},
		onFocusout() {
			this.isFocused = false
			this.$store.commit("web3/connectingWalletId", null)
			this.$store.commit("web3/connectingWalletError", null)
			console.log("unfocus")
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
	margin-top: 18px
	@media (max-width: $breakpoint-mobile)
		margin-top: 10px
</style>
