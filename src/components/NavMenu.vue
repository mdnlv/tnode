<template lang="pug">
#nav-menu(:class="{ active: isMenuFolded, inactive: !isMenuFolded}")
	nav
		ul.menus
			li(v-for="menu in menus")
				nuxt-link.item.flex(v-if="menu.link" :to="menu.link")
					img.icon(:src="iconSrc(menu.icon, menu.name)")
					span.link-text {{ menu.label }}
				.cursor-default.item.flex(v-else class="cursor-default")
					img.icon(:src="iconSrc(menu.icon, menu.name)")
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
					name: "index",
					icon: "overview",
				},
				{
					label: "Staking Portal",
					link: "/staking-portal",
					name: "staking-portal",
					icon: "delegate",
				},
				{
					label: "The Vaults",
					link: "/the-vaults",
					name: "the-vaults",
					icon: "vaults",
				},
				{
					label: "Liquid Staking",
					link: null,
					name: "",
					icon: "liquidstaking",
				},
				{
					label: "Multichain Governance",
					link: null,
					name: "",
					icon: "governance",
				},
			],
		}
	},
	computed: {
		isMenuFolded() {
			return this.$store.getters["menu/isActive"]
		},
	},
	methods: {
		iconSrc(icon: String, name : String) {
			return require("../assets/svg/ui/" + icon + "-" + (this.$nuxt.$route.name === name ? "active" : "icon") + ".svg")
		},
	},
})
</script>

<style lang="sass" scoped>

#nav-menu
	nav
		position: fixed
		left: 0
		top: calc( #{$unit10} + #{$header-padding} * 2 )
		// transition: 0.3s
		width: $nav-width
		white-space: pre-line
		ul.menus
			.item
				padding: $space-medium $unit5
				font-size: $unit-1
				font-weight: bold
				color: $fg
				text-transform: uppercase
				@include hover-opacity
				&:nth-child(2)
					color: $fg
			.cursor-default
				color: $fg2
				opacity: 0.5
				position: relative
				&:after
					font-size: $unit-1
					position: absolute
					bottom: 0
					left: $unit13
					content: "coming soon.."
					text-transform: none
			.icon
				width: $unit3
				height: $unit3
				margin-right: $space-small
			.nuxt-link-exact-active
				color: $color
				.link-text
					position: relative
					display: block
					&::before
						content: ""
						position: absolute
						top: 50%
						left: $unit13
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
