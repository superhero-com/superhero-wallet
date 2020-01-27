# Waellet

<p align="center">
<img
    src="https://waellet.com/images/waellet_transparent.png"
    width="500px">
</p>

[![CircleCI](https://circleci.com/gh/waellet/waellet/tree/develop.svg?style=svg)](https://circleci.com/gh/waellet/waellet/tree/master)
[![GitHub version](https://badge.fury.io/gh/waellet%2Fwaellet.svg)](https://badge.fury.io/gh/waellet%2Fwaellet)
<a href="https://github.com/waellet/waellet/blob/master/LICENSE">
  <img src="https://img.shields.io/badge/license-ISC-blue.svg" alt="License.">
</a>
<a href="https://github.com/waellet/waellet/blob/master/LICENSE">
  <img src="https://img.shields.io/badge/aeternity-aepp-%23F22F70.svg" alt="Aeternity aepp">
</a>

**Waellet is a browser extension that allows you to interact with Aeternity blockchain in your browser.**

We see Waellet as user’s first choice wallet when it comes to interacting with dApps hosted on different blockchains. Build around aeternity, Waellet is to become a tool that enables users to pay for different services without the need to worry about the network of the particular dApp – this will happen in a decentralized and cryptographic secure way through integration with the WeiDex – decentralized exchange.

Currently, Waellet is still in beta and under heavy development pushing to bring you our best vision of the wallet as soon as possible.

## Download 

You can find the latest version on [our official website](https://waellet.com).

Currently waellet supports FireFox, Google Chrome, and Chromium-based browsers. 

We recommend installing the latest stable release via your browser's add-on store.

| <img src="https://unpkg.com/@browser-logos/firefox@2.0.0/firefox_16x16.png" width="16" height="16"> [Firefox](https://www.mozilla.org/firefox/new/) | <img src="https://unpkg.com/@browser-logos/chrome@1.0.4/chrome_16x16.png" width="16" height="16"> [Chrome](https://www.google.com/chrome/) / <img src="https://unpkg.com/@browser-logos/brave@3.0.0/brave_16x16.png" width="16" height="16"> [Brave](https://brave.com/) / <img src="https://unpkg.com/@browser-logos/opera@1.1.1/opera_16x16.png" width="16" height="16"> [Opera](https://www.opera.com/)  / <img src="https://unpkg.com/@browser-logos/edge@1.0.6/edge_16x16.png" width="16" height="16"> [Edge](https://www.microsoftedgeinsider.com/)
|------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [![Install From AMO](https://ipfs.io/ipfs/QmWNa64XjA78QvK3zG2593bSMizkDXXcubDHjnRDYUivqt)](https://addons.mozilla.org/firefox/addon/waellet/) | [![Install from Chrome Store](https://ipfs.io/ipfs/QmXeTTMAxJVSZLqNcVzBdsAZKhWUpP7w7QAZ8f3Bnmk3Mj)](https://chrome.google.com/webstore/detail/waellet/nnkfipoloblhgnahnaocfkhmmplcdneb) |

or see instructions below how to build it from source.


## Build

Clone the master branch of this repo.

```
$ git clone https://github.com/waellet/waellet.git
$ cd waellet
```

### Build locally

```
$ npm install
$ npm run build
```

### Develop locally

```
$ npm install
$ npm run watch:dev
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
If you discover a security vulnerability within this application, please send an e-mail to hello@waellet.com. All security vulnerabilities will be promptly addressed.

## Contribution

Contributions are more than welcome.

If you spot an issue while testing/using the waellet - [submit an issue](https://github.com/waellet/waellet/issues)

If you want to help us with building this amazing project submit your PR!
