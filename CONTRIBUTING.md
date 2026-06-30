# Contributing to LuminaSend

## Development workflow

1. Create a focused branch from `main`.
2. Keep all network integrations restricted to Stellar Testnet.
3. Do not add private keys, recovery phrases, account secrets, analytics, or
   fabricated financial data.
4. Preserve strict TypeScript checks and verify transaction changes against
   the live Testnet contract interface.
5. Run the full verification suite before opening a pull request:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

## Pull requests

Explain the user impact, network impact, and verification performed. Frontend
changes that alter transaction construction should include the relevant Stellar
operation or Soroban contract method.

Never include `.env`, `.config`, generated secrets, or funded identities.
