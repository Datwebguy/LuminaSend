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
	aquariusApiUrl: required(
		"PUBLIC_AQUARIUS_API_URL",
		import.meta.env.PUBLIC_AQUARIUS_API_URL,
	),
	aquariusPoolId: required(
		"PUBLIC_AQUARIUS_POOL_ID",
		import.meta.env.PUBLIC_AQUARIUS_POOL_ID,
	),
	blendPoolId: required(
		"PUBLIC_BLEND_POOL_ID",
		import.meta.env.PUBLIC_BLEND_POOL_ID,
	),
	blendUsdcContractId: required(
		"PUBLIC_BLEND_USDC_CONTRACT_ID",
		import.meta.env.PUBLIC_BLEND_USDC_CONTRACT_ID,
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
	nativeAssetContractId: required(
		"PUBLIC_STELLAR_NATIVE_ASSET_CONTRACT_ID",
		import.meta.env.PUBLIC_STELLAR_NATIVE_ASSET_CONTRACT_ID,
	),
	rpcUrl: required(
		"PUBLIC_STELLAR_RPC_URL",
		import.meta.env.PUBLIC_STELLAR_RPC_URL,
	),
	usdcIssuer: required(
		"PUBLIC_STELLAR_USDC_ISSUER",
		import.meta.env.PUBLIC_STELLAR_USDC_ISSUER,
	),
})
