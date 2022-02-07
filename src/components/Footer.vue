<template lang="pug">
footer.section.medium-padding
	.container.big-padding
		ul.social-profiles.flex.space-items-horz.flex
			li(v-for="profile in profiles")
				a.profile-icon(
					rel="external"
					:href="profile.url"
					:alt="profile.alt"
					v-html="profile.image"
					target="_blank"
				)
</template>

<script lang="ts">
import Vue from "vue"

type ISocialProfile = {
	url: string
	image: string
	alt: string
}
type IFooter = {
	profiles: ISocialProfile[]
}

export default Vue.extend({
	data(): IFooter {
		return {
			profiles: [
				{
					url: "https://www.twitter.com/trustednode",
					image: require("~/assets/svg/social-media/ico-twitter.svg?raw"),
					alt: "Trusted Node Twitter link",
				},
				{
					url: "https://t.me/trustednode_io",
					image: require("~/assets/svg/social-media/ico-telegram.svg?raw"),
					alt: "Trusted Node Telegram link",
				},
				{
					url: "https://trustednode.medium.com/",
					image: require("~/assets/svg/social-media/ico-medium.svg?raw"),
					alt: "Trusted Node Medium link",
				},
			],
		}
	},
})
</script>

<style lang="sass" scoped>
footer
	.social-profiles
		justify-content: flex-end
		align-items: center
		@media (max-width: $breakpoint-mobile)
			justify-content: center

		li:first-child
			.profile-icon
				transform: scale(1.2)
		.profile-icon
			display: block
			@include hover-scale-opacity
			/deep/
				svg
					height: $unit4
					path
						fill: #03DAC5
</style>
