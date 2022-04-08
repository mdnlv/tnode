<template lang="pug">
#delegate
	section
		.container.space-items-big
			h1 Staking Portal
			.grid.start.space-items-big
				.half
					.flex.flex-wrap.wrap-space.space-items-horz-big
						.space-items-small
							p.label.small TOTAL ASSETS STAKED
							.flex
								img.loading-medium(v-if="totalDelegationsLoading" src="~/assets/gif/loading-3.gif")
								.h1.delegated-number ${{ totalAssetsDelegated | floorToDP(0) }}
						.vertical-hr.no-mobile
						.space-items-small
							p.label.small YOUR STAKE
							.flex
								img.loading-medium(v-if="totalStakedLoading" src="~/assets/gif/loading-3.gif")
								.h1.delegate-number ${{ totalStaked | floorToDP(0) }}
				.half
					.right
						SearchBox(@search="handleSearch($event)")
	section.big-padding
		#validators.container
			CampaignBanner
			.spacer
			template(v-for="validator of matchingValidators")
				Validator(
					:key="validator.chainId"
					:validator="validator"
				)
				.spacer
			template(v-for="privateValidator of matchingPrivateValidators")
				PrivateValidator(
					:key="privateValidator.chainName"
					:privateValidator="privateValidator"
				)
				.spacer
			template(v-for="validator of matchingValidatorsComingSoon")
				ValidatorComingSoon(
					:key="validator.chainName"
					:validator="validator"
				)
				.spacer
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import Nav from "~/components/NavMenu.vue"
import SearchBox from "~/components/SearchBox.vue"
import Validator from "~/components/Validator.vue"
import PrivateValidator from "~/components/PrivateValidator.vue"
import ValidatorComingSoon from "~/components/ValidatorComingSoon.vue"
import CampaignBanner from "~/components/CampaignBanner.vue"
import {
	Validator as tValidator,
	PrivateValidator as tPrivateValidator,
	ValidatorComingSoon as tValidatorComingSoon,
} from "~/_types"

export default Vue.extend({
	components: {
		Nav,
		Validator,
		PrivateValidator,
		ValidatorComingSoon,
		SearchBox,
		CampaignBanner,
	},
	scrollToTop: true,
	data() {
		return {
			searchValue: "",
			validatorInfoSetter: null as null | NodeJS.Timer,
		}
	},
	head() {
		return {
			title: "Staking Portal",
			meta: [
				{ hid: "description", name: "description", content: "Instant access to the world of staking rewards." },
			],
		}
	},
	computed: {
		validators(): tValidator[] {
			return this.$store.getters["staking/validators"]
		},
		privateValidators(): tPrivateValidator[] {
			return this.$store.getters["staking/privateValidators"]
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
		matchingPrivateValidators(): tPrivateValidator[] {
			return this.privateValidators.filter(item => {
				const regex = new RegExp(this.searchValue, "i")
				return regex.test(item.chainName) || regex.test(item.denomName)
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
		handleSearch(input: string) {
			// const regex = new RegExp(input)
			// console.log(input)
			this.searchValue = input
		},
		async setValidatorInfo() {
			await this.$store.dispatch("staking/getAllValidatorInfo")
		},
	},
})
</script>

<style lang="sass" scoped>

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
