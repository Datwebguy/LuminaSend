import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react"
import {
	WalletContext,
	type WalletContextValue,
} from "../contexts/WalletContext"
import {
	connectFreighter,
	fundWithFriendbot,
	loadActivities,
	loadWallet,
	restoreFreighterAddress,
	type Activity,
	type WalletBalances,
} from "../lib/stellar"
const EMPTY_BALANCES = { xlm: 0, xlmAvailable: 0, usdc: 0 }

export function WalletProvider({ children }: { children: ReactNode }) {
	const [address, setAddress] = useState<string | null>(null)
	const [balances, setBalances] = useState<WalletBalances>(EMPTY_BALANCES)
	const [activities, setActivities] = useState<Activity[]>([])
	const [isConnecting, setIsConnecting] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		if (!address) return
		setIsLoading(true)
		try {
			const [nextBalances, nextActivities] = await Promise.all([
				loadWallet(address),
				loadActivities(address),
			])
			setBalances(nextBalances)
			setActivities(nextActivities)
			setError(null)
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not load wallet.")
		} finally {
			setIsLoading(false)
		}
	}, [address])

	useEffect(() => {
		restoreFreighterAddress()
			.then((restored) => {
				if (restored) setAddress(restored)
			})
			.catch((cause: unknown) => {
				setError(
					cause instanceof Error
						? cause.message
						: "Could not restore the Freighter connection.",
				)
			})
	}, [])

	useEffect(() => {
		if (!address) return
		let cancelled = false

		Promise.all([loadWallet(address), loadActivities(address)])
			.then(([nextBalances, nextActivities]) => {
				if (cancelled) return
				setBalances(nextBalances)
				setActivities(nextActivities)
				setError(null)
			})
			.catch((cause: unknown) => {
				if (cancelled) return
				setError(cause instanceof Error ? cause.message : "Could not load wallet.")
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [address])

	const connect = useCallback(async () => {
		setIsConnecting(true)
		setError(null)
		try {
			setAddress(await connectFreighter())
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Could not connect Freighter.")
		} finally {
			setIsConnecting(false)
		}
	}, [])

	const disconnect = useCallback(() => {
		setAddress(null)
		setBalances(EMPTY_BALANCES)
		setActivities([])
	}, [])

	const fundTestnet = useCallback(async () => {
		if (!address) return
		setIsLoading(true)
		try {
			await fundWithFriendbot(address)
			await refresh()
			setError(null)
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Could not fund this Testnet account.",
			)
		} finally {
			setIsLoading(false)
		}
	}, [address, refresh])

	const value = useMemo<WalletContextValue>(
		() => ({
			activities,
			address,
			balances,
			connect,
			disconnect,
			error,
			fundTestnet,
			isConnecting,
			isLoading,
			refresh,
		}),
		[
			activities,
			address,
			balances,
			connect,
			disconnect,
			error,
			fundTestnet,
			isConnecting,
			isLoading,
			refresh,
		],
	)

	return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
