<template lang="pug">
	.button.bare.flex.space-items-horz.no-padding(v-if="active")
		.img-outer.inline-middle(v-html="claimIcon")
		span.active CLAIM REWARDS
	.flex.space-items-horz.no-padding(v-else)
		.img-outer.inline-middle(v-html="claimGrayIcon")
		span.disable CLAIM REWARDS
</template>

<script lang="ts">
import Vue from "vue"
export default Vue.extend({
	props: {
		small: {
			type: Boolean as Vue.PropType<boolean>,
			default: false,
		},
		active: {
			type: Boolean as Vue.PropType<boolean>,
			default: false,
		},
	},
	data() {
		return {
			claimIcon: require("~/assets/svg/claim_rewards.svg?raw"),
			claimGrayIcon: require("~/assets/svg/claim_gray.svg?raw"),
		}
	},
})
</script>

<style lang="sass" scoped>
	.active
		color: $color
	.disable
		color: #3f505a
</style>
