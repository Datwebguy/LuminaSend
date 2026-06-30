import {
	ArrowLeft,
	Check,
	ChevronDown,
	ExternalLink,
	LoaderCircle,
	Send,
	X,
} from "lucide-react"
import { useMemo, useState } from "react"
import {
	sendPayment,
	shortAddress,
	type AssetCode,
	type PaymentInput,
} from "../lib/stellar"

type SendModalProps = {
	address: string
	balances: { xlm: number; xlmAvailable: number; usdc: number }
	onClose: () => void
	onSuccess: () => Promise<void>
}

type Step = "form" | "review" | "signing" | "success"

export default function SendModal({
	address,
	balances,
	onClose,
	onSuccess,
}: SendModalProps) {
	const [step, setStep] = useState<Step>("form")
	const [asset, setAsset] = useState<AssetCode>("USDC")
	const [amount, setAmount] = useState("")
	const [recipient, setRecipient] = useState("")
	const [memo, setMemo] = useState("")
	const [error, setError] = useState("")
	const [hash, setHash] = useState("")
	const balance = asset === "USDC" ? balances.usdc : balances.xlmAvailable
	const fee = asset === "USDC" ? "< 0.01 XLM" : "0.00001 XLM"
	const amountNumber = Number(amount)

	const canContinue = useMemo(
		() =>
			Number.isFinite(amountNumber) &&
			amountNumber > 0 &&
			amountNumber <= balance &&
			recipient.trim().length > 20,
		[amountNumber, balance, recipient],
	)

	async function submit() {
		setStep("signing")
		setError("")
		try {
			const transactionHash = await sendPayment({
				address,
				amount,
				asset,
				memo,
				recipient: recipient.trim(),
			} satisfies PaymentInput)
			setHash(transactionHash)
			setStep("success")
			await onSuccess()
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "The transfer failed.")
			setStep("review")
		}
	}

	return (
		<div
			className="fixed inset-0 z-[100] grid place-items-end bg-ink/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="send-title"
		>
			<div className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-[490px] sm:rounded-[28px] sm:p-7">
				{step !== "signing" && step !== "success" && (
					<div className="mb-7 flex items-center justify-between">
						<div className="flex items-center gap-3">
							{step === "review" && (
								<button
									type="button"
									className="focus-ring grid h-9 w-9 place-items-center rounded-full bg-slate-100"
									onClick={() => setStep("form")}
								>
									<ArrowLeft size={18} />
								</button>
							)}
							<div>
								<p className="text-xs font-bold tracking-widest text-lumina-600 uppercase">
									{step === "form" ? "New transfer" : "One last look"}
								</p>
								<h2 id="send-title" className="mt-1 text-2xl font-bold tracking-tight">
									{step === "form" ? "Send money" : "Review transfer"}
								</h2>
							</div>
						</div>
						<button
							type="button"
							className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500"
							onClick={onClose}
							aria-label="Close"
						>
							<X size={19} />
						</button>
					</div>
				)}

				{step === "form" && (
					<form
						onSubmit={(event) => {
							event.preventDefault()
							if (canContinue) setStep("review")
						}}
					>
						<label className="text-sm font-bold text-slate-700" htmlFor="recipient">
							Recipient
						</label>
						<div className="input-shell mt-2 rounded-2xl border border-slate-200 px-4 py-3 transition">
							<input
								id="recipient"
								value={recipient}
								onChange={(event) => setRecipient(event.target.value)}
								placeholder="G... Stellar address"
								autoComplete="off"
								className="w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
							/>
						</div>

						<div className="mt-6 flex items-end justify-between">
							<label className="text-sm font-bold text-slate-700" htmlFor="amount">
								Amount
							</label>
							<p className="text-xs text-slate-400">
								Available:{" "}
								<span className="font-bold text-slate-600">
									{balance.toLocaleString(undefined, {
										maximumFractionDigits: 2,
									})}{" "}
									{asset}
								</span>
							</p>
						</div>
						<div className="input-shell mt-2 flex items-center rounded-2xl border border-slate-200 p-2 pl-4 transition">
							<input
								id="amount"
								type="number"
								min="0"
								step="0.0000001"
								value={amount}
								onChange={(event) => setAmount(event.target.value)}
								placeholder="0.00"
								className="min-w-0 flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-slate-300"
							/>
							<div className="relative">
								<select
									value={asset}
									onChange={(event) => setAsset(event.target.value as AssetCode)}
									className="focus-ring appearance-none rounded-xl bg-slate-100 py-3 pr-9 pl-3 text-sm font-bold outline-none"
								>
									<option value="USDC">USDC</option>
									<option value="XLM">XLM</option>
								</select>
								<ChevronDown
									size={15}
									className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
								/>
							</div>
						</div>
						{amountNumber > balance && (
							<p className="mt-2 text-xs font-semibold text-rose-500">
								This amount is higher than your available balance.
							</p>
						)}

						<label
							className="mt-6 block text-sm font-bold text-slate-700"
							htmlFor="memo"
						>
							Note <span className="font-normal text-slate-400">(optional)</span>
						</label>
						<div className="input-shell mt-2 rounded-2xl border border-slate-200 px-4 py-3 transition">
							<input
								id="memo"
								value={memo}
								maxLength={28}
								onChange={(event) => setMemo(event.target.value)}
								placeholder="What is this for?"
								className="w-full bg-transparent text-sm outline-none placeholder:text-slate-300"
							/>
						</div>

						<div className="mt-5 flex items-center justify-between rounded-xl bg-lumina-50 px-4 py-3 text-xs">
							<span className="text-slate-500">Estimated network fee</span>
							<span className="font-bold text-lumina-700">{fee}</span>
						</div>
						<button
							type="submit"
							disabled={!canContinue}
							className="focus-ring mt-6 w-full rounded-2xl bg-lumina-500 px-5 py-4 font-bold text-white transition enabled:hover:bg-lumina-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
						>
							Review transfer
						</button>
					</form>
				)}

				{step === "review" && (
					<div>
						<div className="rounded-3xl bg-[#f5faf7] p-6 text-center">
							<p className="text-sm font-semibold text-slate-400">You send</p>
							<p className="mt-2 text-4xl font-bold tracking-[-0.04em]">
								{amountNumber.toLocaleString()}{" "}
								<span className="text-2xl text-slate-400">{asset}</span>
							</p>
							<div className="mx-auto my-6 h-8 w-px bg-slate-200" />
							<p className="text-sm text-slate-400">To</p>
							<p className="mt-1 font-bold">{shortAddress(recipient, 9, 8)}</p>
						</div>
						<div className="mt-5 space-y-3 text-sm">
							<div className="flex justify-between">
								<span className="text-slate-400">Network</span>
								<span className="flex items-center gap-2 font-bold">
									<span className="h-2 w-2 rounded-full bg-lumina-500" />
									Stellar Testnet
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-400">Network fee</span>
								<span className="font-bold">{fee}</span>
							</div>
							{memo && (
								<div className="flex justify-between gap-8">
									<span className="text-slate-400">Note</span>
									<span className="truncate font-bold">{memo}</span>
								</div>
							)}
						</div>
						{error && (
							<div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
								{error}
							</div>
						)}
						<button
							type="button"
							className="focus-ring mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-lumina-500 px-5 py-4 font-bold text-white transition hover:bg-lumina-600"
							onClick={() => void submit()}
						>
							<Send size={18} />
							Confirm in Freighter
						</button>
					</div>
				)}

				{step === "signing" && (
					<div className="py-14 text-center">
						<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lumina-50 text-lumina-600">
							<LoaderCircle className="h-9 w-9 animate-spin" />
						</div>
						<h2 className="mt-7 text-2xl font-bold">Waiting for your signature</h2>
						<p className="mx-auto mt-3 max-w-xs leading-6 text-slate-500">
							Review and approve the transfer in Freighter. We’ll take it from
							there.
						</p>
					</div>
				)}

				{step === "success" && (
					<div className="py-8 text-center">
						<div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-lumina-500 text-white shadow-[0_18px_45px_-14px_rgba(0,200,117,.7)]">
							<Check className="h-9 w-9" strokeWidth={3} />
						</div>
						<p className="mt-7 text-xs font-bold tracking-widest text-lumina-600 uppercase">
							Transfer complete
						</p>
						<h2 className="mt-2 text-3xl font-bold tracking-tight">
							{amountNumber.toLocaleString()} {asset} sent
						</h2>
						<p className="mt-3 text-sm text-slate-500">
							To {shortAddress(recipient, 8, 7)}
						</p>
						<a
							href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
							target="_blank"
							rel="noreferrer"
							className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-lumina-700 hover:underline"
						>
							View on Stellar Expert <ExternalLink size={15} />
						</a>
						<button
							type="button"
							className="focus-ring mt-8 w-full rounded-2xl bg-ink px-5 py-4 font-bold text-white"
							onClick={onClose}
						>
							Back to dashboard
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
