<template lang="pug">
#index
	section
		.container
			h2 Overview
	section.big-padding
		.container
			.grid.big-padding
				.quarter
					.box.flex-space-between
						.space-items-big.center
							.page-icon(v-html="delegateIcon")
							.space-items.center
								h3.center-text STAKING PORTAL
								p.center-text Easily stake your native tokens in our trusted validator node
						nuxt-link.button.pill(to="/staking-portal") GO TO STAKE
				.quarter
					.box.flex-space-between
						.space-items-big.center
							.page-icon(v-html="vaultsIcon")
							.space-items.center
								h3.center-text THE VAULTS
								p.center-text
									|TNODE boost Vault
									br
									|High xAPY Vault
									br
									|Timed Vault
									br
									|Promotional Vault
						nuxt-link.button.pill(to="/the-vaults") GO TO VAULTS
				.quarter
					.box.flex-space-between.coming-soon
						.space-items-big.center
							.page-icon(v-html="liquidStakingIcon")
							.space-items.center
								h3.center-text LIQUID STAKING
								p.center-text
									|DVPN to tDVPN
									br
									|REGEN to tREGEN
									br
									|NODL to tNODL
						nuxt-link.button.pill(to="#") GO TO LIQUID STAKING
				.quarter
					.box.flex-space-between.coming-soon
						.space-items-big.center
							.page-icon(v-html="governanceIcon")
							.space-items.center
								h3.center-text MULTICHAIN GOVERNANCE
								p.center-text Vote on Trusted Node proposals as well and your delegated voting power
						nuxt-link.button.pill(to="#") GO TO GOVERNANCE

</template>

<script lang="ts">
import Vue from "vue"
import Nav from "~/components/NavMenu.vue"
import SearchBox from "~/components/SearchBox.vue"
import Validator from "~/components/Validator.vue"
import ValidatorComingSoon from "~/components/ValidatorComingSoon.vue"
import { Validator as tValidator } from "~/_types"

export default Vue.extend({
	components: {
		Nav,
		Validator,
		ValidatorComingSoon,
		SearchBox,
	},
	scrollToTop: true,
	data() {
		return {
			delegateIcon: require("~/assets/svg/ui/delegate-icon.svg?raw"),
			vaultsIcon: require("~/assets/svg/ui/vaults-icon.svg?raw"),
			liquidStakingIcon: require("~/assets/svg/ui/liquidstaking-icon.svg?raw"),
			governanceIcon: require("~/assets/svg/ui/governance-icon.svg?raw"),
		}
	},
	head() {
		return {
			title: "Staking Rewards App",
			meta: [
				{ hid: "description", name: "description", content: "Instant access to the world of staking rewards." },
			],
		}
	},
	computed: {
		validators(): tValidator {
			return this.$store.getters.validators
		},
		validatorsComingSoon(): tValidator {
			return this.$store.getters.validatorsComingSoon
		},
	},
})
</script>

<style lang="sass" scoped>

#index
	.search
		input
			width: $unit17
			border: 2px solid white
	@media (max-width: $breakpoint-tablet)
		.container
			padding: 0
	@media (max-width: $breakpoint-tablet)
		.grid
			display: block
			.quarter
				width: 100%
				&:not(:last-child)
					margin-bottom: $space-big
				.box
					height: auto
					.button
						margin-top: $space-big
	.box
		background: $bg
		padding: $unit7 $unit5
		@include rounded-bigger
		height: $unit20
		flex-direction: column
		.page-icon
			/deep/
				svg
					height: $unit11!important
					width: $unit11!important
		&:not(.coming-soon)
			.page-icon
				/deep/
					svg
						path
							fill: $fg2!important
		&.coming-soon
			position: relative
			&:after
				content: "COMING SOON"
				position: absolute
				background: $fg2
				padding: $unit-1 $unit3
				top: -$unit3
				right: -$unit1
				border-radius: $unit10
				color: $bg-1
			.button
				opacity: $opacity1
				pointer-events: none

</style>
