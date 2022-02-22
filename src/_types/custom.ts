import { ethers } from "ethers"
import bn from "big.js"

export type Network = {
	chainId: string
	chainName: string
	rpcUrls: string[]
	nativeCurrency: {
		name: string
		symbol: string
		decimals: number
	}
	blockExplorerUrls: string[]
	gasConfig: {
		gasPrice: string
		gasLimit: number
	}
	txLinkTemplate: string
	swapRouterAddress: string
}

export type Account = {
	chainId: string
	address: string
}

export type EVMAccount = {
	walletId: string
	address: string
}

export type NativeDenom = {
	id: string
	symbol: string
	min: string
	decimals: number
	coinGeckoId?: string
	price: bn | null
	icon: any
}

export type ERC20Denom = Omit<NativeDenom, "min"> & {
	contractAddress: string
	networkName: string
	lpId?: string
	stable: boolean
	userBalance: bn | null
}

export type LPDenom = Pick<ERC20Denom,
		"id"
		| "symbol"
		| "price"
		| "icon"
		| "contractAddress"
		| "decimals"
	> & {
		networkName: string
		denoms: ERC20Denom[]
	}

export type Denom = NativeDenom | ERC20Denom | LPDenom

export type Wallet = {
	id: string
	name: string
	icon: any
	link: string
	accounts: Account[]
}

export type EVMWallet = {
	id: string
	name: string
	icon: any
	link: string
}

export type Validator = {
	chainName: string
	chainId: string
	rpcEndpoint: string
	linkTemplate: string
	txLinkTemplate: string
	address: string
	operatorName: string
	totalDelegated: bn | null
	apr: bn | null
	denom: NativeDenom
	gas: number
	transactionFee: number
	minimumStakingAmount: number | null
	walletId: string
	ecosystemId: string
	disclaimer: string | null
	unstakingDays: number
	userDelegated: bn | null
	loadingPersonalInfo: boolean
	userRewards: bn | null
	promotion: boolean
}

export type ValidatorComingSoon = {
	chainName: string
	icon: any
	denomName: string
}

export type VaultProperty = {
	type: "limit" | "reset" | "maxRewards" | "lockup" | "compounding"
	value?: number
}

export type Vault = {
	name: string
	address: string
	networkName: string
	icon: any
	auditLink: string | null
	apr: bn | null,
	tvl: bn | null,
	closesAt?: Date | null,
	lockup: bn | null,
	promotional: boolean
	userStaked: bn | null
	userBalance: bn | null
	userRewards: bn | null
	stakeDenom: ERC20Denom | LPDenom
	rewardDenom: ERC20Denom
	properties: VaultProperty[]
}

type AnyOtherProps<T extends object> = T & { [key: string]: any }

export type UserActionResponse = {
	hash: string
	status: string
} | {
	message: string
}

export type Delegation = {
	address: string
	amount: bn
}

export type EcosystemModule = {
	getters: AnyOtherProps<{
		id: (any) => string
	}>
	actions: AnyOtherProps<{
		setTotalDelegated: (ctx: any, validator: Validator) => Promise<void>
		setAPR: (ctx: any, validator: Validator) => Promise<void>
		getBalance: (ctx: any, validator: Validator) => Promise<bn>
		getDelegated: (ctx: any, validator: Validator) => Promise<void>
		getRewards: (ctx: any, validator: Validator) => Promise<void>
		getDelegations: (ctx: any, validator: Validator) => Promise<Delegation[] | null>
		delegate: (ctx: any, { amount: number, validator: Validator }) => Promise<UserActionResponse>
		undelegate: (ctx: any, { amount: number, validator: Validator }) => Promise<UserActionResponse>
		claimRewards: (ctx: any, validator: Validator) => Promise<UserActionResponse>
		redelegate: (ctx: any, { amount: bn, validator: Validator, delegation: Delegation }) => Promise<UserActionResponse>
		_handleError: (ctx: any, { error: Error, statusPrefix: string }) => UserActionResponse
	}>
}

export type WalletModule = {
	getters: AnyOtherProps<{
		id: (any) => string
	}>
	actions: AnyOtherProps<{
		installed: (any) => Promise<boolean>
		onLoad: (any) => void
		getAccount: (any, string) => void
		getOfflineSigner: (any, string) => any
	}>
}

export type ETHProvider = ethers.providers.JsonRpcProvider
export type ETHContract = ethers.Contract

export enum SupportedNetworks {
	BSC_MAINNET = "Binance Smart Chain Mainnet",
	BSC_TESTNET = "Binance Smart Chain Testnet",
	ETH_MAINNET = "Ethereum Mainnet",
	ETH_RINKEBY = "Ethereum Testnet Rinkeby",
	ETH_GOERLI = "Ethereum Testnet Görli",
	FTM_MAINNET = "Fantom Opera",
}

export type DropdownOption = {
	icon: string,
	label: string,
	value: SupportedNetworks,
}
