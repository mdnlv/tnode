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
			h2 Step 1: connect your Keplr wallet
			template(v-if="!account || checkingAlreadyLinked")
				.flex.space-items-horz-big
					button.nowrap.flex.space-items-horz-small(@click="connectWallet")
						img.loading-small(v-if="checkingAlreadyLinked" src="~/assets/gif/loading-3.gif")
						span CONNECT WALLET
			template(v-else)
				.flex.space-items-horz-big
					.account.flex.space-items-horz
						img.icon(:src="wallet.icon")
						p.wrap.color-fg3 {{ account.address }}
				.space-items
					p(v-if="alreadyLinked")
						span.color-fg2 This Keplr account is linked to a reward address.&nbsp;
						| Please stand by while we scan these respective blockchains and confirm your reward amount. The following addresses are linked:
					p(v-else) If you have addresses that are not shown here that you would like to claim for, you can repeat this process while connected to the Keplr account that holds those addresses.
					.flex
						#addresses
							table.concise
								tbody
									tr(v-for="address of otherAddresses")
										td {{ address.chainName }}
										td
											.wrap {{ address.address }}
					template(v-if="alreadyLinked")
						p If you would like to check which reward address was linked to this Keplr account, you can press the button below. You will be asked to sign a random piece of text in Keplr to verify that you're the account owner.
						.flex.flex-wrap.space-items-horz
							button.nowrap.flex.space-items-horz-small(@click="fetchRewardAddress")
								img.loading-small(v-if="fetchingRewardAddress" src="~/assets/gif/loading-3.gif")
								span SIGN AND CONFIRM REWARD ADDRESS
							p.small.color-fg(v-if="fetchingRewardAddressMessage") {{ fetchingRewardAddressMessage }}
						p(v-if="fetchedRewardAddress") Reward address: {{ fetchedRewardAddress }}
			template(v-if="alreadyLinked")
				h2 Step 2: check your reward amounts
				p Your rewards are currently being calculated based on blockchain data. Once this process is complete you will be able to check your reward amount and claim from this page.
			template(v-else-if="alreadyLinked !== null")
				template(v-if="account")
					h2 Step 2: specify your rewards address
					p We will send your TNODE to this address. This address should be a BNB Chain address, visible in your Metamask or other BNB Chain compatible wallet. Click the connect wallet button in the top right of this page to autofill. If you were already connected then please confirm that your address is correctly shown here.
					.flex.space-items-horz
						.icon.center(v-html="bnbIcon")
						#reward-address.form
							input(placeholder="Enter your BNB Chain address" v-model="rewardAddress")
				template(v-if="account && rewardAddress")
					h2 Step 3: sign with Keplr and submit
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

</template>

<script lang="ts">
import Vue from "vue"
import axios from "axios"
import { pubkeyToAddress } from "@cosmjs/amino"
import sleep from "await-sleep"
import randomstring from "randomstring"
import {
	Account,
	EVMAccount,
} from "~/_types"

export default Vue.extend({
	scrollToTop: true,
	data() {
		return {
			bnbIcon: require("~/assets/svg/chains/binance-logo.svg?raw"),
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
	},
	watch: {
		rewardAccount: {
			handler(newVal, oldVal) {
				if (!newVal || oldVal === newVal) {
					return
				}
				this.rewardAddress = newVal.address
			},
			immediate: true,
		},
		account: {
			handler(newVal, oldVal) {
				if (!newVal || oldVal === newVal) {
					return
				}
				this.checkIfAlreadyLinked()
			},
			immediate: true,
		},
	},
	mounted() {
		if (this.rewardAccount) {
			this.rewardAddress = this.rewardAccount.address
		}
	},
	methods: {
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
				const [response] = await Promise.all([
					axios.post(`${this.$config.backendUrl}/set-address-link/`, {
						ecosystemId: "cosmos",
						signature,
						signed,
					}),
					sleep(1500), // wait at least 1.5 seconds before showing completion message
				])
				this.message = response.data.message
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

</style>
