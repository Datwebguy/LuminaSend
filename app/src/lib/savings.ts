import {
	PoolContractV2,
	PoolV2,
	RequestType,
} from "@blend-capital/blend-sdk"
import { signTransaction } from "@stellar/freighter-api"
import {
	BASE_FEE,
	Horizon,
	Networks,
	rpc,
	TransactionBuilder,
	xdr,
} from "@stellar/stellar-sdk"
import { config } from "./config"
import { requireTestnet } from "./stellar"

const STROOPS_PER_UNIT = 10_000_000n
const network = {
	passphrase: config.networkPassphrase,
	rpc: config.rpcUrl,
}
const rpcServer = new rpc.Server(config.rpcUrl)
const horizon = new Horizon.Server(config.horizonUrl)
const poolContract = new PoolContractV2(config.blendPoolId)

export type SavingsSnapshot = {
	apy: number
	poolLiquidity: number
	supplied: number
	utilization: number
	walletBalance: number
}

function toUnits(amount: string) {
	const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(amount.trim())
	if (!match?.[1]) {
		throw new Error("Enter an amount with no more than seven decimal places.")
	}

	const units =
		BigInt(match[1]) * STROOPS_PER_UNIT +
		BigInt((match[2] ?? "").padEnd(7, "0"))
	if (units <= 0n) throw new Error("Enter an amount greater than zero.")
	return units
}

function freighterError(value: unknown) {
	return (value as { error?: string })?.error
}

async function signXdr(transactionXdr: string, address: string) {
	const signed = await signTransaction(transactionXdr, {
		address,
		networkPassphrase: Networks.TESTNET,
	})
	const error = freighterError(signed)
	if (error) throw new Error(error)

	const signedXdr = (signed as { signedTxXdr?: string }).signedTxXdr
	if (!signedXdr) throw new Error("Freighter did not return a signature.")
	return signedXdr
}

async function submitSorobanTransaction(
	transaction: ReturnType<TransactionBuilder["build"]>,
	address: string,
) {
	const prepared = await rpcServer.prepareTransaction(transaction)
	const signedXdr = await signXdr(prepared.toXDR(), address)
	const signed = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
	const submitted = await rpcServer.sendTransaction(signed)

	if (submitted.status === "ERROR") {
		throw new Error("Blend rejected this transaction on Stellar Testnet.")
	}

	for (let attempt = 0; attempt < 45; attempt += 1) {
		await new Promise((resolve) => window.setTimeout(resolve, 1_000))
		const result = await rpcServer.getTransaction(submitted.hash)
		if (result.status === "SUCCESS") return submitted.hash
		if (result.status === "FAILED") {
			throw new Error("The Blend transaction failed on Stellar Testnet.")
		}
	}

	throw new Error(
		"The transaction is still pending. Check its status on Stellar Expert.",
	)
}

async function executeSavingsAction(
	action: "deposit" | "withdraw",
	address: string,
	amount: string,
) {
	await requireTestnet()
	const account = await rpcServer.getAccount(address)
	const requestType =
		action === "deposit"
			? RequestType.SupplyCollateral
			: RequestType.WithdrawCollateral
	const operation = xdr.Operation.fromXDR(
		poolContract.submit({
			from: address,
			requests: [
				{
					address: config.blendUsdcContractId,
					amount: toUnits(amount),
					request_type: requestType,
				},
			],
			spender: address,
			to: address,
		}),
		"base64",
	)
	const transaction = new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(operation)
		.setTimeout(180)
		.build()

	return submitSorobanTransaction(transaction, address)
}

export function depositSavings(address: string, amount: string) {
	return executeSavingsAction("deposit", address, amount)
}

export function withdrawSavings(address: string, amount: string) {
	return executeSavingsAction("withdraw", address, amount)
}

export async function requestBlendTestAssets(address: string) {
	await requireTestnet()
	const response = await fetch(
		`${config.blendFaucetUrl}?userId=${encodeURIComponent(address)}`,
	)
	if (!response.ok) {
		throw new Error("Blend's Testnet faucet could not prepare the transaction.")
	}

	const body = (await response.text()).trim()
	const transactionXdr = body.startsWith('"') ? JSON.parse(body) : body
	if (typeof transactionXdr !== "string" || !transactionXdr.trim()) {
		throw new Error("Blend's Testnet faucet returned an invalid transaction.")
	}

	const signedXdr = await signXdr(transactionXdr, address)
	const transaction = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
	const submitted = await horizon.submitTransaction(transaction)
	return submitted.hash
}

export async function loadSavingsSnapshot(
	address: string,
): Promise<SavingsSnapshot> {
	const [pool, account] = await Promise.all([
		PoolV2.load(network, config.blendPoolId),
		horizon.loadAccount(address),
	])
	const reserve = pool.reserves.get(config.blendUsdcContractId)
	if (!reserve) {
		throw new Error("The configured USDC reserve is not active in this Blend pool.")
	}

	const user = await pool.loadUser(address)
	const walletBalance = account.balances.reduce((balance, entry) => {
		if (
			entry.asset_type !== "native" &&
			"asset_code" in entry &&
			entry.asset_code === "USDC" &&
			entry.asset_issuer === config.blendUsdcIssuer
		) {
			return Number(entry.balance)
		}
		return balance
	}, 0)
	const totalSupply = reserve.totalSupplyFloat()
	const totalLiabilities = reserve.totalLiabilitiesFloat()

	return {
		apy: reserve.estSupplyApy * 100,
		poolLiquidity: Math.max(0, totalSupply - totalLiabilities),
		supplied:
			user.getCollateralFloat(reserve) + user.getSupplyFloat(reserve),
		utilization: reserve.getUtilizationFloat() * 100,
		walletBalance,
	}
}
