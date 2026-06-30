import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

const Dashboard = lazy(() => import("./pages/DashboardRoute"))
const Landing = lazy(() => import("./pages/Landing"))

function PageLoader() {
	return (
		<div className="grid min-h-screen place-items-center bg-[#fbfdfc]">
			<div
				className="h-10 w-10 animate-spin rounded-full border-4 border-lumina-100 border-t-lumina-500"
				aria-label="Loading page"
			/>
		</div>
	)
}

export default function App() {
	return (
		<Suspense fallback={<PageLoader />}>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/app" element={<Dashboard />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	)
}
