<template lang="pug">
div
	Modal(
		v-if="loaded"
		:name="`delegate-${validator.chainId}`"
		:loading="!modalLoaded"
		:title="`Stake ${validator.denom.symbol}`"
		:height="750"
	)
		.modal-form.space-items-big.form
			.flex.space-items-horz
				img.icon(:src="validator.denom.icon")
				.balance
					.label.small balance
					.h2 {{ balance | floorToDP(validator.denom.decimals) }} {{ validator.denom.symbol }}
					p ${{ balance | realValue(validator.denom.price) | floorToDP(2) }}
			MaxInput(
				v-model="amount"
				:max="balance"
				:fees="validator.transactionFee"
				:symbol="validator.denom.symbol"
				placeholder="Amount to stake"
			)
			#alert.flex.space-items-horz
				.icon-small(v-html="infoIcon")
				p This node is operated by&nbsp;
					a(:href="toLink(validator.address, validator.linkTemplate)" target="_blank") {{ validator.operatorName }}
					br
					|Unbonding period: {{ validator.unstakingDays }} days
					template(v-if="validator.disclaimer")
						br
						span {{ validator.disclaimer }}
			.buttons
				p.status-message {{ statusMessage }}
				button.bare.big-text(@click="delegate") STAKE
			.redelegation-form.space-items(v-if="totalDelegation.gt(0)")
				.h2 Restake assets
				p.color-fg3
					|You have a total of {{ totalDelegation | floorToDPorE(6) }} {{ validator.denom.symbol }} currently staked with other validator nodes
				.buttons
					button.bare.big-text(@click="openModal('redelegate')")
						span.icon(v-html="refreshIcon")
						| RESTAKE
	Modal(
		v-if="loaded"
		:name="`undelegate-${validator.chainId}`"
		:loading="!modalLoaded"
		:title="`Unstake ${validator.denom.symbol}`"
	)
		.modal-form.space-items-big.form
			.flex.space-items-horz
				img.icon(:src="validator.denom.icon")
				.balance
					.label.small staked
					.h2 {{ userDelegated | floorToDP(6) }} {{ validator.denom.symbol }}
					p ${{ userDelegated | realValue(validator.denom.price) | floorToDP(2) }}
			MaxInput(
				v-model="amount"
				:max="userDelegated"
				:symbol="validator.denom.symbol"
				placeholder="Amount to unstake"
			)
			div
			.buttons
				p.status-message {{ statusMessage }}
				button.bare.big-text(@click="undelegate") UNSTAKE
	Modal(
		v-if="loaded"
		:name="`claimRewards-${validator.chainId}`"
		:loading="!modalLoaded"
		title="Error claiming rewards"
		:height="300"
	)
		#claim-rewards-error.center
			p.status-message {{ statusMessage }}
	Modal(
		v-if="loaded"
		:name="`redelegate-${validator.chainId}`"
		:title="`Restake ${this.validator.denom.symbol}`"
		:loading="!modalLoaded"
	)
		.modal-form.space-items-big.form
			template(v-if="srcDelegation === null")
				.color-fg3 Already staked assets can be restaked from other validators to Trusted Node’s validator
				div
					template(v-for="(delegation, index) in delegations")
						StakeRow(
							:validator="validator"
							:address="delegation.address"
							:amount="delegation.amount"
							:symbol="validator.denom.symbol"
							@setSrcDelegation="srcDelegation = delegation"
							:class="{highlight: !(index % 2)}"
						)
				div
				.buttons
					button.bare.big-text(@click="openModal('delegate')")
						.color-fg2 CANCEL
			template(v-else)
				.flex.space-items-horz.flex-start
					img.icon(:src="validator.denom.icon")
					.balance
						.label.small Your stake to {{ srcDelegation.address | accountAddress }}
						.h2 {{ srcDelegation.amount | floorToDPorE(6) }} {{ validator.denom.symbol }}
						p ${{ srcDelegation.amount | realValue(validator.denom.price) | floorToDP(2) }}
				MaxInput(
					v-model="amount"
					:max="srcDelegation.amount"
					:symbol="validator.denom.symbol"
					placeholder="Amount to stake"
				)
				.center-text.status-message(v-if="statusMessage") {{ statusMessage }}
				div
				.buttons
					button.bare.big-text(@click="srcDelegation = null")
						.color-fg2 CANCEL
					button.bare.big-text(@click="redelegate")
						span.icon(v-html="refreshIcon")
						| RESTAKE
	Modal(
		v-if="loaded"
		:name="`transaction-${validator.chainId}`"
		:title="transactionTitle"
		:width="500"
		:height="500"
	)
		.modal-form.space-items-big
			.space-items-small
				.label.small {{ transactionStatus }}
				.flex-space-between
					.h2 {{ transactionAmount }} {{ validator.denom.symbol }}
					.center(style="transform: scale(1.7)" v-html="arrowRightIcon")
					.center(v-html="actionIcon[transactionType]")
			.space-items
				.label.small TRANSACTION ID
				.wrap.space-items-horz-small
					span {{ transactionHash }}
					a.explorer-link(
						v-if="transactionHash"
						:href="toLink(transactionHash, validator.txLinkTemplate)"
						target="_blank"
						v-html="linkIcon"
					)
				p(v-if="transactionStatus === 'pending'") (please allow time for transaction confirmation)
			.buttons
				button.bare.big-text(@click="closeTransactionModal") CLOSE
