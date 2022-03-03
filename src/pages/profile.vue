<template lang="pug">
#delegate
	section
		.container.space-items-big
			h1 My Profile
			.flex-start.flex-wrap.wrap-space.space-items-horz-big
				.space-items-small
					p.label.small TOTAL ASSETS
					.flex
						img.loading-medium(v-if="totalDelegationsLoading" src="~/assets/gif/loading-3.gif")
						.h1.delegated-number ${{ totalAssetsDelegated | floorToDP(0) }}
				.vertical-hr.no-mobile
				space-items-small
					p.label.small TOTAL ASSETS DELEGATED
					.flex
						img.loading-medium(v-if="totalDelegationsLoading" src="~/assets/gif/loading-3.gif")
						.h1.delegated-number ${{ totalAssetsDelegated | floorToDP(0) }}
				.vertical-hr.no-mobile
				space-items-small
					p.label.small TOTAL ASSETS STAKED
					.flex
						img.loading-medium(v-if="totalDelegationsLoading" src="~/assets/gif/loading-3.gif")
						.h1.delegated-number ${{ totalAssetsDelegated | floorToDP(0) }}
	section
		.container.flex.space-items-horz
			img.wallet-icon(:src="connectedEVMWallet.icon")
			.flex
				.flex-column.flex-start
					span.green CONNECTED WALLET
					span {{ account.address | accountAddress }}
				.img-copy(v-html="copyIcon")
				span CHANGE
				.flex
					.img-copy(v-html="infoIcon")
					span.green Learn more about linking wallets

	section
		.container.tabs
			input(type="radio" name="tab-btn" id="tab-btn-1" value="" checked)
			label(for="tab-btn-1") VALIDATORS
			input(type="radio" name="tab-btn" id="tab-btn-2" value="")
			label(for="tab-btn-2") VAULTS
			#content-1
				section.big-padding
					#validators
						template(v-for="validator of matchingValidators")
							Validator(
								:key="validator.chainId"
								:validator="validator"
							)
							.spacer
			#content-2
				section.big-padding
					#validators
						template(v-for="validator of matchingValidators")
							Vault(
								:key="validator.chainId"
								:validator="validator"
							)
							.spacer

</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import { chunk } from "lodash"
import Nav from "~/components/NavMenu.vue"
import Validator from "~/components/ValidatorProfile.vue"
import ValidatorComingSoon from "~/components/ValidatorComingSoon.vue"
import Vault from "~/components/VaultProfile.vue"
import {
	Validator as tValidator,
	ValidatorComingSoon as tValidatorComingSoon,
	Wallet,
	EVMAccount,
	EVMWallet,
	Vault as tVault
} from "~/_types"

const ALL_NETWORKS_FILTER = "ALL"

export default Vue.extend({
	components: {
		Nav,
		Validator,
		ValidatorComingSoon,
		Vault,
	},
	scrollToTop: true,
	data() {
		return {
			searchValue: "",
			validatorInfoSetter: null as null | NodeJS.Timer,
			currentTab: "validators" as "validators" | "vaults",
			profileIcon: require("~/assets/svg/profile.svg?raw"),
			copyIcon: require("~/assets/svg/copy.svg?raw"),
			infoIcon: require("~/assets/svg/ui/info-icon.svg?raw"),
			filterIcon: require("~/assets/svg/ui/filter.svg?raw"),
			selectedNetwork: ALL_NETWORKS_FILTER,
		}
	},
	head() {
		return {
			title: "Profile",
			meta: [
				{ hid: "description", name: "description", content: "Profile page." },
			],
		}
	},
	computed: {
		validators(): tValidator[] {
			return this.$store.getters["staking/validators"]
		},
		validatorsComingSoon(): tValidatorComingSoon[] {
			return this.$store.getters["staking/validatorsComingSoon"]
		},
		matchingValidators(): tValidator[] {
			return this.validators.filter(item => {
				const regex = new RegExp(this.searchValue, "i")
				return regex.test(item.chainName) || regex.test(item.denom.symbol)
			})
		},
		matchingValidatorsComingSoon(): tValidatorComingSoon[] {
			return this.validatorsComingSoon.filter(item => {
				const regex = new RegExp(this.searchValue, "i")
				return regex.test(item.chainName) || regex.test(item.denomName)
			})
		},
		totalAssetsDelegated(): string {
			return this.validators.reduce((acc, val) => val.totalDelegated && val.denom.price
				? acc.plus(bn(val.totalDelegated).times(val.denom.price))
				: acc, bn(0)).toString()
		},
		totalDelegationsLoading(): boolean {
			return this.validators.some(v => v.totalDelegated === null)
		},
		totalStaked(): bn {
			return this.$store.getters["staking/totalDelegated"]
		},
		totalStakedLoading(): boolean {
			return this.validators.some(v => v.loadingPersonalInfo)
		},
		account(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
		wallets(): Wallet[] {
			return this.$store.getters["web3/wallets"]
		},
		connectedEVMWallet(): EVMWallet | null {
			return this.$store.getters["web3/wallets"].find(w => w.id === this.account?.walletId) ?? null
		},

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
	mounted() {
		this.setValidatorInfo()
		this.validatorInfoSetter = setInterval(
			() => this.setValidatorInfo(),
			this.$store.getters.refreshInterval,
		)
	},
	destroyed() {
		if (this.validatorInfoSetter !== null) {
			clearInterval(this.validatorInfoSetter)
		}
	},
	methods: {
		async setValidatorInfo() {
			await this.$store.dispatch("staking/getAllValidatorInfo")
		},
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
	@media (max-width: $breakpoint-tablet)
		.container
			padding: 0

.wallet-icon
	height: $unit3
.green
	color: $fg3
	font-size: 0.60em
.img-copy
	margin-left: $unit10

.tabs>input[type="radio"]
	display: none

.tabs>div
	display: none
	padding: 10px 0
	font-size: 16px

#tab-btn-1
	&:checked
		&~#content-1
			display: block

#tab-btn-2
	&:checked
		&~#content-2
			display: block

.tabs
	label
		display: inline-block
		text-align: center
		user-select: none
		transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out
		cursor: pointer
		position: relative
		top: 1px
		color: $fg
		padding: 10px 25px

.tabs>label:not(:first-of-type)
	border-left: none

.tabs>input[type="radio"]:checked+label
	border-bottom: 1px solid $fg

#delegate
	.vertical-hr
		width: 1px
		background: $white
		height: $unit9
	.search
		input
			width: $unit17
			border: 2px solid white
	@media (max-width: $breakpoint-tablet)
		.container
			padding: 0
	#validators
		.spacer
			height: $space-big
		@media (min-width: $breakpoint-mobile-upper)
			display: table
			.spacer
				display: table-row
</style>