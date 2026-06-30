import { createContext, useContext } from "react"
import type {
	Activity,
	WalletBalances,
} from "../lib/stellar"

export type WalletContextValue = {
	activities: Activity[]
	address: string | null
	balances: WalletBalances
	connect: () => Promise<void>
	disconnect: () => void
	error: string | null
	fundTestnet: () => Promise<void>
	isConnecting: boolean
	isLoading: boolean
	refresh: () => Promise<void>
}

export const WalletContext = createContext<WalletContextValue | null>(null)

export function useWallet() {
	const context = useContext(WalletContext)
	if (!context) throw new Error("useWallet must be used inside WalletProvider")
	return context
}

