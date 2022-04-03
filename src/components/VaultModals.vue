<template lang="pug">
div
	Modal(
		v-if="loaded"
		:name="`stake-${vault.address}`"
		:loading="!modalLoaded"
		:title="`Stake ${vault.stakeDenom.symbol} to vault`"
	)
		.modal-form.space-items-big.form
			.flex.space-items-horz
				img.icon(:src="vault.stakeDenom.icon")
				.balance
					p.label.small BALANCE IN WALLET
					.h2.number {{ vault.userBalance | floorToDPorE(4) }} {{ vault.stakeDenom.symbol }}
			MaxInput(
				v-model="amount"
				:max="vault.userBalance"
				:symbol="vault.stakeDenom.symbol"
				placeholder="Amount to stake"
			)
			StatusMessage(:message="statusMessage")
			#buttons
				button.bare.big-text(v-if="vault.stakeDenom.denoms", @click="openModal('addLiquidity')") GET LP TOKENS
				button.bare.big-text(@click="stake") STAKE
	Modal(
		v-if="loaded"
		:name="`unstake-${vault.address}`"
		:loading="!modalLoaded"
		:title="`Unstake ${vault.stakeDenom.symbol}`"
	)
		.modal-form.space-items-big.form
			.flex.space-items-horz
				img.icon(:src="vault.stakeDenom.icon")
				.balance
					p.label.small STAKED
					.h2.number {{ vault.userStaked | floorToDPorE(4) }} {{ vault.stakeDenom.symbol }}
			MaxInput(
				v-model="amount"
				:max="vault.userStaked"
				:symbol="vault.stakeDenom.symbol"
				placeholder="Amount to unstake"
			)
			StatusMessage(:message="statusMessage")
			#buttons
				button.bare.big-text(@click="unstake") UNSTAKE
	Modal(
		v-if="loaded"
		:name="`claimRewards-${vault.address}`"
		:loading="!modalLoaded"
		title="Error claiming rewards"
		:height="300"
	)
		#claim-rewards-error
			StatusMessage(:message="statusMessage", position="relative")
	Modal(
		v-if="loaded"
		:name="`transaction-${vault.address}`"
		:title="transactionTitle"
		:width="500"
		:height="500"
	)
		.modal-form.space-items-big
			.space-items-small
				.label.small {{ transactionStatus }}
				.flex-space-between
					template(v-if="transactionType === 'addLiquidity'")
						.space-items-small
							.h2 {{ transactionAmount[0] | floorToDPorE(4) }} {{ transactionDenom[0] }}
							.h2 {{ transactionAmount[1] | floorToDPorE(4) }} {{ transactionDenom[1] }}
					template(v-else)
						.h2 {{ transactionAmount }} {{ transactionDenom }}
					.center(style="transform: scale(1.7)" v-html="arrowRightIcon")
					.center(v-html="actionIcon[transactionType]")
			.space-items
				.label.small TRANSACTION ID
				.wrap.space-items-horz-small
					span {{ transactionHash }}
					a.explorer-link(
						v-if="transactionHash"
						:href="toLink(transactionHash, txLinkTemplate)"
						target="_blank"
						v-html="linkIcon"
					)
				p(v-if="transactionStatus === 'pending'") (please allow time for transaction confirmation)
			#buttons
				button.bare.big-text(@click="closeTransactionModal") CLOSE
</template>

<script lang="ts">
import Vue from "vue"
import Modal from "~/components/Modal.vue"
import MaxInput from "~/components/MaxInput.vue"
import StatusMessage from "~/components/StatusMessage.vue"
import { Vault } from "~/_types"

export default Vue.extend({
	components: {
		MaxInput,
		Modal,
		StatusMessage,
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
		vault: {
			type: Object as Vue.PropType<Vault>,
			required: true,
		},
		openModal: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		stake: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		transactionHash: {
			type: [String, null] as Vue.PropType<string | null>,
			required: true,
		},
		txLinkTemplate: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		transactionStatus: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		transactionTitle: {
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
		unstake: {
			type: Function as Vue.PropType<()=>void>,
			required: true,
		},
		amount: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		transactionDenom: {
			type: String as Vue.PropType<string>,
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
		}
	},
})
</script>
