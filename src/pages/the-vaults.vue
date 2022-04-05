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
	section.big-padding
		.container.space-items-big
			.flex.space-items-horz-medium
				.flex.space-items-horz-small
					.center(v-html="filterIcon")
					.center.small FILTER:
				Dropdown(:options="networks", @select="onNetworkSelect")
	section.big-padding.vaults
		.container.space-items-big
			.grid.not-on-tablet.start.big-padding(v-for="vaults of vaultsChunked")
				.half
					Vault(:vault="vaults[0]", :networks="networks")
				.half
					Vault(v-if="vaults[1]", :vault="vaults[1]", :networks="networks")
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import { chunk } from "lodash"
import Nav from "~/components/NavMenu.vue"
import SearchBox from "~/components/SearchBox.vue"
import Vault from "~/components/Vault.vue"
import Dropdown from "~/components/Dropdown.vue"
import { Vault as tVault, DropdownOption, SupportedNetworks } from "~/_types"

const ALL_NETWORKS_FILTER = "ALL"

export default Vue.extend({
	components: {
		Nav,
		SearchBox,
		Vault,
		Dropdown,
	},
	scrollToTop: true,
	data() {
		return {
			searchValue: "",
			filterIcon: require("~/assets/svg/ui/filter.svg?raw"),
			selectedNetwork: ALL_NETWORKS_FILTER,
			networks: [
				{
					icon: require("~/assets/svg/chains/all-chains-logo.svg?raw"),
					label: "All Chains",
					value: ALL_NETWORKS_FILTER,
				},
				{
					icon: require("~/assets/svg/chains/binance-logo.svg?raw"),
					label: "BNB Chain",
					value: SupportedNetworks.BSC_MAINNET,
				},
				// {
				// 	icon: require("~/assets/svg/chains/ethereum-logo.svg?raw"),
				// 	label: "Ethereum Mainnet",
				// 	value: SupportedNetworks.ETH_MAINNET,
				// },
				{
					icon: require("~/assets/svg/chains/fantom-logo.svg?raw"),
					label: "Fantom Opera",
					value: SupportedNetworks.FTM_MAINNET,
				},
			] as DropdownOption[],
		}
	},
	head() {
		return {
			title: "The Vaults",
			meta: [
				{ hid: "description", name: "description", content: "Instant access to the world of staking rewards." },
			],
		}
	},
	computed: {
		allVaults(): tVault[] {
			return this.$store.getters["vaults/all"]
		},
		filteredVaults(): tVault[] {
			return this.filterVaults(this.selectedNetwork)
		},
		vaultsChunked(): tVault[][] {
			return chunk(this.filteredVaults, 2)
		},
		totalAssetsInVaults(): bn {
			return this.filteredVaults.reduce(
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
			return this.filteredVaults.reduce(
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
	methods: {
		onNetworkSelect(selectedOption: DropdownOption) {
			this.selectedNetwork = selectedOption.value
		},
		filterVaults(selectedNetwork: string) {
			return selectedNetwork === ALL_NETWORKS_FILTER
				? this.allVaults
				: this.allVaults.filter(vault => vault.networkName === selectedNetwork)
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
