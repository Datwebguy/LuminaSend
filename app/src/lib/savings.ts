import { signTransaction } from "@stellar/freighter-api"
import {
	Address,
	BASE_FEE,
	Contract,
	nativeToScVal,
	Networks,
	rpc,
	scValToNative,
	TransactionBuilder,
	type xdr,
} from "@stellar/stellar-sdk"
import { config } from "./config"
import { requireTestnet } from "./stellar"

const STROOPS_PER_XLM = 10_000_000
const server = new rpc.Server(config.rpcUrl)
const contract = new Contract(config.contractId)

export type SavingsSnapshot = {
	accruedYield: number
	apy: number
	principal: number
	rewardReserve: number
}

function toStroops(amount: string) {
	const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(amount.trim())
	if (!match?.[1]) {
		throw new Error("Enter an amount with no more than seven decimal places.")
	}
	const whole = BigInt(match[1])
	const fraction = BigInt((match[2] ?? "").padEnd(7, "0"))
	const stroops = whole * BigInt(STROOPS_PER_XLM) + fraction
	if (stroops <= 0n) throw new Error("Enter an amount greater than zero.")
	return stroops
}

function fromStroops(amount: bigint | number | string) {
	return Number(amount) / STROOPS_PER_XLM
}

function accountArgument(address: string) {
	return new Address(address).toScVal()
}

async function buildTransaction(
	address: string,
	method: string,
	...args: xdr.ScVal[]
) {
	const account = await server.getAccount(address)
	return new TransactionBuilder(account, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	})
		.addOperation(contract.call(method, ...args))
		.setTimeout(180)
		.build()
}

async function signAndSubmit(
	transaction: ReturnType<TransactionBuilder["build"]>,
	address: string,
) {
	const signed = await signTransaction(transaction.toXDR(), {
		address,
		networkPassphrase: Networks.TESTNET,
	})
	if (signed.error) throw new Error(signed.error)
	if (!signed.signedTxXdr) throw new Error("Freighter did not return a signature.")

	const submitted = await server.sendTransaction(
		TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET),
	)
	if (submitted.status === "ERROR") {
		throw new Error("The contract transaction was rejected by Stellar Testnet.")
	}

	for (let attempt = 0; attempt < 30; attempt += 1) {
		await new Promise((resolve) => window.setTimeout(resolve, 1_000))
		const result = await server.getTransaction(submitted.hash)
		if (result.status === "SUCCESS") return submitted.hash
		if (result.status === "FAILED") {
			throw new Error("The contract transaction failed on Stellar Testnet.")
		}
	}
	throw new Error("The transaction is still pending. Check Stellar Expert.")
}

async function executeAmountMethod(
	method: "deposit" | "withdraw",
	address: string,
	amount: string,
) {
	await requireTestnet()
	const transaction = await buildTransaction(
		address,
		method,
		accountArgument(address),
		nativeToScVal(toStroops(amount), { type: "i128" }),
	)
	return signAndSubmit(await server.prepareTransaction(transaction), address)
}

async function simulate(address: string, method: string, ...args: xdr.ScVal[]) {
	const result = await server.simulateTransaction(
		await buildTransaction(address, method, ...args),
	)
	if (!rpc.Api.isSimulationSuccess(result) || !result.result) {
		throw new Error(`Unable to read ${method} from the savings contract.`)
	}
	return scValToNative(result.result.retval) as unknown
}

export function depositSavings(address: string, amount: string) {
	return executeAmountMethod("deposit", address, amount)
}

export function withdrawSavings(address: string, amount: string) {
	return executeAmountMethod("withdraw", address, amount)
}

export async function claimSavingsYield(address: string) {
	await requireTestnet()
	const transaction = await buildTransaction(
		address,
		"claim_yield",
		accountArgument(address),
	)
	return signAndSubmit(await server.prepareTransaction(transaction), address)
}

export async function loadSavingsSnapshot(
	address: string,
): Promise<SavingsSnapshot> {
	const [positionValue, apyBpsValue, rewardReserveValue] = await Promise.all([
		simulate(address, "position", accountArgument(address)),
		simulate(address, "apy_bps"),
		simulate(address, "reward_reserve"),
	])
	const position = positionValue as {
		accrued_yield: bigint
		principal: bigint
	}

	return {
		accruedYield: fromStroops(position.accrued_yield),
		apy: Number(apyBpsValue) / 100,
		principal: fromStroops(position.principal),
		rewardReserve: fromStroops(rewardReserveValue as bigint),
	}
}
