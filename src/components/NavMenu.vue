<template lang="pug">
#nav-menu(:class="{ active: isMenuFolded, inactive: !isMenuFolded}")
	nav
		ul.menus
			li(v-for="menu in menus")
				component(
					:is="menu.link ? 'nuxt-link' : 'div'"
					:class="{ 'cursor-default': !menu.link }"
					:to="menu.link"
				)
					span.link-text {{ menu.label }}
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
	data() {
		return {
			menus: [
				{
					label: "Overview",
					link: "/",
					iconSrc: "",
				},
				{
					label: "Staking Portal",
					link: "/staking-portal",
					iconSrc: "",
				},
				{
					label: "The Vaults",
					link: "/the-vaults",
					iconSrc: "",
				},
				{
					label: "Liquid Staking",
					link: null,
					iconSrc: "",
				},
				{
					label: "Multichain Governance",
					link: null,
					iconSrc: "",
				},
			],
		}
	},
	computed: {
		isMenuFolded() {
			return this.$store.getters["menu/isActive"]
		},
	},
})
</script>

<style lang="sass" scoped>

#nav-menu
	nav
		position: fixed
		left: 0
		top: calc( #{$unit12} + #{$header-padding} * 2 )
		// transition: 0.3s
		width: $nav-width
		white-space: pre-line
		ul.menus
			a,
			div
				display: block
				padding: $space-medium $space-big
				font-size: $unit1
				font-weight: bold
				color: $fg
				@include hover-opacity
				&:nth-child(2)
					color: $fg
			div
				color: $fg2
				opacity: 0.5
				position: relative
				&:after
					font-size: $unit-1
					position: absolute
					bottom: 0
					left: $unit8
					content: "coming soon.."
			.nuxt-link-exact-active
				color: $color
				.link-text
					position: relative
					display: block
					&::before
						content: ""
						position: absolute
						top: 50%
						right: 0%
						transform: translate(0%, -50%)
						width: $unit-3
						height: $unit5
						background: $blue

@media (max-width: $breakpoint-mobile)
	#nav-menu
		&.inactive
			display: none
		&.active
			display: block
</style>
