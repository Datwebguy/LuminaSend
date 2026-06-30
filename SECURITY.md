# Security policy

## Reporting a vulnerability

Do not disclose vulnerabilities in a public issue. Use GitHub's private
vulnerability reporting feature for this repository and include:

- affected commit or deployment
- reproduction steps
- expected and observed behavior
- potential impact
- any suggested remediation

Reports involving transaction construction, authorization, contract accounting,
or network selection receive priority.

## Wallet and secret handling

LuminaSend is non-custodial. The application must never request, transmit, log,
or store private keys or recovery phrases. All transaction signatures must be
performed by Freighter.

Local Stellar identities belong under `.config`, which is ignored by Git.
Environment variables committed to this repository contain public network
configuration only.

## Supported network

Only Stellar Testnet is supported. Network-passphrase validation is a security
boundary and must not be bypassed.
