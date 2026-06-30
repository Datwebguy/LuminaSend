import { type SVGProps } from "react"

type LogoProps = {
	compact?: boolean
	className?: string
	inverse?: boolean
}

export function PlaneMark({
	className = "h-9 w-9",
	...props
}: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 48 48"
			fill="none"
			aria-hidden="true"
			className={className}
			{...props}
		>
			<path
				d="M40.2 8.9 8.7 21.4c-1.8.7-1.8 3.2 0 3.9l11 4.1 4.1 10.9c.7 1.9 3.3 1.9 4 0L40.2 8.9Z"
				fill="currentColor"
			/>
			<path
				d="m19.7 29.4 8-8"
				stroke="white"
				strokeWidth="2.6"
				strokeLinecap="round"
			/>
		</svg>
	)
}

export default function LuminaLogo({
	compact = false,
	className = "",
	inverse = false,
}: LogoProps) {
	return (
		<div className={`flex items-center gap-2.5 ${className}`}>
			<div
				className={`relative grid h-10 w-10 place-items-center rounded-xl ${
					inverse ? "bg-white text-lumina-600" : "bg-lumina-500 text-white"
				}`}
			>
				<div className="absolute inset-0 rounded-xl bg-lumina-300/40 blur-lg" />
				<PlaneMark className="relative h-7 w-7" />
			</div>
			{!compact && (
				<span
					className={`text-[21px] font-bold tracking-[-0.04em] ${
						inverse ? "text-white" : "text-ink"
					}`}
				>
					Lumina<span className={inverse ? "text-white/70" : "text-lumina-600"}>Send</span>
				</span>
			)}
		</div>
	)
}
