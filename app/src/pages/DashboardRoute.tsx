import { WalletProvider } from "../providers/WalletProvider"
import Dashboard from "./Dashboard"

export default function DashboardRoute() {
	return (
		<WalletProvider>
			<Dashboard />
		</WalletProvider>
	)
}
