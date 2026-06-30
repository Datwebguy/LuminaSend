# LuminaSend

LuminaSend is a non-custodial cross-border payment and savings application on
Stellar Testnet. Users connect Freighter, view balances held by their own
account, send XLM or Circle Testnet USDC, inspect live account activity, and
manage an XLM position in a deployed Soroban savings contract.

No account secrets, recovery phrases, or private keys enter the application.
Freighter authorizes every state-changing operation.

## Product

![LuminaSend landing page](docs/screenshots/landing.png)

![LuminaSend wallet connection](docs/screenshots/wallet.png)

### Live functionality

- Freighter account authorization with strict Testnet validation
- XLM balance, spendable XLM, and Circle Testnet USDC balance from Horizon
- Live base-reserve calculation from the latest Stellar ledger
- Signed XLM and USDC payments submitted to Stellar Testnet
- Destination-account and USDC trustline validation
- Payment and Soroban transaction history from Horizon
- Savings principal, accrued yield, contract APY, and reward reserve from RPC
- Soroban deposits, withdrawals, and yield claims authorized through Freighter
- Direct links to each transaction and the deployed contract on Stellar Expert
- Official Friendbot funding for unfunded Testnet accounts

## Network configuration

LuminaSend is intentionally restricted to Stellar Testnet.

| Resource | Address |
| --- | --- |
| Savings contract | `CAN7GWJJCUM6UOXYWSWFER7WN5T2MOSC4LLI2UYTIQ2SEHWKOHW2YNPV` |
| Native XLM asset contract | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Circle Testnet USDC issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

[Inspect the savings contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAN7GWJJCUM6UOXYWSWFER7WN5T2MOSC4LLI2UYTIQ2SEHWKOHW2YNPV).

The savings contract accrues yield according to its immutable constructor rate.
Claims are limited to the funded reward reserve, so the contract cannot create
unbacked XLM. Testnet assets have no monetary value.

## Architecture

```text
Freighter
   │ authorizes transaction XDR
   ▼
React application
   ├── Horizon ───── balances, ledgers, payments, transactions
   └── Stellar RPC ─ simulation, contract state, Soroban submission
                           │
                           ▼
                    Savings contract
                           │
                           ▼
                    Native XLM SAC
```

The project was initialized with Scaffold Stellar and uses:

- React 19, TypeScript, Vite, and Tailwind CSS
- `@stellar/stellar-sdk`
- `@stellar/freighter-api`
- Soroban SDK with Rust
- Stellar Horizon and Stellar RPC

## Repository structure

```text
LuminaSend/
├── app/
│   ├── src/components/       Transaction and savings interfaces
│   ├── src/contexts/         Wallet context contract
│   ├── src/lib/              Network, wallet, payment, and contract services
│   ├── src/pages/            Landing page and authenticated application
│   └── .env.example          Required public network configuration
├── contracts/
│   └── savings-vault/        Soroban source and tests
├── packages/
│   └── savings_vault/        Generated TypeScript contract bindings
├── docs/screenshots/         Rendered product screenshots
├── environments.toml         Scaffold Stellar Testnet environment
├── scaffold.yml              Scaffold Stellar workspace configuration
└── vercel.json               Vercel build, routing, and security headers
```

## Local development

### Prerequisites

- Node.js 22 or newer
- npm
- Rust 1.89 or newer
- `wasm32v1-none` Rust target
- Stellar CLI
- Scaffold Stellar CLI
- Freighter browser extension

### Install and run

```bash
git clone https://github.com/Datwebguy/LuminaSend.git
cd LuminaSend
npm ci
cp app/.env.example app/.env
npm run dev
```

On Windows PowerShell, use:

```powershell
Copy-Item app/.env.example app/.env
npm.cmd run dev
```

Open `http://localhost:5173`, set Freighter to Testnet, and authorize the
connection.

## Environment variables

All frontend variables are public network configuration. LuminaSend has no
server-side wallet and requires no application secret.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_STELLAR_NETWORK` | Network label; must be `TESTNET` |
| `PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Stellar Testnet passphrase |
| `PUBLIC_STELLAR_RPC_URL` | Stellar RPC endpoint |
| `PUBLIC_STELLAR_HORIZON_URL` | Horizon endpoint |
| `PUBLIC_STELLAR_FRIENDBOT_URL` | Official Testnet funding endpoint |
| `PUBLIC_STELLAR_USDC_ISSUER` | Circle Testnet USDC issuer |
| `PUBLIC_SAVINGS_CONTRACT_ID` | Deployed Soroban savings contract |

The application validates required configuration at startup and refuses to run
with a non-Testnet passphrase.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
cargo fmt --all -- --check
cargo test --workspace
cargo build --locked --release --target wasm32v1-none --package savings-vault
```

Windows requires a compatible native Rust linker for `cargo test`. Contract
Wasm builds do not require a native test executable.

## Deploy to Vercel

1. Import `Datwebguy/LuminaSend` into Vercel.
2. Leave the project root at the repository root.
3. Add every variable from `app/.env.example` in Project Settings →
   Environment Variables.
4. Deploy.

`vercel.json` configures:

- `npm ci` installation
- `npm run build`
- `app/dist` as the output directory
- SPA fallback routing
- baseline browser security headers

No private key, deployer identity, or `.env` file should be added to Vercel.

## Contract interface

- `deposit(from, amount)` transfers XLM into the vault and records principal.
- `withdraw(owner, amount)` returns authorized principal.
- `position(owner)` returns principal and time-accrued yield.
- `claim_yield(owner)` transfers backed accrued yield.
- `fund_rewards(admin, amount)` adds XLM to the reward reserve.
- `apy_bps()`, `reward_reserve()`, and `total_deposits()` expose live metrics.

## Security

- The browser never requests or stores secret keys.
- Freighter signs every payment and contract invocation.
- Network passphrase checks prevent cross-network signing.
- Recipient addresses and USDC trustlines are validated before submission.
- Contract deposits and withdrawals require account authorization.
- Environment files and local Stellar identities are excluded from Git.

Please report security concerns according to [SECURITY.md](SECURITY.md).

## License

Apache 2.0
