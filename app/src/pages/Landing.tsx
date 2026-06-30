import {
	ArrowRight,
	BadgeCheck,
	Clock3,
	Coins,
	Globe2,
	Menu,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	X,
	Zap,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import LuminaLogo, { PlaneMark } from "../components/LuminaLogo"

const steps = [
	{
		number: "01",
		title: "Connect your wallet",
		body: "Link Freighter in a click. Your keys always stay with you.",
		icon: ShieldCheck,
	},
	{
		number: "02",
		title: "Send across borders",
		body: "Choose XLM or USDC, enter an address, and send in seconds.",
		icon: PlaneMark,
	},
	{
		number: "03",
		title: "Earn on what arrives",
		body: "Supply USDC to Blend and earn the live rate paid by borrowers.",
		icon: TrendingUp,
	},
]

const benefits = [
	{
		icon: Zap,
		title: "Fast by design",
		body: "Stellar settles payments in a few seconds, even across borders.",
	},
	{
		icon: Coins,
		title: "Fees stay tiny",
		body: "Keep more of every transfer instead of losing it to intermediaries.",
	},
	{
		icon: ShieldCheck,
		title: "You stay in control",
		body: "Non-custodial by default. LuminaSend never sees your secret key.",
	},
	{
		icon: TrendingUp,
		title: "Grow after payday",
		body: "Earn transparent, variable lending yield through Blend on Stellar.",
	},
]

export default function Landing() {
	const [menuOpen, setMenuOpen] = useState(false)

	return (
		<div className="min-h-screen overflow-hidden bg-[#fbfdfc]">
			<header className="relative z-50 mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
				<Link to="/" aria-label="LuminaSend home">
					<LuminaLogo />
				</Link>
				<nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
					<a className="transition hover:text-lumina-600" href="#how">
						How it works
					</a>
					<a className="transition hover:text-lumina-600" href="#benefits">
						Why Lumina
					</a>
					<a className="transition hover:text-lumina-600" href="#security">
						Security
					</a>
				</nav>
				<div className="hidden items-center gap-3 md:flex">
					<div className="flex items-center gap-2 rounded-full bg-lumina-50 px-3 py-2 text-xs font-bold text-lumina-700">
						<span className="h-2 w-2 rounded-full bg-lumina-500" />
						Stellar Testnet
					</div>
					<Link
						to="/app"
						className="focus-ring rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
					>
						Launch app
					</Link>
				</div>
				<button
					type="button"
					className="focus-ring grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white md:hidden"
					onClick={() => setMenuOpen((open) => !open)}
					aria-label="Toggle menu"
				>
					{menuOpen ? <X size={20} /> : <Menu size={20} />}
				</button>
			</header>

			{menuOpen && (
				<div className="glass-card absolute top-20 right-5 left-5 z-40 rounded-2xl p-5 md:hidden">
					<nav className="flex flex-col gap-1 font-semibold">
						{[
							["How it works", "#how"],
							["Why Lumina", "#benefits"],
							["Security", "#security"],
						].map(([label, href]) => (
							<a
								key={href}
								href={href}
								className="rounded-xl px-3 py-3 hover:bg-lumina-50"
								onClick={() => setMenuOpen(false)}
							>
								{label}
							</a>
						))}
						<Link
							to="/app"
							className="mt-3 rounded-xl bg-ink px-4 py-3 text-center text-white"
						>
							Launch app
						</Link>
					</nav>
				</div>
			)}

			<main>
				<section className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-14 px-5 pt-12 pb-24 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-16">
					<div className="absolute -top-40 -left-64 h-[520px] w-[520px] rounded-full bg-lumina-100/60 blur-3xl" />
					<div className="relative z-10 max-w-2xl">
						<div className="mb-7 inline-flex items-center gap-2 rounded-full border border-lumina-200 bg-white px-3.5 py-2 text-xs font-bold text-lumina-700 shadow-sm">
							<Sparkles size={14} />
							Built for Southeast Asia, powered by Stellar
						</div>
						<h1 className="text-balance text-[clamp(3.2rem,7vw,6.2rem)] leading-[0.94] font-bold tracking-[-0.07em] text-ink">
							Money moves
							<span className="relative ml-[0.18em] inline-block text-lumina-500">
								brighter.
								<svg
									className="absolute -bottom-3 left-0 w-full text-lumina-300"
									viewBox="0 0 300 18"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M3 13C79 3 205 3 297 11"
										stroke="currentColor"
										strokeWidth="7"
										strokeLinecap="round"
									/>
								</svg>
							</span>
						</h1>
						<p className="mt-9 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
							Send money home in seconds, keep fees low, and help every
							remittance go further with optional on-chain earning.
						</p>
						<div className="mt-9 flex flex-col gap-3 sm:flex-row">
							<Link
								to="/app"
								className="focus-ring group inline-flex items-center justify-center gap-2 rounded-full bg-lumina-500 px-7 py-4 font-bold text-white shadow-[0_16px_38px_-12px_rgba(0,200,117,.7)] transition hover:-translate-y-1 hover:bg-lumina-600"
							>
								Start sending
								<ArrowRight
									size={18}
									className="transition group-hover:translate-x-1"
								/>
							</Link>
							<a
								href="#how"
								className="focus-ring inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 font-bold text-ink transition hover:border-lumina-300"
							>
								See how it works
							</a>
						</div>
						<div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-slate-500">
							<span className="flex items-center gap-2">
								<BadgeCheck size={17} className="text-lumina-500" />
								Non-custodial
							</span>
							<span className="flex items-center gap-2">
								<Clock3 size={17} className="text-lumina-500" />
								~5 sec settlement
							</span>
							<span className="flex items-center gap-2">
								<Globe2 size={17} className="text-lumina-500" />
								Borderless
							</span>
						</div>
					</div>

					<div className="relative mx-auto w-full max-w-[540px]">
						<div className="glow-pulse absolute top-6 left-14 h-64 w-64 rounded-full bg-lumina-300/40 blur-[80px]" />
						<div className="plane-float absolute -top-9 right-4 z-20 grid h-24 w-24 place-items-center rounded-[28px] bg-lumina-500 text-white shadow-[0_25px_70px_-18px_rgba(0,200,117,.8)] sm:right-12">
							<PlaneMark className="h-16 w-16" />
						</div>
						<div className="relative ml-auto w-[92%] rounded-[36px] border-[9px] border-ink bg-[#f7faf8] p-3 shadow-[0_40px_100px_-35px_rgba(18,45,34,.45)] sm:w-[390px]">
							<div className="overflow-hidden rounded-[25px] bg-white">
								<div className="px-6 pt-10 pb-7">
									<div className="grid h-12 w-12 place-items-center rounded-2xl bg-lumina-50 text-lumina-600">
										<ShieldCheck size={24} />
									</div>
									<h2 className="mt-6 text-2xl font-bold tracking-tight">
										Every action stays verifiable
									</h2>
									<p className="mt-2 text-sm leading-6 text-slate-500">
										Wallet authorization, settlement, and lending positions
										remain on open Stellar infrastructure.
									</p>
									<div className="mt-7 space-y-3">
										{[
											["Wallet authorization", "Freighter"],
											["Payment settlement", "Stellar Testnet"],
											["Earning market", "Blend Protocol"],
										].map(([label, value]) => (
											<div
												key={label}
												className="flex items-center justify-between rounded-2xl bg-[#f5faf7] px-4 py-4"
											>
												<span className="text-xs font-semibold text-slate-500">
													{label}
												</span>
												<span className="flex items-center gap-2 text-xs font-bold text-ink">
													<span className="h-2 w-2 rounded-full bg-lumina-500" />
													{value}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
						<div className="glass-card absolute top-44 -left-3 z-30 rounded-2xl px-4 py-3 sm:-left-8">
							<div className="flex items-center gap-3">
								<div className="grid h-9 w-9 place-items-center rounded-full bg-lumina-100 text-lumina-700">
									<BadgeCheck size={19} />
								</div>
								<div>
									<p className="text-[11px] text-slate-400">Non-custodial</p>
									<p className="text-sm font-bold">Your keys stay in your wallet</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="border-y border-slate-100 bg-white py-7">
					<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-5 text-sm font-semibold text-slate-400">
						<span>Purpose-built on</span>
						<span className="text-lg font-bold tracking-tight text-slate-700">STELLAR</span>
						<span className="h-4 w-px bg-slate-200" />
						<span>Live Blend lending</span>
						<span className="h-4 w-px bg-slate-200" />
						<span>Designed for Southeast Asia</span>
					</div>
				</section>

				<section id="how" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-sm font-bold tracking-widest text-lumina-600 uppercase">
							Simple by default
						</p>
						<h2 className="text-balance mt-4 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
							From your wallet to theirs, without the maze.
						</h2>
					</div>
					<div className="mt-16 grid gap-5 lg:grid-cols-3">
						{steps.map((step, index) => (
							<div
								key={step.number}
								className="group relative rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
							>
								<div className="flex items-start justify-between">
									<div className="grid h-13 w-13 place-items-center rounded-2xl bg-lumina-50 text-lumina-600 transition group-hover:bg-lumina-500 group-hover:text-white">
										<step.icon className="h-7 w-7" />
									</div>
									<span className="text-sm font-bold text-slate-300">{step.number}</span>
								</div>
								<h3 className="mt-9 text-xl font-bold">{step.title}</h3>
								<p className="mt-3 leading-7 text-slate-500">{step.body}</p>
								{index < 2 && (
									<ArrowRight className="absolute top-1/2 -right-4 z-10 hidden text-lumina-300 lg:block" />
								)}
							</div>
						))}
					</div>
				</section>

				<section id="benefits" className="bg-[#10261d] py-24 text-white lg:py-32">
					<div className="mx-auto max-w-7xl px-5 sm:px-8">
						<div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
							<div>
								<p className="text-sm font-bold tracking-widest text-lumina-300 uppercase">
									Why LuminaSend
								</p>
								<h2 className="text-balance mt-4 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
									More money arrives. More opportunity stays.
								</h2>
								<p className="mt-6 max-w-lg text-lg leading-8 text-white/60">
									Cross-border money should feel as easy as sending a message—and
									create a path toward something bigger.
								</p>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								{benefits.map((benefit) => (
									<div
										key={benefit.title}
										className="rounded-3xl border border-white/10 bg-white/[0.045] p-6"
									>
										<div className="grid h-11 w-11 place-items-center rounded-xl bg-lumina-500/15 text-lumina-300">
											<benefit.icon size={22} />
										</div>
										<h3 className="mt-6 text-lg font-bold">{benefit.title}</h3>
										<p className="mt-2 leading-6 text-white/55">{benefit.body}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				<section id="security" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
					<div className="relative overflow-hidden rounded-[36px] bg-lumina-500 px-6 py-16 text-center text-white sm:px-12">
						<div className="absolute -top-28 -right-20 h-80 w-80 rounded-full border-[50px] border-white/10" />
						<div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full border-[50px] border-white/10" />
						<ShieldCheck className="relative mx-auto h-12 w-12" />
						<h2 className="text-balance relative mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
							Your money. Your keys. Your next move.
						</h2>
						<p className="relative mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
							LuminaSend uses Freighter for signing and Stellar Testnet for every
							transaction. We never store private keys.
						</p>
						<Link
							to="/app"
							className="focus-ring relative mt-9 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 font-bold text-lumina-700 transition hover:-translate-y-1"
						>
							Open LuminaSend <ArrowRight size={18} />
						</Link>
					</div>
				</section>
			</main>

			<footer className="border-t border-slate-100 bg-white">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row sm:px-8">
					<LuminaLogo />
					<p className="text-center text-sm text-slate-400">
						Created by{" "}
						<a
							href="https://x.com/Datweb3guy"
							target="_blank"
							rel="noreferrer"
							className="font-semibold text-slate-600 hover:text-lumina-600"
						>
							Datweb3guy
						</a>{" "}
						· Stellar Testnet · Non-custodial
					</p>
				</div>
			</footer>
		</div>
	)
}