</template>

<script lang="ts">
import Vue from "vue"
import bn from "big.js"
import Modal from "~/components/Modal.vue"
import { Delegation, Validator } from "~/_types"
import { toLink } from "~/_utils"
import MaxInput from "~/components/MaxInput.vue"
import StakeRow from "~/components/common/StakeRow.vue"

export default Vue.extend({
	components: {
		Modal,
		MaxInput,
		StakeRow,
	},
	filters: {
		realValue(amount: bn | null, price: bn | null) {
			return amount === null || price === null
				? null
				: amount.times(price)
		},
	},
	props: {
		loaded: {
			type: Boolean as Vue.PropType<boolean>,
			required: true,
		},
		modalLoaded: {
			type: Boolean as Vue.PropType<boolean>,
			required: true,
		},
		validator: {
			type: Object as Vue.PropType<Validator>,
			required: true,
		},
		openModal: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		transactionHash: {
			type: [String, null] as Vue.PropType<string | null>,
			required: true,
		},
		transactionStatus: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		transactionType: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		transactionAmount: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		closeTransactionModal: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		statusMessage: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		amount: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		balance: {
			type: bn as Vue.PropType<bn>,
			required: true,
		},
		totalDelegation: {
			type: bn as Vue.PropType<bn>,
			required: true,
		},
		userDelegated: {
			type: bn as Vue.PropType<bn>,
			required: true,
		},
		delegate: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		undelegate: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		srcDelegation: {
			type: Object as Vue.PropType<Delegation | null>,
			required: true,
		},
		delegations: {
			type: Array as Vue.PropType<Delegation[]>,
			required: true,
		},
	},
	data() {
		return {
			actionIcon: {
				stake: require("~/assets/svg/ui/delegate-icon.svg?raw"),
				unstake: require("~/assets/svg/ui/undelegate-icon.svg?raw"),
				claimRewards: require("~/assets/svg/ui/claimRewards-icon.svg?raw"),
				addLiquidity: require("~/assets/svg/ui/addLiquidity-icon.svg?raw"),
			},
			arrowRightIcon: require("~/assets/svg/ui/arrow-right.svg?raw"),
			linkIcon: require("~/assets/svg/ui/link.svg?raw"),
			infoIcon: require("~/assets/svg/ui/info-icon.svg?raw"),
		}
	},
	computed: {
		transactionTitle(): string | undefined {
			if (!this.transactionType) {
				return ""
			}
			return {
				delegate: `Stake ${this.validator.denom.symbol}`,
				redelegate: `Restake ${this.validator.denom.symbol}`,
				undelegate: `Unstake ${this.validator.denom.symbol}`,
				claimRewards: `Claim ${this.validator.denom.symbol} rewards`,
			}[this.transactionType]
		},
	},
	methods: {
		toLink,
	},
})
</script>
