<template lang="pug">
	.header-dropdown
		button.header-dropdown__trigger(:aria-expanded="!!isFocused" ref="header")
			slot(name="trigger")
		.header-dropdown__content(v-show="isFocused" ref="dropdown")
			slot
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({

	computed: {
		isFocused() : boolean {
			return this.$store.getters["web3/dropdownVisible"]
		},
	},

	mounted() {
		// eslint-disable-next-line nuxt/no-env-in-hooks
		if (process.client) {
			document.addEventListener("click", (e: MouseEvent) => {
				const withinBoundaries = e.composedPath().includes(this.$refs.dropdown as Element)
				const header = e.composedPath().includes(this.$refs.header as Element)
				if (!withinBoundaries && (header || (!header && this.$store.getters["web3/dropdownVisible"]))) {
					this.$store.commit("web3/changeDropdownVisible")
					this.$store.commit("web3/connectingWalletId", null)
					this.$store.commit("web3/connectingWalletError", null)
				}
			})
		}
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
