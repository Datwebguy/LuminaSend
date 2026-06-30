import {
	PoolContractV2,
	PoolV2,
	RequestType,
} from "@blend-capital/blend-sdk"
import { signTransaction } from "@stellar/freighter-api"
import {
	Address,
	BASE_FEE,
	Contract,
	Horizon,
	nativeToScVal,
	Networks,
	rpc,
	scValToNative,
	TransactionBuilder,
	xdr,
} from "@stellar/stellar-sdk"
import { config } from "./config"
import { requireTestnet } from "./stellar"

const UNITS_PER_ASSET = 10_000_000n
const SLIPPAGE_NUMERATOR = 995n
const SLIPPAGE_DENOMINATOR = 1_000n
const network = {
	passphrase: config.networkPassphrase,
	rpc: config.rpcUrl,
}
const rpcServer = new rpc.Server(config.rpcUrl)
const horizon = new Horizon.Server(config.horizonUrl)
const blendContract = new PoolContractV2(config.blendPoolId)
const aquariusContract = new Contract(config.aquariusPoolId)

export type EarnProtocol = "aquarius" | "blend"

export type SavingsSnapshot = {
	apy: number
	contractId: string
	kind: "lending" | "liquidity"
	pairedXlm: number
	positionValue: number
	protocol: EarnProtocol
	utilization?: number
	walletBalance: number
	withdrawableUsdc: number
	xlmPerUsdc: number
}

export type SavingsSnapshots = Record<EarnProtocol, SavingsSnapshot>

type AquariusPool = {
	address: string
	deposit_killed: boolean
	reserves: [string, string]
	total_apy: string
	total_share: string
	tokens_addresses: [string, string]
}

type AquariusPoolsResponse = {
	items: AquariusPool[]
}

function toUnits(amount: string) {
	const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(amount.trim())
	if (!match?.[1]) {
		throw new Error("Enter an amount with no more than seven decimal places.")
	}

	const units =
		BigInt(match[1]) * UNITS_PER_ASSET +
		BigInt((match[2] ?? "").padEnd(7, "0"))
	if (units <= 0n) throw new Error("Enter an amount greater than zero.")
	return units
}

function fromUnits(amount: bigint) {
	return Number(amount) / Number(UNITS_PER_ASSET)
}

function rawInteger(amount: string) {
	const [integer] = amount.split(".")
	if (!integer) throw new Error("A protocol returned an invalid reserve amount.")
	return BigInt(integer)
}

function ceilDiv(numerator: bigint, denominator: bigint) {
	return (numerator + denominator - 1n) / denominator
}

function valueVector(values: bigint[]) {
	return xdr.ScVal.scvVec(
		values.map((value) => nativeToScVal(value, { type: "u128" })),
	)
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
		throw new Error("The protocol rejected this transaction on Stellar Testnet.")
	}

	for (let attempt = 0; attempt < 45; attempt += 1) {
		await new Promise((resolve) => window.setTimeout(resolve, 1_000))
		const result = await rpcServer.getTransaction(submitted.hash)
		if (result.status === "SUCCESS") return submitted.hash
		if (result.status === "FAILED") {
			throw new Error("The protocol transaction failed on Stellar Testnet.")
		}
	}

	throw new Error(
		"The transaction is still pending. Check its status on Stellar Expert.",
	)
}

async function buildTransaction(address: string, operation: xdr.Operation) {
	const account = await rpcServer.getAccount(address)
	return new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(operation)
		.setTimeout(180)
		.build()
}

async function simulateAquarius(
	address: string,
	method: string,
	...args: xdr.ScVal[]
) {
	const simulation = await rpcServer.simulateTransaction(
		await buildTransaction(address, aquariusContract.call(method, ...args)),
	)
	if (!rpc.Api.isSimulationSuccess(simulation) || !simulation.result) {
		throw new Error(`Aquarius could not read ${method} from its live pool.`)
	}
	return scValToNative(simulation.result.retval) as unknown
}

async function loadAquariusPool() {
	const url = new URL("/pools/", config.aquariusApiUrl)
	url.searchParams.set("address__in", config.aquariusPoolId)
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error("Aquarius pool data is temporarily unavailable.")
	}
	const payload = (await response.json()) as AquariusPoolsResponse
	const pool = payload.items.find(
		(item) => item.address === config.aquariusPoolId,
	)
	if (!pool) throw new Error("The configured Aquarius pool is not active.")
	if (pool.deposit_killed) {
		throw new Error("Deposits are currently paused for this Aquarius pool.")
	}
	if (
		pool.tokens_addresses[0] !== config.blendUsdcContractId ||
		pool.tokens_addresses[1] !== config.nativeAssetContractId
	) {
		throw new Error("The Aquarius pool assets do not match LuminaSend.")
	}
	return pool
}

