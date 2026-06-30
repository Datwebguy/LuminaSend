import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import wasm from "vite-plugin-wasm"

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		nodePolyfills({
			include: ["buffer"],
			globals: {
				Buffer: true,
			},
		}),
		wasm(),
	],
	build: {
		chunkSizeWarningLimit: 1_500,
		target: "esnext",
	},
	optimizeDeps: {
		exclude: ["@stellar/stellar-xdr-json"],
	},
	define: {
		global: "window",
	},
	envPrefix: "PUBLIC_",
	server: {
		port: 5173,
	},
})
