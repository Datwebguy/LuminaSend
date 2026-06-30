import {
	ArrowDownLeft,
	ArrowRight,
	ArrowUpRight,
	ChevronDown,
	CircleDollarSign,
	CircleHelp,
	Copy,
	ExternalLink,
	History,
	Home,
	LoaderCircle,
	LogOut,
	Menu,
	PiggyBank,
	Plus,
	RefreshCw,
	Send,
	ShieldCheck,
	TrendingUp,
	WalletCards,
	X,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import LuminaLogo, { PlaneMark } from "../components/LuminaLogo"
import SavingsModal, {
	type SavingsAction,
} from "../components/SavingsModal"
import SendModal from "../components/SendModal"
import {
	claimSavingsYield,
	loadSavingsSnapshot,
	type SavingsSnapshot,
} from "../lib/savings"
import { config } from "../lib/config"
import { shortAddress } from "../lib/stellar"
import { useWallet } from "../contexts/WalletContext"

type View = "overview" | "send" | "savings" | "activity"

const navItems: { id: View; icon: typeof Home; label: string }[] = [
	{ id: "overview", icon: Home, label: "Overview" },
	{ id: "send", icon: Send, label: "Send money" },
	{ id: "savings", icon: PiggyBank, label: "Savings" },
	{ id: "activity", icon: History, label: "Activity" },
]

export default function Dashboard() {
	const wallet = useWallet()
	const [view, setView] = useState<View>("overview")
	const [menuOpen, setMenuOpen] = useState(false)
	const [accountMenu, setAccountMenu] = useState(false)
	const [sendOpen, setSendOpen] = useState(false)
	const [savingsOpen, setSavingsOpen] = useState(false)
	const [savingsAction, setSavingsAction] =
		useState<SavingsAction>("deposit")
	const [savingsLoading, setSavingsLoading] = useState(true)
	const [savingsError, setSavingsError] = useState<string | null>(null)
	const [isClaiming, setIsClaiming] = useState(false)
	const [copied, setCopied] = useState(false)
	const [savings, setSavings] = useState<SavingsSnapshot | null>(null)

	const refreshSavings = useCallback(async () => {
		if (!wallet.address) return
		setSavingsLoading(true)
		setSavingsError(null)
		try {
			setSavings(await loadSavingsSnapshot(wallet.address))
		} catch (cause) {
			setSavingsError(
				cause instanceof Error
					? cause.message
					: "Could not load the savings contract.",
			)
		} finally {
			setSavingsLoading(false)
		}
	}, [wallet.address])

	useEffect(() => {
		if (!wallet.address) return
		let cancelled = false

		loadSavingsSnapshot(wallet.address)
			.then((snapshot) => {
				if (cancelled) return
				setSavings(snapshot)
				setSavingsError(null)
			})
			.catch((cause: unknown) => {
				if (cancelled) return
				setSavingsError(
					cause instanceof Error
						? cause.message
						: "Could not load the savings contract.",
				)
			})
			.finally(() => {
				if (!cancelled) setSavingsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [wallet.address])

	function selectView(next: View) {
		setView(next)
		setMenuOpen(false)
		if (next === "send" && wallet.address) setSendOpen(true)
		if (next === "savings" && wallet.address) {
			setSavingsAction("deposit")
			setSavingsOpen(true)
		}
	}

	async function copyAddress() {
		if (!wallet.address) return
		await navigator.clipboard.writeText(wallet.address)
		setCopied(true)
		window.setTimeout(() => setCopied(false), 1_600)
	}

	const refreshAll = async () => {
		await Promise.all([wallet.refresh(), refreshSavings()])
	}

	function openSavings(action: SavingsAction) {
		setSavingsAction(action)
		setSavingsOpen(true)
	}

	async function claimYield() {
		if (!wallet.address) return
		setIsClaiming(true)
		setSavingsError(null)
		try {
			await claimSavingsYield(wallet.address)
			await refreshAll()
		} catch (cause) {
			setSavingsError(
				cause instanceof Error ? cause.message : "Yield claim failed.",
			)
		} finally {
			setIsClaiming(false)
		}
	}

	return (
		<div className="min-h-screen bg-[#f5f8f6] lg:grid lg:grid-cols-[250px_1fr]">
			<aside className="fixed inset-y-0 left-0 z-50 hidden w-[250px] flex-col border-r border-slate-100 bg-white px-4 py-6 lg:flex">
				<Link to="/" className="px-3">
					<LuminaLogo />
				</Link>
				<nav className="mt-10 space-y-1.5">
					{navItems.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => selectView(item.id)}
							className={`focus-ring flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
								view === item.id
									? "bg-lumina-50 text-lumina-700"
									: "text-slate-500 hover:bg-slate-50 hover:text-ink"
							}`}
						>
							<item.icon size={19} />
							{item.label}
						</button>
					))}
				</nav>
				<div className="mt-auto">
					<div className="rounded-2xl bg-[#10261d] p-4 text-white">
						<div className="flex items-center gap-2 text-xs font-bold text-lumina-300">
							<span className="h-2 w-2 rounded-full bg-lumina-400" />
							Stellar Testnet
						</div>
						<p className="mt-3 text-xs leading-5 text-white/55">
							Testnet assets have no monetary value.
						</p>
						<a
							href="https://developers.stellar.org/docs/networks"
							target="_blank"
							rel="noreferrer"
							className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/80"
						>
							Learn more <ExternalLink size={12} />
						</a>
					</div>
					<a
						href="https://docs.freighter.app/"
						target="_blank"
						rel="noreferrer"
						className="mt-5 flex w-full items-center gap-3 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-ink"
					>
						<CircleHelp size={18} /> Wallet documentation
					</a>
				</div>
			</aside>

			{menuOpen && (
				<div className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-sm lg:hidden">
					<aside className="h-full w-[285px] bg-white p-5 shadow-2xl">
						<div className="flex items-center justify-between">
							<Link to="/">
								<LuminaLogo />
							</Link>
							<button
								type="button"
								onClick={() => setMenuOpen(false)}
								className="grid h-10 w-10 place-items-center rounded-full bg-slate-100"
							>
								<X size={19} />
							</button>
						</div>
						<nav className="mt-10 space-y-2">
							{navItems.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => selectView(item.id)}
									className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold ${
										view === item.id
											? "bg-lumina-50 text-lumina-700"
											: "text-slate-500"
									}`}
								>
									<item.icon size={19} /> {item.label}
								</button>
							))}
						</nav>
					</aside>
				</div>
			)}

			<div className="lg:col-start-2">
				<header className="sticky top-0 z-40 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setMenuOpen(true)}
							className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden"
						>
							<Menu size={20} />
						</button>
						<div>
							<h1 className="text-lg font-bold tracking-tight capitalize">{view}</h1>
							<p className="hidden text-xs text-slate-400 sm:block">
								Your money, moving brighter
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2.5">
						<button
							type="button"
							onClick={() => void refreshAll()}
							className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500"
							aria-label="Refresh"
						>
							<RefreshCw size={17} className={wallet.isLoading ? "animate-spin" : ""} />
						</button>
						{wallet.address ? (
							<div className="relative">
								<button
									type="button"
									onClick={() => setAccountMenu((open) => !open)}
									className="focus-ring flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pr-3"
								>
									<div className="grid h-8 w-8 place-items-center rounded-full bg-lumina-100 text-xs font-bold text-lumina-700">
										{wallet.address.slice(1, 3)}
									</div>
									<span className="hidden text-sm font-bold sm:block">
										{shortAddress(wallet.address)}
									</span>
									<ChevronDown size={14} className="text-slate-400" />
								</button>
								{accountMenu && (
									<div className="glass-card absolute top-12 right-0 w-64 rounded-2xl p-2">
										<button
											type="button"
											onClick={() => void copyAddress()}
											className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold hover:bg-slate-50"
										>
											<Copy size={16} /> {copied ? "Copied!" : "Copy address"}
										</button>
										<button
											type="button"
											onClick={() => {
												wallet.disconnect()
												setAccountMenu(false)
											}}
											className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-500 hover:bg-rose-50"
										>
											<LogOut size={16} /> Disconnect
										</button>
									</div>
								)}
							</div>
						) : (
							<button
								type="button"
								onClick={() => void wallet.connect()}
								disabled={wallet.isConnecting}
								className="focus-ring flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
							>
								{wallet.isConnecting ? (
									<LoaderCircle size={17} className="animate-spin" />
								) : (
									<WalletCards size={17} />
								)}
								<span className="hidden sm:inline">Connect Freighter</span>
								<span className="sm:hidden">Connect</span>
							</button>
						)}
					</div>
				</header>

				<main className="mx-auto max-w-[1450px] p-4 pb-28 sm:p-7 lg:pb-10">
					{wallet.error && (
						<div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
							<CircleHelp size={18} className="mt-0.5 shrink-0" />
							{wallet.error}
						</div>
					)}

					{!wallet.address ? (
						<ConnectState
							connect={() => void wallet.connect()}
							isConnecting={wallet.isConnecting}
						/>
					) : (
						<>
							<div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
								<div>
									<p className="text-sm font-semibold text-slate-400">
										Good to see you
									</p>
									<h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
										Ready to move money?
									</h2>
								</div>
								<p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
									<ShieldCheck size={15} className="text-lumina-500" />
									Connected securely via Freighter
								</p>
							</div>

							<div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,.55fr)]">
								<div className="space-y-5">
									<BalanceCard
										usdc={wallet.balances.usdc}
										xlm={wallet.balances.xlm}
										onSend={() => setSendOpen(true)}
										onSave={() => openSavings("deposit")}
										onFund={() => void wallet.fundTestnet()}
										isFunding={wallet.isLoading}
									/>
									<div className="grid gap-4 sm:grid-cols-3">
										<StatCard
											icon={WalletCards}
											label="XLM balance"
											value={wallet.balances.xlm.toLocaleString(undefined, {
												maximumFractionDigits: 7,
											})}
											detail={`${wallet.balances.xlmAvailable.toLocaleString(undefined, {
												maximumFractionDigits: 7,
											})} XLM spendable`}
										/>
										<StatCard
											icon={CircleDollarSign}
											label="USDC balance"
											value={wallet.balances.usdc.toLocaleString(undefined, {
												maximumFractionDigits: 7,
											})}
											detail="Circle USDC on Testnet"
										/>
										<StatCard
											icon={History}
											label="Payments loaded"
											value={String(wallet.activities.length)}
											detail="From Stellar Horizon"
										/>
									</div>
									<ActivityCard
										activities={wallet.activities}
										onViewAll={() => setView("activity")}
										showAll={view === "activity"}
									/>
								</div>

								<div className="space-y-5">
									<SavingsCard
										error={savingsError}
										isClaiming={isClaiming}
										isLoading={savingsLoading}
										snapshot={savings}
										onClaim={() => void claimYield()}
										onDeposit={() => openSavings("deposit")}
										onWithdraw={() => openSavings("withdraw")}
									/>
									<div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
										<div className="flex items-center gap-3">
											<div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600">
												<ShieldCheck size={21} />
											</div>
											<div>
												<h3 className="font-bold">Savings contract</h3>
												<p className="text-xs text-slate-400">
													Live on Stellar Testnet
												</p>
											</div>
										</div>
										<a
											href={`https://stellar.expert/explorer/testnet/contract/${config.contractId}`}
											target="_blank"
											rel="noreferrer"
											className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600"
										>
											{shortAddress(config.contractId, 8, 7)}
											<ExternalLink size={14} />
										</a>
									</div>
								</div>
							</div>
						</>
					)}
				</main>
			</div>

			<nav className="fixed right-3 bottom-3 left-3 z-40 flex justify-around rounded-2xl border border-slate-100 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden">
				{navItems.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => selectView(item.id)}
						className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${
							view === item.id ? "bg-lumina-50 text-lumina-700" : "text-slate-400"
						}`}
					>
						<item.icon size={19} />
						{item.label.split(" ")[0]}
					</button>
				))}
			</nav>

			{sendOpen && wallet.address && (
				<SendModal
					address={wallet.address}
					balances={wallet.balances}
					onClose={() => {
						setSendOpen(false)
						setView("overview")
					}}
					onSuccess={wallet.refresh}
				/>
			)}
			{savingsOpen && wallet.address && savings && (
				<SavingsModal
					action={savingsAction}
					address={wallet.address}
					apy={savings.apy}
					available={
						savingsAction === "deposit"
							? wallet.balances.xlmAvailable
							: savings.principal
					}
					onClose={() => {
						setSavingsOpen(false)
						setView("overview")
					}}
					onSuccess={refreshAll}
				/>
			)}
		</div>
	)
}

function ConnectState({
	connect,
	isConnecting,
}: {
	connect: () => void
	isConnecting: boolean
}) {
	return (
		<div className="grid min-h-[70vh] place-items-center">
			<div className="max-w-lg text-center">
				<div className="relative mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-lumina-500 text-white shadow-[0_25px_65px_-18px_rgba(0,200,117,.75)]">
					<div className="absolute inset-0 rounded-[28px] bg-lumina-300/30 blur-2xl" />
					<PlaneMark className="relative h-16 w-16" />
				</div>
				<h2 className="mt-8 text-3xl font-bold tracking-[-0.04em]">
					Your secure Stellar account
				</h2>
				<p className="mt-4 leading-7 text-slate-500">
					Connect Freighter to see your Testnet balances, send XLM or USDC, and
					start an on-chain savings position.
				</p>
				<button
					type="button"
					onClick={connect}
					disabled={isConnecting}
					className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-lumina-500 px-7 py-4 font-bold text-white shadow-lg disabled:opacity-60"
				>
					{isConnecting ? (
						<LoaderCircle size={19} className="animate-spin" />
					) : (
						<WalletCards size={19} />
					)}
					Connect Freighter
				</button>
				<p className="mt-4 text-xs text-slate-400">
					You’ll be asked to approve this connection in the extension.
				</p>
			</div>
		</div>
	)
}

function BalanceCard({
	usdc,
	xlm,
	onSend,
	onSave,
	onFund,
	isFunding,
}: {
	usdc: number
	xlm: number
	onSend: () => void
	onSave: () => void
	onFund: () => void
	isFunding: boolean
}) {
	return (
		<div className="relative overflow-hidden rounded-[30px] bg-[#10261d] p-6 text-white shadow-[0_26px_60px_-30px_rgba(10,50,34,.65)] sm:p-7">
			<div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-lumina-500/25 blur-3xl" />
			<div className="absolute -right-10 -bottom-28 h-64 w-64 rounded-full border-[40px] border-white/[0.035]" />
			<div className="relative flex items-start justify-between">
				<div>
					<p className="text-sm font-semibold text-white/50">USDC balance</p>
					<p className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
						{usdc.toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
						<span className="ml-2 text-xl text-white/40">USDC</span>
					</p>
					<p className="mt-3 text-sm font-semibold text-lumina-300">
						{xlm.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
						available
					</p>
				</div>
				<div className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-bold text-lumina-300">
					TESTNET
				</div>
			</div>
			<div className="relative mt-8 flex flex-wrap gap-3">
				<button
					type="button"
					onClick={onSend}
					className="focus-ring flex items-center gap-2 rounded-full bg-lumina-500 px-5 py-3 text-sm font-bold transition hover:bg-lumina-400"
				>
					<Send size={17} /> Send money
				</button>
				<button
					type="button"
					onClick={onSave}
					className="focus-ring flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/15"
				>
					<PiggyBank size={17} /> Add to savings
				</button>
				<button
					type="button"
					onClick={onFund}
					disabled={isFunding}
					className="focus-ring flex items-center gap-2 rounded-full px-3 py-3 text-sm font-bold text-white/60 hover:text-white"
				>
					{isFunding ? (
						<LoaderCircle size={16} className="animate-spin" />
					) : (
						<Plus size={16} />
					)}
					Get test XLM
				</button>
			</div>
		</div>
	)
}

function StatCard({
	icon: Icon,
	label,
	value,
	detail,
}: {
	icon: typeof ArrowUpRight
	label: string
	value: string
	detail: string
}) {
	return (
		<div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
			<div className="flex items-center gap-3">
				<div className="grid h-10 w-10 place-items-center rounded-xl bg-lumina-50 text-lumina-600">
					<Icon size={19} />
				</div>
				<p className="text-xs font-semibold text-slate-400">{label}</p>
			</div>
			<p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
			<p className="mt-1 text-[11px] text-slate-400">{detail}</p>
		</div>
	)
}

function SavingsCard({
	error,
	isClaiming,
	isLoading,
	snapshot,
	onClaim,
	onDeposit,
	onWithdraw,
}: {
	error: string | null
	isClaiming: boolean
	isLoading: boolean
	snapshot: SavingsSnapshot | null
	onClaim: () => void
	onDeposit: () => void
	onWithdraw: () => void
}) {
	const total = snapshot
		? snapshot.principal + snapshot.accruedYield
		: null
	return (
		<div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
			<div className="bg-gradient-to-br from-lumina-50 to-white p-6">
				<div className="flex items-start justify-between">
					<div className="grid h-12 w-12 place-items-center rounded-2xl bg-lumina-500 text-white">
						<TrendingUp size={23} />
					</div>
					<span className="rounded-full bg-lumina-100 px-3 py-1.5 text-xs font-bold text-lumina-700">
						{snapshot ? `${snapshot.apy.toFixed(2)}% APY` : "Loading rate"}
					</span>
				</div>
				<p className="mt-6 text-sm font-semibold text-slate-400">Your savings</p>
				{isLoading && !snapshot ? (
					<div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-400">
						<LoaderCircle size={17} className="animate-spin" />
						Reading contract state
					</div>
				) : snapshot && total !== null ? (
					<>
						<p className="mt-1 text-3xl font-bold tracking-tight">
							{total.toLocaleString(undefined, { maximumFractionDigits: 7 })}{" "}
							<span className="text-base text-slate-400">XLM</span>
						</p>
						<div className="mt-5 space-y-2 text-xs">
							<div className="flex justify-between">
								<span className="text-slate-400">Principal</span>
								<span className="font-bold">
									{snapshot.principal.toFixed(7)} XLM
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-400">Accrued yield</span>
								<span className="font-bold text-lumina-700">
									+{snapshot.accruedYield.toFixed(7)} XLM
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-slate-400">Reward reserve</span>
								<span className="font-bold">
									{snapshot.rewardReserve.toFixed(7)} XLM
								</span>
							</div>
						</div>
					</>
				) : null}
				{error && (
					<p role="alert" className="mt-4 text-xs font-semibold text-rose-600">
						{error}
					</p>
				)}
			</div>
			<div className="p-5">
				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={onDeposit}
						disabled={!snapshot}
						className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-lumina-500 px-3 py-3 text-sm font-bold text-white disabled:opacity-50"
					>
						<Plus size={17} /> Deposit
					</button>
					<button
						type="button"
						onClick={onWithdraw}
						disabled={!snapshot || snapshot.principal <= 0}
						className="focus-ring rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold disabled:opacity-40"
					>
						Withdraw
					</button>
				</div>
				{snapshot && snapshot.accruedYield > 0 && (
					<button
						type="button"
						onClick={onClaim}
						disabled={isClaiming || snapshot.rewardReserve <= 0}
						className="focus-ring mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-3 text-sm font-bold text-slate-700 disabled:opacity-40"
					>
						{isClaiming && <LoaderCircle size={16} className="animate-spin" />}
						Claim accrued yield
					</button>
				)}
			</div>
		</div>
	)
}

function ActivityCard({
	activities,
	onViewAll,
	showAll,
}: {
	activities: ReturnType<typeof useWallet>["activities"]
	onViewAll: () => void
	showAll: boolean
}) {
	const visibleActivities = showAll ? activities : activities.slice(0, 5)
	return (
		<div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-bold">Recent activity</h3>
					<p className="mt-1 text-xs text-slate-400">
						Latest on-chain account activity
					</p>
				</div>
				{!showAll && (
					<button
						type="button"
						onClick={onViewAll}
						className="flex items-center gap-1 text-xs font-bold text-lumina-700"
					>
						View all <ArrowRight size={14} />
					</button>
				)}
			</div>
			<div className="mt-4">
				{activities.length === 0 ? (
					<div className="py-9 text-center">
						<div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-300">
							<History size={21} />
						</div>
						<p className="mt-3 text-sm font-bold">No transfers yet</p>
						<p className="mt-1 text-xs text-slate-400">
							Your first Testnet payment will appear here.
						</p>
					</div>
				) : (
					visibleActivities.map((activity, index) => (
						<a
							key={activity.id}
							href={`https://stellar.expert/explorer/testnet/tx/${activity.hash}`}
							target="_blank"
							rel="noreferrer"
							className={`flex items-center gap-3 py-3.5 ${
								index < visibleActivities.length - 1
									? "border-b border-slate-100"
									: ""
							}`}
						>
							<div
								className={`grid h-11 w-11 place-items-center rounded-full ${
									activity.direction === "received"
										? "bg-lumina-50 text-lumina-600"
										: "bg-slate-100 text-slate-600"
								}`}
							>
								{activity.kind === "transaction" ? (
									<TrendingUp size={19} />
								) : activity.direction === "received" ? (
									<ArrowDownLeft size={19} />
								) : (
									<ArrowUpRight size={19} />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-bold">{activity.label}</p>
								<p className="truncate text-xs text-slate-400">
									{activity.counterparty
										? `${activity.direction === "sent" ? "To " : "From "}${shortAddress(activity.counterparty)}`
										: shortAddress(activity.hash, 8, 7)}
								</p>
							</div>
							<div className="text-right">
								{activity.amount !== undefined && activity.asset ? (
									<p
										className={`text-sm font-bold ${
											activity.direction === "received"
												? "text-lumina-600"
												: "text-ink"
										}`}
									>
										{activity.direction === "received" ? "+" : "−"}
										{activity.amount.toLocaleString()} {activity.asset}
									</p>
								) : (
									<ExternalLink
										size={15}
										className="ml-auto text-slate-400"
									/>
								)}
								<p className="mt-1 text-[10px] text-slate-400">
									{new Date(activity.createdAt).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
									})}
								</p>
							</div>
						</a>
					))
				)}
			</div>
		</div>
	)
}
