<template lang="pug">
	.header-dropdown(@focus="isFocused = true", @blur="isFocused = false")
		button.header-dropdown__trigger(:aria-expanded="!!isFocused", aria-haspopup="true", @click="onFocusout")
			slot(name="trigger") {{ text }}
		transition(:name="transition")
			.header-dropdown__content(v-if="!!isFocused")
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
		onFocusout() {
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
	right: 0
	min-inline-size: 100%
	margin-top: 18px
	@media (max-width: $breakpoint-mobile)
		margin-top: 10px
</style>
