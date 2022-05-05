<template lang="pug">
#layout-default.layout
	Header
	NavMenu
	Notifications
	main(:class="{ folded: !menuActive }")
		nuxt
		Footer
</template>

<script lang="ts">
import Vue from "vue"

import { POSITION } from "vue-toastification"
import Notifications from "~/components/Notifications.vue"
import Header from "~/components/Header.vue"
import NavMenu from "~/components/NavMenu.vue"
import Footer from "~/components/Footer.vue"

export default Vue.extend({
	components: {
		Header,
		NavMenu,
		Notifications,
		Footer,
	},
	computed: {
		menuActive() {
			return this.$store.getters["menu/isActive"]
		},
	},
	created() {
		if (process.client) {
			const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
			const toastMessage = "Please use Chrome or Brave browser."
			if (isSafari) {
				this.$toast.info(toastMessage, {
					id: 1,
					draggable: true,
					closeButton: false,
					timeout: 5000,
					position: POSITION.BOTTOM_RIGHT,
				})
			}
		}
	},
})
</script>

<style lang="sass" scoped>
#layout-default
	background: $bg--1
	main
		overflow-x: hidden
		background: $bg--2
		> *:not(footer)
			min-height: calc(100vh - #{$unit4} - #{$unit5} * 2 - #{$header-height} - 10px)
			> *:first-child:not(#hero):not(.no-top-padding):not(.with-back-button)
				@include medium-vert-padding-top
			> *.with-back-button
				padding-top: $unit2
			> *:last-child
				@include big-vert-padding-bottom
		margin-left: #{$nav-width}
		@media (max-width: $breakpoint-mobile)
			width: 100vw
			&.folded
				margin-left: 0

</style>
