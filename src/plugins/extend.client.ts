export default function ({ app }) {
	extend(app, {
		data() {
			return {
				priceSetter: null as null | NodeJS.Timer,
			}
		},
		mounted() {
			// TODO: only connect wallets necessary for page
			window.addEventListener("load", async () => {
				this.$store.commit("loaded", true)
				await this.$nextTick()

				const getPrices = () => {
					this.$store.dispatch("denoms/getCoinGeckoPrices")
					this.$store.dispatch("denoms/getLPPrices")
				}
				getPrices()
				this.priceSetter = setInterval(getPrices, 10 * 1000)

				// trigger wallet onLoad handlers
				;(async () => {
					const walletIds = this.$store.getters["staking/walletIds"]
					for (const walletId of walletIds) {
						await this.$store.dispatch(`staking/wallets/${walletId}/onLoad`)
					}
					await this.$store.dispatch("web3/onLoad")
				})()
			}, { once: true })
		},
		destroyed() {
			if (this.priceSetter !== null) {
				clearInterval(this.priceSetter)
			}
		},
	})
}

function extend(app, mixin) {
	if (!app.mixins) {
		app.mixins = []
	}
	app.mixins.push(mixin)
}
