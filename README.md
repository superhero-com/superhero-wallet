# Superhero Wallet

**Superhero is a browser extension that allows you to send and recieve value to URLs and content accross Internet.**

[![Build Status](https://travis-ci.com/aeternity/superhero-wallet.svg?branch=develop)](https://travis-ci.com/aeternity/superhero-wallet)

## Build

Clone the master branch of this repo.

```
$ git clone https://github.com/aeternity/superhero-wallet.git
$ cd superhero-wallet
```

### Build locally

```
$ npm install
$ npm run build
$ npm run build:Testnet # build for Testnet
$ npm run build:Mainnet # build for Mainnet
$ npm run gen:cordova-resources
$ npx cordova build/run android/ios # to build Cordova application
```

### Develop locally

```
$ npm install
$ npm run watch:dev
$ npm run watch:dev:Testnet
$ npm run watch:dev:Mainnet
```

### Running tests

```
$ npm install
$ npm run test
```

### Adding to browser via local build or release zip

- Chromium based (Chrome, Brave, Opera)

1. Open chrome/brave browser `Preferences -> More tools > Extensions`
2. Make sure `Developer mode` is `On` in the right corner.
3. Click `Load unpacked` button and select the generated `dist` folder in the cloned repo or the unacrhived release folder.

- Firefox

1. Open the Firefox menu and select `Add-ons` section.
2. Click the `Tools for  all add-ons` button and select `Debug Add-ons`
3. Click `Load a temorary add-on` navigate to the generated `dist` folder in the cloned repo  or the unacrhived release folder and select the `manifest.json` file.

## Security
If you discover a security vulnerability within this application, please get in touch with us. All security vulnerabilities will be promptly addressed.

## Contribution

Contributions are more than welcome.

If you spot an issue while testing/using the extension - [submit an issue](https://github.com/aeternity/superhero-wallet/issues)

If you want to help us with building this amazing project submit your PR!
