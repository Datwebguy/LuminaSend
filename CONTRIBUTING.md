# Contributing to LuminaSend

## Development workflow

1. Create a focused branch from `main`.
2. Keep all network integrations restricted to Stellar Testnet.
3. Do not add private keys, recovery phrases, account secrets, analytics, or
   fabricated financial data.
4. Add tests for contract changes and preserve strict TypeScript checks.
5. Run the full verification suite before opening a pull request:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
cargo fmt --all -- --check
cargo test --workspace
cargo build --locked --release --target wasm32v1-none --package savings-vault
```

## Pull requests

Explain the user impact, network impact, and verification performed. Contract
changes must document whether a new deployment is required. Frontend changes
that alter transaction construction should include the relevant Stellar
operation or contract method.

Never include `.env`, `.config`, generated secrets, or funded identities.
