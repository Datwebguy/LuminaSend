# LuminaSend

LuminaSend is a non-custodial cross-border payment and earning application on
Stellar Testnet. Users connect Freighter, send XLM or USDC, inspect real account
activity, and supply USDC directly to Blend's lending market.

Every balance, rate, position, and transaction comes from Stellar. LuminaSend
does not store private keys, recovery phrases, user profiles, or financial
records.

## Product

![LuminaSend landing page](docs/screenshots/landing.png)

![LuminaSend wallet connection](docs/screenshots/wallet.png)

### Live functionality

- Freighter wallet authorization with strict Testnet validation
- XLM, spendable XLM, and Circle Testnet USDC balances from Horizon
- Signed XLM and USDC payments submitted to Stellar Testnet
- Real payment and Soroban transaction history from Horizon
- Live Blend USDC supply APY, utilization, liquidity, and wallet-owned position
- Direct Blend supply and withdrawal transactions signed by the user
- Blend's official Testnet asset faucet, invoked only when the user requests it
- Direct Stellar Expert links for transactions and contracts

## How earning works

USDC is supplied directly to the Blend Testnet V2 lending pool. Borrowers
pay interest to use pool liquidity, and that interest increases the value of
suppliers' positions. There is no LuminaSend-funded reward reserve and no fixed
or promised rate.

The dashboard reads Blend's current variable supply APY from the live pool.
Accrued interest is already included in the supplied balance. Rates change with
market utilization, and withdrawals depend on available pool liquidity.
Testnet assets have no monetary value.

## Network configuration

LuminaSend is intentionally restricted to Stellar Testnet.

| Resource | Address |
| --- | --- |
| Blend Testnet V2 pool | `CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF` |
| Blend Testnet USDC contract | `CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU` |
| Blend Testnet USDC issuer | `GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56` |
| Circle Testnet USDC issuer | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |

[Inspect the Blend pool on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF).

Circle Testnet USDC is used for remittance payments. Blend Testnet USDC is the
separate test asset supported by Blend's Testnet pool; the interface labels
these uses separately.

## Architecture

```text
Freighter
  └─ authorizes transaction XDR
      └─ React + Vite application
          ├─ Horizon: balances, ledgers, payments, activity
          ├─ Stellar RPC: simulation and Soroban submission
          └─ Blend V2 Soroban pool
              └─ wallet-owned USDC lending position
```

The project was initialized with Scaffold Stellar and uses React 19,
TypeScript, Vite, Tailwind CSS, `@stellar/stellar-sdk`,
`@stellar/freighter-api`, and Blend's official JavaScript SDK. Blend's lending
contracts are open-source Soroban contracts written in Rust.

## Repository structure

```text
LuminaSend/
├── app/
│   ├── src/components/       Payment and lending transaction interfaces
│   ├── src/contexts/         Wallet context contract
│   ├── src/lib/              Stellar, Freighter, and Blend services
│   ├── src/pages/            Landing page and application dashboard
│   └── .env.example          Public Testnet configuration
├── docs/screenshots/         Product screenshots
├── environments.toml         Scaffold Stellar Testnet contracts
├── scaffold.yml              Scaffold Stellar workspace configuration
└── vercel.json               Vercel build, routing, and security headers
```

## Local development

### Prerequisites

- Node.js 22 or newer
- npm
- Freighter browser extension
- Freighter configured for Stellar Testnet

### Install and run

```bash
git clone https://github.com/Datwebguy/LuminaSend.git
cd LuminaSend
npm ci
cp app/.env.example app/.env
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item app/.env.example app/.env
npm.cmd run dev
```

Open `http://localhost:5173`.

## Environment variables

All variables are public network configuration. LuminaSend has no server-side
wallet and requires no application secret.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_STELLAR_NETWORK` | Must be `TESTNET` |
| `PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Stellar Testnet passphrase |
| `PUBLIC_STELLAR_RPC_URL` | Stellar RPC endpoint |
| `PUBLIC_STELLAR_HORIZON_URL` | Horizon endpoint |
| `PUBLIC_STELLAR_FRIENDBOT_URL` | Official Stellar Testnet funding endpoint |
| `PUBLIC_STELLAR_USDC_ISSUER` | Circle Testnet USDC issuer for payments |
| `PUBLIC_BLEND_POOL_ID` | Blend Testnet V2 pool contract |
| `PUBLIC_BLEND_USDC_CONTRACT_ID` | Blend pool's USDC asset contract |
| `PUBLIC_BLEND_USDC_ISSUER` | Blend pool's Testnet USDC issuer |
| `PUBLIC_BLEND_FAUCET_URL` | Blend's official Testnet asset endpoint |

The application validates required configuration at startup and refuses to run
with a non-Testnet passphrase.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Deploy to Vercel

1. Import `Datwebguy/LuminaSend` into Vercel.
2. Leave the project root at the repository root.
3. Add every variable from `app/.env.example` in Project Settings →
   Environment Variables.
4. Deploy.

`vercel.json` uses `npm ci`, builds the Vite application, serves `app/dist`,
adds SPA fallback routing, and applies baseline browser security headers.
Never add private keys, local identities, or `.env` files to Vercel.

## Security model

- The browser never requests or stores a secret key.
- Freighter signs every payment, faucet request, supply, and withdrawal.
- Lending positions are recorded by Blend for the user's wallet address.
- LuminaSend has no custody account and no withdrawal authority.
- Network checks prevent cross-network signing.
- Recipient addresses and Circle USDC trustlines are validated before payment.
- The Blend faucet receives a public wallet address only after explicit action.

Please report security concerns according to [SECURITY.md](SECURITY.md).

## Creator

LuminaSend is created and maintained by
[Datweb3guy](https://x.com/Datweb3guy).

Public Stellar address:
`GBCNH3PNORW5K4GMVIMT5RQEUZZL7IHPCYF2X2HHKNIAILBCKDWBUM65`

## License

Apache 2.0
