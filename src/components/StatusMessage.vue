<template lang="pug">
#status-message(:class="`position-${position}`")
	.flex.space-items-horz(v-if="message")
		.center.error-icon(v-html="errorIcon")
		p.status-message.color-fg3 {{ message }}
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
	props: {
		message: {
			type: [String] as Vue.PropType<string>,
			default: null,
		},
		position: {
			type: String as Vue.PropType<string>,
			default: "absolute",
		},
	},
	data() {
		return {
			errorIcon: require("~/assets/svg/ui/error_accent.svg?raw"),
		}
	},
})
</script>

<style lang="sass">

#status-message
	&.position-absolute
		position: relative
		height: 0
		> .flex
			position: absolute
			top: 50%
			left: 50%
			transform: translate(-50%, -50%)
			width: fit-content

</style>
