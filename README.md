# Superhero Wallet

**Superhero is a multi-blockchain wallet to manage crypto assets and navigate the web3 and DeFi space. Powered by æternity.**

[![main action](https://github.com/superhero-com/superhero-wallet/actions/workflows/main.yml/badge.svg)](https://github.com/superhero-com/superhero-wallet/actions/workflows/main.yml) [![codeql](https://github.com/superhero-com/superhero-wallet/actions/workflows/codeql.yml/badge.svg)](https://github.com/superhero-com/superhero-wallet/actions/workflows/codeql.yml) [![test](https://github.com/superhero-com/superhero-wallet/actions/workflows/test.yml/badge.svg)](https://github.com/superhero-com/superhero-wallet/actions/workflows/test.yml)

## Guides & Examples

| I want to… | Start here |
|---|---|
| Choose a chain, account type, or signing device | [Chain and platform compatibility](docs/compatibility.md) |
| Receive or send assets, restore accounts, or use an æternity multisig vault | [Using the wallet](docs/using-the-wallet.md) · [Backup and recovery](https://developer.superhero.com/wallets/backup-and-recovery/) |
| Connect a dApp and request a signature | [Integration guides and API reference](docs/integrating-dapps.md) · [Deep link schema](docs/deep-link-schema.md) |
| Diagnose an unavailable service or configure a provider | [Services and troubleshooting](docs/services.md) |
| Build, test, or extend the wallet | [Development guide](docs/development.md) · [Contributing and releases](CONTRIBUTING.md) |

For a released version, select [its tag](https://github.com/superhero-com/superhero-wallet/releases) before following a version-sensitive example. The guides on `develop` cover the development build.

## Build

With Node.js 22.12 or a later 22.x release installed, run these commands in the repository root to start the web wallet locally.

```sh
npm ci
npm run dev
```

The [development guide](docs/development.md) covers unpacked extensions, Capacitor mobile builds, and platform-specific tests.

## Security

Use the [private disclosure contact](https://developer.superhero.com/resources/support/#security-disclosure) to report a suspected vulnerability. For a wallet problem, consult [troubleshooting](https://developer.superhero.com/wallets/troubleshooting/) or [file a bug](https://github.com/superhero-com/superhero-wallet/issues/new?template=bug_report.md). Include the wallet version, platform, and network. Remove recovery phrases, private keys, unclaimed gift card links, and identifying details from screenshots or logs before sharing them.

## Contribution

[Contributing](CONTRIBUTING.md) describes the branch workflow, checks, and release process.

## Tooling

This project is tested with BrowserStack.
