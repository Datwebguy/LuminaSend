import { Buffer } from "buffer"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import "./index.css"

const browserGlobal = globalThis as typeof globalThis & {
	Buffer?: typeof Buffer
}
browserGlobal.Buffer ??= Buffer

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</StrictMode>,
)