async function executeBlendAction(
	action: "deposit" | "withdraw",
	address: string,
	amount: string,
) {
	const requestType =
		action === "deposit"
			? RequestType.SupplyCollateral
			: RequestType.WithdrawCollateral
	const operation = xdr.Operation.fromXDR(
		blendContract.submit({
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
	return submitSorobanTransaction(
		await buildTransaction(address, operation),
		address,
	)
}

async function executeAquariusAction(
	action: "deposit" | "withdraw",
	address: string,
	amount: string,
) {
	const pool = await loadAquariusPool()
	const reserveUsdc = rawInteger(pool.reserves[0])
	const reserveXlm = rawInteger(pool.reserves[1])
	const totalShares = rawInteger(pool.total_share)
	const requestedUsdc = toUnits(amount)

	let operation: xdr.Operation
	if (action === "deposit") {
		const requiredXlm = ceilDiv(requestedUsdc * reserveXlm, reserveUsdc)
		const expectedShares =
			(requestedUsdc * totalShares) / reserveUsdc
		const minShares =
			(expectedShares * SLIPPAGE_NUMERATOR) / SLIPPAGE_DENOMINATOR
		operation = aquariusContract.call(
			"deposit",
			new Address(address).toScVal(),
			valueVector([requestedUsdc, requiredXlm]),
			nativeToScVal(minShares, { type: "u128" }),
		)
	} else {
		const userShares = BigInt(
			String(
				await simulateAquarius(
					address,
					"get_user_shares",
					new Address(address).toScVal(),
				),
			),
		)
		const shareAmount = ceilDiv(requestedUsdc * totalShares, reserveUsdc)
		if (shareAmount > userShares) {
			throw new Error("The withdrawal exceeds your Aquarius LP position.")
		}
		const expectedUsdc = (shareAmount * reserveUsdc) / totalShares
		const expectedXlm = (shareAmount * reserveXlm) / totalShares
		const minUsdc =
			(expectedUsdc * SLIPPAGE_NUMERATOR) / SLIPPAGE_DENOMINATOR
		const minXlm =
			(expectedXlm * SLIPPAGE_NUMERATOR) / SLIPPAGE_DENOMINATOR
		operation = aquariusContract.call(
			"withdraw",
			new Address(address).toScVal(),
			nativeToScVal(shareAmount, { type: "u128" }),
			valueVector([minUsdc, minXlm]),
		)
	}

	return submitSorobanTransaction(
		await buildTransaction(address, operation),
		address,
	)
}

export async function depositSavings(
	protocol: EarnProtocol,
	address: string,
	amount: string,
) {
	await requireTestnet()
	return protocol === "blend"
		? executeBlendAction("deposit", address, amount)
		: executeAquariusAction("deposit", address, amount)
}

export async function withdrawSavings(
	protocol: EarnProtocol,
	address: string,
	amount: string,
) {
	await requireTestnet()
	return protocol === "blend"
		? executeBlendAction("withdraw", address, amount)
		: executeAquariusAction("withdraw", address, amount)
}

export async function loadSavingsSnapshots(
	address: string,
): Promise<SavingsSnapshots> {
	const [pool, account, aquariusPool] = await Promise.all([
		PoolV2.load(network, config.blendPoolId),
		horizon.loadAccount(address),
		loadAquariusPool(),
	])
	const reserve = pool.reserves.get(config.blendUsdcContractId)
	if (!reserve) {
		throw new Error("Circle USDC is not active in the configured Blend pool.")
	}

	const [blendUser, aquariusSharesValue] = await Promise.all([
		pool.loadUser(address),
		simulateAquarius(
			address,
			"get_user_shares",
			new Address(address).toScVal(),
		),
	])
	const walletBalance = account.balances.reduce((balance, entry) => {
		if (
			entry.asset_type !== "native" &&
			"asset_code" in entry &&
			entry.asset_code === "USDC" &&
			entry.asset_issuer === config.usdcIssuer
		) {
			return Number(entry.balance)
		}
		return balance
	}, 0)
	const blendSupply = reserve.totalSupplyFloat()
	const blendLiabilities = reserve.totalLiabilitiesFloat()
	const blendPosition =
		blendUser.getCollateralFloat(reserve) + blendUser.getSupplyFloat(reserve)

	const aquariusShares = BigInt(String(aquariusSharesValue))
	const aquariusTotalShares = rawInteger(aquariusPool.total_share)
	const aquariusUsdcReserve = rawInteger(aquariusPool.reserves[0])
	const aquariusXlmReserve = rawInteger(aquariusPool.reserves[1])
	const aquariusUsdc =
		aquariusTotalShares > 0n
			? (aquariusShares * aquariusUsdcReserve) / aquariusTotalShares
			: 0n
	const aquariusXlm =
		aquariusTotalShares > 0n
			? (aquariusShares * aquariusXlmReserve) / aquariusTotalShares
			: 0n

	return {
		aquarius: {
			apy: Number(aquariusPool.total_apy) * 100,
			contractId: config.aquariusPoolId,
			kind: "liquidity",
			pairedXlm: fromUnits(aquariusXlm),
			positionValue: fromUnits(aquariusUsdc) * 2,
			protocol: "aquarius",
			walletBalance,
			withdrawableUsdc: fromUnits(aquariusUsdc),
			xlmPerUsdc:
				Number(aquariusXlmReserve) / Number(aquariusUsdcReserve),
		},
		blend: {
			apy: reserve.estSupplyApy * 100,
			contractId: config.blendPoolId,
			kind: "lending",
			pairedXlm: 0,
			positionValue: blendPosition,
			protocol: "blend",
			utilization: reserve.getUtilizationFloat() * 100,
			walletBalance,
			withdrawableUsdc: Math.min(
				blendPosition,
				Math.max(0, blendSupply - blendLiabilities),
			),
			xlmPerUsdc: 0,
		},
	}
}
