import {
	getAddress,
	getNetwork,
	isConnected,
	requestAccess,
	signTransaction,
} from "@stellar/freighter-api"
import {
	Asset,
	BASE_FEE,
	Horizon,
	Memo,
	Networks,
	Operation,
	StrKey,
	TransactionBuilder,
} from "@stellar/stellar-sdk"
import { config } from "./config"

export const TESTNET = {
	horizonUrl: config.horizonUrl,
	networkPassphrase: config.networkPassphrase,
	friendbotUrl: config.friendbotUrl,
	usdcIssuer: config.usdcIssuer,
} as const

export type AssetCode = "XLM" | "USDC"

export type WalletBalances = {
	xlm: number
	xlmAvailable: number
	usdc: number
}

export type Activity = {
	amount?: number
	asset?: AssetCode
	counterparty?: string
	createdAt: string
	direction?: "sent" | "received"
	hash: string
	id: string
	kind: "payment" | "transaction"
	label: string
}

export type PaymentInput = {
	address: string
	amount: string
	asset: AssetCode
	memo?: string
	recipient: string
}

const horizon = new Horizon.Server(TESTNET.horizonUrl)
const STROOPS_PER_UNIT = 10_000_000n

function normalizeAmount(value: string) {
	const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(value.trim())
	if (!match?.[1]) {
		throw new Error("Enter an amount with no more than seven decimal places.")
	}
	const fraction = (match[2] ?? "").padEnd(7, "0")
	const stroops = BigInt(match[1]) * STROOPS_PER_UNIT + BigInt(fraction)
	if (stroops <= 0n) throw new Error("Enter an amount greater than zero.")
	const whole = stroops / STROOPS_PER_UNIT
	const remainder = (stroops % STROOPS_PER_UNIT)
		.toString()
		.padStart(7, "0")
		.replace(/0+$/, "")
	return remainder ? `${whole}.${remainder}` : whole.toString()
}

function unwrapConnected(value: unknown) {
	if (typeof value === "boolean") return value
	return Boolean((value as { isConnected?: boolean })?.isConnected)
}

function errorMessage(value: unknown) {
	return (value as { error?: string })?.error
}

export async function restoreFreighterAddress() {
	const connection = await isConnected()
	if (!unwrapConnected(connection)) return null

	const result = await getAddress()
	if (errorMessage(result)) return null
	const address = (result as { address?: string }).address
	if (!address) return null
	await requireTestnet()
	return address
}

export async function connectFreighter() {
	const connection = await isConnected()
	if (!unwrapConnected(connection)) {
		throw new Error(
			"Freighter was not found. Install the browser extension and try again.",
		)
	}

	const result = await requestAccess()
	const accessError = errorMessage(result)
	if (accessError) throw new Error(accessError)
	const address = (result as { address?: string }).address
	if (!address) throw new Error("Freighter did not return an account address.")

	await requireTestnet()
	return address
}

export async function requireTestnet() {
	const details = await getNetwork()
	const networkError = errorMessage(details)
	if (networkError) throw new Error(networkError)
	const network = (details as { network?: string }).network?.toUpperCase()
	const passphrase = (details as { networkPassphrase?: string }).networkPassphrase
	if (network !== "TESTNET" && passphrase !== Networks.TESTNET) {
		throw new Error("Switch Freighter to Testnet before using LuminaSend.")
	}
}

export function shortAddress(address: string, start = 5, end = 4) {
	if (!address) return ""
	return `${address.slice(0, start)}…${address.slice(-end)}`
}

export async function loadWallet(address: string) {
	try {
		const [account, ledgers] = await Promise.all([
			horizon.loadAccount(address),
			horizon.ledgers().order("desc").limit(1).call(),
		])
		let xlm = 0
		let xlmLiabilities = 0
		let usdc = 0

		for (const balance of account.balances) {
			if (balance.asset_type === "native") {
				xlm = Number(balance.balance)
				xlmLiabilities = Number(balance.selling_liabilities)
			}
			if (
				balance.asset_type !== "native" &&
				"asset_code" in balance &&
				balance.asset_code === "USDC" &&
				balance.asset_issuer === TESTNET.usdcIssuer
			) {
				usdc = Number(balance.balance)
			}
		}

		const latestLedger = ledgers.records[0]
		if (!latestLedger) throw new Error("Stellar Horizon returned no ledger data.")
		const baseReserve = Number(latestLedger.base_reserve_in_stroops) / 10_000_000
		const minimumBalance =
			(2 +
				account.subentry_count +
				account.num_sponsoring -
				account.num_sponsored) *
			baseReserve
		const xlmAvailable = Math.max(
			0,
			xlm - minimumBalance - xlmLiabilities,
		)

		return { xlm, xlmAvailable, usdc } satisfies WalletBalances
	} catch (error) {
		if ((error as { response?: { status?: number } }).response?.status === 404) {
			return { xlm: 0, xlmAvailable: 0, usdc: 0 } satisfies WalletBalances
		}
		throw error
	}
}

