<template lang="pug">
#tiger-node
	section
		.container.space-items-big
			h1 Tiger Node Campaign
	section#eligible-amounts.big-padding
		.container.space-items-big
			.space-items
				p In February we announced our&nbsp;
					a.link(target="_blank" href="https://trustednode.medium.com/1-million-tnode-airdrop-alert-f44310d7818") Tiger Node airdrop
					|&nbsp;for users who staked their assets with us before March 1st and stayed staked through to the end of the month. Users are now able to claim these rewards, based on how much they staked with our Cosmos validators.
			.flex.space-items-horz.step-header(:class="{ complete: isStepComplete(0) }" @click="toggleStep(0)")
				.step-number.bold 1
				h2 Connect your Keplr wallet
			.step-content.container.big-padding.space-items-big
				template(v-if="!account || checkingAlreadyLinked")
					.flex.space-items-horz-big
						button.nowrap.flex.space-items-horz-small(@click="connectWallet")
							img.loading-small(v-if="checkingAlreadyLinked" src="~/assets/gif/loading-3.gif")
							span CONNECT WALLET
				template(v-else-if="!alreadyLinked && !fetchedRewardAddress")
					.flex.space-items-horz-big
						.account.flex.space-items-horz
							img.icon(:src="wallet.icon")
							p.wrap.color-fg3 {{ account.address }}
					.space-items
						p If you have addresses that are not shown here that you would like to claim for, you can repeat this process while connected to the Keplr account that holds those addresses.
						.flex
							#addresses
								table.concise
									tbody
										tr(v-for="address of otherAddresses")
											td {{ address.chainName }}
											td
												.wrap {{ address.address }}
			template(v-if="account")
				.flex.space-items-horz.step-header(:class="{ complete: isStepComplete(1) }" @click="toggleStep(1)")
					.step-number.bold 2
					h2 Specify your rewards address
				.step-content.container.big-padding.space-items-small
					template(v-if="!alreadyLinked && !fetchedRewardAddress")
						.space-items-big
							p We will send your TNODE to this address. This address should be a BNB Chain address, visible in your Metamask or other BNB Chain compatible wallet. Click the connect wallet button in the top right of this page to autofill. If you were already connected then please confirm that your address is correctly shown here.
							.flex.space-items-horz
								.icon.center(v-html="bnbIcon")
								#reward-address.form
									input(placeholder="Enter your BNB Chain address" v-model="rewardAddress", :class="{ error: !isRewardAddressValid }")
								.error-msg(v-if="!isRewardAddressValid") Entered address invalid!
						div
			template(v-if="account && rewardAddress && isRewardAddressValid")
				.flex.space-items-horz.step-header(:class="{ complete: isStepComplete(2) }" @click="toggleStep(2)")
					.step-number.bold 3
					h2 Sign with Keplr and submit
				.step-content.container.big-padding.space-items-big
					template(v-if="!alreadyLinked && !submitted")
						.space-items
							p A Keplr signature that contains your reward address will act as a proof of ownership, which is necessary for us to make sure that we're sending the rewards to the real owner of the account.
							p When you click submit, Keplr will ask you to sign a message that is simply your reward address&nbsp;
								a.link(target="_blank" href="https://www.rapidtables.com/web/tools/base64-decode.html") encoded as base64
								|. Once done, we'll send this signature to our admin and confirm your reward amount. You will then be able to come back to this page to claim.
						.flex.flex-wrap.space-items-horz
							button.nowrap.flex.space-items-horz-small(v-if="!submitted" @click="sign")
								img.loading-small(v-if="submitting" src="~/assets/gif/loading-3.gif")
								span SIGN AND SUBMIT
							p.small.color-fg(v-if="message") {{ message }}
			template(v-if="fetchedRewardAddress || alreadyLinked")
				.flex.space-items-horz.step-header(:class="{ complete: isStepComplete(3) }" @click="toggleStep(3)")
					.step-number.bold 4
					h2 Check your eligible stakes
				.step-content.container.big-padding.space-items-big
					template(v-if="hasEligibleTransactions")
						#transactions.space-items-big
							.space-items(v-for="table of transactionsTables")
								h3 {{ table.chainName }}
								.small address: {{ table.address }}
								.table-outer
									table.list
										tr
											th Time
											th Transaction
											th Amount
											th TX Hash
										tr(v-for="transaction of table.transactions")
											td {{ transaction.block_timestamp | formatDateTime }}
											td {{ transaction.type | typeToReadable }}
											td {{ divBy10toPow(transaction.amount, table.decimals) | floorToDPorE(4) }} {{ table.denomName }}
											td
												a.link(
													v-if="transaction.hash"
													:href="toLink(transaction.hash, table.txLinkTemplate)"
													target="_blank"
												) {{ transaction.hash | accountAddress(10) }}
							p Your total reward amount based on your staking transactions is&nbsp;
								span.color-fg2  {{ calculatedRewards | floorToDPorE(4) }} TNODE
					template(v-else) No eligible transactions, please check that you are connected with the Keplr account you used for staking.
			template(v-if="(fetchedRewardAddress || alreadyLinked) && hasEligibleTransactions")
				.flex.space-items-horz.step-header(:class="{ complete: isStepComplete(4) }" @click="toggleStep(4)")
					.step-number.bold 5
					h2 Check reward amount and claim
				.step-content.container.big-padding.space-items-big
					template(v-if="!totalAmount || totalAmount.eq(0)")
						p Your rewards are currently being calculated based on blockchain data. Once this process is complete you will be able to check your reward amount and claim from this page.
					template(v-else)
						.space-items-big
							.flex.align-items-end.flex-wrap.space-items-horz-big
								.space-items-smaller
									.label.smaller Rewards available to claim now
									LoadingValue(:value="claimableAmount" #default="{ value }" size="medium")
										.total-rewards-amount.number {{ value | floorToDPorE(4) }} TNODE
								.vertical-hr.no-mobile
								.space-items-smaller
									.label.smaller.nowrap Remaining rewards
									LoadingValue(:value="remainingAmount" #default="{ value }" size="medium")
										.other-rewards-amount.number {{ value | floorToDPorE(4) }} TNODE
								.space-items-smaller
									.label.smaller.nowrap Total rewards claimed
									LoadingValue(:value="claimedAmount" #default="{ value }" size="medium")
										.other-rewards-amount.number {{ value | floorToDPorE(4) }} TNODE
								.space-items-smaller
									.label.smaller.nowrap TOTAL REWARDS
									LoadingValue(:value="totalAmount" #default="{ value }" size="medium")
										.other-rewards-amount.number {{ value | floorToDPorE(4) }} TNODE
						.flex.flex-wrap.space-items-horz(v-if="claimableAmount && claimableAmount.gt(0)")
							button.nowarp.flex.space-items-horz-small(@click="claimRewards")
								img.loading-small(v-if="claimingRewards" src="~/assets/gif/loading-3.gif")
								span CLAIM REWARDS
							p.small.color-fg(v-if="claimingRewardsMessage") {{ claimingRewardsMessage }}
						.space-items(v-if="rewardAmountGTCalculated")
							p If your reward amount shown here does not match the reward amount shown in step 4 then please confirm that you are connected to your linked BNB chain address via Metamask or Walletconnect. If you recently linked your accounts then please wait 1 or 2 business days for us to commit the information on-chain.
							.flex.flex-wrap.space-items-horz
								button.nowrap.flex.space-items-horz-small(@click="fetchRewardAddress")
									img.loading-small(v-if="fetchingRewardAddress" src="~/assets/gif/loading-3.gif")
									span SIGN AND CONFIRM REWARD ADDRESS
								p.small.color-fg(v-if="fetchingRewardAddressMessage") {{ fetchingRewardAddressMessage }}
							p(v-if="fetchedRewardAddress") Reward address:&nbsp;
								span.color-fg2 {{ fetchedRewardAddress }}
						.space-items(v-else-if="rewardAmountLTCalculated")
							p Your total reward amount may include rewards from additional linked Keplr accounts

</template>

<script lang="ts">
import Vue from "vue"
import axios from "axios"
import { pubkeyToAddress } from "@cosmjs/amino"
import bn from "big.js"
import sleep from "await-sleep"
import { ethers } from "ethers"
import randomstring from "randomstring"
import {
	Account,
	Denom,
	EVMAccount,
	ETHProvider,
	Network,
	SupportedNetworks,
} from "~/_types"
import { divBy10toPow, toLink } from "~/_utils"
import LoadingValue from "~/components/LoadingValue.vue"
import ToolTip from "~/components/ToolTip.vue"

type tTransactionsTable = {
	[chainId: string]: {
		chainName: string,
		address: string,
		txLinkTemplate: string,
		decimals: number,
		denomName: string
		transactions: {
			chain_id: string,
			type: "stake" | "redelegate-in" | "unstake" | "redelegate-out",
			hash: string,
			amount: string,
			block_timestamp: string,
		}[]
	}
}

export default Vue.extend({
	components: {
		LoadingValue,
		ToolTip,
	},
	filters: {
		typeToReadable(txType: string) {
			return {
				stake: "Stake",
				"redelegate-in": "Redelegate in",
				unstake: "Unstake",
				"redelegate-out": "Redelegate out",
			}[txType]
		},
	},
	scrollToTop: true,
	data() {
		return {
			bnbIcon: require("~/assets/svg/chains/binance-logo.svg?raw"),
			linkIcon: require("~/assets/svg/ui/link.svg?raw"),
			infoIcon: require("~/assets/svg/ui/info-icon.svg?raw"),
			walletInstalled: false,
			chainId: "cosmoshub-4",
			alreadyLinked: null as boolean | null,
			checkingAlreadyLinked: false,
			rewardAddress: "",
			message: null as string | null,
			submitting: false,
			fetchingRewardAddress: false,
			fetchingRewardAddressMessage: null as string | null,
			fetchedRewardAddress: null as string | null,
			submitted: false,
			rewardContractAddress: "0x06bc69567163c10adfafe9ab0b083eb56f8d3765",
			claimableAmount: null as bn | null,
			remainingAmount: null as bn | null,
			totalAmount: null as bn | null,
			claimedAmount: null as bn | null,
			claimingRewards: false,
			claimingRewardsMessage: null as string | null,
			transactionsTables: null as tTransactionsTable | null,
			calculatedRewards: null as bn | null,
		}
	},
	head() {
		return {
			title: "Tiger Node Campaign",
			meta: [
				{ hid: "description", name: "description", content: "Instant access to the world of staking rewards." },
			],
		}
	},
	computed: {
		wallet(): any {
			return this.$store.getters[
				this.walletModuleName("wallet")
			]
		},
		account(): Account | undefined {
			const accounts = this.$store.getters[
				this.walletModuleName("accounts")
			] as Account[]
			return accounts.find(a => a.chainId === this.chainId)
		},
		rewardAccount(): EVMAccount | null {
			return this.$store.getters["web3/account"] as EVMAccount
		},
		connectingWalletError() {
			return this.$store.getters["staking/connectingWalletError"]
		},
		otherAddresses(): { chainName: string, address: string }[] {
			const account = this.account
			if (!account) {
				return []
			}
			return [
				{ chainName: "Sentinel", prefix: "sent" },
				{ chainName: "Regen", prefix: "regen" },
				{ chainName: "Persistence", prefix: "persistence" },
				{ chainName: "Iris", prefix: "iaa" },
				{ chainName: "Cosmos", prefix: "cosmos" },
				{ chainName: "Sifchain", prefix: "sif" },
			].map(({ chainName, prefix }) => ({
				chainName,
				address: pubkeyToAddress(account.pubKey!, prefix),
			}))
		},
		hasEligibleTransactions(): boolean {
			const transactionsTables = this.transactionsTables
			if (!transactionsTables) {
				return false
			}
			for (const chainId of Object.keys(transactionsTables)) {
				const transactions = transactionsTables[chainId].transactions
				if (transactions && transactions.length) {
					return true
				}
			}
			return false
		},
		isRewardAddressValid(): boolean {
			return !this.rewardAddress || ethers.utils.isAddress(this.rewardAddress)
		},
		rewardAmountLTCalculated(): boolean {
			return Boolean(
				this.calculatedRewards
				&& this.totalAmount
				&& bn(bn(this.calculatedRewards).toFixed(4))
					.lt(bn(this.totalAmount).toFixed(4)),
			)
		},
		rewardAmountGTCalculated(): boolean {
			return Boolean(
				this.calculatedRewards
				&& this.totalAmount
				&& bn(bn(this.calculatedRewards).toFixed(4))
					.gt(bn(this.totalAmount).toFixed(4)),
			)
		},
	},
	watch: {
		rewardAccount: {
			async handler(newVal, oldVal) {
				if (!newVal || oldVal === newVal) {
					return
				}
				this.rewardAddress = newVal.address
				await this.getRewards()
			},
			immediate: true,
		},
		account: {
			handler(newVal, oldVal) {
				if (!newVal || oldVal === newVal) {
					return
				}
				this.checkIfAlreadyLinked()
				this.setTransactionsTables()
			},
			immediate: true,
		},
		fetchedRewardAddress: {
			async handler(newVal, oldVal) {
				if (!newVal || oldVal === newVal) {
					return
				}
				await this.getRewards()
			},
			immediate: false,
		},
		alreadyLinked: {
			async handler(alreadyLinked) {
				if (alreadyLinked && this.rewardAddress) {
					await this.getRewards()
				}
			},
			immediate: false,
		},
	},
	mounted() {
		if (this.rewardAccount) {
			this.rewardAddress = this.rewardAccount.address
		}
	},
	methods: {
		toLink,
		divBy10toPow,
		isStepComplete(stepNumber: number) {
			switch (stepNumber) {
				case 0:
					return this.account && !this.checkingAlreadyLinked
				case 1:
					return this.rewardAddress && this.isRewardAddressValid
				case 2:
					return this.fetchedRewardAddress || this.alreadyLinked
				case 3:
					return this.claimableAmount && this.claimableAmount.eq(0)
				case 4:
					return this.claimableAmount && this.claimableAmount.eq(0)
				default:
					return false
			}
		},
		toggleStep(stepNumber: number) {
			// TODO slide up animation does not work in first time after page initialization
			const content = document.getElementsByClassName("step-content")[stepNumber] as any
			if (content.style.maxHeight !== "0px") {
				content.style.maxHeight = 0
			}
			else {
				content.style.maxHeight = content.scrollHeight + "px"
			}
		},
		walletModuleName(route: string): string {
			return `staking/wallets/keplr/${route}`
		},
		async connectWallet() {
			this.$modal.show("connecting-staking-wallet")
			this.$store.commit("staking/connectingWalletId", this.wallet.id)
			await this.$store.dispatch(
				this.walletModuleName("getAccount"),
				this.chainId,
			)
			this.walletInstalled = await this.$store.dispatch(
				this.walletModuleName("installed"),
			)
			if (this.walletInstalled && !this.connectingWalletError) {
				this.$modal.hide("connecting-staking-wallet")
			}
		},
		connectRewardWallet() {
			this.$modal.show("connecting-web3-wallet")
		},
		async checkIfAlreadyLinked() {
			try {
				this.checkingAlreadyLinked = true
				const pubKey = this.account!.pubKey
				const [response] = await Promise.all([
					axios.post(`${this.$config.backendUrl}/get-address-linked/`, {
						ecosystemId: "cosmos",
						pubKey,
					}),
					sleep(1500), // wait at least 1.5 seconds before showing completion message
				])
				this.alreadyLinked = response.data
			}
			catch (e) {
				// eslint-disable-next-line
				console.log(e)
				await sleep(1000)
				this.message = e.response.data.message
			}
			finally {
				this.checkingAlreadyLinked = false
			}
		},
		async fetchRewardAddress() {
			try {
				this.alreadyLinked = true
				this.fetchingRewardAddress = true
				this.fetchingRewardAddressMessage = "signing in Keplr..."
				const { signature, signed } = await this.$store.dispatch(
					this.walletModuleName("signArbitrary"),
					{
						chainId: "cosmoshub-4",
						message: randomstring.generate(10),
					},
				)
				this.fetchingRewardAddressMessage = "submitting signature..."
				const [response] = await Promise.all([
					axios.post(`${this.$config.backendUrl}/get-address-link/`, {
						ecosystemId: "cosmos",
						signature,
						signed,
					}),
					sleep(1500), // wait at least 1.5 seconds before showing completion message
				])
				this.fetchedRewardAddress = response.data
				this.fetchingRewardAddressMessage = null
			}
			catch (e) {
				// eslint-disable-next-line
				console.log(e)
				await sleep(1000)
				this.message = e.response.data.message
			}
			finally {
				this.fetchingRewardAddress = false
			}
		},
		async sign() {
			try {
				this.submitting = true
				this.message = "signing in Keplr..."
				const { signature, signed } = await this.$store.dispatch(
					this.walletModuleName("signArbitrary"),
					{
						chainId: "cosmoshub-4",
						message: this.rewardAddress,
					},
				)
				this.message = "submitting signature..."
				const [setAddressLinkResponse] = await Promise.all([
					axios.post(`${this.$config.backendUrl}/set-address-link/`, {
						ecosystemId: "cosmos",
						signature,
						signed,
					}),
					sleep(1500), // wait at least 1.5 seconds before showing completion message
				])
				this.message = setAddressLinkResponse.data.message
				const [getAddressLinkResponse] = await Promise.all([
					axios.post(`${this.$config.backendUrl}/get-address-link/`, {
						ecosystemId: "cosmos",
						signature,
						signed,
					}),
					sleep(1500), // wait at least 1.5 seconds before showing completion message
				])
				this.fetchedRewardAddress = getAddressLinkResponse.data
				this.fetchingRewardAddressMessage = null
				this.submitted = true
			}
			catch (e) {
				// eslint-disable-next-line
				console.log(e)
				await sleep(1000)
				this.message = e.response.data.message
			}
			finally {
				this.submitting = false
			}
		},
		async setTransactionsTables(): Promise<void> {
			const pubKey = this.account!.pubKey
			const response = await axios.post(`${this.$config.backendUrl}/tiger-node-stakes/`, { pubKey }) as any
			const data = response.data as {
				transactions: {
					chain_id: string,
					type: "stake" | "redelegate-in" | "unstake" | "redelegate-out",
					hash: string,
					amount: string,
					block_timestamp: string,
				}[],
				reward: string,
			}
			this.calculatedRewards = bn(data.reward)
			const transactionsTables: tTransactionsTable = {}
			const chainNameMap = {
				"cosmoshub-4": "Cosmos",
				"sentinelhub-2": "Sentinel",
				"regen-1": "Regen",
				"core-1": "Persistence",
				"irishub-1": "Iris",
				"sifchain-1": "Sifchain",
			}
			const validators = this.$store.getters["staking/validators"]
			const rawTransactions = data.transactions
			for (const transaction of rawTransactions) {
				if (transactionsTables[transaction.chain_id]) {
					transactionsTables[transaction.chain_id].transactions.push(transaction)
				}
				else {
					const chainName = chainNameMap[transaction.chain_id]
					const address = this.otherAddresses.find(address => address.chainName === chainName)!.address
					const validator = validators.find(val => val.chainId === transaction.chain_id)!
					const txLinkTemplate = validator.txLinkTemplate
					const decimals = validator.denom.decimals
					const denomName = validator.denom.symbol
					transactionsTables[transaction.chain_id] = {
						chainName,
						address,
						txLinkTemplate,
						decimals,
						denomName,
						transactions: [transaction],
					}
				}
			}
			this.transactionsTables = transactionsTables
		},
		async getRewards(): Promise<void> {
			if (!this.alreadyLinked || !this.rewardAddress) {
				// eslint-disable-next-line
				console.error("Reward address not fetched!")
				return
			}
			const address = this.rewardAddress
			try {
				const rewardContract = this._getRewardContract()
				const denom = await this.$store.getters["denoms/all"].find(d => d.id === "tnode")! as Denom

				const totalAmount = await rewardContract.totalAmount(address) as bn
				this.totalAmount = totalAmount
					? divBy10toPow(totalAmount.toString(), denom.decimals)
					: null

				const claimableAmount = await rewardContract.claimableAmount(address) as bn
				this.claimableAmount = claimableAmount
					? divBy10toPow(claimableAmount.toString(), denom.decimals)
					: null

				const remainingAmount = await rewardContract.remainingAmount(address) as bn
				this.remainingAmount = remainingAmount
					? divBy10toPow(remainingAmount.toString(), denom.decimals)
					: null

				this.claimedAmount = this.totalAmount
				if (this.totalAmount && this.remainingAmount) {
					this.claimedAmount = this.totalAmount.minus(this.remainingAmount)
				}
			}
			catch (e) {
				// eslint-disable-next-line
				console.error(e)
			}
		},
		async claimRewards(): Promise<void> {
			if (!this.rewardAddress) {
				// eslint-disable-next-line
				console.error("Reward address not fetched!")
				return
			}
			try {
				this.claimingRewards = true
				this.claimingRewardsMessage = "submitting signature..."
				const rewardContract = this._getRewardContract()
				const offlineSigner = await this.$store.dispatch("web3/getOfflineSigner",
					{
						networkName: SupportedNetworks.BSC_MAINNET,
						switchNetwork: true,
					}) as ethers.providers.JsonRpcSigner
				const rewardContractSigner = await rewardContract.connect(offlineSigner)

				const response = await rewardContractSigner.claim()
				if (response.hash) {
					this.claimingRewardsMessage = "waiting for transaction..."
					await this.listenForTransactionComplete(response.hash, 60000)
					this.claimingRewardsMessage = "claim rewards complete"
					await this.getRewards()
				}
			}
			catch (e) {
				// eslint-disable-next-line
				console.error(e)
				this.claimingRewardsMessage = "error on claiming rewards: " + e.message
			}
			finally {
				this.claimingRewards = false
			}
		},
		async listenForTransactionComplete(txHash: string, timeout: number) {
			const provider = this._getViewProvider(SupportedNetworks.BSC_MAINNET)
			const receipt = await provider.waitForTransaction(txHash, 1, timeout)
			if (!receipt) {
				throw new Error("timeout error")
			}
		},
		_getRewardContract() {
			const rewardContractABI = [
				"function claimableAmount(address _investor) view returns (uint256)",
				"function remainingAmount(address _investor) view returns (uint256)",
				"function totalAmount(address _investor) view returns (uint256)",
				"function claim()",
			]
			// TODO update network
			const provider = this._getViewProvider(SupportedNetworks.BSC_MAINNET)
			return new ethers.Contract(this.rewardContractAddress, rewardContractABI, provider)
		},
		_getViewProvider(networkName: string): ETHProvider {
			const networks = this.$store.getters["networks/all"] as Network[]
			const network = networks.find(n => n.chainName === networkName)!
			for (const rpcUrl of network.rpcUrls) {
				try {
					return new ethers.providers.JsonRpcProvider(rpcUrl)
				}
				catch (e) {
					// eslint-disable-next-line no-console
					console.warn("couldn't connect to rpcUrl, trying next")
				}
			}
			return new ethers.providers.Web3Provider(window.ethereum!)
		},
	},
})
</script>

<style lang="sass" scoped>

#tiger-node
	#addresses
		background: $fg3--2
		color: $white
		@include rounded
		padding: $unit-3 $unit-1
	.wrap
		word-wrap: break-word
		word-break: break-all
	#reward-address
		> input
			width: $unit20
			max-width: 100%
		button
			margin-left: $unit2
	.flex-baseline
		display: flex
		align-items: baseline
	.error-msg
		color: #f56b6b
	.step-header
		cursor: pointer
	.step-number
		background: $fg2
		border-radius: 50%
		width: 24px
		height: 24px
		text-align: center
		font-size: $unit2
		color: black
	.step-header.complete
		.step-number
			background: $fg
		h2
			color: $grey
	.step-content
		overflow: hidden
		transition: max-height 0.3s ease-out
	.flex
		&.align-items-end
			align-items: flex-end
	#transactions
		.table-outer
			background: darken($fg3--2, 2%)
			color: $white
			@include rounded
			padding: $unit-3 $unit-1
			max-height: $unit18
			height: auto
			overflow-y: auto
			.link
				color: $fg2
	.total-rewards-amount
		font-size: $unit5
	.other-rewards-amount
		font-size: $unit2
		line-height: $unit6
	.vertical-hr
		width: 1px
		background: $white
		height: $unit9

	/deep/
		.vts-tooltip__content
			width: 700px

</style>
