import eslint from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import typescript from "typescript-eslint"

export default defineConfig(
	globalIgnores(["dist"]),
	eslint.configs.recommended,
	...typescript.configs.recommended,
	reactHooks.configs.flat.recommended,
	reactRefresh.configs.vite,
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
)
