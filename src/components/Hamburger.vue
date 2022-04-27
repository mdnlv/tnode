<template lang="pug">
#hamburger.center.cursor-pointer(@click="toggle")
	svg.icon(viewBox="0 0 70 70" width="28" height="28", :class="{ active: menuActive }")
		title Hamburger icon
		desc The hamburger icon for toggling menu
		rect#top.bar(width="100%" height="8%" y="10")
		rect#medium.bar(width="100%" height="8%" y="30")
		rect#bottom.bar(width="100%" height="8%" y="50")
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
	computed: {
		menuActive() {
			return this.$store.getters["menu/isActive"]
		},
	},
	methods: {
		toggle() {
			this.$store.commit("menu/toggle", null)
		},
	},
})
</script>

<style lang="sass" scoped>
#hamburger
	@include hover-opacity
	.icon
		transform: translateY(4px)
		.bar
			transform-origin: center
			transition: transform 0.5s, opacity 0.25s
			fill: #fff
		&.active
			#top
				transform-origin: center
				transform: translate(-15px, 14px) rotate(45deg)
			#medium
				opacity: 0
			#bottom
				transform: translate(14px, 11px) rotate(135deg)
	@media (max-width: $breakpoint-mobile-mini)
		margin-right: $space-small

</style>
