<template lang="pug">
#vaults
	section
		.container.space-items-big
			h1 The Vaults
			.flex.flex-wrap.wrap-space.space-items-horz-big
				.space-items-small
					p.label.small TOTAL ASSETS IN VAULTS
					.flex
						img.loading-medium(v-if="totalAssetsInVaultsLoading" src="~/assets/gif/loading-3.gif")
						.h2.delegated-number ${{ totalAssetsInVaults | floorToDP(0) }}
				template(v-if="totalStakingInVaults")
					.vertical-hr.no-mobile
					.space-items-small
						p.label.small YOUR STAKE IN VAULTS
						.flex
							img.loading-medium(v-if="totalStakingInVaultsLoading" src="~/assets/gif/loading-3.gif")
							.h2.delegated-number ${{ totalStakingInVaults | floorToDP(0) }}
			//- TODO: add filter box
	section.big-padding.vaults
		.container.space-items-big
			.grid.not-on-tablet.start.big-padding(v-for="vaults of vaultsChunked")
				.half
					Vault(:vault="vaults[0]")
				.half
					Vault(v-if="vaults[1]", :vault="vaults[1]")
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import { chunk } from "lodash"
import Nav from "~/components/NavMenu.vue"
import SearchBox from "~/components/SearchBox.vue"
import Vault from "~/components/Vault.vue"
import { Vault as tVault } from "~/_types"

export default Vue.extend({
	components: {
		Nav,
		SearchBox,
		Vault,
	},
	scrollToTop: true,
	data() {
		return {
			searchValue: "",
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
		vaults(): tVault[] {
			return this.$store.getters["vaults/all"]
		},
		vaultsChunked(): tVault[][] {
			return chunk(this.vaults, 2)
		},
		totalAssetsInVaults(): bn {
			return this.vaults.reduce(
				(acc, v) => acc.plus(v.tvl && v.stakeDenom.price
					? v.tvl.times(v.stakeDenom.price)
					: 0,
				),
				bn(0),
			)
		},
		totalAssetsInVaultsLoading(): boolean {
			return false
		},
		totalStakingInVaults(): bn {
			return this.vaults.reduce(
				(acc, v) => acc.plus(v.userStaked && v.stakeDenom.price
					? v.userStaked.times(v.stakeDenom.price)
					: 0,
				),
				bn(0),
			)
		},
		totalStakingInVaultsLoading(): boolean {
			return false
		},
	},
})
</script>

<style lang="sass" scoped>

#vaults
	.vertical-hr
		width: 1px
		background: $white
		height: $unit8
	.search
		input
			width: $unit17
			border: 2px solid white
	@media (max-width: $breakpoint-tablet)
		.container
			padding: 0
</style>
