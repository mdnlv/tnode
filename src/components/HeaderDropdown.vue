<template lang="pug">
	div(:class="['vts-dropdown', classes.root]", @focus="isFocused = true", @blur="isFocused = false")
		button(:aria-expanded="!!isFocused", aria-haspopup="true", :class="['vts-dropdown__trigger', classes.trigger]", @click="onFocusout")
			slot(name="trigger") {{ text }}
		transition(:name="transition")
			div.vts-dropdown__content(v-if="!!isFocused", :class="[`vts-dropdown__content--${position}`, classes.content]")
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

		position: {
			type: String,
			default: "bottom",
			validator(value) {
				return ["top", "bottom"].includes(value)
			},
		},

		transition: {
			type: String,
			default: "",
		},
		classes: {
			type: Object,
			default: () => ({}),
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

<style>
.vts-dropdown {
  display: inline-block;
  position: relative;
}
.vts-dropdown__content {
  position: absolute;
  z-index: 5;
  min-inline-size: 100%;
}
.vts-dropdown__content--top {
  inset-block-start: 0;
  transform: translateY(-100%);
}
</style>
