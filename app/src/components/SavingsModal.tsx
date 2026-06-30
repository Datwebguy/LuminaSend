import {
	Check,
	ExternalLink,
	Info,
	LoaderCircle,
	LockKeyhole,
	TrendingUp,
	X,
} from "lucide-react"
import { useMemo, useState } from "react"
import { depositSavings, withdrawSavings } from "../lib/savings"

export type SavingsAction = "deposit" | "withdraw"

type SavingsModalProps = {
	action: SavingsAction
	address: string
	apy: number
	available: number
	onClose: () => void
	onSuccess: () => Promise<void>
}

type Step = "form" | "signing" | "success"

export default function SavingsModal({
	action,
	address,
	apy,
	available,
	onClose,
	onSuccess,
}: SavingsModalProps) {
	const [amount, setAmount] = useState("")
	const [step, setStep] = useState<Step>("form")
	const [error, setError] = useState("")
	const [hash, setHash] = useState("")
	const numericAmount = Number(amount)
	const isDeposit = action === "deposit"
	const projected = useMemo(
		() => (Number.isFinite(numericAmount) ? (numericAmount * apy) / 100 : 0),
		[apy, numericAmount],
	)
	const canSubmit =
		Number.isFinite(numericAmount) &&
		numericAmount > 0 &&
		numericAmount <= available

	async function submit() {
		setStep("signing")
		setError("")
		try {
			const transactionHash = isDeposit
				? await depositSavings(address, amount)
				: await withdrawSavings(address, amount)
			setHash(transactionHash)
			setStep("success")
			await onSuccess()
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Transaction failed.")
			setStep("form")
		}
	}

	return (
		<div
			className="fixed inset-0 z-[100] grid place-items-end bg-ink/35 backdrop-blur-sm sm:place-items-center sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="savings-dialog-title"
		>
			<div className="w-full rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-[470px] sm:rounded-[28px] sm:p-7">
				{step === "form" && (
					<>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-xs font-bold tracking-widest text-lumina-600 uppercase">
									On-chain savings
								</p>
								<h2
									id="savings-dialog-title"
									className="mt-1 text-2xl font-bold tracking-tight"
								>
									{isDeposit ? "Deposit XLM" : "Withdraw XLM"}
								</h2>
							</div>
							<button
								type="button"
								onClick={onClose}
								className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500"
								aria-label="Close"
							>
								<X size={19} />
							</button>
						</div>

						<div className="mt-6 rounded-3xl bg-gradient-to-br from-lumina-500 to-lumina-700 p-5 text-white">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-white/65">Contract APY</p>
									<p className="mt-1 text-4xl font-bold">{apy.toFixed(2)}%</p>
								</div>
								<div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
									<TrendingUp size={27} />
								</div>
							</div>
							<p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-white/65">
								The rate and position are read directly from the live Soroban
								contract on Stellar Testnet.
							</p>
						</div>

						<div className="mt-6 flex items-end justify-between">
							<label htmlFor="savings-amount" className="text-sm font-bold">
								{isDeposit ? "Deposit amount" : "Withdrawal amount"}
							</label>
							<span className="text-xs text-slate-400">
								{available.toLocaleString(undefined, {
									maximumFractionDigits: 7,
								})}{" "}
								XLM available
							</span>
						</div>
						<div className="input-shell mt-2 flex items-center rounded-2xl border border-slate-200 px-4 py-3 transition">
							<input
								id="savings-amount"
								type="number"
								min="0"
								step="0.0000001"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
								placeholder="0.00"
								className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-slate-300"
							/>
							<span className="font-bold text-slate-500">XLM</span>
						</div>
						<button
							type="button"
							onClick={() => setAmount(String(available))}
							className="mt-2 text-xs font-bold text-lumina-700"
						>
							Use maximum available
						</button>

						<div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
							{isDeposit && (
								<div className="flex justify-between">
									<span className="text-slate-500">
										Projected annual accrual
									</span>
									<span className="font-bold text-lumina-700">
										+{projected.toFixed(7)} XLM
									</span>
								</div>
							)}
							<div
								className={`flex justify-between ${isDeposit ? "mt-3" : ""}`}
							>
								<span className="text-slate-500">Authorization</span>
								<span className="flex items-center gap-1.5 font-bold">
									<LockKeyhole size={14} /> Freighter required
								</span>
							</div>
						</div>
						<div className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-800">
							<Info size={16} className="mt-0.5 shrink-0" />
							Testnet assets have no monetary value. Accrued rewards can only be
							claimed when the contract reward reserve is funded.
						</div>
						{error && (
							<div
								role="alert"
								className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
							>
								{error}
							</div>
						)}
						<button
							type="button"
							disabled={!canSubmit}
							onClick={() => void submit()}
							className="focus-ring mt-6 w-full rounded-2xl bg-lumina-500 px-5 py-4 font-bold text-white transition enabled:hover:bg-lumina-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
						>
							Continue in Freighter
						</button>
					</>
				)}

				{step === "signing" && (
					<div className="py-14 text-center">
						<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lumina-50 text-lumina-600">
							<LoaderCircle className="h-9 w-9 animate-spin" />
						</div>
						<h2 className="mt-7 text-2xl font-bold">Waiting for authorization</h2>
						<p className="mx-auto mt-3 max-w-xs leading-6 text-slate-500">
							Review and approve the {action} transaction in Freighter.
						</p>
					</div>
				)}

				{step === "success" && (
					<div className="py-8 text-center">
						<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lumina-500 text-white">
							<Check className="h-9 w-9" strokeWidth={3} />
						</div>
						<p className="mt-7 text-xs font-bold tracking-widest text-lumina-600 uppercase">
							Transaction confirmed
						</p>
						<h2 className="mt-2 text-3xl font-bold">
							{amount} XLM {isDeposit ? "deposited" : "withdrawn"}
						</h2>
						<p className="mt-3 text-sm text-slate-500">
							Your live contract position has been refreshed.
						</p>
						<a
							href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
							target="_blank"
							rel="noreferrer"
							className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-lumina-700"
						>
							View transaction <ExternalLink size={15} />
						</a>
						<button
							type="button"
							onClick={onClose}
							className="focus-ring mt-8 w-full rounded-2xl bg-ink px-5 py-4 font-bold text-white"
						>
							Done
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
