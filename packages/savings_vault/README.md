# LuminaSend savings contract client

This package is generated from the live LuminaSend savings contract interface
with Stellar CLI. It provides typed bindings for integrations that prefer the
generated client over direct `@stellar/stellar-sdk` contract calls.

Regenerate it from the repository root:

```bash
stellar contract bindings typescript \
  --contract-id "$PUBLIC_SAVINGS_CONTRACT_ID" \
  --network testnet \
  --output-dir packages/savings_vault \
  --overwrite
```
