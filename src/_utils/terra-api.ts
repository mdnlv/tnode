// TODO: consolidate this file with ecosystem for portability
import axios from "axios"
import { LCDClient, MsgBeginRedelegate } from "@terra-money/terra.js"
import { getChainOptions } from "@terra-money/wallet-provider"

export const ASSETS = "https://assets.terra.money"
export const DEFAULT_GAS_ADJUSTMENT = 1.75

export const terraAPIURL = (network?: string) => {
	return {
		mainnet: "https://api.terra.dev",
		testnet: "https://bombay-api.terra.dev",
	}[network ?? "mainnet"]
}

export const getNetwork = async () => {
	const networks = await getChainOptions()
	return networks.defaultNetwork ?? networks.defaultNetwork
}

export const getGasPrices = async () => {
	const baseURL = terraAPIURL("mainnet")
	const path = "/gas-prices"
	const { data } = await axios.get(path, { baseURL })
	return data
}

export const getEstimatedGasPrice = async (msg: MsgBeginRedelegate, address: string, gasPrice: number, denom: string = "uluna") => {
	const network = await getNetwork()
	const config = {
		...network,
		URL: network.lcd,
		gasPrices: { [denom]: gasPrice },
	}

	const lcd = new LCDClient(config)

	const unsignedTx = await lcd.tx.create([{ address }], {
		msgs: [msg],
		feeDenoms: [denom],
	})

	return Math.ceil(unsignedTx.auth_info.fee.gas_limit * DEFAULT_GAS_ADJUSTMENT)
}
