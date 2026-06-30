import { Networks } from "@stellar/stellar-sdk"

function required(name: string, value: string | undefined) {
	if (!value?.trim()) {
		throw new Error(`Missing required environment variable: ${name}`)
	}
	return value.trim()
}

const networkPassphrase = required(
	"PUBLIC_STELLAR_NETWORK_PASSPHRASE",
	import.meta.env.PUBLIC_STELLAR_NETWORK_PASSPHRASE,
)
const network = required(
	"PUBLIC_STELLAR_NETWORK",
	import.meta.env.PUBLIC_STELLAR_NETWORK,
).toUpperCase()

if (network !== "TESTNET" || networkPassphrase !== Networks.TESTNET) {
	throw new Error("LuminaSend can only be configured for Stellar Testnet.")
}

export const config = Object.freeze({
	blendFaucetUrl: required(
		"PUBLIC_BLEND_FAUCET_URL",
		import.meta.env.PUBLIC_BLEND_FAUCET_URL,
	),
	blendPoolId: required(
		"PUBLIC_BLEND_POOL_ID",
		import.meta.env.PUBLIC_BLEND_POOL_ID,
	),
	blendUsdcContractId: required(
		"PUBLIC_BLEND_USDC_CONTRACT_ID",
		import.meta.env.PUBLIC_BLEND_USDC_CONTRACT_ID,
	),
	blendUsdcIssuer: required(
		"PUBLIC_BLEND_USDC_ISSUER",
		import.meta.env.PUBLIC_BLEND_USDC_ISSUER,
	),
	friendbotUrl: required(
		"PUBLIC_STELLAR_FRIENDBOT_URL",
		import.meta.env.PUBLIC_STELLAR_FRIENDBOT_URL,
	),
	horizonUrl: required(
		"PUBLIC_STELLAR_HORIZON_URL",
		import.meta.env.PUBLIC_STELLAR_HORIZON_URL,
	),
	network,
	networkPassphrase,
	rpcUrl: required(
		"PUBLIC_STELLAR_RPC_URL",
		import.meta.env.PUBLIC_STELLAR_RPC_URL,
	),
	usdcIssuer: required(
		"PUBLIC_STELLAR_USDC_ISSUER",
		import.meta.env.PUBLIC_STELLAR_USDC_ISSUER,
	),
})