export async function loadActivities(address: string): Promise<Activity[]> {
	try {
		const [paymentPage, transactionPage] = await Promise.all([
			horizon.payments().forAccount(address).order("desc").limit(20).call(),
			horizon.transactions().forAccount(address).order("desc").limit(20).call(),
		])

		const payments = paymentPage.records
			.filter(
				(record) =>
					record.type === "payment" &&
					"from" in record &&
					"to" in record &&
					"amount" in record &&
					(record.asset_type === "native" ||
						("asset_code" in record &&
							record.asset_code === "USDC" &&
							"asset_issuer" in record &&
							record.asset_issuer === TESTNET.usdcIssuer)),
			)
			.map((record) => {
				const payment = record as typeof record & {
					amount: string
					asset_code?: string
					asset_type: string
					from: string
					to: string
					transaction_hash: string
				}
				const sent = payment.from === address
				return {
					amount: Number(payment.amount),
					asset: payment.asset_type === "native" ? "XLM" : "USDC",
					counterparty: sent ? payment.to : payment.from,
					createdAt: payment.created_at,
					direction: sent ? "sent" : "received",
					hash: payment.transaction_hash,
					id: payment.id,
					kind: "payment",
					label: sent ? "Sent" : "Received",
				} satisfies Activity
			})

		const paymentHashes = new Set(payments.map((payment) => payment.hash))
		const transactions = transactionPage.records
			.filter((transaction) => !paymentHashes.has(transaction.hash))
			.map((transaction) => ({
				createdAt: transaction.created_at,
				hash: transaction.hash,
				id: transaction.id,
				kind: "transaction",
				label:
					"soroban_meta" in transaction && transaction.soroban_meta
						? "Contract interaction"
						: "Account transaction",
			}) satisfies Activity)

		return [...payments, ...transactions]
			.sort(
				(left, right) =>
					new Date(right.createdAt).getTime() -
					new Date(left.createdAt).getTime(),
			)
			.slice(0, 20)
	} catch (error) {
		if ((error as { response?: { status?: number } }).response?.status === 404) {
			return []
		}
		throw new Error("Could not load payment history from Stellar Horizon.", {
			cause: error,
		})
	}
}

export async function sendPayment(input: PaymentInput) {
	if (!StrKey.isValidEd25519PublicKey(input.recipient)) {
		throw new Error("Enter a valid Stellar account address.")
	}
	const normalizedAmount = normalizeAmount(input.amount)

	await requireTestnet()
	let destination
	try {
		destination = await horizon.loadAccount(input.recipient)
	} catch (error) {
		if ((error as { response?: { status?: number } }).response?.status === 404) {
			throw new Error("The recipient account does not exist on Stellar Testnet.")
		}
		throw error
	}
	const source = await horizon.loadAccount(input.address)
	const asset =
		input.asset === "XLM"
			? Asset.native()
			: new Asset("USDC", TESTNET.usdcIssuer)

	if (input.asset === "USDC") {
		const hasTrustline = destination.balances.some(
			(balance) =>
				balance.asset_type !== "native" &&
				"asset_code" in balance &&
				balance.asset_code === "USDC" &&
				balance.asset_issuer === TESTNET.usdcIssuer,
		)
		if (!hasTrustline) {
			throw new Error("The recipient needs a Testnet USDC trustline first.")
		}
	}

	let builder = new TransactionBuilder(source, {
		fee: BASE_FEE,
		networkPassphrase: Networks.TESTNET,
	}).addOperation(
		Operation.payment({
			destination: input.recipient,
			asset,
			amount: normalizedAmount,
		}),
	)

	if (input.memo?.trim()) {
		builder = builder.addMemo(Memo.text(input.memo.trim().slice(0, 28)))
	}

	const transaction = builder.setTimeout(180).build()
	const signed = await signTransaction(transaction.toXDR(), {
		address: input.address,
		networkPassphrase: Networks.TESTNET,
	})
	const signError = errorMessage(signed)
	if (signError) throw new Error(signError)
	const signedXdr = (signed as { signedTxXdr?: string }).signedTxXdr
	if (!signedXdr) throw new Error("Freighter did not return a signed transaction.")

	const submitted = await horizon.submitTransaction(
		TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET),
	)
	return submitted.hash
}

export async function fundWithFriendbot(address: string) {
	const response = await fetch(
		`${TESTNET.friendbotUrl}?addr=${encodeURIComponent(address)}`,
	)
	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as {
			detail?: string
		} | null
		throw new Error(payload?.detail ?? "Friendbot could not fund this account.")
	}
	return response.json()
}
