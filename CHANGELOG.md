# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.6.1](https://github.com/Superhero-com/superhero-wallet/compare/v2.6.0...v2.6.1) (2025-05-15)


### Features

* account name on transaction review ([bc90aea](https://github.com/Superhero-com/superhero-wallet/commit/bc90aeae7d4b20c149c927650bb2713ecae74f0e))
* select account in multisig dashboard ([31ac897](https://github.com/Superhero-com/superhero-wallet/commit/31ac8976f97ee3b6dff7861c0281ead29ff4babe))
* sign transaction despite not enough balance ([db3d91c](https://github.com/Superhero-com/superhero-wallet/commit/db3d91c0cf2ee3e6d60788c650839dca4012451a))
* ui improvement on single recipient ([19eeceb](https://github.com/Superhero-com/superhero-wallet/commit/19eecebeba07d7bda2f3624122d7a82c8012e9ca))


### Bug Fixes

* chrome extension store missing icons ([83f3c14](https://github.com/Superhero-com/superhero-wallet/commit/83f3c1446e13c5c532195986a45577988b5cf250))
* dynamic symbol of token in test ([61c9227](https://github.com/Superhero-com/superhero-wallet/commit/61c9227a80e89daea44216fec6cfb469b494d35a))
* **evm:** return blockNumber in correct format ([165bdd2](https://github.com/Superhero-com/superhero-wallet/commit/165bdd20f6f5892b1685e06be8b64ca4da07aef8))
* translation issue in paid by ([c713b81](https://github.com/Superhero-com/superhero-wallet/commit/c713b8157ce6fe4c00c2bad29d454664663dd2e4))

## [2.6.0](https://github.com/Superhero-com/superhero-wallet/compare/v2.5.3...v2.6.0) (2025-04-15)


### Features

* add pulse animation to plus icon on add card ([8baec96](https://github.com/Superhero-com/superhero-wallet/commit/8baec96faee4825f1f59a352221ad45fd79b3f85))
* be able to add custom token sale url ([2ceb4aa](https://github.com/Superhero-com/superhero-wallet/commit/2ceb4aac0380ff22479e3c43cac92e38f32f0c4c))
* be able to set custom explorer url ([e2a2342](https://github.com/Superhero-com/superhero-wallet/commit/e2a2342155a5d16baf0f85df31205b9c5bba7474))
* be able to shrink error status ([7ba5a81](https://github.com/Superhero-com/superhero-wallet/commit/7ba5a817676f7f7cbe2fe70af8f7cf65da61cb5b))
* do not show notification settings if no aeternity account ([b041e99](https://github.com/Superhero-com/superhero-wallet/commit/b041e9912c370a147236afe67305924e67963b97))
* **evm:** support web3_clientVersion method ([9200b6e](https://github.com/Superhero-com/superhero-wallet/commit/9200b6e563fa4bf55bd43954e23b7c24429e8092))
* handle long numbers ([0f44f35](https://github.com/Superhero-com/superhero-wallet/commit/0f44f359d1efb7da45dbabe9a64bf03b7d40db70))
* multiple recipients transaction ([d775ccb](https://github.com/Superhero-com/superhero-wallet/commit/d775ccb56a5f2f1a20cf3ddfb17e1dd4c7afecd8))
* show info on currencies unavailable ([0a4cd51](https://github.com/Superhero-com/superhero-wallet/commit/0a4cd51803f2f37a4bd2f03cc4ee06be4f70836a))
* **wallet-connect:** propagate account change ([21e9b89](https://github.com/Superhero-com/superhero-wallet/commit/21e9b894add816b55b85b0d6708606dda735267f))


### Bug Fixes

* add generic max calcutation composable ([4c8bd2c](https://github.com/Superhero-com/superhero-wallet/commit/4c8bd2cba848fcea2ffd9f0d3e76676e76eef6c7))
* background svg responsiveness ([b9b8564](https://github.com/Superhero-com/superhero-wallet/commit/b9b8564253eb5e9fa8676b742c6d81c27bcd5e6a))
* be able to handle all evm requests ([bc33d42](https://github.com/Superhero-com/superhero-wallet/commit/bc33d422eebf703ff060dc10debf3421ef4da180))
* do not autosign in reverse iframe ([78c4a3a](https://github.com/Superhero-com/superhero-wallet/commit/78c4a3a7203e27c2c578fa0af2e8b815a3711577))
* do not calculate daily limit for ethereum ([f4a18b8](https://github.com/Superhero-com/superhero-wallet/commit/f4a18b8715d1948dbea2d5c20748f116f9589133))
* handle blur on custom field from vee-validate ([39965d4](https://github.com/Superhero-com/superhero-wallet/commit/39965d47edf60429f39d4a2295ebdc8c95e95871))
* modify placeholder since ENS is not yet supported ([353c23c](https://github.com/Superhero-com/superhero-wallet/commit/353c23c745591b91a093b14b3c7acbc7fd0eb44b))
* qr code modal missing closing animation ([4e79563](https://github.com/Superhero-com/superhero-wallet/commit/4e79563ebdb8f197d782da95a900433a00b64b2c))
* show latest transaction in account transaction list ([a0f0cc1](https://github.com/Superhero-com/superhero-wallet/commit/a0f0cc13b1ebf1a0e3431c79f0b42ed5a7ee334e))


### Performance

* do not load all fungible tokens on each initialization ([47c7d0a](https://github.com/Superhero-com/superhero-wallet/commit/47c7d0a83f469332d916429339471a576d0c5025))


### Style

* adjust Tokens style ([5db40e9](https://github.com/Superhero-com/superhero-wallet/commit/5db40e90120a4b7476a474e6ca09fd158ecc3f0d))
* show aeternity protocol name lower-case ([28f765a](https://github.com/Superhero-com/superhero-wallet/commit/28f765aa23acc2b7097b3618b38c6a2c4358e794))


### Maintenance

* format number based on language in token amount formatted ([45c8d0f](https://github.com/Superhero-com/superhero-wallet/commit/45c8d0f7311ff8810d8accde5bdfdb1b1e8b3a35))
* remove unused tip related info ([68d1e10](https://github.com/Superhero-com/superhero-wallet/commit/68d1e10300e0d04bd301a9f47c825a80110cc62f))
* run npm update and fix linter issues ([ae46aa8](https://github.com/Superhero-com/superhero-wallet/commit/ae46aa83eb6b248a4b6217744796c543b310d725))
* **token-amount:** also format integers ([67b52a4](https://github.com/Superhero-com/superhero-wallet/commit/67b52a46419512821b726dfa9319e9b9fec9b1d1))
* update vue-i18n ([3bb9e25](https://github.com/Superhero-com/superhero-wallet/commit/3bb9e25a6148878ef85bac897c974708810bcd75))

### [2.5.3](https://github.com/Superhero-com/superhero-wallet/compare/v2.5.2...v2.5.3) (2025-03-12)


### Bug Fixes

* be able to send custom aex9 tokens ([608256e](https://github.com/Superhero-com/superhero-wallet/commit/608256e87969ba3ff8877557902cbb3ca3ba83da))
* calculate max token amount correctly ([f0b5edf](https://github.com/Superhero-com/superhero-wallet/commit/f0b5edfc1fdba6f0deba7293ab25bdc282427df8))


### Performance

* clear component link on component remove ([4d9f2b4](https://github.com/Superhero-com/superhero-wallet/commit/4d9f2b43d9671f5c0cc173109a73f2d221f5acac))
* optimize all svgs ([7d55ad8](https://github.com/Superhero-com/superhero-wallet/commit/7d55ad809d9760fabd8c2a222b7a364d07bbaa3b))
* properly clear several intervals ([788ce5b](https://github.com/Superhero-com/superhero-wallet/commit/788ce5bdae1a14430df8da26217acd1dc18b2c18))
* remove addded event listeners on unmount ([f571e39](https://github.com/Superhero-com/superhero-wallet/commit/f571e397b25c0a71d54f59298681237716a4b5e8))
* remove rpc client on port disconnect ([45e9ec2](https://github.com/Superhero-com/superhero-wallet/commit/45e9ec20c3a4f2116ed4d57e1e7c16f58bdc4f67))


### Maintenance

* disable page/modal transitions in Chrome based browsers ([2b7fe31](https://github.com/Superhero-com/superhero-wallet/commit/2b7fe3179d9d560a23924deefea23f74f6f693f6))
* disable transitions on chrome web and extension ([b33d00b](https://github.com/Superhero-com/superhero-wallet/commit/b33d00b7f1e9755c3527e9d3c3d51b0048396993))
* temporary remove all transition in chrome based browsers ([fc957d1](https://github.com/Superhero-com/superhero-wallet/commit/fc957d13eafdb5f017c78073b91badb87cf862bc))
* use new avatars url ([f7e90cb](https://github.com/Superhero-com/superhero-wallet/commit/f7e90cbab49ac31b963424fb6c052697ea79caca))
* use new bug report url ([74738ec](https://github.com/Superhero-com/superhero-wallet/commit/74738ec22932117285582024973fa3f94a034b70))

### [2.5.2](https://github.com/Superhero-com/superhero-wallet/compare/v2.5.1...v2.5.2) (2025-03-04)


### Features

* support personal sign with EVM and WalletConnect ([44b3b4d](https://github.com/Superhero-com/superhero-wallet/commit/44b3b4d534cfbaf96134a4a14b5511d650c572f5))


### Bug Fixes

* be able to connect if permission set and wallet is locked ([1dd92d9](https://github.com/Superhero-com/superhero-wallet/commit/1dd92d9b1dabe107944d46aa94149a2f9b373e71))
* **evm:** propagate errors ([2cdf577](https://github.com/Superhero-com/superhero-wallet/commit/2cdf5777613f5acecffabd6eee4b458d6a77d3ce))
* **evm:** proxy several methods with Etherscan correctly ([8f6a973](https://github.com/Superhero-com/superhero-wallet/commit/8f6a973e608a6b380b7e44d8d05746e854c8a398))
* **evm:** return correct account on account request ([bdb2b5e](https://github.com/Superhero-com/superhero-wallet/commit/bdb2b5e813e828bf551877ec0c295f90810ab436))
* **evm:** set window ethereum object correctly ([eb854fa](https://github.com/Superhero-com/superhero-wallet/commit/eb854fac7800e358f4f08fb8c2db88b9e0251fe1))
* **popup:** call reject on window close ([d0437d0](https://github.com/Superhero-com/superhero-wallet/commit/d0437d094098b3b53d11f3ac466bc8cb2fed152c))
* show advanced call data details correctly ([2ea0771](https://github.com/Superhero-com/superhero-wallet/commit/2ea077145551ff0948975be8e09450cb499d2068))
* show asset as unrecognized if so ([fc95116](https://github.com/Superhero-com/superhero-wallet/commit/fc9511619ac1a9c2a26903cec82cb189c2bbb1ee))
* show private key only if wallet knows it ([e42888b](https://github.com/Superhero-com/superhero-wallet/commit/e42888b69740362719c105fceefdd3a33ac4a066))
* show transactionCallDataDetails correctly ([49628c6](https://github.com/Superhero-com/superhero-wallet/commit/49628c62e8c889a11f8fcf3fd705ee6aededc01d))
* **wallet-connect:** be able to use personal_sign method ([d35f0a8](https://github.com/Superhero-com/superhero-wallet/commit/d35f0a8fc1731afc65a987fa76b7ee58e472facb))


### Tests

* fix unknown tx signing ([06706e7](https://github.com/Superhero-com/superhero-wallet/commit/06706e7b23befcd3750038168e683eabd341d8c3))
* remove old not working coingecko stubs ([2c797d0](https://github.com/Superhero-com/superhero-wallet/commit/2c797d05932b13fd272b1bf53119e03ff521460b))
* stub requests to coingecko in e2e to avoid rate limit errors ([445397e](https://github.com/Superhero-com/superhero-wallet/commit/445397e9c9b77ed36574ff6b55c8aff535e174af))


### Performance

* **evm:** add ethereum object only when necessary ([911da0b](https://github.com/Superhero-com/superhero-wallet/commit/911da0b54fbc2f974b408658e1fbd96882b1c59f))


### Maintenance

* add serialized type to `useStorageRef` ([0300170](https://github.com/Superhero-com/superhero-wallet/commit/030017018cd441568f9771e2e7d31e0d7fe57706))
* avoid importing aesdk internals ([939c4ba](https://github.com/Superhero-com/superhero-wallet/commit/939c4ba34ae2b53aaf017609af115f21183a35fd))
* **deps:** update sdk to 14.0.0 ([ad4429f](https://github.com/Superhero-com/superhero-wallet/commit/ad4429f29592469d5181d5abe25dff3fef49bf07))
* **deps:** use a maintained bip39 implementation ([abfb4a4](https://github.com/Superhero-com/superhero-wallet/commit/abfb4a43c86c08e15211372d4e4d21ea22e47d13))
* prefer `use` over `import` in scss ([e783f10](https://github.com/Superhero-com/superhero-wallet/commit/e783f10d038b9591b21fd4348d19d7e8a0ed732c))
* put the same license to package.json as in LICENSE file ([f681ad7](https://github.com/Superhero-com/superhero-wallet/commit/f681ad7e7eeedf5b2df747a5527aae8b1d121ea3))
* update walletconnect dependencies ([60e7fc6](https://github.com/Superhero-com/superhero-wallet/commit/60e7fc6bdc626a30ae9092ebe4b7cd1e74a978f1))
* use NodeJS.Timeout instead NodeJS.Timer everywhere ([b2381cf](https://github.com/Superhero-com/superhero-wallet/commit/b2381cfe3c9e731d8751bb5e48adc48e0bf68eef))
* use ts-expect-error instead ts-ignore ([6efbbe0](https://github.com/Superhero-com/superhero-wallet/commit/6efbbe0d91e0f1861e64b1509f1304d8766c0e09))

### [2.5.1](https://github.com/Superhero-com/superhero-wallet/compare/v2.5.0...v2.5.1) (2025-02-06)


### Features

* be able to set ethplorer api key ([f409883](https://github.com/Superhero-com/superhero-wallet/commit/f409883892408dba7e35df7c46ec1992ce6c8ab4))
* show full createCommunity contract call info ([34ed221](https://github.com/Superhero-com/superhero-wallet/commit/34ed2218aaf5d2e45b850d10523af62ec89795f5))
* show internal spendTx correctly ([35bd814](https://github.com/Superhero-com/superhero-wallet/commit/35bd8143e397bff1da20b3a32e713a740957d419))


### Bug Fixes

* **aeternity:** correct usage of onAccount property ([b2227b0](https://github.com/Superhero-com/superhero-wallet/commit/b2227b0909d39a088c4b5c037fdd957864d1cbeb))
* be able to show set password help modal ([453c777](https://github.com/Superhero-com/superhero-wallet/commit/453c7775d5cebf01a8cce67ca061b65f75a520b7))
* do not overlap token name with amount in TransactionAssetRow ([08b6df1](https://github.com/Superhero-com/superhero-wallet/commit/08b6df14ba9767464fdcc8d5655e8c42d321d4c9))
* do not rewrite encrypted state with default value on initialization ([1328fcf](https://github.com/Superhero-com/superhero-wallet/commit/1328fcf396bee6181735ad452f541570a48d38fe))
* **ethereum:** show correct token transaction details ([2f3fa84](https://github.com/Superhero-com/superhero-wallet/commit/2f3fa841229055c44f6229a790b1bb190c652909))
* show correct information for loaded transactions ([621f082](https://github.com/Superhero-com/superhero-wallet/commit/621f082e67187b72462b683ca5fac737ee0ca8c3))


### Maintenance

* adjust transaction details page ([238e022](https://github.com/Superhero-com/superhero-wallet/commit/238e022056428adc16e34536361509f54329ff42))
* change several icons style ([24a75a0](https://github.com/Superhero-com/superhero-wallet/commit/24a75a02b26e1fd3e7dd78cc0f5719249e83635b))
* update github actions ([9883c3a](https://github.com/Superhero-com/superhero-wallet/commit/9883c3aced519d98dc47aaba79a7425c367326c5))


### Performance

* reduce the number of name check requests ([f294b29](https://github.com/Superhero-com/superhero-wallet/commit/f294b292b708886b23f04f66f57da9619ac1f46b))

## [2.5.0](https://github.com/Superhero-com/superhero-wallet/compare/v2.4.0...v2.5.0) (2025-01-30)


### Features

* change active account on dapp login ([3ea2f1e](https://github.com/Superhero-com/superhero-wallet/commit/3ea2f1e63b34dadf22214b61e2221a4e5b88d618))
* padding on fixed footer to fix overlay issue with status ([7153427](https://github.com/Superhero-com/superhero-wallet/commit/7153427e39886fbe9ab446aa5065b2650181838a))
* show full information for token sale buy transactions ([5aeaf45](https://github.com/Superhero-com/superhero-wallet/commit/5aeaf450d7dee6ba5f7f9c24af60664b0275d545))
* show more information on create_community transactions ([a047eb5](https://github.com/Superhero-com/superhero-wallet/commit/a047eb57b5cd2596dbb958e92492b8aa243fc869))
* support ledger using usb transport ([fcaad39](https://github.com/Superhero-com/superhero-wallet/commit/fcaad3980a255280e2bde8053acecee454d82ff4))
* wallet connect remember me checkbox ([534cc8b](https://github.com/Superhero-com/superhero-wallet/commit/534cc8b75a429d21647e49efb4a4bcbc64076b74))


### Bug Fixes

* be able to migrate raw mnemonic to encrypted ([1e8a779](https://github.com/Superhero-com/superhero-wallet/commit/1e8a77903900ca408d6d0662d050b7c95a5bffdf))
* **deep-link:** show internal error modal before redirect ([9e3e417](https://github.com/Superhero-com/superhero-wallet/commit/9e3e417f1331cc3ce4ef2b5d160c5987940c6b19))
* missing compliance on testflight ([27e05e6](https://github.com/Superhero-com/superhero-wallet/commit/27e05e66176b6fdcac1584657ac8163c8e9eac18))
* popup being cut if the height of it is small ([865ae75](https://github.com/Superhero-com/superhero-wallet/commit/865ae75e589046986ebb0e990a9cc585fa240b32))
* welcome screen wording ([a1f9e59](https://github.com/Superhero-com/superhero-wallet/commit/a1f9e597fd490bebadae5d88ec872ee2d2162734))


### Maintenance

* do not omit internal events ([c92ce8f](https://github.com/Superhero-com/superhero-wallet/commit/c92ce8ff8bd554e81b0402bae0ebfc4d1868184f))
* do not show add ledger account in firefox ([bab3f19](https://github.com/Superhero-com/superhero-wallet/commit/bab3f19577d63a4bb0949aa5370dfa15868e5294))
* simplify AccountSelectOptionsItem ([c016022](https://github.com/Superhero-com/superhero-wallet/commit/c016022bf03a26ff496800ca19698391bab7d986))

## [2.4.0](https://github.com/Superhero-com/superhero-wallet/compare/v2.3.2...v2.4.0) (2024-12-19)


### Features

* add new data cy ids ([ef41173](https://github.com/Superhero-com/superhero-wallet/commit/ef4117339a2f806c46cb1e1438cfab9a015788a7))
* animated text in active account dropdown ([c744201](https://github.com/Superhero-com/superhero-wallet/commit/c7442019fa293178fa99f8c86048f4171e077dba))
* be able to connect to dapps as EVM ([de8b00f](https://github.com/Superhero-com/superhero-wallet/commit/de8b00feae78c506de23ce60f84f8ab6d299ee5e))
* close all modals on wallet reset ([68ed6d3](https://github.com/Superhero-com/superhero-wallet/commit/68ed6d381c000245d37e47715f3d99397a133db9))
* **connect-modal:** show network info and correct account info ([96aee0a](https://github.com/Superhero-com/superhero-wallet/commit/96aee0add9091150739fc3988d077dfe7b298dfe))
* do not rely on sdk being valid in sign process ([84a8514](https://github.com/Superhero-com/superhero-wallet/commit/84a8514ef7295673707988822cdea50ecb97e423))
* **evm:** propogate chain change event to dapps ([4e3b4a2](https://github.com/Superhero-com/superhero-wallet/commit/4e3b4a26c25c7be89aef2c549b866871fc64a094))
* **evm:** proxy several requests with etherscan ([e64e2ec](https://github.com/Superhero-com/superhero-wallet/commit/e64e2ecbbfc9aa6026dd54597fe6af284e34bb38))
* export error log and show error modals on transaction errors ([7a8d224](https://github.com/Superhero-com/superhero-wallet/commit/7a8d224e175e71ce499a8791abd6deea32398445))


### Bug Fixes

* add ionSkellet component ([58ac17a](https://github.com/Superhero-com/superhero-wallet/commit/58ac17af486d378f323c0bd2979426430732de9f))
* **aeternity:** share wallet info with dapp ([e8941c4](https://github.com/Superhero-com/superhero-wallet/commit/e8941c40581c7735dff36f5cbf7d94468474efb6))
* auto-sign not redirecting back to browser ([ce4bcab](https://github.com/Superhero-com/superhero-wallet/commit/ce4bcabb43b909ec154dc6ebd4cd90612fcc694b))
* do not preserve permissions on reset ([6e5a009](https://github.com/Superhero-com/superhero-wallet/commit/6e5a009f13fe73265177aa62590fe1a437261e69))
* **ethereum:** catch Ethplorer fetching errors ([e3d46b8](https://github.com/Superhero-com/superhero-wallet/commit/e3d46b8d2d2e5512c1366e48d994b3dcdd9cf4da))
* **ethereum:** show advancde transaction details only for contract calls ([50d9783](https://github.com/Superhero-com/superhero-wallet/commit/50d9783f2473aa838ee982ea553cc7d4c11f5a8b))
* **ethereum:** show correct transaction labels ([4004609](https://github.com/Superhero-com/superhero-wallet/commit/40046095c62f6e5216c669b2ae4eb78cd5d1a842))
* hide all content under placeholder ([4e8ecff](https://github.com/Superhero-com/superhero-wallet/commit/4e8ecffc172a3896985839952897b7c1a18d5bfb))
* hyphenate attributes ([9aa67ca](https://github.com/Superhero-com/superhero-wallet/commit/9aa67cafa150f7f80621a9b6f9c5284ff7bb3a86))
* show auction history correctly ([99122f5](https://github.com/Superhero-com/superhero-wallet/commit/99122f534ca158f8da78ab95adcd00b237cf7372))
* show correct balance and color for custom account ([e98c992](https://github.com/Superhero-com/superhero-wallet/commit/e98c992ffe882e7967bb135653f4bec54c4f44c3))


### Maintenance

* **offscreen:** remove unused method ([77a3ee9](https://github.com/Superhero-com/superhero-wallet/commit/77a3ee9023472970cf61724b19c468c8b5728cc0))
* prevent background from fail on importing from common constants ([ee95a64](https://github.com/Superhero-com/superhero-wallet/commit/ee95a64f4a31cae9f22c99b6474d5489b37c6326))
* run npm update ([3d3f8b7](https://github.com/Superhero-com/superhero-wallet/commit/3d3f8b7a1001c0e7633727a95a7b821dd743a15b))


### Style

* remove deprecated functions ([3426381](https://github.com/Superhero-com/superhero-wallet/commit/3426381764a616d53ba82f89d9b51fcbbc8893bd))

### [2.3.2](https://github.com/Superhero-com/superhero-wallet/compare/v2.3.1...v2.3.2) (2024-11-22)


### Features

* account selector improvements ([05b4f7d](https://github.com/Superhero-com/superhero-wallet/commit/05b4f7df03c8df0127bb6de54e14629e6bd5d03d))
* connect modal layout update ([7a02d70](https://github.com/Superhero-com/superhero-wallet/commit/7a02d70feabbcb51f105d59d1b74c9b994d18a39))
* permission manager form as modal ([b51b1d5](https://github.com/Superhero-com/superhero-wallet/commit/b51b1d54fdb7ebae1129c08f2d0c8cc2f22b162e))
* show decoded call data on eth tx details ([79dcf90](https://github.com/Superhero-com/superhero-wallet/commit/79dcf90e6099c2a602f1017bfcb758a5f1a745b1))


### Bug Fixes

* **aeternity:** show correct allowance transaction info ([b5ff9d5](https://github.com/Superhero-com/superhero-wallet/commit/b5ff9d5e4c252422c94a159397a3bb3f5a430384))
* be able to import private key account on mobile app ([80dd57f](https://github.com/Superhero-com/superhero-wallet/commit/80dd57f2eb816d524af8c8f6f4174ca2b9f30d8d))
* be able to receive ethereum related info ([7832b3a](https://github.com/Superhero-com/superhero-wallet/commit/7832b3a6ff2eebc34193b020f60faf0348b7ca3d))
* change svg name ([e20264f](https://github.com/Superhero-com/superhero-wallet/commit/e20264f87ad39ffb691ab85b9aa5ac07c861471b))
* get correct token address for token sale transaction ([e619c24](https://github.com/Superhero-com/superhero-wallet/commit/e619c246e1f9cb8e1a6752929814b02235c8191c))
* missing warning message when focusing/unfocusing autocomplete input ([8f7578f](https://github.com/Superhero-com/superhero-wallet/commit/8f7578f24027df23096e15580258bd629ef0db43))
* raw callData should not be deprecated ([8ea7faf](https://github.com/Superhero-com/superhero-wallet/commit/8ea7fafcd809b256052c59e5a33488d526c07914))
* show assets for sell transactions correctly ([e90d260](https://github.com/Superhero-com/superhero-wallet/commit/e90d260b8e3562b40caf57159a4feb594b4bbc57))
* show correct market cap coin info ([a9106bc](https://github.com/Superhero-com/superhero-wallet/commit/a9106bc4ee855bc6f176db88d1a09ed295748578))


### Maintenance

* token allowance modification are not only for dex ([9667530](https://github.com/Superhero-com/superhero-wallet/commit/96675308834d7fb3191816f42607b010ce26ee54))


### Performance

* **asset-selector:** do not render all assets at once ([3ab5296](https://github.com/Superhero-com/superhero-wallet/commit/3ab52962d5d2fbc2794826142b0f1e01f4c5b071))

### [2.3.1](https://github.com/Superhero-com/superhero-wallet/compare/v2.3.0...v2.3.1) (2024-11-01)


### Features

* add additional info in token details ([7d442c8](https://github.com/Superhero-com/superhero-wallet/commit/7d442c8d0e931f28a39ca2ec410e65fcd569d442))
* add token balance to accounts total ([3853a6b](https://github.com/Superhero-com/superhero-wallet/commit/3853a6b533a5dface18ea2de0403393f96e1570e))
* **aeternity:** show fiat value for tokens with price ([60aa5e2](https://github.com/Superhero-com/superhero-wallet/commit/60aa5e21ca8446725a38873cad060f8c7c6815e6))
* allow copy private key when password skipped ([4998613](https://github.com/Superhero-com/superhero-wallet/commit/4998613d3954c093c3596fd6a487f11c41b4a89b))
* choose protocol when creating new wallet ([765dc53](https://github.com/Superhero-com/superhero-wallet/commit/765dc5375ee8a5959915b53d9fccdb23bf9e4815))
* enrich token swap transactions ([fb62884](https://github.com/Superhero-com/superhero-wallet/commit/fb6288498a6ea5ef3d037d32684c7e7846f94efd))
* preserve tokenSales info in case fetching failed ([c4cf011](https://github.com/Superhero-com/superhero-wallet/commit/c4cf011661325771308309c8ff99cd70e83f805f))
* reusable component for selecting account from a dropdown while typing ([1ae39b9](https://github.com/Superhero-com/superhero-wallet/commit/1ae39b92569a5a9e2abdb412485af2fc6a45e04e))
* show price for tokens ([cfbc24b](https://github.com/Superhero-com/superhero-wallet/commit/cfbc24b4baeb14042e39147f28257b9c5163cd43))
* skip password protection for web ([435d3d0](https://github.com/Superhero-com/superhero-wallet/commit/435d3d0967b33516856969610e55edd6715d5ba8))
* use usd currency name instead of dollar sign ([e1fde63](https://github.com/Superhero-com/superhero-wallet/commit/e1fde63c028fc7c3e36d854ccd834f824d30c7be))


### Bug Fixes

* **aeternity:** show fiat value for transaction that have coin spent ([8966088](https://github.com/Superhero-com/superhero-wallet/commit/896608841b21fdd1c4ad9171f4ec787f4680d5e3))
* **deep-link:** be able to return networkId ([e590832](https://github.com/Superhero-com/superhero-wallet/commit/e590832470cfdb4ff763edee4c726151ef57d2ca))
* show token sale label only for token sale transactions ([c2c3572](https://github.com/Superhero-com/superhero-wallet/commit/c2c3572e13f5c06ae78b288b8377f436677e1196))


### Maintenance

* address book items use panel items ([0572fa5](https://github.com/Superhero-com/superhero-wallet/commit/0572fa56ab438356874d3efa5c429394f00703ce))
* adjust asset details page ([1d609a4](https://github.com/Superhero-com/superhero-wallet/commit/1d609a4e5cdd9bdb4095f802dd8b938c9c01a639))
* rename tokenSwaps to tokenSales ([4a7d815](https://github.com/Superhero-com/superhero-wallet/commit/4a7d8158520a47e70b0b429009108835d6fdd7c5))

## [2.3.0](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.11...v2.3.0) (2024-10-16)


### Features

* [#3318](https://github.com/Superhero-com/superhero-wallet/issues/3318) change wording to remove aeternity ([65c57bc](https://github.com/Superhero-com/superhero-wallet/commit/65c57bcad1626c4bc44c6ead75730b64a1549c4b))
* add change password functionality ([54b344e](https://github.com/Superhero-com/superhero-wallet/commit/54b344e1015ea3cec00459ff483e8f3e9031019e))
* add forgot password ([101d49a](https://github.com/Superhero-com/superhero-wallet/commit/101d49a6f1870b8d51e97a092b6928291e6cf6e3))
* add password login & secure storage ([eb5a944](https://github.com/Superhero-com/superhero-wallet/commit/eb5a944a81ea3542f835154d3d5eaee6de7ac5cc))
* **aeternity:** skip confirm modal for transactions created by wallet ([1380bea](https://github.com/Superhero-com/superhero-wallet/commit/1380beafc046cffc8cedcfe800e67134d6d10bb8))
* allow developer to skip password login ([ab69711](https://github.com/Superhero-com/superhero-wallet/commit/ab697118b4b7a9712bfba9811426a7f325bb3562))
* calculate password strength ([3c738e2](https://github.com/Superhero-com/superhero-wallet/commit/3c738e2d0832de3888c60a5fb4ec487e2bc13753))
* create password for existing wallet ([657802a](https://github.com/Superhero-com/superhero-wallet/commit/657802aa8183ff1ec0d9b89731f122072bb4f92f))
* disable logout time options on web ([7555cad](https://github.com/Superhero-com/superhero-wallet/commit/7555cadc4eea77c8204957950f41dd980eb054a6))
* disable or hide lock wallet button if not usable ([a9406fe](https://github.com/Superhero-com/superhero-wallet/commit/a9406fe46a39c3c9d3714ab3fd99b9e530eb823f))
* do not allow to extend session with local time manipulation ([d87caad](https://github.com/Superhero-com/superhero-wallet/commit/d87caada368fcf0b25ce2dbb1eff59622e7ff9c3))
* do not keep salt and iv with encryption key ([e147614](https://github.com/Superhero-com/superhero-wallet/commit/e1476144c4a3e04bc654a65bfff6a50a621a69dd))
* encrypt login timeout ([5607f66](https://github.com/Superhero-com/superhero-wallet/commit/5607f66ab7a0f1613cce90fc5c163efb3c56483f))
* horizontal scroll component ([fc00632](https://github.com/Superhero-com/superhero-wallet/commit/fc00632e52952e33f8710ec7a131423c73b84bf8))
* migrate mobile mnemonic to secure storage ([859b7a5](https://github.com/Superhero-com/superhero-wallet/commit/859b7a5e380d2b39f7eed2ba2cd7e6386195e70e))
* move browser button before faucet & buy ([9107ed8](https://github.com/Superhero-com/superhero-wallet/commit/9107ed810e42da627172891dfaddc143ac2a2702))
* remove aeternity wording from manifest file ([c5b16fa](https://github.com/Superhero-com/superhero-wallet/commit/c5b16fa8f2f286fce298a10b91294e87f6a2222d))
* secure storage logout action ([a0c3514](https://github.com/Superhero-com/superhero-wallet/commit/a0c3514d22beb812aa33d60996039e2fec8f5bf9))
* support private key export ([0495fff](https://github.com/Superhero-com/superhero-wallet/commit/0495fff9be56b36106058bf8c7050a67ae83f36f))
* support private key import ([91ee00e](https://github.com/Superhero-com/superhero-wallet/commit/91ee00e076cd41d2ff090ca353e6204854a33c7a))
* use default value for secureLoginTimeout ([1666681](https://github.com/Superhero-com/superhero-wallet/commit/1666681839fbd8b4ecf70c16376deb9797c6cbeb))
* **wallet-connect:** support deeplinks ([e9998bd](https://github.com/Superhero-com/superhero-wallet/commit/e9998bd71cf54f74a27b41921c58853ab4c378f2))


### Bug Fixes

* [#3319](https://github.com/Superhero-com/superhero-wallet/issues/3319) change order of protocols ([770151e](https://github.com/Superhero-com/superhero-wallet/commit/770151ecfe23f284d32b22b0d4a7a142992d661d))
* airgap import text ([8b1eec7](https://github.com/Superhero-com/superhero-wallet/commit/8b1eec759081b951f728870e3cfbd99bc53b8280))
* allow displaying terms when not authenticated ([a2aa0e5](https://github.com/Superhero-com/superhero-wallet/commit/a2aa0e56d6efcea58c64e2cbc6f89d8fbdbf14cb))
* apply correct color to BtnSubheader ([182ae07](https://github.com/Superhero-com/superhero-wallet/commit/182ae07f1a2290dbbfa9f192a5794ba32579d9ba))
* be able to connect to dapp ([238a51a](https://github.com/Superhero-com/superhero-wallet/commit/238a51a58c8dda6784f11c0bfbd8df22e0b0701f))
* be able to import private key account if airGap account imported ([a9dfde0](https://github.com/Superhero-com/superhero-wallet/commit/a9dfde00666561009ce0c222f37c7a6601daa7c9))
* be able to open page that are not requiring logging in ([c19da7d](https://github.com/Superhero-com/superhero-wallet/commit/c19da7d4a44e010336e81b0200f82e5f03f3989d))
* be able to remove session key from session storage ([512b94f](https://github.com/Superhero-com/superhero-wallet/commit/512b94f42785dac5190189a12f6db12519662b22))
* be able to scan complex airGap qr codes ([e67d7b2](https://github.com/Superhero-com/superhero-wallet/commit/e67d7b23ecacce14c0d4b4cfd05f2da383c71cbe))
* be able to verify seed phrase ([938e798](https://github.com/Superhero-com/superhero-wallet/commit/938e7983aeeef5870c7eff5c56ba3fcbd75a90c4))
* **bitcoin:** show correct amount for send transactions ([82c6fed](https://github.com/Superhero-com/superhero-wallet/commit/82c6fed3d822f83c339276ba53708cf1a73c42fd))
* check current password before setting new one ([3fde3eb](https://github.com/Superhero-com/superhero-wallet/commit/3fde3ebdc251155fa0f89917c76b7fde97965bba))
* do not hide header on changing password ([0d15d09](https://github.com/Superhero-com/superhero-wallet/commit/0d15d09746e87e5a9f1825db5d2513bb71dd6f59))
* do not set ecnription key if password incorrect ([56a6848](https://github.com/Superhero-com/superhero-wallet/commit/56a684806c8e3be5496e8303ee4b0da0c15de9c1))
* extension can connect to dapps ([1efa6ac](https://github.com/Superhero-com/superhero-wallet/commit/1efa6ac76cbe8ff26b128a548d3569ccbb18deb5))
* **extension:** be able to scan qr code in extension ([4094713](https://github.com/Superhero-com/superhero-wallet/commit/4094713ea4b1535434c298d93b1ac71ba7b1f275))
* **extension:** check existing session correctly ([45c628f](https://github.com/Superhero-com/superhero-wallet/commit/45c628f69922a7645084c150eba91b3cfbfc146d))
* **firefox:** show qr code for addrees book item correctly ([131c422](https://github.com/Superhero-com/superhero-wallet/commit/131c4228a94957799d394d521c941046849176e4))
* input autofocus breaking the modal animation ([713138a](https://github.com/Superhero-com/superhero-wallet/commit/713138ae4ee43bac92b3350cc46ef9dbf528b2fc))
* long account names not truncating ([358af4e](https://github.com/Superhero-com/superhero-wallet/commit/358af4e81c54df737e045d554845129e3d006d3c))
* migrate Secure Login settings ([00ee7af](https://github.com/Superhero-com/superhero-wallet/commit/00ee7af7841f1b1527314fc4475d0e58231bf3e0))
* **mobile:** show enable biometric login modal on setting mnemonic ([80c019e](https://github.com/Superhero-com/superhero-wallet/commit/80c019e6a44b9c2cb954b28bb6e0b5804057a82e))
* secure login settings wrap fields with form ([c722326](https://github.com/Superhero-com/superhero-wallet/commit/c722326e7407740f987062b6a7c31adeb697f8f1))
* show correct mnemonic phrase ([ed00448](https://github.com/Superhero-com/superhero-wallet/commit/ed00448ce203ea6b4c5c5f671b85a0f68a951929))
* update encrypted states on password update ([90870b3](https://github.com/Superhero-com/superhero-wallet/commit/90870b36308645e2248252c9e7f0af2f20724d79))
* update mnemonic encryption on password update ([033bc5f](https://github.com/Superhero-com/superhero-wallet/commit/033bc5ff7d0ccd2724929880878710f9c8b61706))
* use solid lock wallet icon in more page ([90f32a5](https://github.com/Superhero-com/superhero-wallet/commit/90f32a55de66f3894c87ba37b3c2ecb3df36f5b1))


### Performance

* **deep-link:** do not load a Header that is not shown ([62a3c74](https://github.com/Superhero-com/superhero-wallet/commit/62a3c74e35a885644c4d0e3560e6156b4220ae01))
* do not load Header, if hideHeader is enabled ([90325bb](https://github.com/Superhero-com/superhero-wallet/commit/90325bb9117e7ea4c7f344d43d5e894a2401f9bc))


### Tests

* set salt upon login correctly ([3cf175e](https://github.com/Superhero-com/superhero-wallet/commit/3cf175ec1c55c09209eb401c788497b1835872cf))
* update tests to work with password login ([5f7b1a1](https://github.com/Superhero-com/superhero-wallet/commit/5f7b1a1badcb0f49bf0929be090180640affbfe2))


### Documentation

* add missing JWT sign schema ([d05aa96](https://github.com/Superhero-com/superhero-wallet/commit/d05aa9670ddd67a1ffc3ab632b1f17a9847648a8))


### Style

* apply correct label line-height in InputField ([c0c84f0](https://github.com/Superhero-com/superhero-wallet/commit/c0c84f0894b256ebc664262b989dd9f408c8a2fc))


### Maintenance

* add labels to new bug reports ([13a19e0](https://github.com/Superhero-com/superhero-wallet/commit/13a19e07237714c8689f2bce105d60113d989a3b))
* address truncated clickable area ([4979029](https://github.com/Superhero-com/superhero-wallet/commit/497902919b3469e4a65e0984fe02dff0f17f9598))
* disable backend health check ([6b37a14](https://github.com/Superhero-com/superhero-wallet/commit/6b37a1459b663ed805640aa410706ad8996b0a27))
* do not set isAuthenticated outside auth composable ([7569eaa](https://github.com/Superhero-com/superhero-wallet/commit/7569eaaf9de5c5662c671b7221877190e05423bc))
* fix sass-loader warnings ([2e452a2](https://github.com/Superhero-com/superhero-wallet/commit/2e452a239cad3c8b40acc9edf9716bff318e8722))
* improve offline mode tabs wording ([9c278d5](https://github.com/Superhero-com/superhero-wallet/commit/9c278d5664f8d307c11d902ca7d57a8777e8e995))
* lock wallet on login timeout ([709d7fc](https://github.com/Superhero-com/superhero-wallet/commit/709d7fca455ade5b250b3790fd22757e77b7a832))
* remove remnants of migration to manifest v3 ([f4065d2](https://github.com/Superhero-com/superhero-wallet/commit/f4065d2c8961780a9a03078771672da879338400))
* remove ui composableHelpers circular dependency ([cd18848](https://github.com/Superhero-com/superhero-wallet/commit/cd18848f9d7e810af49cd2b3cc117f670c3269b5))
* remove unnecessary lastTimeAppWasActive variable ([bf1a32a](https://github.com/Superhero-com/superhero-wallet/commit/bf1a32acd7b414d60f68d22d4b6e3adc0a56040c))
* remove unused locales ([828aac0](https://github.com/Superhero-com/superhero-wallet/commit/828aac020adb81a283266c0326dbc6dc8a3ae6a0))
* rename passwordKey to encryptedData ([05924a0](https://github.com/Superhero-com/superhero-wallet/commit/05924a0cc5428e203e086ff13de45bcb5b6d3112))
* rename sign JWT deep link ([fc44dbe](https://github.com/Superhero-com/superhero-wallet/commit/fc44dbe23b83b84061b666c1054bce966fb3432d))
* reorganize auth composable ([42b8129](https://github.com/Superhero-com/superhero-wallet/commit/42b8129d29eac0b54caa565481e10a42d1721a9d))
* run npm audit fix ([8fc5545](https://github.com/Superhero-com/superhero-wallet/commit/8fc5545223f7f07ec958b91c706ee1df6fbea12f))
* secure storage move auth logic from accounts composable ([9ba882d](https://github.com/Superhero-com/superhero-wallet/commit/9ba882d4dad69aeacd1978c8f2d8835c05e3fb95))
* set input type only for password field ([11aaf1a](https://github.com/Superhero-com/superhero-wallet/commit/11aaf1a0de269a22844c74b24e6f6ae19812245a))
* simplify secure storage implementation ([a6b3642](https://github.com/Superhero-com/superhero-wallet/commit/a6b36422789dde0e76ef0059baac8bba79b64bc2))
* translate password strength value & simplify AUTHENTICATION_TIMEOUTS const ([0cf47b1](https://github.com/Superhero-com/superhero-wallet/commit/0cf47b13934b6ede4b883861d92f2748a7c02607))
* update backend failure modals wording ([4260570](https://github.com/Superhero-com/superhero-wallet/commit/42605700641a8b6e90fc51d02346a3a9411b4141))
* update Index page wording ([7b410a5](https://github.com/Superhero-com/superhero-wallet/commit/7b410a53d0bbde47e9d94c8d49661f226c146684))
* update project web version description ([b0d97ff](https://github.com/Superhero-com/superhero-wallet/commit/b0d97ff94117cf77182fdf6d7e6af4507b2d51ff))
* use route constants ([0dcb4be](https://github.com/Superhero-com/superhero-wallet/commit/0dcb4be308e23af070c7a20dc6e7a216ee759863))

### [2.2.11](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.9...v2.2.11) (2024-08-21)


### Features

* add new connection statuses ([2d1bda6](https://github.com/Superhero-com/superhero-wallet/commit/2d1bda6809d6510d246cafce8e50c2bfade24bef))
* extension as side panel ([fe4a103](https://github.com/Superhero-com/superhero-wallet/commit/fe4a1037693f777175beb645d27a11d3d948b404))
* invite page route name constant ([696d1b5](https://github.com/Superhero-com/superhero-wallet/commit/696d1b5cf226029b5e53720d36b12133d8550597))
* replace terms and privacy policy icons ([e605c3d](https://github.com/Superhero-com/superhero-wallet/commit/e605c3d77f3ba2496ceca5accbf0a6871662712d))
* show decoded data for ethereum transactions ([72dca02](https://github.com/Superhero-com/superhero-wallet/commit/72dca024e0c60745fdecf7bfe1e64c88953dbbff))
* wallet connect modal styling updates ([e25a0df](https://github.com/Superhero-com/superhero-wallet/commit/e25a0df223e2ae9f2de7b16b1ec878a49ec731cb))


### Bug Fixes

* **aens:** show name bid history correctly ([78257af](https://github.com/Superhero-com/superhero-wallet/commit/78257af761fc3a62846cf2d1c9cfa3f080d4090c))
* align revoke icon correctly ([4a215c3](https://github.com/Superhero-com/superhero-wallet/commit/4a215c3b873fca8575f618f74aaddd16732740eb))
* firefox extension popup content too small ([8da2abd](https://github.com/Superhero-com/superhero-wallet/commit/8da2abd256f73f508de9c5840e5b148b1cb938e0))
* input field disabled state ([59fb7a1](https://github.com/Superhero-com/superhero-wallet/commit/59fb7a1b8661607ffc4c6fa06d186caf675db8a0))
* manifest side panel warnings ([2291516](https://github.com/Superhero-com/superhero-wallet/commit/229151623c5928bf1d75c5892403c785ef77354b))
* **multisig:** show correct info on network switch ([3598bd7](https://github.com/Superhero-com/superhero-wallet/commit/3598bd7f92bd90f5d419a257081c0f64bc292f72))
* network list action buttons opacity ([4b89dd7](https://github.com/Superhero-com/superhero-wallet/commit/4b89dd7756199e45f202ced793c94176430e057c))
* **panel-table-item:** be able to click link ([390845f](https://github.com/Superhero-com/superhero-wallet/commit/390845f2dddda82ddbc67404a47c283c64abce36))
* show correct pending item status ([89e7b3a](https://github.com/Superhero-com/superhero-wallet/commit/89e7b3a69d961e849767987f9bfb19f0ad741d92))
* transaction label for pending transactions ([2070bc5](https://github.com/Superhero-com/superhero-wallet/commit/2070bc5fda4c4bdfac3a2acd5136794a5e9bde66))
* **wallet-connect:** approve all required events ([a034cfb](https://github.com/Superhero-com/superhero-wallet/commit/a034cfb2fb97906ff5d6aae285df6570bc1b2085))


### Maintenance

* active scanner html class ([db78d96](https://github.com/Superhero-com/superhero-wallet/commit/db78d960abef6c130abaca67941df25dd2dd31f9))
* **aens:** use v3 endpoint in auctions ([87f49a8](https://github.com/Superhero-com/superhero-wallet/commit/87f49a82b3262a4f36aa44a76c37b77a4dd0edd1))
* remove raw tx from transaction interface ([faa305a](https://github.com/Superhero-com/superhero-wallet/commit/faa305a0bab1f239ff725ca8290119501b57e82a))
* remove transaction type property ([44a5856](https://github.com/Superhero-com/superhero-wallet/commit/44a58566219998b60d111eb2a3389e86d31dc3e0))
* remove unused dependency ([05e2bf8](https://github.com/Superhero-com/superhero-wallet/commit/05e2bf88074883d739565ea2bb2de47f2ede3894))
* rename network row event names ([f1d5c61](https://github.com/Superhero-com/superhero-wallet/commit/f1d5c61bfa70ee5a63a36c954b5de3c1f86006ad))
* update dependencies ([271a383](https://github.com/Superhero-com/superhero-wallet/commit/271a38380e0ae1f1e121f339e29fad7e81b8c4e8))
* update reset wallet modal ([5f17894](https://github.com/Superhero-com/superhero-wallet/commit/5f17894118828467a2decbca574e5bfb6627a6e4))
* update validation wording ([0ee6b8c](https://github.com/Superhero-com/superhero-wallet/commit/0ee6b8cc87c82c7976c3cd4f66980a1ca118d359))

### [2.2.9](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.8...v2.2.9) (2024-07-19)


### Features

* add addressBook selector to multisig creation form ([bc700d9](https://github.com/Superhero-com/superhero-wallet/commit/bc700d988abaae273c0b46e0e29475a1ca1da777))
* **address-book:** add form validation ([0aea2b7](https://github.com/Superhero-com/superhero-wallet/commit/0aea2b7a9ad8d04e266868610199cc1c571114b3))
* **address-book:** add page & form ([b2be9db](https://github.com/Superhero-com/superhero-wallet/commit/b2be9db60daa3e4b2eaf270fed8de7ed871df6cb))
* **address-book:** add share address button ([69f08ac](https://github.com/Superhero-com/superhero-wallet/commit/69f08ac6bf4a8d9fe0f00d8245c7bd3c00829c73))
* **address-book:** filters logic ([9197946](https://github.com/Superhero-com/superhero-wallet/commit/9197946952341cf57d7c42879204edc5faa63a59))
* **address-book:** import export functionality ([08d1d21](https://github.com/Superhero-com/superhero-wallet/commit/08d1d21a544992f5752604af6294827e4f4d7751))
* **address-book:** send to contact ([e617b2c](https://github.com/Superhero-com/superhero-wallet/commit/e617b2c206e79568c29f838c71c90cd85b0dc20c))
* global font family definition ([812ba5e](https://github.com/Superhero-com/superhero-wallet/commit/812ba5e95e8d072e9dcbda4ec9af27b6cdbf1be3))
* improve character counter ui ([840d86d](https://github.com/Superhero-com/superhero-wallet/commit/840d86dbacc7771babecdae20044363d505e0eec))
* radio input styles unification ([fc8d3eb](https://github.com/Superhero-com/superhero-wallet/commit/fc8d3ebce916fa2a67dd42bb8afd610e0888f09e))
* remove duplicated babel config files ([b95089a](https://github.com/Superhero-com/superhero-wallet/commit/b95089a78a08d9bb74b8a5406333dbe3138d2e96))
* remove name avatar faces ([c06755c](https://github.com/Superhero-com/superhero-wallet/commit/c06755c15530b3928f3eb7066150ccf0b6440f7e))
* show fee in transaction list for token transfers ([a67d5c5](https://github.com/Superhero-com/superhero-wallet/commit/a67d5c5a951924a9c056a80d845332a115b3d3bb))


### Bug Fixes

* add missing wording ([9ee8c2a](https://github.com/Superhero-com/superhero-wallet/commit/9ee8c2a6ee5a2e2e2d21c0dd65cfddca67f63a0d))
* **aens:** show correct auction end info ([9ac1b19](https://github.com/Superhero-com/superhero-wallet/commit/9ac1b192c194efb0a1eeb366526f9e130d590870))
* **aens:** validate name correctly ([38101a4](https://github.com/Superhero-com/superhero-wallet/commit/38101a42519afafa95e937443b9f6d66924c9267))
* be able to select from account assets only ([47d46d5](https://github.com/Superhero-com/superhero-wallet/commit/47d46d57c9ff91da23bfffdf591a8b1a51cefa79))
* link button colors ([fc0cadf](https://github.com/Superhero-com/superhero-wallet/commit/fc0cadfdf5746203baf6b793be5af1f05db19114))
* **multisig:** show correct multisig proposal blockHeight ([69b80f7](https://github.com/Superhero-com/superhero-wallet/commit/69b80f707b30a723edfa2f42d4bcdb626a9fec7b))
* **multisig:** show correct revoke info ([e10038b](https://github.com/Superhero-com/superhero-wallet/commit/e10038b666832fa6f385abaa91cbee53b7acdb4b))
* network switcher options margin ([d1b9b73](https://github.com/Superhero-com/superhero-wallet/commit/d1b9b73e557d01f4b9b95ff0e29302f4d2328cec))
* remove incorrect component prop ([0e0d63a](https://github.com/Superhero-com/superhero-wallet/commit/0e0d63a2a243b41d7439bfeaa0d3e82e48e836fc))
* show bid history correctly ([9869205](https://github.com/Superhero-com/superhero-wallet/commit/9869205f0391c63265f7f2a0a20f516fb93f04e3))


### Documentation

* add a deep link schema ([7d5cdba](https://github.com/Superhero-com/superhero-wallet/commit/7d5cdba894d05197ce41d84cbb3001837a85cc41))


### Maintenance

* add data-cys to address-book filters ([56c3259](https://github.com/Superhero-com/superhero-wallet/commit/56c32596421c58cfa22d75a4c2cbc5f291f74430))
* **address-book:** resolve comments ([279c322](https://github.com/Superhero-com/superhero-wallet/commit/279c322926284ee0884e79867d197a82e2dda084))
* change mainnet backend url ([244b4ab](https://github.com/Superhero-com/superhero-wallet/commit/244b4ab9bcf017bc1efba4b7b2155fae26489ad1))
* multisig accounts use storage ref ([79f5b3c](https://github.com/Superhero-com/superhero-wallet/commit/79f5b3c7ce1470143337a5de3a9ab68e4975d8f6))
* remove unused wording ([341fc0e](https://github.com/Superhero-com/superhero-wallet/commit/341fc0e04300a7e4bd01f5b40fbb4d8691548a83))
* unify label text styling ([833599d](https://github.com/Superhero-com/superhero-wallet/commit/833599d38471baf98c7333153b3d8fdda2be1ee3))
* update ionic ([56a2897](https://github.com/Superhero-com/superhero-wallet/commit/56a2897c4a4066762c273c1dfdc9941c08c057f4))

### [2.2.8](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.7...v2.2.8) (2024-07-17)


### Maintenance

* reduce size of the built chunks ([3f0bcaa](https://github.com/Superhero-com/superhero-wallet/commit/3f0bcaa18f200d59adfcdef7cbfd2a395db4b72e))

### [2.2.7](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.6...v2.2.7) (2024-07-02)


### Features

* add function name to transaction details ([749219d](https://github.com/Superhero-com/superhero-wallet/commit/749219df684adc7409900615e4fec5bf35e7de00))
* add gas information to transaction details ([986cc0e](https://github.com/Superhero-com/superhero-wallet/commit/986cc0e0c917c8f664727f426ed743651440dc8b))
* airgap accounts can only send to address ([b4f27bf](https://github.com/Superhero-com/superhero-wallet/commit/b4f27bf473aa91a1b45eaf7270d63e15eb3dbc4f))
* **airgap:** account import ui improvements ([ab311b4](https://github.com/Superhero-com/superhero-wallet/commit/ab311b4eeaab631d02f43585aecd8dba64036162))
* **airgap:** implement no qr flow & new design ([67c2636](https://github.com/Superhero-com/superhero-wallet/commit/67c26363ac72e1f3b574a94570c6b204892ccdbc))
* **airgap:** send transaction flow ([33680e0](https://github.com/Superhero-com/superhero-wallet/commit/33680e0ae151f36f5a657f67ad9634a9995a5351))
* **airgap:** sign transactions ([95e067f](https://github.com/Superhero-com/superhero-wallet/commit/95e067f912cb02bb77f2d76ec271357743373ec5))
* **airgap:** update styling of input error and warning messages ([a460c1c](https://github.com/Superhero-com/superhero-wallet/commit/a460c1cd689acc8484cf7338a568ade6524622ab))
* eth chain id numeric instead of hex ([07cb2e1](https://github.com/Superhero-com/superhero-wallet/commit/07cb2e1d8d5bb9b0bbc22dbe53863ebf9fe900d7))
* eth wallet connect dapps support ([d16dffa](https://github.com/Superhero-com/superhero-wallet/commit/d16dffa9fc7636f805a2d35e44942241cf9822ec))
* modal open return type ([58f0624](https://github.com/Superhero-com/superhero-wallet/commit/58f06248e4c9d872b99fab482c39998b452e2197))
* show error modal when airGap account tries to signMessage ([de6b03b](https://github.com/Superhero-com/superhero-wallet/commit/de6b03bd411a4ecd7c46f036bbf1b7e3582fc10d))
* the ability to connect qr based hardware wallet ([d32fa56](https://github.com/Superhero-com/superhero-wallet/commit/d32fa56dad5cf3339a7196f516d76364f9afd9f6))
* wallet connect extension open tx confirm modal ([b00ec2a](https://github.com/Superhero-com/superhero-wallet/commit/b00ec2aac6e290dfad69e1f237051e43ab6e7912))
* walletConnect transaction sign modal alignments ([20b1854](https://github.com/Superhero-com/superhero-wallet/commit/20b1854b6fef3d8802e134c80a7c0ed48a46c4c0))


### Bug Fixes

* airgap extension issues ([ebbdca3](https://github.com/Superhero-com/superhero-wallet/commit/ebbdca3d989043c68bcd34c693b66cb7937e3ec6))
* alignment on AccountInfo ([001b00e](https://github.com/Superhero-com/superhero-wallet/commit/001b00e6f6568f3d66134249fa9c1ffcc7631cdf))
* cache currency rates ([d8ee2ed](https://github.com/Superhero-com/superhero-wallet/commit/d8ee2edd7fa597cb9d68395d3955193755be2a91))
* camera permission request on ff ([f13487a](https://github.com/Superhero-com/superhero-wallet/commit/f13487a34ab0733d1f40ace2fd12599e662aa37f))
* copy multifragment qr code ([cd3ce29](https://github.com/Superhero-com/superhero-wallet/commit/cd3ce2909544b34c1ae2ed7483a24a50f6ce6755))
* custom networks are testnet type ([1a377d5](https://github.com/Superhero-com/superhero-wallet/commit/1a377d5f715243836e1ebf3dec7ea4cc3db5ad9e))
* do not overload node with dry-runs ([af537dc](https://github.com/Superhero-com/superhero-wallet/commit/af537dce78feb72f776c8c7a4969471f8650a70a))
* do not show symbol for gasUsed ([227fa42](https://github.com/Superhero-com/superhero-wallet/commit/227fa42744e77c9cf94bedb916458ec8fb09e763))
* **fungible-token:** be able to send big amount ([55b8053](https://github.com/Superhero-com/superhero-wallet/commit/55b805371daa48583ca0574c8be83b486ce152a3))
* improve input error message & throttle balance updating ([2687b0e](https://github.com/Superhero-com/superhero-wallet/commit/2687b0e49e0c767a73f725d1f4dc5c16562cf099))
* long names extend beyond container ([6536a70](https://github.com/Superhero-com/superhero-wallet/commit/6536a701fd233fa4840754f54ef776d3b4fa43ec))
* multipart qr code progress bar ([6e8ed40](https://github.com/Superhero-com/superhero-wallet/commit/6e8ed40318f8886c1ccf3a6ff3869e06c8f6ead3))
* remove window browser polyfill from ext background ([0181251](https://github.com/Superhero-com/superhero-wallet/commit/0181251ed50efcd1d1824d613b2cfad53c3f6f25))
* reset input after generating gift card ([b69cb4a](https://github.com/Superhero-com/superhero-wallet/commit/b69cb4a7848dabb68e74791012efe22d316cc78d))
* resolve several manifest issues ([b64911f](https://github.com/Superhero-com/superhero-wallet/commit/b64911fdf70dc713e903672592bb6bffb910a731))
* scan qr code translation ([bcbc48f](https://github.com/Superhero-com/superhero-wallet/commit/bcbc48fce42b3f0588472b152978c979b76a0212))
* show correct fee in the multisig proposal details ([e1ff7e1](https://github.com/Superhero-com/superhero-wallet/commit/e1ff7e17dd5f488f96ff8ddac65945aed1be0e83))
* show correct prepared transaction info ([227e4a4](https://github.com/Superhero-com/superhero-wallet/commit/227e4a44a22f18c5d49ba455253da2e5e188e343))
* show gasCost if exists ([6c7ae0a](https://github.com/Superhero-com/superhero-wallet/commit/6c7ae0a24157a5e834ce242d7818b8578f854699))
* skip decimals calculation in transaction list item ([1f07a66](https://github.com/Superhero-com/superhero-wallet/commit/1f07a668c760bdb6fa974b34f334f73a179a8938))
* update qr code when value changes ([edc16a4](https://github.com/Superhero-com/superhero-wallet/commit/edc16a4d972e1d785926e94cb5d15866f62298ea))
* wallet connect confirm transaction fee calculation ([e6dc658](https://github.com/Superhero-com/superhero-wallet/commit/e6dc658a72d097c965c6663d765abad6a753fe05))
* **wallet-connect:** be able to send transaction ([4de167c](https://github.com/Superhero-com/superhero-wallet/commit/4de167cef1fd86d1244191ab5f9f8d643b25b7aa))
* weth transaction details ([f8d12cd](https://github.com/Superhero-com/superhero-wallet/commit/f8d12cd8fdcdae0092e2089aba2fa465c4242b5a))


### Tests

* update snapshots ([f2ae462](https://github.com/Superhero-com/superhero-wallet/commit/f2ae46263473087ed0f758c173cab1a14b7ae6d5))


### Maintenance

* apps browser types and composables update ([80fd11a](https://github.com/Superhero-com/superhero-wallet/commit/80fd11a49b50c788bab5a93f627d14fda8724cf5))
* change backend url ([66acf44](https://github.com/Superhero-com/superhero-wallet/commit/66acf441ae90058fed20f8c0c731c344b1e68192))
* css imports ([38ecb52](https://github.com/Superhero-com/superhero-wallet/commit/38ecb52162d62b259c8b65cd727002f6ad7273ca))
* issues after rebase ([97269e6](https://github.com/Superhero-com/superhero-wallet/commit/97269e6b1d0cdda6a2725eb23cf75dbc01f2f29a))
* **multisig:** remove wrong hash info ([6b440c7](https://github.com/Superhero-com/superhero-wallet/commit/6b440c713ccf00cb0a5696577e9f7431adfe223c))
* restructure airgap integration ([becb6de](https://github.com/Superhero-com/superhero-wallet/commit/becb6de1f8612113b23259c43d4d94bd83e49ceb))
* run npm update ([1029ada](https://github.com/Superhero-com/superhero-wallet/commit/1029adafcd80633f5f53e2c41dde0e3f863f1955))
* transaction data composable arguments as refs ([b973c34](https://github.com/Superhero-com/superhero-wallet/commit/b973c34d8d893d101cd83521f0b55b62f51174e2))
* transaction overview remove unused props ([f8edee5](https://github.com/Superhero-com/superhero-wallet/commit/f8edee5e3ac56ac48066e5d7e5494a9d6320e65c))
* update sdk to 13.3.2 ([fdd7895](https://github.com/Superhero-com/superhero-wallet/commit/fdd789500ef9fa1e7e53e1949682c69ebef5aae9))
* use Superhero Wallet as app name ([70a471a](https://github.com/Superhero-com/superhero-wallet/commit/70a471a1cc380dcd33a294ccdc5e045fae8ce6df))


### Performance

* debounce max amount calculation ([6aaeee4](https://github.com/Superhero-com/superhero-wallet/commit/6aaeee405f54ff91320965ad16cc24d418fe798c))
* **multisig:** do not reinitialize contract instances ([deaa5d0](https://github.com/Superhero-com/superhero-wallet/commit/deaa5d02d83756c8287c3e6ab77ad562a8135686))
* **multisig:** poll current network vaults info ([260a033](https://github.com/Superhero-com/superhero-wallet/commit/260a033628c508a5dd52dec7a3d3b2cdcbcb1aef))

### [2.2.6](https://github.com/superhero-com/superhero-wallet/compare/v2.2.5...v2.2.6) (2024-05-27)


### Features

* add placeholder when device has no camera ([433e869](https://github.com/superhero-com/superhero-wallet/commit/433e8695cf30bb708f40fe0b025bb02a64aaeb0d))
* ask confirmation for delegation and typed data signing ([0bc3cb1](https://github.com/superhero-com/superhero-wallet/commit/0bc3cb15251f3adaf5481a9d8c1ce28b85b92c31))
* **bitcoin:** improve dust error ([8e58952](https://github.com/superhero-com/superhero-wallet/commit/8e589528b28e82fd4f54b36c7368aa1fcb2e16ab))
* custom panel table item component ([de18eef](https://github.com/superhero-com/superhero-wallet/commit/de18eeff74eb43fbedcded56690951668cd63f56))
* open scan qr code modal method ([b1b72c3](https://github.com/superhero-com/superhero-wallet/commit/b1b72c3de9fb600f67965da96913a33ef2d0b7ab))
* qr code scanner messages inside box ([953321e](https://github.com/superhero-com/superhero-wallet/commit/953321ef31ee7e1d3886d5b8f13778cd15ffe5f8))
* show loader on account discovering after migration ([1520915](https://github.com/superhero-com/superhero-wallet/commit/1520915be30db95c28243c084992f75043a23e46))


### Bug Fixes

* adjust wording for failed transaction modal ([120b822](https://github.com/superhero-com/superhero-wallet/commit/120b8222a2ce505157c10fe0ff1445d9eeb7bf74))
* **aeternity:** include gasUsed to the calculation of total ([fb0e456](https://github.com/superhero-com/superhero-wallet/commit/fb0e4565c054b42b131e1340417f1b45c6df2099))
* **aeternity:** show correct fee in initialization of TransferSend modal ([9e02090](https://github.com/superhero-com/superhero-wallet/commit/9e02090d38740131b0ea76e3b5493e798037c177))
* **aeternity:** show node connection error ([01c0503](https://github.com/superhero-com/superhero-wallet/commit/01c050323f5a7ede964c8eab28588224da317e6b))
* **bitcoin:** show correct transaction info ([bf2fcf2](https://github.com/superhero-com/superhero-wallet/commit/bf2fcf2944a953dcc34531a55eeb34fc47f69ee8))
* **browser:** accept urls starting with "Http://" ([f1c667d](https://github.com/superhero-com/superhero-wallet/commit/f1c667dbffea37bc6b653d846344b49916deb6f2))
* **browser:** allow opening aepps on localhost ([ada5fbd](https://github.com/superhero-com/superhero-wallet/commit/ada5fbd4543aeeb142606e3e33da4a861a5716c0))
* **browser:** use url keyboard instead general ([c25f723](https://github.com/superhero-com/superhero-wallet/commit/c25f7232e5ff9a44954e63f92e01924a4ce99dee))
* calculate fee based on node load ([9de40f4](https://github.com/superhero-com/superhero-wallet/commit/9de40f4d67d567a0e276eb58cc787d9cf03f3a30))
* estimate gas limit for erc20 transfers ([6e33f45](https://github.com/superhero-com/superhero-wallet/commit/6e33f45cd89dfbe8f80a3652294cd0ac7c8bb3ea))
* **ethereum:** show token transfer info correctly ([2b9dabb](https://github.com/superhero-com/superhero-wallet/commit/2b9dabbcc3f6a5365596e2379daebf2a6aca1c16))
* handle pay for tx correctly ([2ca3657](https://github.com/superhero-com/superhero-wallet/commit/2ca365719f5f9b6dc03994889dbe40d574fe0f56))
* **ios:** don't recreate RpcClient on navigation inside page ([60b7d55](https://github.com/superhero-com/superhero-wallet/commit/60b7d550381e7b671ea5c2ea0d2187871d2c3c2c))
* multisig transfer receive share correct address ([b9b5252](https://github.com/superhero-com/superhero-wallet/commit/b9b52523942692b2bd8ea2e8e3455e3f1c4af191))
* **multisig:** do not fail if no function provided ([acd104a](https://github.com/superhero-com/superhero-wallet/commit/acd104a3f3749b47b4ea2ae6a56d83f3cf8c5ce0))
* **multisig:** slide to active account ([361518e](https://github.com/superhero-com/superhero-wallet/commit/361518e2d9b1f4dc550919f9e57d04eca790d44f))
* remove extra error message in RpcRejectedByUserError ([8f4d1bb](https://github.com/superhero-com/superhero-wallet/commit/8f4d1bbe83a5b1d3ddff1444b3fbc5323e238343))


### Performance

* do not create new sdk instance on invite claim ([1a314ef](https://github.com/superhero-com/superhero-wallet/commit/1a314ef8af2528e82f898ca3b486d2cafed2631b))
* remove skip optimize flag on svg loading ([6ee6d0a](https://github.com/superhero-com/superhero-wallet/commit/6ee6d0a76fd44c1056eab11c765efbbdd82ed5d3))


### Tests

* add deeplinks e2e test ([5a6b219](https://github.com/superhero-com/superhero-wallet/commit/5a6b2190cd9476a935ebc8c80fab2feb8586a02c))
* add invites e2e test ([69f27bc](https://github.com/superhero-com/superhero-wallet/commit/69f27bc8d30bc7890ed9f9e61781cf8e60894fa9))
* add open-scan-qr-modal unit test ([b98e97e](https://github.com/superhero-com/superhero-wallet/commit/b98e97e47577c1f2a0dfc0b0ae8a56ce937aea33))
* add receive e2e test ([320075a](https://github.com/superhero-com/superhero-wallet/commit/320075a7114ad7950cd9cd737d0c6b1cc0101999))
* disable part of invite test ([393febd](https://github.com/superhero-com/superhero-wallet/commit/393febd90bd14bdee258f4df9ec815564bb5a3d8))
* update deeplinks test page ([f2053de](https://github.com/superhero-com/superhero-wallet/commit/f2053de5d155154453eb8d9e4cfff7d0ea2dbb22))


### Maintenance

* app name as constant ([00f8ef6](https://github.com/superhero-com/superhero-wallet/commit/00f8ef6710dddfbd9e8a6e7b1b8aefd7123fd8a7))
* **browser:** ensure one RpcClient per iframe, avoid extra polling ([be5ff43](https://github.com/superhero-com/superhero-wallet/commit/be5ff433e9612a2fb0ec536e50d4ed69862e48df))
* comment on iOS fix in InputField ([23011f2](https://github.com/superhero-com/superhero-wallet/commit/23011f220a3a0b3e5470d10e6318ddf2fba0e577))
* hide dex filter on AE asset page ([a0405e2](https://github.com/superhero-com/superhero-wallet/commit/a0405e2b6ef9d841502d5fe475ec4b854d3bc9a0))
* qr scanner modal safari camera permissions ([ec90b95](https://github.com/superhero-com/superhero-wallet/commit/ec90b951b06957beb7ba3c50451b538e801c2053))
* remove untranslated locale ([d2ed330](https://github.com/superhero-com/superhero-wallet/commit/d2ed330bd7729b793f71bde25667ee6656ed65fb))
* remove unused dependency ([78942f0](https://github.com/superhero-com/superhero-wallet/commit/78942f0d2f158f3b89b7bc9dc8c44ee88841444d))
* rename ae coin name to aeternity ([c9489d6](https://github.com/superhero-com/superhero-wallet/commit/c9489d63e822cd4190cd58b653c03292ddef4dcf))
* replace browser qr code reader ([ad15090](https://github.com/superhero-com/superhero-wallet/commit/ad1509059c86174d5b063a2df440706ac5bdd8b1))
* show total amount for multisig contract calls ([63ad6f4](https://github.com/superhero-com/superhero-wallet/commit/63ad6f42441b475313d8ad17e75323c7d093fa13))
* show total amount with high precision ([f5b2e0d](https://github.com/superhero-com/superhero-wallet/commit/f5b2e0d55bfaebb0b4bdb9b450919fa7e503ce17))
* update capacitor & plugins to v6 ([a63f77a](https://github.com/superhero-com/superhero-wallet/commit/a63f77afc861a78375e0d7091b2fc354b0b05769))
* update github actions to the latest versions ([d645e6f](https://github.com/superhero-com/superhero-wallet/commit/d645e6ff075d6ccd6359226d3a17b4c42b29e0de))
* use isNameValid from sdk instead of custom ([1ee963d](https://github.com/superhero-com/superhero-wallet/commit/1ee963df562e55d6fd3ff64cd0efcfe6417a6cf0))

### [2.2.5](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.4...v2.2.5) (2024-05-04)


### Bug Fixes

* calculate auth tx hash in Ceres ([59c578e](https://github.com/Superhero-com/superhero-wallet/commit/59c578eb3dd5f23bd113b090e2ab3ff7369ab784))

### [2.2.4](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.3...v2.2.4) (2024-04-22)


### Bug Fixes

* show build, ci commit types in the changelog ([36cefea](https://github.com/Superhero-com/superhero-wallet/commit/36cefea0bd1cba785c0f4f40185a1cb0e560f3a8))


### Maintenance

* update sdk to 13.3.1 ([d3cba80](https://github.com/Superhero-com/superhero-wallet/commit/d3cba8009e5fb13dc8321b75d85304e6f7222dfa))

### [2.2.3](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.2...v2.2.3) (2024-04-18)


### Features

* ability to sign payForTx, typed data, delegation ([9342082](https://github.com/Superhero-com/superhero-wallet/commit/934208261d6719eb3646b777383c471fa86521ac))
* add support for biometric login on mobile apps ([4ef0219](https://github.com/Superhero-com/superhero-wallet/commit/4ef02190f7f51647f5d1043bb995a7e2585d7130))
* allow to replace caller in sign transaction ([1e4aae3](https://github.com/Superhero-com/superhero-wallet/commit/1e4aae3ee9e88f31cea456b09d916b9522c2aced))
* expose address for sign message in callback ([b445a5c](https://github.com/Superhero-com/superhero-wallet/commit/b445a5cf88a9a4a564189b78a026304f11de47d4))
* show max fee for eth transactions ([f15c6ce](https://github.com/Superhero-com/superhero-wallet/commit/f15c6ce1cc51b3a9334736a6a2af1706998160ee))
* support jwt signing ([90d55bf](https://github.com/Superhero-com/superhero-wallet/commit/90d55bf8b47cf294a0be13cf4d2cdbfc65a07daf))
* warn user that sender has been replaced ([6291f65](https://github.com/Superhero-com/superhero-wallet/commit/6291f652e63e0814ee49d003512aa0a4b3a85453))


### Bug Fixes

* add gecko id to browser_specific_settings for ff ([976b06a](https://github.com/Superhero-com/superhero-wallet/commit/976b06a73b9316de94d5c081a140cb5b60b2d975))
* **aeternity:** be able to send max amount ([69aeb71](https://github.com/Superhero-com/superhero-wallet/commit/69aeb7198a939edab46f8b461fae232a98fb1132))
* allow to open index html via redirect ([a1a6193](https://github.com/Superhero-com/superhero-wallet/commit/a1a61936169636dd0e25efe91be550889a499129))
* be able to migrate mnemonic from vuex ([fda76f7](https://github.com/Superhero-com/superhero-wallet/commit/fda76f79517a9a97a8490648c4ba1212db08c701))
* blurred modal windows ([d9f42fb](https://github.com/Superhero-com/superhero-wallet/commit/d9f42fb07f1a14c2a65856ab56a5cf81a9bf6b80))
* browser actions menu buttons appearance ([0713f4a](https://github.com/Superhero-com/superhero-wallet/commit/0713f4af7254d3b28ab3fe692b411346ae7f7103))
* do not use sdk without node ([dfd0fff](https://github.com/Superhero-com/superhero-wallet/commit/dfd0fff0f943a94c554c6ecb74acd0dc25670ff3))
* eth max button should stay on ([27c1fb8](https://github.com/Superhero-com/superhero-wallet/commit/27c1fb89abafc7bd27a9762ff0782723458082bd))
* header add btn vue keys ([0b45ccf](https://github.com/Superhero-com/superhero-wallet/commit/0b45ccfcc73cc4c9f563600d4da235c1fd96a89c))
* **multisig:** disable every propose button if propose pending ([6e6f987](https://github.com/Superhero-com/superhero-wallet/commit/6e6f987e2fc3965550f912d55a515f97b20ea342))
* prevent cutting off parts of account name letters ([3313569](https://github.com/Superhero-com/superhero-wallet/commit/3313569628c0edd6b2f67b51d8b3c7f26cb1b3c1))
* secure login modal should not appear when authenticated ([39300e3](https://github.com/Superhero-com/superhero-wallet/commit/39300e306586956ff23a280804838e8ce2a94391))
* show dex related info only for dex transactions ([8faa670](https://github.com/Superhero-com/superhero-wallet/commit/8faa670ee689138c06d1f0410f82de30043637f6))
* update dryRunSdk on network change correctly ([58b0389](https://github.com/Superhero-com/superhero-wallet/commit/58b038999ebcba31aa2dea1dc8a77a04fa4f9cef))


### Maintenance

* update eth node urls ([a9219c4](https://github.com/Superhero-com/superhero-wallet/commit/a9219c42fba541acb8516d63cfd8cb12a5c5db20))


### Performance

* use dryAeSdk to collect multisig info ([2789cf4](https://github.com/Superhero-com/superhero-wallet/commit/2789cf4bc220d7d856add79d6be80208e458dbd1))

### [2.2.2](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.1...v2.2.2) (2024-04-14)


### Bug Fixes

* allow to open index html via redirect ([8125f9b](https://github.com/Superhero-com/superhero-wallet/commit/8125f9bfb956c470211f2511a91520920483140b))
* be able to migrate mnemonic from vuex ([e11f2e3](https://github.com/Superhero-com/superhero-wallet/commit/e11f2e3c035b843594cbeb48ea1680522c66335a))

### [2.2.1](https://github.com/Superhero-com/superhero-wallet/compare/v2.2.0...v2.2.1) (2024-04-01)


### Features

* refresh account latest transactions if pending found ([86d2ee8](https://github.com/Superhero-com/superhero-wallet/commit/86d2ee8f01238b081c71d8978c89cb67142a2745))


### Bug Fixes

* correct grammar ([de00164](https://github.com/Superhero-com/superhero-wallet/commit/de00164372d2839d8e3df7277f2030ba10bc98fa))

## [2.2.0](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.6...v2.2.0) (2024-03-28)


### Features

* add custom token icons ([a2171fc](https://github.com/Superhero-com/superhero-wallet/commit/a2171fc31c498e7cb817e4225b58f83e4cf36e87))
* add eth protocol icon ([83836f2](https://github.com/Superhero-com/superhero-wallet/commit/83836f296379ff888566d28ab090825a7993e4cb))
* add eth transfer receive view ([5464ba3](https://github.com/Superhero-com/superhero-wallet/commit/5464ba31d922368ac9cb6262a1d0f19c91e03c0f))
* add eth transfer send view ([93917ad](https://github.com/Superhero-com/superhero-wallet/commit/93917ad1426455399d44bb1a4e87917fe0721891))
* add meta description ([51fb142](https://github.com/Superhero-com/superhero-wallet/commit/51fb142042e2f2e1ff1b7ea041b2971d7145272a))
* add pending eth transactions instantly after sending ([0ad3caf](https://github.com/Superhero-com/superhero-wallet/commit/0ad3caf3089721bfb37f5b8eebe2f1ef22232381))
* add support of erc20 tokens into eth adapter ([19d112e](https://github.com/Superhero-com/superhero-wallet/commit/19d112e0c13e5ae3cb40ac0064f3979676e7d562))
* add temp eth account ([e8bf163](https://github.com/Superhero-com/superhero-wallet/commit/e8bf16384c633b2c62214fbafba2313ead1a459e))
* asset names and symbols ([aee963c](https://github.com/Superhero-com/superhero-wallet/commit/aee963ceabdaafa7194c1a22e244e6bfdd9f22bb))
* associated wallet domain ([ad178e6](https://github.com/Superhero-com/superhero-wallet/commit/ad178e67f0577824707e8419f2593a5d37eaaac3))
* autocomplete address in transfer send form even if different protocol ([867b903](https://github.com/Superhero-com/superhero-wallet/commit/867b90314c4cdda63afafc84ad415c9fc2231451))
* be able to send erc20 tokens ([ce4f908](https://github.com/Superhero-com/superhero-wallet/commit/ce4f908933428e35d4b9e15097313c4aac598e39))
* calculate ethereum fees ([444588c](https://github.com/Superhero-com/superhero-wallet/commit/444588cb7abfb3a9dd732c438c4e784273990305))
* composables migrations ([d1a6083](https://github.com/Superhero-com/superhero-wallet/commit/d1a60836fd93d57e226af417dcc37b8847d91b69))
* create last used routes library ([d3e6b67](https://github.com/Superhero-com/superhero-wallet/commit/d3e6b671a07921fa7248d1c11c9805955768db28))
* dashboard account counter and switcher ([276fd8e](https://github.com/Superhero-com/superhero-wallet/commit/276fd8e422abd8bafa771b688ab0a73c3c697cbe))
* erc-20 token transaction list ([9b8d3b1](https://github.com/Superhero-com/superhero-wallet/commit/9b8d3b1a47dc9c190b3a07b85e38276ffd8b4f79))
* eth account details erc-20 token details ([7d21ce6](https://github.com/Superhero-com/superhero-wallet/commit/7d21ce63b81a29c9624672a09469c3bc07d935a3))
* eth account details erc-20 token list ([90760df](https://github.com/Superhero-com/superhero-wallet/commit/90760df05d196d4f0efade0668a16ca2367446ee))
* eth adapter fetch transactions ([dc2217c](https://github.com/Superhero-com/superhero-wallet/commit/dc2217c30783c1c08670731074b5875060a83dce))
* eth add default network values ([7f5ec0b](https://github.com/Superhero-com/superhero-wallet/commit/7f5ec0bac60bf9ac425d7783251c59493545067b))
* eth add erc-20 asset selector support ([b0b1b64](https://github.com/Superhero-com/superhero-wallet/commit/b0b1b64a1eeaa4f6c0c4c6699abf03f8e6818e89))
* eth add explorer urls ([e42a2c5](https://github.com/Superhero-com/superhero-wallet/commit/e42a2c58bb2fe2d256d406e4e8532975c0163f18))
* eth create account & fetch balance ([892ca30](https://github.com/Superhero-com/superhero-wallet/commit/892ca30ae9501cbd6002873c394e1fc7475613ae))
* eth dont wait for tx confirmation when sending ([aff7686](https://github.com/Superhero-com/superhero-wallet/commit/aff7686f1ffd39ccb08380ccbb4af931adc7177e))
* eth erc-20 display only owned tokens ([7a16eb3](https://github.com/Superhero-com/superhero-wallet/commit/7a16eb371ce18f49d8ba5c9fbd2bdb136e733f75))
* eth spend ([4e4b548](https://github.com/Superhero-com/superhero-wallet/commit/4e4b548013b4b262c74c26b8af6aa626575ef6d6))
* eth used accounts discovery ([3632d29](https://github.com/Superhero-com/superhero-wallet/commit/3632d29fdbe2e00f83787897538e98addbf4a99a))
* ethereum account details page ([1a0988a](https://github.com/Superhero-com/superhero-wallet/commit/1a0988a6ce3f73938ff9b7cd6417652263c80c91))
* ethereum address validation ([b55e020](https://github.com/Superhero-com/superhero-wallet/commit/b55e020dce750084c039eb2bd45db41f3fcbbb88))
* ethereum support initial structure ([a4ceb65](https://github.com/Superhero-com/superhero-wallet/commit/a4ceb65283416e160ed9d6dd56d225f05e8d91b9))
* ethereum transaction details ([cf63b36](https://github.com/Superhero-com/superhero-wallet/commit/cf63b368b84b2df4a765b6391cc98a0267ecaea8))
* ethereum transaction list ([7eac415](https://github.com/Superhero-com/superhero-wallet/commit/7eac41594e5db86c9d7493637431aad51ff532a0))
* extract custom tokens from token balances ([6a0670b](https://github.com/Superhero-com/superhero-wallet/commit/6a0670b8ec20de294dc38067cfcdce886267197e))
* fetch transactions when account balance changes ([67be7b6](https://github.com/Superhero-com/superhero-wallet/commit/67be7b684a0e231524bd4c4937ce07fdad5f779f))
* handle hardware back button ([e24c1ab](https://github.com/Superhero-com/superhero-wallet/commit/e24c1ab96c7a11a505c76eeee620e6103e7cfe2c))
* hide vault address when not ready ([6e3d1b0](https://github.com/Superhero-com/superhero-wallet/commit/6e3d1b064dff818a19fc7c97a1393fb04d3b6bd8))
* implement back to top button ([7724ee0](https://github.com/Superhero-com/superhero-wallet/commit/7724ee048f6be328ed4798d62bc0a48a8ca9e273))
* limit number of decimals for amount inputs according to selected asset ([9f29b90](https://github.com/Superhero-com/superhero-wallet/commit/9f29b9012d77a96df2b447ddfc2f0d53ecf37f20))
* lock screen orientation in portrait ([61e976e](https://github.com/Superhero-com/superhero-wallet/commit/61e976e9b975d899b25be172dbe34188c4c6b58c))
* make transactions default view for account details ([69f03e1](https://github.com/Superhero-com/superhero-wallet/commit/69f03e1b4eedd5bdc0062d54f3179edf7cab8e21))
* migrate extension to manifest v3 ([e3fcd89](https://github.com/Superhero-com/superhero-wallet/commit/e3fcd89f288e48d7368362d3e5ff92c2efb0d157))
* mnemonic migrator cordova to ionic ([8561582](https://github.com/Superhero-com/superhero-wallet/commit/8561582e80d153baa604bd95a2b1665712813ea8))
* move closed cards and seed phrase backed up state to composable ([815ce5e](https://github.com/Superhero-com/superhero-wallet/commit/815ce5e258ed76ba96bc44465e3eb7236da40a0b))
* move fungibleTokens to composable ([e0c47db](https://github.com/Superhero-com/superhero-wallet/commit/e0c47db46d4657d6455da5990b3ae9e6dcd7a604))
* **multichain:** improve btc utxo selection alogrithm and prevent dust error ([67e2f44](https://github.com/Superhero-com/superhero-wallet/commit/67e2f44a14e66bd0820f1bb758c2c7989a563505))
* parse query params to support bitcoin transfers ([6e9f66b](https://github.com/Superhero-com/superhero-wallet/commit/6e9f66bb2d8c03a0dbca7a169e7a26714cb658c8))
* pr comments ([6f879f4](https://github.com/Superhero-com/superhero-wallet/commit/6f879f45f67de70c94ae1d0c9eb2d18a7587afcb))
* preparing composable transactions ([0194077](https://github.com/Superhero-com/superhero-wallet/commit/0194077c19105b9751e7d2476ae94d532bceffcd))
* present more info on contract call signing ([3f00f1a](https://github.com/Superhero-com/superhero-wallet/commit/3f00f1adc84793fa56ede842f75478155ee8de74))
* remove assets for landscape ([43c3107](https://github.com/Superhero-com/superhero-wallet/commit/43c3107abbb75470262572290592551a77269f7f))
* remove chainlink icon ([cf31507](https://github.com/Superhero-com/superhero-wallet/commit/cf315072201fee56f1053e51b39336bd95e88f44))
* remove languages from store ([21b48c3](https://github.com/Superhero-com/superhero-wallet/commit/21b48c3c3f78e06113e2cb0a2d0839fe90aae5bd))
* replace default animations ([497ecdf](https://github.com/Superhero-com/superhero-wallet/commit/497ecdf2e4f62de2a22142e44deac3af088fb6a9))
* reset extension path if user is idle for 10 mins ([1b0cee6](https://github.com/Superhero-com/superhero-wallet/commit/1b0cee6e1f0a83a8c0e07e3243ed2b5dfa53f579))
* seed-phrase verification should not redirect ([614cb75](https://github.com/Superhero-com/superhero-wallet/commit/614cb75ac6ae9aee012ceba79a2b2b2aad3f3ddf))
* show a loader on deeplink signing ([9f28076](https://github.com/Superhero-com/superhero-wallet/commit/9f28076bfbba4f539e5409078638f7992bfbc762))
* show amount in transactionDetails ([794882a](https://github.com/Superhero-com/superhero-wallet/commit/794882a1d413dad80898dd67c1ff97dbac27b4f4))
* show recent aepps in aepps browser ([caae289](https://github.com/Superhero-com/superhero-wallet/commit/caae28997f7fdde540bca0b900556d8e97914f7b))
* support & create different build for ff ([42af23a](https://github.com/Superhero-com/superhero-wallet/commit/42af23a05c7175dc08cc348d4807626d9f906732))
* support signing messages encoded as hex ([5c25a3f](https://github.com/Superhero-com/superhero-wallet/commit/5c25a3f7794d5cba8c96e118e3b20bf7240913b1))
* transfer send button disabled when no connection ([f6d664e](https://github.com/Superhero-com/superhero-wallet/commit/f6d664e237f3d9be3497ff58d5afeacc03941e59))
* transfer send multiline recipient field ([8c7be0a](https://github.com/Superhero-com/superhero-wallet/commit/8c7be0ad0b8a824c7a7f34d1aea00f95c1d31cbd))
* update asset details page ([a4461da](https://github.com/Superhero-com/superhero-wallet/commit/a4461da038ceda705553193bbfaf4fc5783f1d98))
* use capacitor plugin for network status ([33812e7](https://github.com/Superhero-com/superhero-wallet/commit/33812e77945bb33622fdcab715bea726f8b67d0c))


### Bug Fixes

* account cards using separate account balances ([797ef41](https://github.com/Superhero-com/superhero-wallet/commit/797ef4116b26e1cf6dfc548486b59299a57e19a2))
* account details doesnt always cover whole area ([c423472](https://github.com/Superhero-com/superhero-wallet/commit/c423472241b34ed363ebc9fb12bcc8ee076125ba))
* account discovery last used account index calculation ([52a1246](https://github.com/Superhero-com/superhero-wallet/commit/52a12463f4cc060fd0ab33054d5574efb318024a))
* account discovery last used account index calculation ([74f0e06](https://github.com/Superhero-com/superhero-wallet/commit/74f0e0667436bd02a8ac8c273bf7781272766869))
* account select text filtering ([324b6b7](https://github.com/Superhero-com/superhero-wallet/commit/324b6b70791e8fdf2bc35261b5aef692a25d2897))
* ae network settings composable effect scope ([10ed6a0](https://github.com/Superhero-com/superhero-wallet/commit/10ed6a048007169b8becc7cc0dade6ecc6d6aedd))
* ae sdk init with wrong network ([a334433](https://github.com/Superhero-com/superhero-wallet/commit/a334433dee8148c15fbb46b7dc27d5a46a7e8771))
* ae token amount precision fallback ([8eafdaf](https://github.com/Superhero-com/superhero-wallet/commit/8eafdaf24b7d769263f13c5d3de3b7988cfe29d5))
* **aepp:** onAccountChange notification ([d6a5a41](https://github.com/Superhero-com/superhero-wallet/commit/d6a5a4104f6f1b90f628e5d719a4e2f6766aed90))
* aeternity token names fallback ([814b1fe](https://github.com/Superhero-com/superhero-wallet/commit/814b1fe8f40e8508f3b9cd87e50e988a07428a00))
* **aeternity:** aex9 unfinished transaction info ([69a2b3d](https://github.com/Superhero-com/superhero-wallet/commit/69a2b3dade92282260a001380309715e92a02148))
* **aeternity:** format recipient address correctly ([045ce00](https://github.com/Superhero-com/superhero-wallet/commit/045ce0065b95865c9759c3598cd51229b16adfb8))
* **aeternity:** show all asset related transactions ([783940b](https://github.com/Superhero-com/superhero-wallet/commit/783940bc2146362ac2b10d842eabb93da66e96a2))
* **aeternity:** show correct transaction details for token transfers ([d6ecb99](https://github.com/Superhero-com/superhero-wallet/commit/d6ecb994055f9f9d78eab27d2d277a866c77abf4))
* **aeternity:** show incoming fungible token transactions correctly ([1a3b9dc](https://github.com/Superhero-com/superhero-wallet/commit/1a3b9dc8066784175d8aaadb826e700471e4280b))
* **aeternity:** show pending and tip withdrawn transactions ([d166817](https://github.com/Superhero-com/superhero-wallet/commit/d1668179408ab96e3eb8067ba74ccfcbea98c357))
* avatar profile image background ([11378ea](https://github.com/Superhero-com/superhero-wallet/commit/11378eafd940533d67f73589356a8a66118519fb))
* back to top should not add height to page if not scrolled ([89682f6](https://github.com/Superhero-com/superhero-wallet/commit/89682f67710c6d4e6df15b53f0655b80523bc8d4))
* back-to-top inside asset selector ([299fefd](https://github.com/Superhero-com/superhero-wallet/commit/299fefd13955b5a15d89bf58d7f8e7eef7d830bf))
* be able to claim the invite link ([1225478](https://github.com/Superhero-com/superhero-wallet/commit/1225478d597c81004e7d8976234773c5cd4705b4))
* be able to open deeplinks on running device ([6e21602](https://github.com/Superhero-com/superhero-wallet/commit/6e216021e5a986ff389a321892c95f259499647a))
* be able to see the address deeplink ([f6942ca](https://github.com/Superhero-com/superhero-wallet/commit/f6942ca62e44471f9c58c2ad5abe6182cfbf3c49))
* be able to send ethereum ([2ba0584](https://github.com/Superhero-com/superhero-wallet/commit/2ba05847b731513c333aa060ab64ef163c93b4a7))
* be able to sign transaction via deeplink ([cf7a1a2](https://github.com/Superhero-com/superhero-wallet/commit/cf7a1a278d9d37cdb058ad39bbf8425c72727a30))
* bitcoin transactions not loading ([d24e0b5](https://github.com/Superhero-com/superhero-wallet/commit/d24e0b5b685f4659cf0c9020b605389a9eb3f9b4))
* btc transaction details unrecognized coin name ([2e00b62](https://github.com/Superhero-com/superhero-wallet/commit/2e00b6258defbfbff4898d1c88038797499fe22c))
* buttons on multisig propose ([0b6c11e](https://github.com/Superhero-com/superhero-wallet/commit/0b6c11e897fbb1bf02ef3af9ba2cd0d3e525bd95))
* cache loaded transactions if state did not change ([c112a22](https://github.com/Superhero-com/superhero-wallet/commit/c112a22bedaa5021fd84d2c76a676731b9bd1df4))
* capitalize letters for multisig consensus info ([ceb3c7f](https://github.com/Superhero-com/superhero-wallet/commit/ceb3c7f1b0bc0b4e3e734ccacb1b99f2e6aef2d0))
* catch errors when fetching cached chain names ([9f963ea](https://github.com/Superhero-com/superhero-wallet/commit/9f963eadc6c8a8fca8daa9264ce5f4ad347cb18d))
* check for null microTime ([a826642](https://github.com/Superhero-com/superhero-wallet/commit/a826642ee95c85d007e121fe93644bb2d01d3f84))
* coin icon not displaying on ff extension ([523c21f](https://github.com/Superhero-com/superhero-wallet/commit/523c21fb3b36b9d8aa3c72b07a984c08a7bba942))
* **confrim-transaction-modal:** verify balance of correct signer ([1ea8312](https://github.com/Superhero-com/superhero-wallet/commit/1ea8312b7f5c20c1aaf9bd6b1c384189e74335d6))
* converted balance should not be 0 for small amounts ([4c2b1f4](https://github.com/Superhero-com/superhero-wallet/commit/4c2b1f466766db73cc15f9c01da59aeab45f66fc))
* correct contactId explorer link ([d4af1ff](https://github.com/Superhero-com/superhero-wallet/commit/d4af1ff49f610aed8547c41ef12251fe001823bc))
* correct way for popups checking if user is logged in ([6c29933](https://github.com/Superhero-com/superhero-wallet/commit/6c29933d67f004452a0b51c15edb8b75ccd90d8a))
* correctly fix eth api limit issue ([1b12a72](https://github.com/Superhero-com/superhero-wallet/commit/1b12a7269d4d2586624ef882d2034be1160c79f6))
* dapp first account change not syncing ([b85eccf](https://github.com/Superhero-com/superhero-wallet/commit/b85eccf2f3083aa796612e72658632fcc1aa347c))
* delegate http applinks to https ([cfdddde](https://github.com/Superhero-com/superhero-wallet/commit/cfdddde8ab5d3250305cf7d2ad1b9d1c7d756dcb))
* do not allow to add invalid custom node ([abe0b1b](https://github.com/Superhero-com/superhero-wallet/commit/abe0b1bb4768308b3f361e47dc4e68cb149dd2bd))
* do not call cordova mnemonic migration on extension ([955f508](https://github.com/Superhero-com/superhero-wallet/commit/955f5088621653acd56db0e118ce85484a70a72f))
* do not prohibit sending to same address ([20c1329](https://github.com/Superhero-com/superhero-wallet/commit/20c1329781884f3ed9eef91abfb12dbf2355cece))
* do not show backup seed when restoring ([1369c19](https://github.com/Superhero-com/superhero-wallet/commit/1369c19fe847590ad7c8b83f6844ff7ab8edf1af))
* do not show previous page filters ([9e702be](https://github.com/Superhero-com/superhero-wallet/commit/9e702bea18aa2794438ddcf0cfc9691b92276e1d))
* do not use sdk without node ([5021753](https://github.com/Superhero-com/superhero-wallet/commit/502175377e383e3194864277daa6ee693641c39a))
* do not use useI18n outside the setup function ([2e84c5e](https://github.com/Superhero-com/superhero-wallet/commit/2e84c5ecbab1f64ff72154810e1b583f91601ec1))
* dont allow ionic to cache permission manager page ([07b258e](https://github.com/Superhero-com/superhero-wallet/commit/07b258e6cc7e861537cf3c13be566ef33f41d90e))
* ensure that available tokens are correct for the network ([d4ae2e4](https://github.com/Superhero-com/superhero-wallet/commit/d4ae2e4603d1bab9910172e1a69f5a7c9af6f286))
* ensure that latest transactions are correct for the network ([775f6ec](https://github.com/Superhero-com/superhero-wallet/commit/775f6ec50a68bb37b6abe2d42a871687c3f46377))
* eth account explorer links ([473c245](https://github.com/Superhero-com/superhero-wallet/commit/473c2456aecd20e762afcae39d41a7baa9d6824a))
* eth api limit issue ([bf7b93a](https://github.com/Superhero-com/superhero-wallet/commit/bf7b93a814f363a29a86f5a90d9e95504c74c5fd))
* eth coin precision ([73ef4af](https://github.com/Superhero-com/superhero-wallet/commit/73ef4afee00607c4ee965a43c867615a1bfc3b32))
* eth send very small amounts ([c51dbef](https://github.com/Superhero-com/superhero-wallet/commit/c51dbeffef0da3854465e920a9a6a5238f0a7d7f))
* eth transaction list displaying partly ([48ebf48](https://github.com/Superhero-com/superhero-wallet/commit/48ebf481decdfb1234b0780f8511b666884bb84b))
* eth tx list not loading ([fc18f55](https://github.com/Superhero-com/superhero-wallet/commit/fc18f55444babaff68e27bdb0810d4e9c4e6cb8d))
* **ethereum:** calculate fee correctly ([b6661c5](https://github.com/Superhero-com/superhero-wallet/commit/b6661c5504132cdfbb65b9794bc3b7c5c0c971cf))
* **ethereum:** show combined transaction list correctly ([1c4193b](https://github.com/Superhero-com/superhero-wallet/commit/1c4193b866437114447ca233476958255c2bfbf6))
* **ethereum:** show pending transaction details correctly ([d13ec59](https://github.com/Superhero-com/superhero-wallet/commit/d13ec593795e8c91c40773c7a966436e6ea9e2e5))
* **ethereum:** validate token amount when asset is predefined ([aa49432](https://github.com/Superhero-com/superhero-wallet/commit/aa494329fd1f4f4213f883cdd3051b54f98c483c))
* fetch error when opening eth send ([c14e5ed](https://github.com/Superhero-com/superhero-wallet/commit/c14e5ed823df9c912b167c46687176eff5b91bbf))
* fetchTransaction mock should return correct data ([67ff05c](https://github.com/Superhero-com/superhero-wallet/commit/67ff05ccf80869f5e031ba26c682d08bb5e0bdd8))
* fiat value showing when sending fungible tokens ([b08151d](https://github.com/Superhero-com/superhero-wallet/commit/b08151d9d1e9e7be08bf1cc562fe6fb2be44c18e))
* fix refresh action in daepps browser. Issue arised on ios ([92b5d7c](https://github.com/Superhero-com/superhero-wallet/commit/92b5d7cccb5c24955ee019d029eb091b13d00a1f))
* font rendering issues ([e9de140](https://github.com/Superhero-com/superhero-wallet/commit/e9de140efac6d1705f2bd07f4192a2e74a6b3d1d))
* full screen loading ([16c88d2](https://github.com/Superhero-com/superhero-wallet/commit/16c88d2c5711f45411ce97f0940f9899f54143dc))
* get correct dryAeSdk after changing network ([d7cc957](https://github.com/Superhero-com/superhero-wallet/commit/d7cc9573e239fd027796c839b508a48b0f902466))
* hide contractId for wae tokens ([306e6a2](https://github.com/Superhero-com/superhero-wallet/commit/306e6a25e0272fe618e469cf6507ce53b26d2951))
* icons on index page ([48f0001](https://github.com/Superhero-com/superhero-wallet/commit/48f0001e9ad1f84a35dc63418d7f169beccd5113))
* inactive last used multisig account card ([d1bd03d](https://github.com/Superhero-com/superhero-wallet/commit/d1bd03ddd62e4a9ab5f99264b63c6e02381778b0))
* index.html points to missing favicon files ([72d9968](https://github.com/Superhero-com/superhero-wallet/commit/72d996883f7297a6375cdf24b159f4811056db20))
* ionic lifecycle methods do not trigger ([fece9d5](https://github.com/Superhero-com/superhero-wallet/commit/fece9d5e08eb92a771502ae8714ceb323d8b1ce4))
* **ios:** discover accounts for new wallet correctly ([ea41f3a](https://github.com/Superhero-com/superhero-wallet/commit/ea41f3a4111ca8762e2a52279970c954f800a00a))
* latest multisig transaction updating on acc change ([29819d5](https://github.com/Superhero-com/superhero-wallet/commit/29819d51ec4df7f5aa539d88c006791e487d9a44))
* load available tokens when adding an account on a new blockchain ([8b0c59c](https://github.com/Superhero-com/superhero-wallet/commit/8b0c59c9c22f2ef3df7d2767ddc430b0a8406a10))
* load notifications and transactions in chunks ([63d12fa](https://github.com/Superhero-com/superhero-wallet/commit/63d12fa110a3ec0ea37d0bf11187d8601a50b077))
* load old transactions ([47c7711](https://github.com/Superhero-com/superhero-wallet/commit/47c7711e9024e5529c2ae288b379e89d087045cb))
* missing coin details in assetDetails page ([925d8ce](https://github.com/Superhero-com/superhero-wallet/commit/925d8ce4f4b51b9caa800992fb3a81efc3d32c18))
* missing payload from multisig tx ([fbcaa6e](https://github.com/Superhero-com/superhero-wallet/commit/fbcaa6e8472c4e3193471f814b11eedb31f72eb1))
* missing required param error ([e80f922](https://github.com/Superhero-com/superhero-wallet/commit/e80f922891282874b08ab189e1db33f379a5111f))
* multiply eth fee with gasLimit ([198b39b](https://github.com/Superhero-com/superhero-wallet/commit/198b39b44399c9c6e2e715096cb5fa2f724e669a))
* multisig active transaction card padding ([e80b90a](https://github.com/Superhero-com/superhero-wallet/commit/e80b90a0e2e06f7a2daf2f63f7fb8161e7eb838a))
* multisig transaction list is displaying partly ([a48c46d](https://github.com/Superhero-com/superhero-wallet/commit/a48c46d4aec2d7f5db59a965346bc61b353171db))
* **multisig:** be able to load more transcations ([1e2bda1](https://github.com/Superhero-com/superhero-wallet/commit/1e2bda124ffba6ae39ebfbc9161c8054ef8f17c8))
* **multisig:** return total balance with correct type ([b47242c](https://github.com/Superhero-com/superhero-wallet/commit/b47242c453d1a3cab03a079f63d2fc059d3632d1))
* **multisig:** set correct urls in proposal details ([48b5bbe](https://github.com/Superhero-com/superhero-wallet/commit/48b5bbeebc734d6a03e0d562194e95af333ba953))
* **multisig:** show ae coin details correctly ([d979507](https://github.com/Superhero-com/superhero-wallet/commit/d9795074d00279025cfcee82d5fb88fda1fd07d2))
* **multisig:** show coin information correctly ([7dce458](https://github.com/Superhero-com/superhero-wallet/commit/7dce458e0d19080bc60dc4c374bc1f521b834049))
* **multisig:** show correct fiat value for assets ([7320dbc](https://github.com/Superhero-com/superhero-wallet/commit/7320dbc06ecea16dd787e8b5ea8913581ee913a4))
* **multisig:** show correct transcation proposal labels ([841f57c](https://github.com/Superhero-com/superhero-wallet/commit/841f57cd72be87fd24b7bd60b51ee4d675695752))
* **multisig:** show list of assets correctly ([3726f6a](https://github.com/Superhero-com/superhero-wallet/commit/3726f6aa76d9755450d2ab27adf602ba4bf15a3b))
* **multisig:** show total correctly ([d325a97](https://github.com/Superhero-com/superhero-wallet/commit/d325a9787a265ff3331fe75a4b59cb2ca8da9fbe))
* **multisig:** update pending transaction info correctly ([097ab8f](https://github.com/Superhero-com/superhero-wallet/commit/097ab8fbde11d832ca4eec20ed046cdf8cba01ac))
* name animation of resize ([24d2be5](https://github.com/Superhero-com/superhero-wallet/commit/24d2be55ca9b708c9a687d6ade75924e4b45964e))
* network switcher visible during page transitions ([0dd9429](https://github.com/Superhero-com/superhero-wallet/commit/0dd9429879b0faafd25d9d14005cb3982c229f93))
* offscreen-page issues on chrome extension ([7e36384](https://github.com/Superhero-com/superhero-wallet/commit/7e363847f41d0db0c91d373fb83bbf03f4ae42fb))
* open callback url on ios ([0586bef](https://github.com/Superhero-com/superhero-wallet/commit/0586bef4b019b27431540d917190f5536f0b3b98))
* owned names should only be updated for current network ([933cac1](https://github.com/Superhero-com/superhero-wallet/commit/933cac150e2d4b6ffaf8c7c7ff284584ba5e62d3))
* paddings on settings pages ([30e8116](https://github.com/Superhero-com/superhero-wallet/commit/30e811627b1d40d6f15400e1983d730449bf52f7))
* permission edit transaction limit amounts ([3c24c77](https://github.com/Superhero-com/superhero-wallet/commit/3c24c77f35e7b605dbde7ce2adab392ff4d2fe39))
* place extension on center when open as tab ([d1e99d7](https://github.com/Superhero-com/superhero-wallet/commit/d1e99d7a6141d7eb0a03a2d8cab03e6eb26b44c7))
* popup only gives permission on user approval ([f0aa649](https://github.com/Superhero-com/superhero-wallet/commit/f0aa6490fe4cf350a9fab323ad70cec3104476ce))
* qr scanner on safari mobile ([3dfcf47](https://github.com/Superhero-com/superhero-wallet/commit/3dfcf478a1a427339b023dc85c0a3b9afa2bb22a))
* redirect if no multisig ([74b977e](https://github.com/Superhero-com/superhero-wallet/commit/74b977ebe7e6586f66e354d647bd6c6a2e59a372))
* redirect to 404 when tx cant be fetched ([8b662c9](https://github.com/Superhero-com/superhero-wallet/commit/8b662c98cbb0ff1f73910cf8c7167ddd2061ccdf))
* remove custom pending transactions correctly ([f3b7c20](https://github.com/Superhero-com/superhero-wallet/commit/f3b7c20a817dc162682ae76ae2efb770aedd419b))
* remove swap button from non ae assets ([2471aee](https://github.com/Superhero-com/superhero-wallet/commit/2471aeecc5b55f0bd3f0ef49b7e0de85d48a345a))
* reset token lists on network change ([223082d](https://github.com/Superhero-com/superhero-wallet/commit/223082d2fb0190c5163c39dd0e599de981f88d26))
* reset wallet should reset localStorage ([c91c442](https://github.com/Superhero-com/superhero-wallet/commit/c91c4420dcf12b3a7407a257027b9caddb132730))
* router next function is called twice ([f5e2d29](https://github.com/Superhero-com/superhero-wallet/commit/f5e2d2913852e89e2ae3c53af326f6c86d89fa7f))
* search transactions by contract ([5eac4e8](https://github.com/Superhero-com/superhero-wallet/commit/5eac4e8e2026822d217546dfb32e379dd1e80ba6))
* seed phrase notification position ([0e685d4](https://github.com/Superhero-com/superhero-wallet/commit/0e685d442b890335910fb671879288b9465eac83))
* seed-phrase verification alert alignment ([295fcfb](https://github.com/Superhero-com/superhero-wallet/commit/295fcfb61e6a449b2968785a950a101a2daae1dd))
* set full screen loader correctly ([776a73b](https://github.com/Superhero-com/superhero-wallet/commit/776a73bd6c5236ee3663950244dc4e7d068704da))
* show a correct tag for a pending multisig proposal ([2b07975](https://github.com/Superhero-com/superhero-wallet/commit/2b07975f60b167102e6e147cd9ad62bf40fbf3bd))
* show a proper address of a bidder ([7ff3e7e](https://github.com/Superhero-com/superhero-wallet/commit/7ff3e7ece631f9c553e29d3f477341dc1a558df4))
* show auction bids ([890f1ab](https://github.com/Superhero-com/superhero-wallet/commit/890f1ab87bf1a714ceb4d72358a4ce0e7eeb7116))
* show correct avatar for names ([b2b1f47](https://github.com/Superhero-com/superhero-wallet/commit/b2b1f4787eebcfe468165ad0a46cbed582ad6703))
* show correct default name for the selected network ([5ac57a3](https://github.com/Superhero-com/superhero-wallet/commit/5ac57a312b5cb544acbed8e8d6f27d2b91a44ca2))
* show correct details for pending ethereum transactions ([a2103c9](https://github.com/Superhero-com/superhero-wallet/commit/a2103c900f4e4bef334244ad0ff4b8d9c7fb82cc))
* show correct erc-20 transaction details ([4629222](https://github.com/Superhero-com/superhero-wallet/commit/462922206d97b1d02f438bef079bf2b847827cbd))
* show correct icons & amount on tx details ([c6b4afd](https://github.com/Superhero-com/superhero-wallet/commit/c6b4afd3c34bdd8b03002cb5f4d1384d18d1cdd5))
* show correct label for a transaction owner ([e1d4e96](https://github.com/Superhero-com/superhero-wallet/commit/e1d4e9642a12a0c5ebd964912c51e6136a800d20))
* show fiat value for eth spend transactions ([f592461](https://github.com/Superhero-com/superhero-wallet/commit/f5924616ad070dfd6b517368f18a252b21ca0278))
* show owner address correctly in create contract transaction ([1918f9a](https://github.com/Superhero-com/superhero-wallet/commit/1918f9a41e52ea6800fad955fe9b1a25e0392bd9))
* show pending multisig transaction correctly ([e07a3f4](https://github.com/Superhero-com/superhero-wallet/commit/e07a3f432519d3a9d8951fade560138fff6bffe4))
* show pending multisig transaction in the transaction list ([6ea20e0](https://github.com/Superhero-com/superhero-wallet/commit/6ea20e0332df5a97feef245d44936ff820267d12))
* show sign confirmation modals ([7ecbe78](https://github.com/Superhero-com/superhero-wallet/commit/7ecbe781d2b4fa585ff83448799b6f0fc111b3e6))
* show transactions only for chosen asset ([81f082b](https://github.com/Superhero-com/superhero-wallet/commit/81f082b898a8a0867917fe3152958d503b6fae0e))
* show wallet notifications ([45a91e5](https://github.com/Superhero-com/superhero-wallet/commit/45a91e59561cfa9025afa553c36c115f6fb1a026))
* sort pending multisig transaction correctly ([661ee35](https://github.com/Superhero-com/superhero-wallet/commit/661ee35f9f8a1e5f7712c539c4a1d1783fd532e5))
* splash screen bg color on android ([0ae2397](https://github.com/Superhero-com/superhero-wallet/commit/0ae2397a1ea21fd5b4c546facef41ef41e8b4ffb))
* support all the superhero chat urls ([defcbfa](https://github.com/Superhero-com/superhero-wallet/commit/defcbfa3986fe80307f548a14eb89a53013fa89d))
* svg animatios on ff extension ([c742149](https://github.com/Superhero-com/superhero-wallet/commit/c742149b46eb6d5e5a267c9fb6f28745916b5bb4))
* switch networks correctly ([73d1a95](https://github.com/Superhero-com/superhero-wallet/commit/73d1a95b777edb6a0c892222bd15acbfae365586))
* terms and conditions scrolling not working in ios. Removed overflow auto css property ([1f3712d](https://github.com/Superhero-com/superhero-wallet/commit/1f3712dd75cef0838e048a43d974c35dfccb3c03))
* tip-in transaction details ([b8d219d](https://github.com/Superhero-com/superhero-wallet/commit/b8d219d7d80df6f59e1f605ec430922b33b558cd))
* token amount vertical variant ([0915c25](https://github.com/Superhero-com/superhero-wallet/commit/0915c25d87d26f5f512d4344cbc1601c8ff85b05))
* **token-amount:** justify content correctly ([b902af0](https://github.com/Superhero-com/superhero-wallet/commit/b902af0cb731baf8be2fad0afbfaddbbf2b1c624))
* transaction details avatar size and color ([821080c](https://github.com/Superhero-com/superhero-wallet/commit/821080c8ab387768e1b7a42880088d5e9aa5ea8a))
* transaction list asset name brighter color ([f701c37](https://github.com/Superhero-com/superhero-wallet/commit/f701c37926293f40589d24c29f05a96a08aef3e6))
* transaction list is displaying partly ([7f01233](https://github.com/Superhero-com/superhero-wallet/commit/7f0123338d61767e9d7e03b57013cc5807efbc11))
* **transaction-details-base:** copy correct hash ([25de21c](https://github.com/Superhero-com/superhero-wallet/commit/25de21cee1a9a52875d25cc0528df9c6621f0f5c))
* **transaction-list:** show allow transaction correctly ([fd7e5bd](https://github.com/Superhero-com/superhero-wallet/commit/fd7e5bd3c643a45c50fa19199313fe83777638e5))
* use correct back button logic ([7e2a1a9](https://github.com/Superhero-com/superhero-wallet/commit/7e2a1a9f0323cd7b539d363452fa384ba122b79b))
* use correct nonce to dry-run contract calls ([e1d9123](https://github.com/Superhero-com/superhero-wallet/commit/e1d912396f3b14650fdabb41aeb7f43c8fd55f0b))
* use supported favicon type for chrome ([00b2081](https://github.com/Superhero-com/superhero-wallet/commit/00b208185f7225c3262eef5addcff7196a0b4b49))
* validate props correctly ([aa51837](https://github.com/Superhero-com/superhero-wallet/commit/aa518374db4fe50b9fcd81164b43c0f440a0b5d7))
* validate several props and emits correctly ([a462071](https://github.com/Superhero-com/superhero-wallet/commit/a462071d969c4a6a64035590bee9b53923345e31))
* verify account contract call displayed as ae coin ([4294bb6](https://github.com/Superhero-com/superhero-wallet/commit/4294bb651a8a088b70e83596e7051eb7415ddd77))
* viewport element missing in dashboard ([63ff126](https://github.com/Superhero-com/superhero-wallet/commit/63ff126fea86f0bea2d6024662735acee54341e6))
* watch when building extension ([d0ed3e9](https://github.com/Superhero-com/superhero-wallet/commit/d0ed3e9416ce245f19f051472bb47c416662b694))
* weird account details page appearance ([6ad3a94](https://github.com/Superhero-com/superhero-wallet/commit/6ad3a94414d2167ecb84be38cff3d096b0b63436))


### Style

* use correct indentation in TransactionDetails ([f8b7bf9](https://github.com/Superhero-com/superhero-wallet/commit/f8b7bf9d069c25eb2e8a2efb13f86a30ba059326))


### Performance

* prefer `Object.fromEntries` over `reduce` ([09ecca4](https://github.com/Superhero-com/superhero-wallet/commit/09ecca4d12b1b52c6cd2b10d011344b65b0e8874))
* remove request for unused Inter fonts ([5c774ce](https://github.com/Superhero-com/superhero-wallet/commit/5c774ce5b19d0b5d4d6fa8f49750a54fa3e73c99))
* **transaction-list:** do not load next transactions page on entering ([206ad82](https://github.com/Superhero-com/superhero-wallet/commit/206ad8273858dc7476ef9f0a2af9a962aed33f93))
* use webp instead of png, jpg formats ([0729300](https://github.com/Superhero-com/superhero-wallet/commit/0729300ca5f1e17d8fb5bf236196e1437e693e11))


### Documentation

* update README.md ([d3131d7](https://github.com/Superhero-com/superhero-wallet/commit/d3131d79d7021a89dc9b8bb337c1e28f102d6e98))


### Maintenance

* **accessibility:** fix lint issues ([63397d3](https://github.com/Superhero-com/superhero-wallet/commit/63397d3a5a709f7ae9eb9ae030ffb930c6e46a32))
* add data-cy to close buttons ([55220fc](https://github.com/Superhero-com/superhero-wallet/commit/55220fc25b1045746d3152b8f0f8b44f0d96a2bd))
* add missing data-cy ids ([cba71ee](https://github.com/Superhero-com/superhero-wallet/commit/cba71ee723c21bfeb959a9d90e55a58d254dd802))
* add robots.txt ([741d4ef](https://github.com/Superhero-com/superhero-wallet/commit/741d4ef1336a26b082de4179b3cd950a89475271))
* adjust page transitions ([0a79110](https://github.com/Superhero-com/superhero-wallet/commit/0a79110d05c92f6407dc0752ceb2ba91bbb791a7))
* **aeternity:** do not wait transaction mining to finalize transfer ([85f0ac2](https://github.com/Superhero-com/superhero-wallet/commit/85f0ac2c4968d7d7b04d646a3ae82aa3c58ad623))
* **aeternity:** move transferToken to adapter ([920303d](https://github.com/Superhero-com/superhero-wallet/commit/920303d43316e0defac1c4dbdc581733d7499a31))
* allow optional methods in base protocol adapter ([32bac3a](https://github.com/Superhero-com/superhero-wallet/commit/32bac3a8806a9ffe4cfdb278199caf9360096b6e))
* apps browser props validation ([df03451](https://github.com/Superhero-com/superhero-wallet/commit/df03451c194e5622b413c44860024c5b5fa629f1))
* avoid running multiple watchers in composables ([54a5c34](https://github.com/Superhero-com/superhero-wallet/commit/54a5c3450e4dd3a070d2329483a04867e8bf8217))
* change backend urls ([3677a96](https://github.com/Superhero-com/superhero-wallet/commit/3677a96c90ef3c597e8732174c5b04c5ddbd19eb))
* config commitlint more precisely ([6fba6db](https://github.com/Superhero-com/superhero-wallet/commit/6fba6db69e9b65f8955acc3dd9cc5b25d5c2ab01))
* do not change active account to sign multisig action ([d6048dc](https://github.com/Superhero-com/superhero-wallet/commit/d6048dc586280a1c292743ab9b1c498305f25a6f))
* drop useless condition and improve indentation ([1550d6a](https://github.com/Superhero-com/superhero-wallet/commit/1550d6ab0d2015404d1fa9209cdd93b192d5bd39))
* enforce consistent interface member delimiter style ([096ae9f](https://github.com/Superhero-com/superhero-wallet/commit/096ae9fe2425548752c171b74f659d84c5e8f5fb))
* eth fee calculation ([dfa8311](https://github.com/Superhero-com/superhero-wallet/commit/dfa831140f7e874eb9bccabf3b268c97abea64c8))
* **ethereum-adapter:** do not start sending process if different protocol is chosen ([c8fd273](https://github.com/Superhero-com/superhero-wallet/commit/c8fd273fea09d7cdead881c4b67e892fce63807f))
* **ethereum:** avoid showing wrong token info ([09d35a6](https://github.com/Superhero-com/superhero-wallet/commit/09d35a632093903926fc9bad1420d89b6c2a3fbc))
* extract common transaction list logic ([7d24fe7](https://github.com/Superhero-com/superhero-wallet/commit/7d24fe762b8a563b03e0cf3f57f8e04b77b0d049))
* formatted address validation regardless of protocol ([f38219e](https://github.com/Superhero-com/superhero-wallet/commit/f38219e59dd639b45435a6117357d5b646b89831))
* fungible tokens composable updates allowing to hold non ae tokens ([378a5fc](https://github.com/Superhero-com/superhero-wallet/commit/378a5fcbaf6e3443972257111711a13a1fedebb6))
* migrate offscreen scripts to ts ([2e70f19](https://github.com/Superhero-com/superhero-wallet/commit/2e70f19ecdc26b8c4bc85eddb44050ef570c926d))
* move accounts vuex state to composable ([a6100d5](https://github.com/Superhero-com/superhero-wallet/commit/a6100d5367a99a6dfe49d1fc2c4d6146aa82226a))
* move ae aci files to protocol dir ([9f7b4c8](https://github.com/Superhero-com/superhero-wallet/commit/9f7b4c802d89daef4e838ed684eb2b7e0b255780))
* move AppsBrowser components to own folder ([b74cec6](https://github.com/Superhero-com/superhero-wallet/commit/b74cec67beaaeb9cf8eef6b0f013968c3890ebbd))
* move invites vuex state to composable ([18ea987](https://github.com/Superhero-com/superhero-wallet/commit/18ea9873e15979e60f729230e18c4e03f9f74bba))
* move names to composable ([d6552b7](https://github.com/Superhero-com/superhero-wallet/commit/d6552b72ca9e1d1c47ffb10023ae3b548b2c8307))
* move notification settings from vuex to composable ([d1e1549](https://github.com/Superhero-com/superhero-wallet/commit/d1e15491c54e285d93d6f6f26f117f6c553e6810))
* move permissions vuex state to composable ([442d886](https://github.com/Superhero-com/superhero-wallet/commit/442d8864ea65cd59b2ddae0a2ea89a6771cf3481))
* move tipUrl vuex state to composable ([cc39ae6](https://github.com/Superhero-com/superhero-wallet/commit/cc39ae6dcf5bf454bbe70411237e65495f4c142b))
* move veevalidate vuex module to separate plugin ([c567863](https://github.com/Superhero-com/superhero-wallet/commit/c56786368ddff61a60cf56cbdce29b007f9d4483))
* move vuex hdwallet methods to sdk wallet lib ([7c3cb65](https://github.com/Superhero-com/superhero-wallet/commit/7c3cb657680b46549e926ad30f91aa3055c21dca))
* pass sender address instead of account object ([4133ab0](https://github.com/Superhero-com/superhero-wallet/commit/4133ab08ee43a9819fb745b44b61e71a89c39590))
* protocol adapters account address validation ([e5e0af3](https://github.com/Superhero-com/superhero-wallet/commit/e5e0af3afec1613911226df6715a1d7edbacc00c))
* protocols proper typing ([565753b](https://github.com/Superhero-com/superhero-wallet/commit/565753b16b28867365f191177aa532dd7ff0744f))
* **release:** 2.1.0 ([05f4dcc](https://github.com/Superhero-com/superhero-wallet/commit/05f4dcca89129ebb251e71f6ee98fbb341d89159))
* **release:** 2.1.4 ([9cdd400](https://github.com/Superhero-com/superhero-wallet/commit/9cdd4009ee2907486266b3e1926e8aa84e3c85d5))
* remove double space in translation ([f7280f4](https://github.com/Superhero-com/superhero-wallet/commit/f7280f4497841de8f5b1b8f27a1bfcd08d41f6ac))
* remove global ae mdw initialization ([ca72ab9](https://github.com/Superhero-com/superhero-wallet/commit/ca72ab909d45f566c536f824ba6607cf4244fb6e))
* remove protocol specific logic from tokens component ([4e8205b](https://github.com/Superhero-com/superhero-wallet/commit/4e8205b974c4ed5fff4b82c044932a01d91d2cc2))
* remove store dependency from accounts composable ([c7b8b9a](https://github.com/Superhero-com/superhero-wallet/commit/c7b8b9a95b04c5c1fc3c041e242fa4a1a0d38384))
* remove vue feature flag warning ([06b2161](https://github.com/Superhero-com/superhero-wallet/commit/06b2161b4a559a6b5ea2a16c4bd35ddc8896b567))
* remove vuex final steps ([33b3962](https://github.com/Superhero-com/superhero-wallet/commit/33b3962ff64e4b70d7283eb127b2c749635344a8))
* rename keys to storage key in storage ref helper ([10a5004](https://github.com/Superhero-com/superhero-wallet/commit/10a50045119dd4229e543cd64c63bdcd9857778c))
* set lang attribute of html ([78621f4](https://github.com/Superhero-com/superhero-wallet/commit/78621f4e93e00f0c67b6f909a4630427cb2ba577))
* show decoded payload on transaction signing ([2fb4ef7](https://github.com/Superhero-com/superhero-wallet/commit/2fb4ef70bb07efb182c5ec7e15d87f900d3c1270))
* show recipient field required message ([4e62bf1](https://github.com/Superhero-com/superhero-wallet/commit/4e62bf1e309cee909957418d28a80699ec6830a6))
* transaction sign permission count amount spend instead of amount left ([35a3736](https://github.com/Superhero-com/superhero-wallet/commit/35a37361ae7e84a0a3dc39013b9dc28a8653b9a4))
* **transaction-details:** extract protocol specific components from base ([f30fd0d](https://github.com/Superhero-com/superhero-wallet/commit/f30fd0d3f0395ba2dbbabb25d6857df5cddeb3f6))
* ui tweaks of retip page ([89b5d86](https://github.com/Superhero-com/superhero-wallet/commit/89b5d86af9a23f8740923970f01bdf67d98e880e))
* unify icon sizes ([199778b](https://github.com/Superhero-com/superhero-wallet/commit/199778bb8c4aaad5ea43ec6ba8c6732faddd111a))
* update dapp disconnect mechanism ([e33e68e](https://github.com/Superhero-com/superhero-wallet/commit/e33e68ec5d9628f66525b9e67300604632c0fb88))
* update favicons ([47b3127](https://github.com/Superhero-com/superhero-wallet/commit/47b31270c9496d8975076b4addf6be16a043d555))
* update fungible token wording ([166dc97](https://github.com/Superhero-com/superhero-wallet/commit/166dc971459608e03f7df89e5dc7927c4588a88b))
* use new multisig backend links ([0b250b5](https://github.com/Superhero-com/superhero-wallet/commit/0b250b51eb66476949bf914dc0b3e14a93d866e0))
* use next nonce in maxAmount ([b525f07](https://github.com/Superhero-com/superhero-wallet/commit/b525f070f3c890519c24708d22db23bf7507ea1b))
* use shared component for max-amount button ([32bfa89](https://github.com/Superhero-com/superhero-wallet/commit/32bfa89aea45851b8116e297ada85a493bd9019e))
* use string as account address type ([75a87b1](https://github.com/Superhero-com/superhero-wallet/commit/75a87b17e8e235d6027b0251ba27d4f518fc127e))
* use the correct auction structure ([dec4a1c](https://github.com/Superhero-com/superhero-wallet/commit/dec4a1c3a5c822c2a67d11694abaee144f788152))
* **vue-config:** remove leftover ([99115df](https://github.com/Superhero-com/superhero-wallet/commit/99115dfbdad52ccfd8a7c37622a039a241bea5a6))

### [2.1.6](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.5...v2.1.6) (2024-02-26)


### Features

* support signing messages encoded as hex ([63e398c](https://github.com/Superhero-com/superhero-wallet/commit/63e398ca0f5f3df0806385f2ca101ce0a580aeed))

### [2.1.5](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.4...v2.1.5) (2024-02-13)


### Features

* associated wallet domain ([cd89955](https://github.com/Superhero-com/superhero-wallet/commit/cd89955fefe2d5b4906c2585fbc5143ef8dc9699))
* mnemonic migrator cordova to ionic ([b2b6dca](https://github.com/Superhero-com/superhero-wallet/commit/b2b6dcaa59f5bfb5cbe72d655a68b48afbe8a4cb))
* show a loader on deeplink signing ([edc5f9c](https://github.com/Superhero-com/superhero-wallet/commit/edc5f9ccd8da4b1d337a276d716370de02596903))


### Bug Fixes

* open callback url on ios ([8c357dc](https://github.com/Superhero-com/superhero-wallet/commit/8c357dccedcf4f607440f5772d413cdfa133efb2))

### [2.1.4](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.2...v2.1.4) (2024-02-07)


### Features

* add meta description ([d0d83ea](https://github.com/Superhero-com/superhero-wallet/commit/d0d83ea0b98f63f4a6aac6422c7b03fc74832cc7))


### Bug Fixes

* be able to claim the invite link ([35951f7](https://github.com/Superhero-com/superhero-wallet/commit/35951f702e6daa376e44bb758466450d116a386c))
* be able to open deeplinks on running device ([9e30363](https://github.com/Superhero-com/superhero-wallet/commit/9e30363aaf45200420f8df7ab4252028381cc187))
* delegate http applinks to https ([07df746](https://github.com/Superhero-com/superhero-wallet/commit/07df7464583879ce380314d69564a039bfcedcec))
* show auction bids ([6ad7aeb](https://github.com/Superhero-com/superhero-wallet/commit/6ad7aeb73c17f50f6c5e4655c0a157aceb33dacf))


### Maintenance

* change backend urls ([b2e387e](https://github.com/Superhero-com/superhero-wallet/commit/b2e387ed7ed70697b8cedaac76d6383a707ec64b))
* use new multisig backend links ([428f008](https://github.com/Superhero-com/superhero-wallet/commit/428f0085ce86e148eb2f56d911f41f473fd1575c))


### Performance

* remove request for unused Inter fonts ([585ca5f](https://github.com/Superhero-com/superhero-wallet/commit/585ca5f5dee1517f6b7b5c049b35e00d4c37febd))

### [2.1.2](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.0...v2.1.2) (2023-12-01)


### Features

* add meta description ([d0d83ea](https://github.com/Superhero-com/superhero-wallet/commit/d0d83ea0b98f63f4a6aac6422c7b03fc74832cc7))


### Bug Fixes

* be able to claim the invite link ([35951f7](https://github.com/Superhero-com/superhero-wallet/commit/35951f702e6daa376e44bb758466450d116a386c))
* be able to open deeplinks on running device ([9e30363](https://github.com/Superhero-com/superhero-wallet/commit/9e30363aaf45200420f8df7ab4252028381cc187))
* delegate http applinks to https ([07df746](https://github.com/Superhero-com/superhero-wallet/commit/07df7464583879ce380314d69564a039bfcedcec))
* show auction bids ([6ad7aeb](https://github.com/Superhero-com/superhero-wallet/commit/6ad7aeb73c17f50f6c5e4655c0a157aceb33dacf))


### Maintenance

* change backend urls ([b2e387e](https://github.com/Superhero-com/superhero-wallet/commit/b2e387ed7ed70697b8cedaac76d6383a707ec64b))
* use new multisig backend links ([428f008](https://github.com/Superhero-com/superhero-wallet/commit/428f0085ce86e148eb2f56d911f41f473fd1575c))


### Performance

* remove request for unused Inter fonts ([585ca5f](https://github.com/Superhero-com/superhero-wallet/commit/585ca5f5dee1517f6b7b5c049b35e00d4c37febd))

### [2.1.2](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.0...v2.1.2) (2023-12-01)


### Bug Fixes

* correct contactId explorer link ([3f2f57d](https://github.com/Superhero-com/superhero-wallet/commit/3f2f57d23d0578c063135325acab50735452d9fc))
* support all the superhero chat urls ([3414e49](https://github.com/Superhero-com/superhero-wallet/commit/3414e496694f87abbef8960f3be289df8839fbcb))


### Maintenance

* **release:** 2.1.1 ([10d6195](https://github.com/Superhero-com/superhero-wallet/commit/10d6195eb0a5c193245e5402a9521fde4942355d))
* show decoded payload on transaction signing ([187afe6](https://github.com/Superhero-com/superhero-wallet/commit/187afe62c75e8ca8f2b8f703a0a81196b2d2bc1e))

### [2.1.1](https://github.com/Superhero-com/superhero-wallet/compare/v2.1.0...v2.1.1) (2023-11-30)


### Features

* present more info on contract call signing ([39a341a](https://github.com/Superhero-com/superhero-wallet/commit/39a341a5524c12586bf2ab55524cc1ffde504f6c))


### Bug Fixes

* be able to see the address deeplink ([7802f2b](https://github.com/Superhero-com/superhero-wallet/commit/7802f2b3c7e3085e44661b5cd052591d95a85b78))
* be able to sign transaction via deeplink ([79049f0](https://github.com/Superhero-com/superhero-wallet/commit/79049f0eee3b5c85414326158b0dea5c93769eb5))
* show correct label for a transaction owner ([f85a443](https://github.com/Superhero-com/superhero-wallet/commit/f85a4431718350af298cd5570af25e970141de29))
* show owner address correctly in create contract transaction ([ab49592](https://github.com/Superhero-com/superhero-wallet/commit/ab49592d86596bb4b518872ded3f2ddc1260c743))


### Maintenance

* show decoded payload on transaction signing ([187afe6](https://github.com/Superhero-com/superhero-wallet/commit/187afe62c75e8ca8f2b8f703a0a81196b2d2bc1e))

## [2.1.0](https://github.com/Superhero-com/superhero-wallet/compare/v2.0.2...v2.1.0) (2023-10-27)


### Features

* add ionic router outlet & ionic pages ([1d2e1a2](https://github.com/Superhero-com/superhero-wallet/commit/1d2e1a2725ee926bf3bfb0c2e64792958cde02f4))
* build extension with ionic ([de28e9e](https://github.com/Superhero-com/superhero-wallet/commit/de28e9e543894afb2252b9484a11283bdbe6e6b7))
* convert QR code reader to TS & compositionAPI & update design ([fb71d25](https://github.com/Superhero-com/superhero-wallet/commit/fb71d2585af20dc765b3c584dcf80e465d5dd92e))
* handle hardware back button ([97c4994](https://github.com/Superhero-com/superhero-wallet/commit/97c4994d71d841da2f87beebca5a94644e63fab2))
* init ionic project, configs and update package ([2f3750a](https://github.com/Superhero-com/superhero-wallet/commit/2f3750aeb808bbfe488edbe37f17abd213ac9319))
* init ionic project, configs and update package ([ee7b4a8](https://github.com/Superhero-com/superhero-wallet/commit/ee7b4a8adc093f6d34ee62d12ce0513481522489))
* lock screen orientation in portrait ([c2a0b88](https://github.com/Superhero-com/superhero-wallet/commit/c2a0b88299f46c006dd2553d754e018c6a4410dd))
* make transactions default view for account details ([4514e8c](https://github.com/Superhero-com/superhero-wallet/commit/4514e8c7a54234e1d0eefe51b08162541c42b1d3))
* mount router when ready,  add ionic mode and styles ([81a1856](https://github.com/Superhero-com/superhero-wallet/commit/81a185685a40ef664d3add33cc453d2f0ee54555))
* remove assets for landscape ([01c5a47](https://github.com/Superhero-com/superhero-wallet/commit/01c5a47cf75de585ada2a9795b17f3aa1af7172e))
* remove cordova headercolor plugin ([463b38a](https://github.com/Superhero-com/superhero-wallet/commit/463b38a0ecd43094729450bcff3d905417231a8a))
* replace default animations ([d3a80ab](https://github.com/Superhero-com/superhero-wallet/commit/d3a80abd86b0a582d59d8d42233944fc681ec7f4))
* save and restore transfer state when user needs to give access to camera in extension ([1026b62](https://github.com/Superhero-com/superhero-wallet/commit/1026b62c7a39eb00ab66cb217ce76b811bfee906))
* use capacitor plugin for network status ([afaa492](https://github.com/Superhero-com/superhero-wallet/commit/afaa49239a299bcabb0e45c140dc1fc1a7ec32b6))
* use capacitor StatusBar ([0f0ac1d](https://github.com/Superhero-com/superhero-wallet/commit/0f0ac1dbbad111fd0a5d6089e979509bae1b4d10))
* use ion-header for header component ([43547f1](https://github.com/Superhero-com/superhero-wallet/commit/43547f170b973dc231d8773bdcd9781fee5511ca))


### Bug Fixes

* account details doesnt always cover whole area ([1798162](https://github.com/Superhero-com/superhero-wallet/commit/1798162c159d573a356431d98d46c1b1d7dcb36e))
* account details safe area top bug ([bec1ae1](https://github.com/Superhero-com/superhero-wallet/commit/bec1ae1b01be1edf8a14acbbc770a33cb8449b63))
* add account card swiper issues ([5681688](https://github.com/Superhero-com/superhero-wallet/commit/5681688d7600275987a6192b1e6ca363db22647d))
* add filter functionality on bitcoin details page ([10bdb3c](https://github.com/Superhero-com/superhero-wallet/commit/10bdb3cee2199ba18842f9c6c9eb8a3032bf18d7))
* apps-browser custom url pointer issue ([782f3b9](https://github.com/Superhero-com/superhero-wallet/commit/782f3b92e8c17a2145e061f88e09b815f3abd1f4))
* background ion-content color ([d7d6520](https://github.com/Superhero-com/superhero-wallet/commit/d7d6520ebd7ea7eb07e1807d7a9bb1a453885caa))
* bitcoin transactions not loading ([01677db](https://github.com/Superhero-com/superhero-wallet/commit/01677db2fb097839f12a507363a2222f8c9e2555))
* buttons on multisig propose ([5ee11cf](https://github.com/Superhero-com/superhero-wallet/commit/5ee11cfa2636db3a65a50c9fe3a57d0c8cb9bcaa))
* different popup at extension sizing at macOS ([758eaf2](https://github.com/Superhero-com/superhero-wallet/commit/758eaf262f1f6521a765c11f5196483b70864660))
* dont show 404 page when closing a page ([338f86b](https://github.com/Superhero-com/superhero-wallet/commit/338f86b1512ff55eac380ce1f8f8eb910dffe8cb))
* extension not rendering properly on firefox ([97dddc3](https://github.com/Superhero-com/superhero-wallet/commit/97dddc3f7585a5b17b2d90b06a5a41d4f851f2b6))
* filters functionality ([43a6347](https://github.com/Superhero-com/superhero-wallet/commit/43a63478139877b0e6c1851643424a9b77d2a62b))
* fix refresh action in daepps browser. Issue arised on ios ([e002bee](https://github.com/Superhero-com/superhero-wallet/commit/e002beef18af86cd4009b2688fab472a859bb7fd))
* font rendering issues ([396eca8](https://github.com/Superhero-com/superhero-wallet/commit/396eca81320e901d80544e5d2c0d7d87599bbc0e))
* full screen loading ([c391825](https://github.com/Superhero-com/superhero-wallet/commit/c3918253cdc1213255aea2850457d7e572a700b5))
* icons on index page ([adf6f4f](https://github.com/Superhero-com/superhero-wallet/commit/adf6f4fb15f68984154a95982c318ea1a7c29aa7))
* inactive last used multisig account card ([c629e44](https://github.com/Superhero-com/superhero-wallet/commit/c629e44c40cc71cd9938ea163714e1b3a71133e7))
* ionic caching wrong account details page ([2ec098a](https://github.com/Superhero-com/superhero-wallet/commit/2ec098aa6768c3ffa3732dc36d308b6e01ebe7c4))
* ionic dynamic height tabs ([d2828df](https://github.com/Superhero-com/superhero-wallet/commit/d2828dff07cf65e85b0d8e23441abce7c5d3f5f4))
* ionic jumping animation on firefox ([18b9471](https://github.com/Superhero-com/superhero-wallet/commit/18b9471abaf4222d16c89879cbc8c435db4082b1))
* ionic lifecycle methods do not trigger ([47c6f13](https://github.com/Superhero-com/superhero-wallet/commit/47c6f13c2413833e7e571768ce2bf323d852add4))
* ionic routing issues ([306d65e](https://github.com/Superhero-com/superhero-wallet/commit/306d65eef9bdf34545dde6a7e4091c05f10aff8e))
* iOS header issue ([a96d881](https://github.com/Superhero-com/superhero-wallet/commit/a96d881604e9d96c94dd8836b73c5bfd41813602))
* ios padding top on index.vue ([629f59b](https://github.com/Superhero-com/superhero-wallet/commit/629f59b9b0bcbbf9a5373630c03ccb2369554c3f))
* linting issues ([dc3fc21](https://github.com/Superhero-com/superhero-wallet/commit/dc3fc21db11f115e7f13ef914a9fb8bc389c10d2))
* load notifications and transactions in chunks ([8a3ecef](https://github.com/Superhero-com/superhero-wallet/commit/8a3ecefca900009bc16ed5911a85cd26e5567e0e))
* multisig related ionic bugs ([869be02](https://github.com/Superhero-com/superhero-wallet/commit/869be023a5c7abb7236b2888a59b35e944557105))
* network switcher visible during page transitions ([b20283b](https://github.com/Superhero-com/superhero-wallet/commit/b20283b7382b190bfb6295d1010b89eeca5683b1))
* open external links on mobile correctly ([6881796](https://github.com/Superhero-com/superhero-wallet/commit/68817968282cbe51446ea2054d22f34be50cf53c))
* paddings on settings pages ([689fcab](https://github.com/Superhero-com/superhero-wallet/commit/689fcab249b100099bf9b7a546e2faff5df67f07))
* pass route params to prevent errors related with ionic router ([f387b3d](https://github.com/Superhero-com/superhero-wallet/commit/f387b3dfd04c6626458826e4997a3457a8a7509c))
* place extension on center when open as tab ([3af898f](https://github.com/Superhero-com/superhero-wallet/commit/3af898fb055196d51688b3113cf794c4904ff1b4))
* pr comments, scrollState and css ([8daf729](https://github.com/Superhero-com/superhero-wallet/commit/8daf72901a1243bcd6f93b7cbbc661ca71a83123))
* qr scanner black screen issue ([1cdfc83](https://github.com/Superhero-com/superhero-wallet/commit/1cdfc839f104a0bcb1ce93320382060e87200c24))
* qr scanner not showing ([eaaa9e1](https://github.com/Superhero-com/superhero-wallet/commit/eaaa9e199be30fa2f0df09ba8aada67c43282af7))
* redirect if no multisig ([0ae9bab](https://github.com/Superhero-com/superhero-wallet/commit/0ae9bab955ec98196994af074030b00984c51e94))
* reset wallet action ([4bccf5b](https://github.com/Superhero-com/superhero-wallet/commit/4bccf5b73ba020638ad071cfd4f7988a1eb1937e))
* set correct version name for android app ([be4b57e](https://github.com/Superhero-com/superhero-wallet/commit/be4b57e9ec6ee9d1cf295371c7bdf4f4b753687e))
* set full screen loader correctly ([95078c4](https://github.com/Superhero-com/superhero-wallet/commit/95078c4f19e562f89b256eafa52d03a1e178bbd4))
* shifted tabs on tx list token/coin details ([cd86796](https://github.com/Superhero-com/superhero-wallet/commit/cd867967571776019a17230579c3aa713075c75e))
* show correct address in the account selector ([c5b0fdc](https://github.com/Superhero-com/superhero-wallet/commit/c5b0fdcb68657be893f58a9c46cbe19fcc9bc209))
* sort pending multisig transaction correctly ([f2fd1b3](https://github.com/Superhero-com/superhero-wallet/commit/f2fd1b32a62b0040bcf6e9e93b9568768591882f))
* splash screen white screen issue ([1d47223](https://github.com/Superhero-com/superhero-wallet/commit/1d472238370e81a51d1f9dcb7a9568720bf2a99c))
* svg animatios on ff extension ([f0a6f7e](https://github.com/Superhero-com/superhero-wallet/commit/f0a6f7e0a9a32273a605233d9788126afad198fe))
* swiper on ionic ([bcb385e](https://github.com/Superhero-com/superhero-wallet/commit/bcb385e3b05af08206e618c433ca7e6d0e50aae4))
* terms and conditions scrolling not working in ios. Removed overflow auto css property ([00c8325](https://github.com/Superhero-com/superhero-wallet/commit/00c8325a7648b60c943d32b5311af180ff4931e5))
* **transaction-details-base:** copy correct hash ([ebbbfe0](https://github.com/Superhero-com/superhero-wallet/commit/ebbbfe0ce7e75a2709a760a947506f15a23fbc41))
* use back transitions animations at back and close ([44f1cba](https://github.com/Superhero-com/superhero-wallet/commit/44f1cba98d7b42a7160fa0fd53bb42585713dd6f))
* use correct back button logic ([bad1f8c](https://github.com/Superhero-com/superhero-wallet/commit/bad1f8cfa3cb45e65186eb0239c87a7b22eb34ac))
* watch when building extension ([6316f5f](https://github.com/Superhero-com/superhero-wallet/commit/6316f5fe97fec129f4f8ab3069279916a6ff9a66))
* weird account details page appearance ([738b328](https://github.com/Superhero-com/superhero-wallet/commit/738b3286e277d9a0eb741c1f64caf0b991bd82f5))


### Performance

* throttle scroll event handler ([fdf0e04](https://github.com/Superhero-com/superhero-wallet/commit/fdf0e046300f44e8ef5766beb9769cce67e681ba))


### Tests

* update snapshot ([44e01e9](https://github.com/Superhero-com/superhero-wallet/commit/44e01e9155b3aed2f45950a7ca1a5faa135bfc1c))


### Maintenance

* add capacitor-assets and initialize android assets ([f6d95a6](https://github.com/Superhero-com/superhero-wallet/commit/f6d95a6cfaf96c18f48702863be297f120cdd3e7))
* add comments & use scss variables ([ad7b6e3](https://github.com/Superhero-com/superhero-wallet/commit/ad7b6e36735e00efec4afb57821b9b120ef09c72))
* add ios platform folder ([404b217](https://github.com/Superhero-com/superhero-wallet/commit/404b217005f90aa2055977ff6279eee397d33788))
* adjust page transitions ([9b21936](https://github.com/Superhero-com/superhero-wallet/commit/9b21936c116c07a01516be91160178ae14c2a8c7))
* fix critical npm vulnerability issues ([98b2d94](https://github.com/Superhero-com/superhero-wallet/commit/98b2d948436510d5911ba8d7f1600ece71b62ce2))
* fix transaction filters funtionality according to ionic elements ([fc287bf](https://github.com/Superhero-com/superhero-wallet/commit/fc287bfc18ee8ded3844130b10389638c3625091))
* remove @ionic/pwa-elements and related files ([e9165e6](https://github.com/Superhero-com/superhero-wallet/commit/e9165e60f4773b7b6fd1fad5d99e2de9fdee6992))
* remove preferences from config file ([1c6365f](https://github.com/Superhero-com/superhero-wallet/commit/1c6365f5a52fe47d051ce31ea9d15ec416c03fd9))
* replace cordova clipboard plugin ([9590675](https://github.com/Superhero-com/superhero-wallet/commit/95906750f86aae3362aea5d3ae1c37d74baa0ed7))
* replace cordova leftovers with Ionic ([f93c77e](https://github.com/Superhero-com/superhero-wallet/commit/f93c77ef02d335c273132ab9418ba3b8d60574d4))
* replace cordova qr-scanner plugin with capacitor barcode-scanner ([2bf7c0a](https://github.com/Superhero-com/superhero-wallet/commit/2bf7c0a265b604b1493945b39e7807b644341a08))
* replace cordova share plugin with ionic share ([d6d9b5d](https://github.com/Superhero-com/superhero-wallet/commit/d6d9b5df1f74dd725f07e7031d40c72bab1ba685))
* replace IS_IONIC with IS_MOBILE_APP ([eeabb26](https://github.com/Superhero-com/superhero-wallet/commit/eeabb267b776d3ae40cd1afdd856aa6aa7dab507))
* update action steps for ionic ([3517303](https://github.com/Superhero-com/superhero-wallet/commit/351730381973eda96a4f3b69fe1e4f4b119b7593))
* update readme & scripts for signed android build ([b8d65c8](https://github.com/Superhero-com/superhero-wallet/commit/b8d65c8b5365a9bf89697846fc5d3d3f8c68c5a5))
* update readme according to ionic ([0313fee](https://github.com/Superhero-com/superhero-wallet/commit/0313fee006c47d419c0646dd312cad49c17cfdc8))
* update scripts ([ddc095e](https://github.com/Superhero-com/superhero-wallet/commit/ddc095eeb7948223817f86a82d3edeab364e7751))
* updated ios files and android assets according to latest working settings ([78be82f](https://github.com/Superhero-com/superhero-wallet/commit/78be82fd0d6f1bde900ce5036b46ca57b0782b5b))
* updated Readme instructions for ios Build ([88d5e07](https://github.com/Superhero-com/superhero-wallet/commit/88d5e07bea4f6537afd372957aeb93f4e56b5105))
* use capacitor browser instead of cordova ([6d07fd4](https://github.com/Superhero-com/superhero-wallet/commit/6d07fd40c6d1abe178458bac4f4c26f06a8c81b2))
* use capacitor status-bar ([4b99df1](https://github.com/Superhero-com/superhero-wallet/commit/4b99df121adcc042217f59ef5826db2d9d79f305))
* use different notation ([0717cc1](https://github.com/Superhero-com/superhero-wallet/commit/0717cc1269f003ff00897c7a3d2717f073f0a2f0))
* use latest ionic deeplinks implementation ([e4f53ba](https://github.com/Superhero-com/superhero-wallet/commit/e4f53ba1250040d201e2c110ffc729fa554634f0))
* use router.replace instead of router.push, cause of ionic cache problems ([3ef754e](https://github.com/Superhero-com/superhero-wallet/commit/3ef754e1413957daeaed6bd4628ce8cedaafbb3b))
* using composable to pass props fron TokenContainer to tabs instead of ion-router-outlet ([c0ab118](https://github.com/Superhero-com/superhero-wallet/commit/c0ab118aaf96e59f93797198185f174aa202e15b))

### [2.0.2](https://github.com/aeternity/superhero-wallet/compare/v2.0.1...v2.0.2) (2023-10-02)


### Features

* removing action.js from store ([8e78599](https://github.com/aeternity/superhero-wallet/commit/8e785992331e9f81fa4b44e5772f677656435d94))
* show error modal if failed to sign transaction via deeplink ([3b319c6](https://github.com/aeternity/superhero-wallet/commit/3b319c648b0f097c69e85332d2150508912b9fb2))


### Bug Fixes

* be able to broadcast signed via deeplink transaction ([b35226d](https://github.com/aeternity/superhero-wallet/commit/b35226d607990231e9dd41d4220b75fdd647cd76))
* be able to open a tip deeplink on mobile ([bbcf398](https://github.com/aeternity/superhero-wallet/commit/bbcf3985b31eef638140c2ac4d089ddc08b82f9b))
* **confirm-raw-sign:** show the correct raw data ([e6adc4a](https://github.com/aeternity/superhero-wallet/commit/e6adc4aa4890bb1c12a836d751cec58ca26e9455))
* don't show error when opening transfer send modal with 0 btc balance ([34e1eb7](https://github.com/aeternity/superhero-wallet/commit/34e1eb78659b473566a5b5ecfc61cc208bb64f7d))
* open deeplink url correctly on mobile ([0ac4d76](https://github.com/aeternity/superhero-wallet/commit/0ac4d76b0b65853fa63ae41b32ebe127dba1d4c8))
* **retip:** show correct header ([ee365c3](https://github.com/aeternity/superhero-wallet/commit/ee365c3e7cdf0d9dc44f32408b75ea3a2ffe0589))
* show icon on adding a new network ([3fa9d5d](https://github.com/aeternity/superhero-wallet/commit/3fa9d5dc7edee5a0163f441a7e46da6502111e3c))


### Maintenance

* move loginTargetLocation to composable ([edf6d28](https://github.com/aeternity/superhero-wallet/commit/edf6d285cd1cc61d81e6a0c5169d6801fc1184ee))

### [2.0.1](https://github.com/aeternity/superhero-wallet/compare/v2.0.0...v2.0.1) (2023-09-18)


### Features

* adjust Invite page ([26086a7](https://github.com/aeternity/superhero-wallet/commit/26086a78d64fe4cd135a3bdec393fc80380f7e38))
* allow to access app browser on dev ([41f595e](https://github.com/aeternity/superhero-wallet/commit/41f595e5babcd2b9bbf295b2a1250710803bcf2f))
* discover accounts for every protocol ([a3dafe5](https://github.com/aeternity/superhero-wallet/commit/a3dafe5a307a247bb9aaa34c5cb3bef371065b62))
* improve invite links ([e7da467](https://github.com/aeternity/superhero-wallet/commit/e7da4674a95a495f054ab517dd66315cfbb49ffa))


### Bug Fixes

* **about:** show correct node status ([883105d](https://github.com/aeternity/superhero-wallet/commit/883105dbad9c5e5e1f38b068e60cc83484848081))
* add multisig account on multisig dashboard ([0d85058](https://github.com/aeternity/superhero-wallet/commit/0d85058c09391a866a83b37d4ad90fe0494b70f7))
* adding new networks in chrome extension ([f704b9f](https://github.com/aeternity/superhero-wallet/commit/f704b9f5c8d2e8c092f4050212981e486ff77f03))
* adjust tx filters for non ae accounts ([c10467b](https://github.com/aeternity/superhero-wallet/commit/c10467bb864b16e59004406da5465a32ae6a440b))
* apply correct logic for dex transactions ([a5d7f56](https://github.com/aeternity/superhero-wallet/commit/a5d7f56b2936a44661f0371c436f154b57e37a34))
* display only multisig transactions on multisig token transaction details ([2ff6514](https://github.com/aeternity/superhero-wallet/commit/2ff6514e93ee28414dfb0280f2124ce65e9b1f77))
* don't display contract id if it's not present ([25f5351](https://github.com/aeternity/superhero-wallet/commit/25f53510c7ca3f94c93aebdab70db9f65f46662d))
* include other protocols in total amount calculation ([38a459d](https://github.com/aeternity/superhero-wallet/commit/38a459dc10a3d707e79790dbb99d2300b0d4dd40))
* **invites:** preserve invites state on extension ([435e7ba](https://github.com/aeternity/superhero-wallet/commit/435e7ba10b6c30d146a6e505c724c4c7cce2b293))
* load filtered transactions correctly ([1b451b5](https://github.com/aeternity/superhero-wallet/commit/1b451b5a54d19b941b03abc846ed9ca86dcff264))
* open external links in mobile correctly ([ddd7315](https://github.com/aeternity/superhero-wallet/commit/ddd7315939acaf4a792495e40843aeaaa89be39c))
* prevent transfer send opening on unsupported deeplinks ([9a1b49c](https://github.com/aeternity/superhero-wallet/commit/9a1b49c963df0c48a4b4237189f17f42d5a97edc))
* prevent transfer send opening on unsupported deeplinks ([49c1f68](https://github.com/aeternity/superhero-wallet/commit/49c1f68e523946d26a96717edcc34bfcecf2686f))
* show bitcoin transaction list correctly ([47b9d76](https://github.com/aeternity/superhero-wallet/commit/47b9d7645560bdb1e6a3e4be84a20227870f5927))
* show ClaimSuccess modal correctly ([cd318ca](https://github.com/aeternity/superhero-wallet/commit/cd318caa9abd3282ae723e20e7b9c3a29c8bd392))
* show correct label for claim transaction ([745fd7e](https://github.com/aeternity/superhero-wallet/commit/745fd7e42a495ab1c642655f2783db6d8cae33bc))
* show correct token amount in transaction item ([d664006](https://github.com/aeternity/superhero-wallet/commit/d664006d39ca6ceefb0c42c6760e16e7759c79a9))
* show the text correctly ([3b4ce51](https://github.com/aeternity/superhero-wallet/commit/3b4ce51b250a336528da1983ac683be7cb27ecc5))
* **transaction-label:** show contract related labels ([3608e16](https://github.com/aeternity/superhero-wallet/commit/3608e16162a890902a406b660649db98099923cd))
* **transaction-list:** correct aex9 event condition ([eca3c97](https://github.com/aeternity/superhero-wallet/commit/eca3c97ef083fd1a47d8ac350bd97008c9725597))
* update no longer pending transaction ([6542a1d](https://github.com/aeternity/superhero-wallet/commit/6542a1de25b3531c7b2d86dc206b70683d59c175))


### Maintenance

* adjust middleware swagger file fetching ([c64bdb6](https://github.com/aeternity/superhero-wallet/commit/c64bdb639735f14fdccb5bdc3c656c8dec369c7e))
* adjust transferSend util ([552320d](https://github.com/aeternity/superhero-wallet/commit/552320d3c7cdcc29e854520488e5d7abebe6011b))
* ae node status as sdk composable state ([d28eaed](https://github.com/aeternity/superhero-wallet/commit/d28eaed159b106b78f032dfb7acfb4ff78b04e2c))
* do not allow user to set custom compiler ([eb30b45](https://github.com/aeternity/superhero-wallet/commit/eb30b45664e1a8f60668aa6e11501af893ec6e66))
* do not depend on http compiler ([b30330a](https://github.com/aeternity/superhero-wallet/commit/b30330a619756a522d4b203759b485a9f3d7cf62))

## [2.0.0](https://github.com/aeternity/superhero-wallet/compare/v1.1.4...v2.0.0) (2023-08-29)


### Features

* add back arrow to dashboard back button ([3532215](https://github.com/aeternity/superhero-wallet/commit/35322150c7da6f4929a13dd2c02dd88cb4259743))
* add explorer for btc ([b432fe1](https://github.com/aeternity/superhero-wallet/commit/b432fe19d302d6947b15d1c1bfc8501ebd8059f2))
* add governance icon as png ([ad5d1a6](https://github.com/aeternity/superhero-wallet/commit/ad5d1a68f4a54568ae9dc8551c0789ac2eec466e))
* add icons on action browser dapps ([b56f2a4](https://github.com/aeternity/superhero-wallet/commit/b56f2a4d78d26aae42eb6a9a266877e4c4f91f51))
* add svg icons and modal functionality ([650f7d4](https://github.com/aeternity/superhero-wallet/commit/650f7d42e1c5b6ea475fb75f17eba09f78c4f35f))
* add TransactionDetails for bitcoin transactions ([fcfc21d](https://github.com/aeternity/superhero-wallet/commit/fcfc21d614b730020a081e04da9575191eb01bc7))
* add types ([92fe1a9](https://github.com/aeternity/superhero-wallet/commit/92fe1a91a00a53bd2ee557108418f092be3d65d4))
* add warning message if ft is used for multisig proposal ([a22365b](https://github.com/aeternity/superhero-wallet/commit/a22365bb95ed05310245a6578536e94da84e5208))
* add warning modal in order to connect in dapp browser ([f0e1024](https://github.com/aeternity/superhero-wallet/commit/f0e1024e98714a1cba7d612c961ba180bdd78f30))
* adding ui changes for account screen ([2ef007b](https://github.com/aeternity/superhero-wallet/commit/2ef007bc943b960b52ac201423f76b5275c00951))
* adjust connect modal wording ([4a8add9](https://github.com/aeternity/superhero-wallet/commit/4a8add9df45dce82f6bf3d5535e067006b3c629d))
* adjust decimal numbers formatting ([df25757](https://github.com/aeternity/superhero-wallet/commit/df2575782fdecd60ebb68cf4ff2cf1d3d2c16afa))
* adjust invite links ([7e4aa20](https://github.com/aeternity/superhero-wallet/commit/7e4aa200b101c800a82cfcddeae6d5a863d9aa82))
* adjust multichain texts on modals ([8f1a761](https://github.com/aeternity/superhero-wallet/commit/8f1a761fd6b822663951c8b9367a321b57cb6b9d))
* basic dapp browser ([aee04c2](https://github.com/aeternity/superhero-wallet/commit/aee04c2d0e1b890080137dc038e5d4c954d356fb))
* **bitcoin:** add max button in send form ([4b16340](https://github.com/aeternity/superhero-wallet/commit/4b1634033eab1a91618992eac75de92b0e51d7e3))
* **bitcoin:** adjust amount validation ([18470a8](https://github.com/aeternity/superhero-wallet/commit/18470a83e98eaf8b2a013d2c84bfbfd83abc949f))
* **bitcoin:** implement transaction fetching logic ([794a53e](https://github.com/aeternity/superhero-wallet/commit/794a53ef97c6b2e0179af2a33e6e72857327ccbf))
* **bitcoin:** show unconfirmed balance ([ce4a22d](https://github.com/aeternity/superhero-wallet/commit/ce4a22da0de28a66c1b28d170fc091935acf4c64))
* bring back at path aliases ([9054105](https://github.com/aeternity/superhero-wallet/commit/90541059cc1830ffe1e6fc8c7ad2d3d43e03b53c))
* btc address validation ([cd543fc](https://github.com/aeternity/superhero-wallet/commit/cd543fce3ee8572513bc95d6f56f6e9952510d94))
* calculate fee for the bitcoin transactions ([13e7b5b](https://github.com/aeternity/superhero-wallet/commit/13e7b5b55c97b508a8acd04adab39916b4f31875))
* change button swap to browser if ae account ([65eb145](https://github.com/aeternity/superhero-wallet/commit/65eb1457fd46d5388ddbfacce3b0b70abb150877))
* changes according to new figma requirements ([31eae11](https://github.com/aeternity/superhero-wallet/commit/31eae110f74a18545652ee9c76d67e0c6552db56))
* clean-up after aepp disconnects ([e102856](https://github.com/aeternity/superhero-wallet/commit/e1028569ac0d8c69d14a3cae15e10d258c1df93b))
* common way of storing data on user device ([e547033](https://github.com/aeternity/superhero-wallet/commit/e54703395e57b776b01d833878948b44474309c4))
* composable for transaction state ([1dae715](https://github.com/aeternity/superhero-wallet/commit/1dae715a81342bc4cbb1dbe09ba862ab9ee7e26f))
* create bitcoin account ([7d4a977](https://github.com/aeternity/superhero-wallet/commit/7d4a97745f7f9c12ac6deec3985b9504ae0d4a11))
* create browser actions modal ([6e950c4](https://github.com/aeternity/superhero-wallet/commit/6e950c49f0e887aca6d05c7fdcf8f5da7b1846ab))
* create global stubs file ([a600599](https://github.com/aeternity/superhero-wallet/commit/a6005991cead40bf21833b5910c5e3e88d00f1a0))
* create global utils directory ([0b61578](https://github.com/aeternity/superhero-wallet/commit/0b615782c626b50923e06eabecec721f5e6c4d9c))
* create global utils directory ([4e99e13](https://github.com/aeternity/superhero-wallet/commit/4e99e13bc80711cf2dbef9c437724033819cda3f))
* create utility file with translation maps ([9e0b3ca](https://github.com/aeternity/superhero-wallet/commit/9e0b3cae1a72aa9207badb38dfd0ad94beeb34ae))
* disable claim and invite for non ae accounts ([08e2e8c](https://github.com/aeternity/superhero-wallet/commit/08e2e8c3a138785c8ea2757471f6509e2a015063))
* enhancement to support dapp browser card ([5a9e52a](https://github.com/aeternity/superhero-wallet/commit/5a9e52ab8e540cdeec969ba5f83356cf039e57cd))
* get last active ae account for in-app browser ([1b264d8](https://github.com/aeternity/superhero-wallet/commit/1b264d8b4f71210a0d6a016d09cd1ca522397879))
* global translate function ([5ee1167](https://github.com/aeternity/superhero-wallet/commit/5ee1167e99524145b523e54469a10bc2b3fbe755))
* handle send bitcoin error ([3457da9](https://github.com/aeternity/superhero-wallet/commit/3457da917fc4e1741b7f343af4e472b49c58ad1c))
* hide menu actions ([8ce126f](https://github.com/aeternity/superhero-wallet/commit/8ce126f651a60e377e9eee80f4eb049fefc879a7))
* implement in-app browser header ([f801fcc](https://github.com/aeternity/superhero-wallet/commit/f801fcce38751e08f58f437527fb67d0ac854c38))
* init ui for multichain account cards ([c69f94b](https://github.com/aeternity/superhero-wallet/commit/c69f94b276aa5961d191805edb6359c03c64b011))
* last active protocol accounts ([6d18229](https://github.com/aeternity/superhero-wallet/commit/6d1822937200a4cbf212bc59c08bb27949c767d2))
* make in-app browser feature mobile-only ([24959a8](https://github.com/aeternity/superhero-wallet/commit/24959a8e8f62d3c36c606c95b1ef1532c3c03d11))
* make wording changes to card and warning modal ([f39a48f](https://github.com/aeternity/superhero-wallet/commit/f39a48f8e66e473a63a384f9f176ee78cf46245e))
* migrate new code to vue3 ([5f27595](https://github.com/aeternity/superhero-wallet/commit/5f275957cd27128ef4125c8c2a9366e4604e9323))
* migrate swiper to v6 ([9609d06](https://github.com/aeternity/superhero-wallet/commit/9609d06502e024fde3d236f81f93ab1ad16b2a58))
* move aens constants to aeternity protocol dir ([ede2f52](https://github.com/aeternity/superhero-wallet/commit/ede2f528c8a239f84e708f1e37f256d3b9f8b8ef))
* move aeternity constants to protocol dir ([202436f](https://github.com/aeternity/superhero-wallet/commit/202436f06623e650ff631fb67601acdc116b339b))
* move avatar util to global utils ([731e6bb](https://github.com/aeternity/superhero-wallet/commit/731e6bb4b346ee2484ad3d69ae1e0c03310302a8))
* move constants to global config dir ([8a4efc6](https://github.com/aeternity/superhero-wallet/commit/8a4efc6a0f448d588dbe8e4a57af3c9f06266ba8))
* move environment js constants to global config dir ([55f4a0f](https://github.com/aeternity/superhero-wallet/commit/55f4a0f49bfffc62268420170d645a04b66fc73d))
* move remaining utils to root dir ([8bd9da6](https://github.com/aeternity/superhero-wallet/commit/8bd9da683b7ef1353efcd877048f5ae1bcf09e9b))
* move transaction resolvers to ae protocol helpers ([49b3bc4](https://github.com/aeternity/superhero-wallet/commit/49b3bc480ed8aec6245f815ca9f601ebef945c33))
* multichain account create modal ([9942fdf](https://github.com/aeternity/superhero-wallet/commit/9942fdfd3b6f9157de6f498360d02fb8c45fc9ed))
* multichain btc account transaction list ([1905d56](https://github.com/aeternity/superhero-wallet/commit/1905d56a574bcbf242a5d4dd8535242b1383520b))
* multichain btc dashboard recent transactions ([27f4dc8](https://github.com/aeternity/superhero-wallet/commit/27f4dc8b6e2d8426ee2c0cd9137e79358e884a42))
* multichain global adapters registration ([1914650](https://github.com/aeternity/superhero-wallet/commit/1914650b202bb88a7cc2ad65dda434684ea8aaaa))
* multichain move ae libs to protocol dir ([d667aba](https://github.com/aeternity/superhero-wallet/commit/d667abaf38ccb9d8723cca39ea537cbc1e040fb4))
* multichain network management ([ac9837c](https://github.com/aeternity/superhero-wallet/commit/ac9837c045e4078d1b48c447dea1aa713e3db569))
* multichain network switch modal ([ced6fb6](https://github.com/aeternity/superhero-wallet/commit/ced6fb65bda6e10cacf74731f8f44b8b481a587d))
* multichain vue components architecture ([cabde44](https://github.com/aeternity/superhero-wallet/commit/cabde4438d80754147d8950474dfda269c85183f))
* **multichain:** add dust amount restriction for bitcoin transfers ([77756dd](https://github.com/aeternity/superhero-wallet/commit/77756dd8e544f72363ee44a0775e01bc05d17223))
* **multichain:** implement bitcoin adapter interface ([557f4a2](https://github.com/aeternity/superhero-wallet/commit/557f4a2b94c503b42fbde015822f48629cbed806))
* **multichain:** use minimum utxos for bitcoin spend operation ([7f2fa59](https://github.com/aeternity/superhero-wallet/commit/7f2fa59dd7a304bc261b689f135e248b7445a75a))
* prevent signing unverified transactions ([4aaf038](https://github.com/aeternity/superhero-wallet/commit/4aaf0383de1e3d835c78904589b2badcc8ab41ec))
* remove send confirmation modal ([41b249a](https://github.com/aeternity/superhero-wallet/commit/41b249ac2810616492041643a470f343720138c1))
* remove text about sending to url from recipient info modal ([ec40819](https://github.com/aeternity/superhero-wallet/commit/ec408197ea70718289cb27bf2c640f44d044543b))
* remove vue compat ([35f1d53](https://github.com/aeternity/superhero-wallet/commit/35f1d5352dc237e74a3e4dbbbf64ed0a5a9e838e))
* remove warning/errors filtering at TransferSendForm ([148ae72](https://github.com/aeternity/superhero-wallet/commit/148ae72ea181c17e5cd295afa7f6d7dc75a81f71))
* rename global config dir into constants ([d50d102](https://github.com/aeternity/superhero-wallet/commit/d50d102a60ebd7974fc34a373d0a22d929b44b4f))
* replace action icons ([966ede5](https://github.com/aeternity/superhero-wallet/commit/966ede5fb39e1ea84165a0aba3283d2a0c54b046))
* replace aepp browser dashboard card image ([aa070b1](https://github.com/aeternity/superhero-wallet/commit/aa070b120ecac574d69f434e0245fd0689c27137))
* replace explorer links with ae scan ([276e882](https://github.com/aeternity/superhero-wallet/commit/276e882d903a2e68b49bd515e422af4ed18ade7e))
* replace explorer links with ae scan ([7673d71](https://github.com/aeternity/superhero-wallet/commit/7673d713d5da16e730795de19af927481a43b3a9))
* **restore-wallet:** add qr scanner to import seed phrase ([ff3dd38](https://github.com/aeternity/superhero-wallet/commit/ff3dd388ac742a3b9b48c4831dde14cc759ea2c8))
* scan btc qr code recipient ([bfa3b32](https://github.com/aeternity/superhero-wallet/commit/bfa3b322b5fd077acc7bc091292108c4a6ec2cb7))
* show btc as currency in transfer receive modal ([0ffff1a](https://github.com/aeternity/superhero-wallet/commit/0ffff1a7a518ce42485b5c55f79e9f2874cf72ff))
* show contract address in the token details ([26b1e8e](https://github.com/aeternity/superhero-wallet/commit/26b1e8e8806e594367cead57190a75f4855b6fee))
* split transaction list logic between parents ([2dc2937](https://github.com/aeternity/superhero-wallet/commit/2dc2937356f365b2f5b73b8d79a11d8f459dcb8e))
* swiper minor eslint alternations ([bbe4292](https://github.com/aeternity/superhero-wallet/commit/bbe42924e893143efadb5a2dfcb8219cc143687a))
* sync the protocol last active global idx with background ([f95a4ee](https://github.com/aeternity/superhero-wallet/commit/f95a4ee1490367ce0ed4ecfd3dfda801b9e8b0c1))
* transaction details protocol specific views ([20e24b3](https://github.com/aeternity/superhero-wallet/commit/20e24b3749fd779337ee6fd692c508796f381772))
* update aepp list & hover effect ([f425cce](https://github.com/aeternity/superhero-wallet/commit/f425ccec5df404033bcecd1651804bf96fbad0c5))
* update aepps list ([c12b951](https://github.com/aeternity/superhero-wallet/commit/c12b951845d777dd766d1f6958d9ef988560a2a6))
* update apps list ui ([09cc824](https://github.com/aeternity/superhero-wallet/commit/09cc824eb49d2937a42a4e9313de07d0b1882f22))
* update components to sdk13 ([687e8a1](https://github.com/aeternity/superhero-wallet/commit/687e8a1f1f6c46029e23131f3328b76b6013c38c))
* update styling of input error and warning messages ([c8569b6](https://github.com/aeternity/superhero-wallet/commit/c8569b6d9bd2368631dc9672c89a66f352d23749))
* update ui for btc transfer send ([f9cae7e](https://github.com/aeternity/superhero-wallet/commit/f9cae7e7987936b54a56f6abb90faccea5cc95a8))
* use sdk13 in latest transaction widget ([5966aa0](https://github.com/aeternity/superhero-wallet/commit/5966aa041c7b40f6997cb580ce4f43a8adff77d7))
* use separate resolve and reject callback types ([7e862c1](https://github.com/aeternity/superhero-wallet/commit/7e862c1b42c493c3d9aab1cf201776df088dbb02))
* use separate resolve and reject callback types ([00d95b3](https://github.com/aeternity/superhero-wallet/commit/00d95b370977e27f6e1628eb2cbdde74857b336e))


### Bug Fixes

* **account-create:** show correct coin name ([ed62fcf](https://github.com/aeternity/superhero-wallet/commit/ed62fcf54cbb2f058f6d426b041fc1571ca7a220))
* accounts getter performance issues ([3a40eb0](https://github.com/aeternity/superhero-wallet/commit/3a40eb0fcd1a91ef212da07b45fa14fcb0feae5b))
* add correct type for tipWithdrawnTransactions ([31981bb](https://github.com/aeternity/superhero-wallet/commit/31981bb45f11862eb87f776838124c94ca036824))
* aepp browser height ([ead7a4b](https://github.com/aeternity/superhero-wallet/commit/ead7a4b08fa91eadf57d8ca186be14bdb1f187c3))
* **aepp:** add user consent popup for sharing all accounts list to aepps" ([24ccdb7](https://github.com/aeternity/superhero-wallet/commit/24ccdb7394c14b7bd7978bf8823be5bbc3be72bb))
* **aepp:** message signing on reverse iframe connection ([3e5bfe4](https://github.com/aeternity/superhero-wallet/commit/3e5bfe438a0f17d4bb078fd5f2fd991e01346459))
* **aepp:** send connect and disconnect messages ([2903e5f](https://github.com/aeternity/superhero-wallet/commit/2903e5fcf967eccb1dcb311d5534ce63aa6dcea0))
* all the _blank links ([216b41a](https://github.com/aeternity/superhero-wallet/commit/216b41af1b649e3f6dc19d53ad82f2ed12d6b0ee))
* allow only one modal to be opened at one time & sanitize user URLs ([7fae2ac](https://github.com/aeternity/superhero-wallet/commit/7fae2acc325ae6d59090f43e166b773984e3bd03))
* apply correct path logic for not found page ([b5bb3ce](https://github.com/aeternity/superhero-wallet/commit/b5bb3ceca3620458dac55311b7608de3d6c42574))
* apply correct validation rules for name bidding ([a253ffc](https://github.com/aeternity/superhero-wallet/commit/a253ffc2eea1af5f683507b980710da3dddf692d))
* apply new cordova links logic ([5fb646a](https://github.com/aeternity/superhero-wallet/commit/5fb646aa5cec9977f31566cf188ea03264e30ecd))
* await for resetNode to finish ([7efe726](https://github.com/aeternity/superhero-wallet/commit/7efe726a42df8ccbe688eda38c6601111b528bf5))
* be able to claim invite ([7937568](https://github.com/aeternity/superhero-wallet/commit/7937568c51e0bf25905235e530f230e72f31a6c6))
* **bitcoin:** be able to send bitcoins ([b0bdacf](https://github.com/aeternity/superhero-wallet/commit/b0bdacf0e425dde5c358337a13128b3cc3a8bcd4))
* **bitcoin:** do not set negative max amount ([48db511](https://github.com/aeternity/superhero-wallet/commit/48db5118a1c82fb69c152a1271339bb5d18d7584))
* **bitcoin:** show transaction details ([8306e41](https://github.com/aeternity/superhero-wallet/commit/8306e4150f84739c523a40511be1b4842f337a4d))
* browser actions ([e20f8fa](https://github.com/aeternity/superhero-wallet/commit/e20f8fa5e0ca5b13ecd20b75faa35916f1daedb3))
* button events ([9095f48](https://github.com/aeternity/superhero-wallet/commit/9095f48b11b6a6837d34597be063d30c1aa377d3))
* calculate full name claim amount ([d82b3fb](https://github.com/aeternity/superhero-wallet/commit/d82b3fbf47d30993af792e38eff1af4c94a4f4e4))
* calculate tip url fee correctly ([e86c666](https://github.com/aeternity/superhero-wallet/commit/e86c66679b8eb00dd83dc14cbf07b6c7cc67fd05))
* calulate txFee for the auction correctly ([6fc7a94](https://github.com/aeternity/superhero-wallet/commit/6fc7a94202200374f58b0595b7b50675963e2fdb))
* change resolving issues regarding pending transaction in TransactionDetails ([a4789d3](https://github.com/aeternity/superhero-wallet/commit/a4789d33c561c8eb9fa5c2c1fb0fb6a0114e8b8c))
* changing view in create multisig vault ([9112ece](https://github.com/aeternity/superhero-wallet/commit/9112ece41cd4189c9e280e457a855971bdfa93b5))
* changing view in multisig card and details ([1b48ee9](https://github.com/aeternity/superhero-wallet/commit/1b48ee910101a1cf51a60d5bb26f4aacaf235530))
* coin details market data ([4835708](https://github.com/aeternity/superhero-wallet/commit/483570813cadc32373087f202235789224e3b40e))
* communication with sdk on cordova ([c7d1ebe](https://github.com/aeternity/superhero-wallet/commit/c7d1ebe7a15829c1fdca7b9930a1e000b0a662a7))
* cordova allow-intent url ([86c2693](https://github.com/aeternity/superhero-wallet/commit/86c2693d71b3590e797053fd1f7510aa8c70be55))
* correct name claiming validation ([2276139](https://github.com/aeternity/superhero-wallet/commit/2276139fafb08cbda55830785da3180566c28386))
* creation of multisig with inactive account ([7735af4](https://github.com/aeternity/superhero-wallet/commit/7735af46520bf72494732c4433c589bc3b6cf862))
* detecting the protocol in details page ([1b8f75a](https://github.com/aeternity/superhero-wallet/commit/1b8f75a4daa9c0346f303d5140b272b4c0e3027f))
* dex icon not showing on iOS ([9d416fe](https://github.com/aeternity/superhero-wallet/commit/9d416fe3ac2f10cec224aac12aef00a966fa8b14))
* don't share wallet info to clients when sdk is blocked ([b71a35f](https://github.com/aeternity/superhero-wallet/commit/b71a35fc6aebb9c674a6609a8283fd7c68445228))
* fetch confirmed transactions on load ([fdc1420](https://github.com/aeternity/superhero-wallet/commit/fdc1420f99cd408311a66a3b7c538500404f02b2))
* fill out send modal from url properly ([dbc6b82](https://github.com/aeternity/superhero-wallet/commit/dbc6b8270805112ee14b902471a7cbdab600c600))
* fix account swiping & multisig details ([938578b](https://github.com/aeternity/superhero-wallet/commit/938578b104c37d757cddbb168abb7b4e1bfa6049))
* gh action npm issue ([4cbe066](https://github.com/aeternity/superhero-wallet/commit/4cbe066d5c188098219f5500707e492ed73b8a29))
* **hdwallet:** use last aeternity account for signing when other protocol account is active ([b1d9d87](https://github.com/aeternity/superhero-wallet/commit/b1d9d87824de54e095831b1e000e33dbbf18589b))
* hide dex button on ios ([92e38a5](https://github.com/aeternity/superhero-wallet/commit/92e38a5d3622b8a5ea3f9e21ef507db314e3b6da))
* i18n errors when handling arrays of translations ([d51f937](https://github.com/aeternity/superhero-wallet/commit/d51f937ddeb09808cafa46346be53c0c3ffd55c3))
* icon sizes in dashboard cards ([ae13b81](https://github.com/aeternity/superhero-wallet/commit/ae13b81ef930435d79a016ba03942e882e4a3391))
* icons import, pass props, display logic ([a2bb6ea](https://github.com/aeternity/superhero-wallet/commit/a2bb6ea1fad93efa599cdcffe4976cab9f500012))
* imports now using @ ([e4fc7b9](https://github.com/aeternity/superhero-wallet/commit/e4fc7b913fea702c9c8b289d4ddd800d86e69cb8))
* input field icon size ([88d9d0c](https://github.com/aeternity/superhero-wallet/commit/88d9d0c43b2d08f1903e70b133a939436f9d8258))
* iOS null origin issue ([74de1a5](https://github.com/aeternity/superhero-wallet/commit/74de1a5bff8b1d21128e96ee458913c428179812))
* logic of sharing wallet info when sdk is not blocked ([0b2edc8](https://github.com/aeternity/superhero-wallet/commit/0b2edc8460955bdf949176f9e121166f712a912f))
* make ae ecosystem card mobile only ([3e43d76](https://github.com/aeternity/superhero-wallet/commit/3e43d76828c4218416643caaa9b070ff6c9fed21))
* make browser feature mobile only ([b36ae3d](https://github.com/aeternity/superhero-wallet/commit/b36ae3d224b513ef3e36553ba620a1b3297f2c38))
* multichain accounts getter performance issues ([f91c8b8](https://github.com/aeternity/superhero-wallet/commit/f91c8b87711b34ac32a9ae9fa27b0a216380d68d))
* present proper top header data after network change ([94812f8](https://github.com/aeternity/superhero-wallet/commit/94812f8938d4a94797e918806f263801e3a38e9b))
* prevent signing unknown protocol requests in hdwallet component ([be592fd](https://github.com/aeternity/superhero-wallet/commit/be592fd173eb490c71f87b0551e6ac73b5534f88))
* refresh dapp content ([20dd67b](https://github.com/aeternity/superhero-wallet/commit/20dd67b020603ca1a6dbf96c8fd306774105863d))
* remove obsolete mutation call ([17eb9b9](https://github.com/aeternity/superhero-wallet/commit/17eb9b9162c5a86c1bb244e577c131487dea4652))
* remove restrictions to show browser in not ios ([6bc1766](https://github.com/aeternity/superhero-wallet/commit/6bc17669612b5fd5f82cb0b0c870549e437b8958))
* replace vue router exact prop ([7115877](https://github.com/aeternity/superhero-wallet/commit/7115877df3cf53ca18526b1559f625d18a8546ec))
* resolve minor PR comments ([d538ed4](https://github.com/aeternity/superhero-wallet/commit/d538ed417a5a34134c66d5414a31ec34b012ce00))
* resolve pr issues ([a363f88](https://github.com/aeternity/superhero-wallet/commit/a363f88faf1c1ffaece6dbc27325092a679768f9))
* resolve webextension-polyfill related issues ([7978996](https://github.com/aeternity/superhero-wallet/commit/7978996081f9d9ffa1edd041a85c785be8c93e3b))
* resovle minor pr issues ([a4931ee](https://github.com/aeternity/superhero-wallet/commit/a4931ee07335dc2d43cae4edb08cb4df4e2bc58a))
* reverse iframe connection using sdk13 ([925eb30](https://github.com/aeternity/superhero-wallet/commit/925eb3008d76b0b10840fb82751d26ecc6a95ccf))
* sdk13 extension type  & confirm connect modal ([1f72e9c](https://github.com/aeternity/superhero-wallet/commit/1f72e9c1e1c505233c9a547cf68ea8a9424da1f7))
* **sdk:** correct isSdkReady logic ([1d84138](https://github.com/aeternity/superhero-wallet/commit/1d84138ad2644bfff4aa461fdea8e1c3d67d4648))
* secure-lock icon not showing ([314cdd8](https://github.com/aeternity/superhero-wallet/commit/314cdd8c807dae543e6b521f0882e9d5be3c6bbe))
* show actual sdk version ([1d2c709](https://github.com/aeternity/superhero-wallet/commit/1d2c70984395cd264903f219c4b40ece7d49c977))
* show an actual total amount in confirm transaction sign modal ([a49b6a4](https://github.com/aeternity/superhero-wallet/commit/a49b6a4105632127f6fce038ea39a5ded5d74b31))
* show labels for fields in advancedDetails ([615318a](https://github.com/aeternity/superhero-wallet/commit/615318ae55841e9f6b3c6203dbd5a4a75a0d529e))
* show payload on multisig transaction details ([e857414](https://github.com/aeternity/superhero-wallet/commit/e85741414907ae447ca2231596bf9ced255d03fa))
* show proper tx direction on account change ([2c36b5e](https://github.com/aeternity/superhero-wallet/commit/2c36b5eeb2de7765c1b56059834f5326d795aac5))
* **sign:** enable permission check for deep link transaction signing ([78f167e](https://github.com/aeternity/superhero-wallet/commit/78f167e2886941f887830eefce879d78e33dd65e))
* stylelint errors ([a671d27](https://github.com/aeternity/superhero-wallet/commit/a671d27c854919dccb300a7cc083059a2d31add6))
* svg icon issues ([e5eeae3](https://github.com/aeternity/superhero-wallet/commit/e5eeae3577a3fe5374d711384d1d9defd087e3f7))
* svg warnings & functional components ([d96cf5f](https://github.com/aeternity/superhero-wallet/commit/d96cf5f347d9b39f60ce378d144df599698fdf32))
* swagger js console warn ignore ([0e7819b](https://github.com/aeternity/superhero-wallet/commit/0e7819b842002fd5099d9f34919ca580c72022e5))
* **transfer-modal:** disable next button if input is not valid ([94f5ced](https://github.com/aeternity/superhero-wallet/commit/94f5ced4231535da0e47e5bae1e2c97845ec7a21))
* **transfer-send-form:** handle warnings correctly ([ccd5a4d](https://github.com/aeternity/superhero-wallet/commit/ccd5a4d7f4ca49c69755917d6204cdefcdfd1441))
* translation dynamic keys ([a89d5bd](https://github.com/aeternity/superhero-wallet/commit/a89d5bda4f4625cbc038c86b5404e80a12587006))
* typescript, improvements and css changes ([c9925eb](https://github.com/aeternity/superhero-wallet/commit/c9925eb1947fb030666244b1d0c7341c9f8af8e9))
* url seach dapp rules ([456452b](https://github.com/aeternity/superhero-wallet/commit/456452b17d54a58a6707825cbf9712b1bd83880e))
* use correct discovery logic ([4579606](https://github.com/aeternity/superhero-wallet/commit/4579606ba4d7df79e9e7fe218a77257406d889de))
* use correct function to validate address ([7496a83](https://github.com/aeternity/superhero-wallet/commit/7496a83595d65285265fec2637256bdc50255de7))
* use correct url for contract addresses ([3ef2c64](https://github.com/aeternity/superhero-wallet/commit/3ef2c6487038a0b0fbe8bf919365a115d8b754c8))
* use correct wording for contracts ([4df2b4f](https://github.com/aeternity/superhero-wallet/commit/4df2b4f5b15b636ba17399cfeab26b69395335a5))
* use the correct explorer link for a truncated address ([65bc21c](https://github.com/aeternity/superhero-wallet/commit/65bc21c8e4fc8e5735a77878d3ab1906546d02b9))
* use the correct target for the LinkButton ([f244e6a](https://github.com/aeternity/superhero-wallet/commit/f244e6ae6a1b890d2f48ae52b3f25f8e400fa413))
* use the correct warnings condition ([72425b1](https://github.com/aeternity/superhero-wallet/commit/72425b1dd37e86632e628419f7a6f37ef5f6c47a))
* validate max amount correctly ([273259f](https://github.com/aeternity/superhero-wallet/commit/273259f081607bdadc8cf12c83937b12eb831c33))
* vue3 routes config types ([9390696](https://github.com/aeternity/superhero-wallet/commit/93906964b02b9f05b0585ad1f6bc69aeb5ce9c70))
* wallet connection issue ([44480b7](https://github.com/aeternity/superhero-wallet/commit/44480b7cd53a44503e7048836d6dd5264b0534ee))
* wording and use correct syntax ([52c0e7f](https://github.com/aeternity/superhero-wallet/commit/52c0e7f83882166d9cdcfb852a1988b25f0c1e97))


### Tests

* enable pending transaction tests ([5f08bf5](https://github.com/aeternity/superhero-wallet/commit/5f08bf533813bb35939b617591f1e78c8f65f72e))


### Maintenance

* add browser extension typings ([aac01c4](https://github.com/aeternity/superhero-wallet/commit/aac01c44e58fbbdbab12c2af6707831d42d4ad7b))
* adjust account discovery logic ([ec4c991](https://github.com/aeternity/superhero-wallet/commit/ec4c991ad065a516f394bc6f3c8101b9b11d2e97))
* adjust review transaction text ([7ca7bf1](https://github.com/aeternity/superhero-wallet/commit/7ca7bf1bb48f88507159e7a91dc291917588aed0))
* **aepp:** improve aepps notification on account and network change ([cb3f22e](https://github.com/aeternity/superhero-wallet/commit/cb3f22e077f3a12cb57ea3fc7e44b002c898e1ca))
* change wording for aepps browser ([44d55ea](https://github.com/aeternity/superhero-wallet/commit/44d55ea6ff8c65428ea499dfe0d5856760da37d2))
* fix title of account list popup ([f84b1fc](https://github.com/aeternity/superhero-wallet/commit/f84b1fc7d79777fc9a522d06d5bb0bed759c3321))
* generate mdw swagger client without sdk ([59b26ad](https://github.com/aeternity/superhero-wallet/commit/59b26add89ba6fc8a4367f65d36bcf1509927824))
* initialize sdk in the confirm transaction sign popup to access the dex contracts ([1102634](https://github.com/aeternity/superhero-wallet/commit/11026345ddcf3dba6081b51a36ddc1c772d461c4))
* lifecycle hooks ([b42d179](https://github.com/aeternity/superhero-wallet/commit/b42d179ca140f36be189558e5bc20b2baf1c19b5))
* make migration-to-vue3 changes to new code ([dc04c5a](https://github.com/aeternity/superhero-wallet/commit/dc04c5ab9eb96c84e7aa56bd8bc5ddda8f49d281))
* migrate i18n languages file to ts ([c6edd20](https://github.com/aeternity/superhero-wallet/commit/c6edd208524ebf07f37fe991507e2b4b72cdc6f0))
* migrate i18n, v-model, Vue.set; replace vue-svg-loader & remove console.logs ([08c9f15](https://github.com/aeternity/superhero-wallet/commit/08c9f1585d914741196778b1d49d4b226448facb))
* migrate usage of watch when used with array ([6112ca0](https://github.com/aeternity/superhero-wallet/commit/6112ca079c01b3b90cf2e0a83b28a6fe9cf8b760))
* move account getters to composable ([3b0954c](https://github.com/aeternity/superhero-wallet/commit/3b0954cbe19851740080d7bab26f4dbe9fc100ea))
* move getPopupProps and i18nTranslations utils from popup utils to global utils dir ([85cb0c1](https://github.com/aeternity/superhero-wallet/commit/85cb0c10039c7c5f23cc039ae8fc9617728956c5))
* move share vuex action to utils ([a9f0325](https://github.com/aeternity/superhero-wallet/commit/a9f032504aadc4e77bdd6b35a2a68b193f00eb3e))
* multichain dynamic account create buttons ([587fbc9](https://github.com/aeternity/superhero-wallet/commit/587fbc97d6a2ec74ff2329290e96b8e637c6dff2))
* **multichain:** implement multichain protocol interface ([73df4a9](https://github.com/aeternity/superhero-wallet/commit/73df4a9599ae32e5247ecf5438dcbf3ec914b7df))
* multisig on sdk 13 ([c5ffd15](https://github.com/aeternity/superhero-wallet/commit/c5ffd15225e18b1a7240c3becb343583a5709b7f))
* redirect to 404 page when is not mobile ([32a078c](https://github.com/aeternity/superhero-wallet/commit/32a078cd38d611c424d0f7f58e82d678da8cb9d6))
* reduce account color saturation ([4658fa7](https://github.com/aeternity/superhero-wallet/commit/4658fa734832c8789c2dbbeb88d390a14bee1d05))
* reload middleware only when middleware url changed ([9efda78](https://github.com/aeternity/superhero-wallet/commit/9efda78cca64798d2b6e44a679396b72e07e9e85))
* remove obsolete getters ([ef1e196](https://github.com/aeternity/superhero-wallet/commit/ef1e1964d2129161283356939c0d7fe1b3e6bf74))
* remove sdk 11 dependency ([2e01c8e](https://github.com/aeternity/superhero-wallet/commit/2e01c8e177254bc131479dc64b8c07cd7e1c6846))
* remove unnecessary payload in invite links ([7307140](https://github.com/aeternity/superhero-wallet/commit/7307140875f90312109d290c54ab04f207841507))
* remove unnecessary sdk transpilation ([a8de6be](https://github.com/aeternity/superhero-wallet/commit/a8de6be264890f6b90cee8610eb8cc0288433a0f))
* remove unused code ([17e6a55](https://github.com/aeternity/superhero-wallet/commit/17e6a557f7a80d8dd9cda39a2f6da90dce06126a))
* remove unused files in preference to use sdk supported ledger account ([3afbb84](https://github.com/aeternity/superhero-wallet/commit/3afbb845c43e0691b93b27d0bd67fb0891b0395a))
* remove unused functions ([9dd1d7b](https://github.com/aeternity/superhero-wallet/commit/9dd1d7b782b0384399a4b95809b96a60e1970e15))
* remove unused vars ([598f972](https://github.com/aeternity/superhero-wallet/commit/598f972f43bc1b54d63cb886d182514b743fec63))
* remove usage of transaction schema from sdk v11 ([d10beb3](https://github.com/aeternity/superhero-wallet/commit/d10beb3ad107245f6367a5bfe323f70beb667896))
* remove validation status from the retip component ([28caee1](https://github.com/aeternity/superhero-wallet/commit/28caee16840eb73155aeff05409c9a57ad53facb))
* rename aepp-sdk instances to aeSdk standard ([cbe83bd](https://github.com/aeternity/superhero-wallet/commit/cbe83bdc8ea555e1c124ffd3103f6fd63eb79dfc))
* rename fromAccount to onAccount ([52af43f](https://github.com/aeternity/superhero-wallet/commit/52af43f669211336cd0f746aa0cfd2d8d0bab771))
* rename popupProps.transaction to tx ([73b049f](https://github.com/aeternity/superhero-wallet/commit/73b049f4ef96442009ba6e34ec82f01102cd150e))
* rename sdk13 to sdk ([7e9be70](https://github.com/aeternity/superhero-wallet/commit/7e9be70c61b5e8a9b2fa8d0fd6ea5212d16e2bfe))
* resolve minor pr issues ([71dd40d](https://github.com/aeternity/superhero-wallet/commit/71dd40dc6e91afcbec4f241719420924665d9933))
* resolve reject callbacks ([d6d7da4](https://github.com/aeternity/superhero-wallet/commit/d6d7da44d0128af50ecea40cce42afcae06e3653))
* **sdk:** determine transaction types and labels using sdk defined types ([1730169](https://github.com/aeternity/superhero-wallet/commit/1730169ce5872e8415e78d65390e49f400838d44))
* **sdk:** remove legacy sdk instance from state ([0da3d9a](https://github.com/aeternity/superhero-wallet/commit/0da3d9a3b024e6f889eadf9cc39975694de67260))
* **sdk:** remove unused onCompiler option on initialization ([6336d03](https://github.com/aeternity/superhero-wallet/commit/6336d03f238798a88bc00ddde74a298462cf3ab1))
* simplify account importing ([6330d69](https://github.com/aeternity/superhero-wallet/commit/6330d697d0b143331577c900a6639da4d315d537))
* simplify account-selector modifications ([4b3359e](https://github.com/aeternity/superhero-wallet/commit/4b3359e7ddfd9e2ae9862ddb1c584d95b6ccd2b8))
* simplify and using code standards ([37885ec](https://github.com/aeternity/superhero-wallet/commit/37885ecfed14e91453b6db60c50357d620ed3828))
* simplify custom aepp url rule ([64c9b40](https://github.com/aeternity/superhero-wallet/commit/64c9b40c9c25314e8967f7f3380be74cc8cc139f))
* start migration to vue3 ([a1bcbce](https://github.com/aeternity/superhero-wallet/commit/a1bcbce414e0d4dd2adb5f692716220980392f05))
* switch to first ae account and go to apps browser ([3dd0f94](https://github.com/aeternity/superhero-wallet/commit/3dd0f944b42a82259f2f5a4947f6d787f88d4c55))
* **tag:** distinguish between tx type and tag names ([9d4ecec](https://github.com/aeternity/superhero-wallet/commit/9d4ecec7f6c57b96bffb21f33a8ae17db81f40d5))
* terms of service cleanup ([be13a8c](https://github.com/aeternity/superhero-wallet/commit/be13a8c1adc9a7c242d13309f6defeffefd0cba0))
* update e2e tests ([864998f](https://github.com/aeternity/superhero-wallet/commit/864998fa2b90187cdb225150b2ca409279a0571a))
* update unit tests to run with vue3 ([891c8a3](https://github.com/aeternity/superhero-wallet/commit/891c8a3effba0eb6df8098165affd1da42991e13))
* update vue-cli to v5 & fix eslint errors ([a03482c](https://github.com/aeternity/superhero-wallet/commit/a03482c0c3a28fcf11572ed3a9b098ba803118a6))
* use custom utils to check dex functions ([db16303](https://github.com/aeternity/superhero-wallet/commit/db16303395814d36a94d6efa7479170ffef18420))
* use dedicated network watcher for popup and background ([29e9eea](https://github.com/aeternity/superhero-wallet/commit/29e9eea43baa83e79142dc92a8dbb0b77c63c925))
* use existing bigint library to parse pending transaction api responses ([997a99e](https://github.com/aeternity/superhero-wallet/commit/997a99e2f9ee1ecf3c38a4ce7085dfd64f9ef5c5))
* use networkId returned by the Node ([39c17d7](https://github.com/aeternity/superhero-wallet/commit/39c17d774ceb246ee5020682e6606ab3b66c94a3))
* use of <transition> ([28f61d7](https://github.com/aeternity/superhero-wallet/commit/28f61d7638e251d636bd5d66df884665d97d2cf6))
* use of v-deep ([9979c87](https://github.com/aeternity/superhero-wallet/commit/9979c8761253cccabcbbf2377545e1ece70f3706))
* use sdk 13 in fungible token plugin ([f8c0fb1](https://github.com/aeternity/superhero-wallet/commit/f8c0fb1cb8778b5ee87beb45f76285bf7f07d013))
* use sdk 13 to calculate fee ([a50d6f3](https://github.com/aeternity/superhero-wallet/commit/a50d6f32328f85d537a033247a9cadfbaa2b014c))
* use sdk13 type for contractId ([f6921bf](https://github.com/aeternity/superhero-wallet/commit/f6921bf156729ea756ffd32d4dfc5334f5879f35))
* use tx builder from sdk 13 ([c3bbb2c](https://github.com/aeternity/superhero-wallet/commit/c3bbb2c825653a75a64819514a828d202480a0d9))
* use updated qr-code-styling ([6f7f0a7](https://github.com/aeternity/superhero-wallet/commit/6f7f0a719bc81905198fdd4efa43859a7509e2b5))
* use vee-validate@v4 ([b947f87](https://github.com/aeternity/superhero-wallet/commit/b947f879bf00f04ffcb3c17fd5cf04236a595204))
* using props for styling instead of  change child's classes ([6d87522](https://github.com/aeternity/superhero-wallet/commit/6d8752231211493244a71e19ba9f6df6adde4df3))
* using props instead of deep ([670355f](https://github.com/aeternity/superhero-wallet/commit/670355f9c5488f89faf3a5f76cf9410d865ad768))
* using pseudo element for opacity ([60032be](https://github.com/aeternity/superhero-wallet/commit/60032be6df6285e7df96a1c6093a5efa9fd2d17e))
* utilize SDK constants for popup types and remove unnecessary watcher ([39cbaae](https://github.com/aeternity/superhero-wallet/commit/39cbaae354fff7f05c378a65b3757cb68e90af0f))

### [1.1.4](https://github.com/aeternity/superhero-wallet/compare/v1.1.3...v1.1.4) (2023-08-21)


### Maintenance

* hide buy ae button ([da6a1c6](https://github.com/aeternity/superhero-wallet/commit/da6a1c6d787c8cac3a9a5392300ea842e61e3e87))
* hide dex button on ios ([f093200](https://github.com/aeternity/superhero-wallet/commit/f093200afb1b8d594a223e792d2614783f58978f))

### [1.1.3](https://github.com/aeternity/superhero-wallet/compare/v1.1.2...v1.1.3) (2023-06-23)


### Features

* adding consensus info modal ([a89c48e](https://github.com/aeternity/superhero-wallet/commit/a89c48e324b4f60f6b7a8c1a3551db2b75d0679b))
* create new network from a link ([767ccbb](https://github.com/aeternity/superhero-wallet/commit/767ccbbd160a7b94bab769f9065a12ca0b8d0c31))
* disable URL tipping for URLs inside wallet ([a408260](https://github.com/aeternity/superhero-wallet/commit/a4082602457f0800938adcf2a1dac49e105716a1))
* handle rejected by user errors with custom error ([7f20271](https://github.com/aeternity/superhero-wallet/commit/7f202719dc151c3b10d4aea379bcc06b326b9409))
* hide buy button on non mainnet networks ([7472b28](https://github.com/aeternity/superhero-wallet/commit/7472b28127c38b34bb2ca968a7342667c8d41d39))
* icon boxed component ([5d64600](https://github.com/aeternity/superhero-wallet/commit/5d64600b34fb6f0231b7221a0a80f42711c15fa3))
* improve wording in transaction list ([a977626](https://github.com/aeternity/superhero-wallet/commit/a977626880042daa54a7d2bf2d079e52e568a7d7))
* make privacy page accessible without authorization ([2917133](https://github.com/aeternity/superhero-wallet/commit/2917133c2adf30204e9f2dc2e25a664667e6c6a7))
* remove double icons from pool tokens ([3a83a47](https://github.com/aeternity/superhero-wallet/commit/3a83a47cbe22709546f320650ae0a729403d18a0))
* remove send confirmation modal ([c173a1a](https://github.com/aeternity/superhero-wallet/commit/c173a1addb31b4f76faaec4518a7cd0928eb966b))
* remove SH tipping buttons from third party websites ([4158629](https://github.com/aeternity/superhero-wallet/commit/4158629275f5aa8b13e78d267edc73da898dc0ba))
* reuse listItemWrapper ([121053b](https://github.com/aeternity/superhero-wallet/commit/121053b7b7a02f9bfdf160531019116281638e84))
* **send-modal:** handle payload in query ([daed253](https://github.com/aeternity/superhero-wallet/commit/daed25376113720fb5344c96dbcfc746a312fabc))
* update account selector ui ([9dfe2d8](https://github.com/aeternity/superhero-wallet/commit/9dfe2d8e48920a48b0e2e562680a0b72ec60d34c))


### Bug Fixes

* add missing popup type import to popup handler ([35240d1](https://github.com/aeternity/superhero-wallet/commit/35240d1bb66323caac35d9cc51f5e337b113748b))
* adding Direction constans ([86357b4](https://github.com/aeternity/superhero-wallet/commit/86357b41bb5898716425a0281dd21c0d2fb441d6))
* adjust conditions for bullet switcher resizing and translating ([93283d7](https://github.com/aeternity/superhero-wallet/commit/93283d7657623d7618e6a98d77b39c8bbd7f0b8b))
* app active state & account avatar loading ([4a503a3](https://github.com/aeternity/superhero-wallet/commit/4a503a39266df5f6cd4b250348c48d1a3ccf76b7))
* assign proper routes for ae coin details ([c78f15f](https://github.com/aeternity/superhero-wallet/commit/c78f15f1d5ae40c76e7df3888d3c4e3ad6b2c2d4))
* be able to claim name ([dc4a73f](https://github.com/aeternity/superhero-wallet/commit/dc4a73f090af7c27afe33567bba980e4b170a90c))
* be able to sign message in iframe ([160b325](https://github.com/aeternity/superhero-wallet/commit/160b3254127e5cff107497c52d9b4e6333918643))
* changing solution about scroll top state ([78fe495](https://github.com/aeternity/superhero-wallet/commit/78fe495fd56c61fe7b69229b97636e13d2e4b191))
* display proper recipient for transfer type transactions ([bbfd205](https://github.com/aeternity/superhero-wallet/commit/bbfd2058291cbb8e3f4f3b933812de86416ae1ed))
* display the correct error message while attempting to set a pointer with a low balance account ([b6b79b1](https://github.com/aeternity/superhero-wallet/commit/b6b79b16cb887de443bdaae692451a4b7e9909c0))
* do not save not found page as last route ([8ca1b6b](https://github.com/aeternity/superhero-wallet/commit/8ca1b6b598ed57b1f87c3da1ea728d4c7614fa5e))
* do not save warnings in develop mode ([9108a60](https://github.com/aeternity/superhero-wallet/commit/9108a6096cf515bf1a11257862a5310fef5ca557))
* fix font size of amount, when the text is too long ([25a7d14](https://github.com/aeternity/superhero-wallet/commit/25a7d14a82d16e31d1478f8a9a70a65751a9ddc4))
* hide not found error on pointer update ([510c108](https://github.com/aeternity/superhero-wallet/commit/510c108089e0ca6c4366edf165398c9d24acd5d2))
* include address data in qr code ([18007e5](https://github.com/aeternity/superhero-wallet/commit/18007e56c09a3f6b929c6b7eab7e0d07873bc335))
* open error modal correctly ([419cf05](https://github.com/aeternity/superhero-wallet/commit/419cf05c4015c22e400f6dbd3bfe75d3072193d2))
* **popup:** handle no props correctly ([4b282cf](https://github.com/aeternity/superhero-wallet/commit/4b282cff5238abe12e611bc29d0987469dad9e17))
* refactor transaction list ([a07bd86](https://github.com/aeternity/superhero-wallet/commit/a07bd8612e6c5e842f480a9bc6215fb870ddc216))
* remove buy tokens on ios devices & ios platform detector ([12abc56](https://github.com/aeternity/superhero-wallet/commit/12abc56b0e12409a9dd98553fa0bbfe763a4139b))
* remove jumping address from transfer send modal ([3863cc7](https://github.com/aeternity/superhero-wallet/commit/3863cc71dc7825a76d3ae49f86be3db3031e1f31))
* remove user-select from input field placeholder ([32b94d8](https://github.com/aeternity/superhero-wallet/commit/32b94d8161a4b7e13334a9e0e6b27d9680567c0f))
* **send-modal:** prevent token from being replaced by default value ([ca37f85](https://github.com/aeternity/superhero-wallet/commit/ca37f852b441803907b732e05dc5bcb89a8b4bdd))
* set correct localeDir ([a1589ac](https://github.com/aeternity/superhero-wallet/commit/a1589ac0de017a8ac4eeffa752afab5ee24b05e8))
* show auctions for an existing name correctly ([cf6ee68](https://github.com/aeternity/superhero-wallet/commit/cf6ee68b442f1042249d77d94cdbcfa35a5d59f1))
* show custom avatar ([5646607](https://github.com/aeternity/superhero-wallet/commit/5646607b4fd8d3f43b1ef0f0f579ef373716ff20))
* textarea auto height repairs ([e8039d6](https://github.com/aeternity/superhero-wallet/commit/e8039d61f44e5834c101cc1a40c8d284ff0dd062))
* **tips-claim:** correct spelling error ([147c4aa](https://github.com/aeternity/superhero-wallet/commit/147c4aa7854adeaa32876b079218b0524c7c8cb1))
* **transfer-review:** fit translation in the edit button ([30ea74c](https://github.com/aeternity/superhero-wallet/commit/30ea74c65a42ea5a0b9be085a1c83a41dfa8fdbe))
* update balance correctly on network change ([0d4bdd4](https://github.com/aeternity/superhero-wallet/commit/0d4bdd47d07202fd798dcc3abfb231620d2642ba))
* update coingecko api error handling ([85f3ca4](https://github.com/aeternity/superhero-wallet/commit/85f3ca4157b97f81305a6cc60fbbdd9c2dc1efa0))
* use opacity instead of rgba for icons in btn box ([c765492](https://github.com/aeternity/superhero-wallet/commit/c765492d297046382c34ab34f5596188b6912a63))
* validate input amount correctly ([2a1ba2e](https://github.com/aeternity/superhero-wallet/commit/2a1ba2e662f0f959a3ff366f644669a22a3bc39d))


### Tests

* add get-tx-amount-total ([5aad4fd](https://github.com/aeternity/superhero-wallet/commit/5aad4fd4c036d04308aa28c74f9e13b2437b3423))
* add popup-handler test ([43dc793](https://github.com/aeternity/superhero-wallet/commit/43dc7939c7537296ed02c44d41824bdb57241e1f))
* add transaction-tag-list test ([889f6eb](https://github.com/aeternity/superhero-wallet/commit/889f6ebaf0315c32cfa8cd94a0079289a5a45813))
* adding new transaction types to tests ([93e9580](https://github.com/aeternity/superhero-wallet/commit/93e9580e43cc63e89079fd01dc2b3660e21bfbee))
* fix and enable validate-hash ([f669eba](https://github.com/aeternity/superhero-wallet/commit/f669ebac0d24e596b1bd26a6145452079090f43e))
* remove unused aepp test ([6fb2f41](https://github.com/aeternity/superhero-wallet/commit/6fb2f4105c21bc8dac75d6b265108ee0df8d6fe7))


### Maintenance

* account import page use composition api ([f2c59ae](https://github.com/aeternity/superhero-wallet/commit/f2c59aedeeab0f0134dcf9d4887b34b5242cd965))
* **background:** remove unused functions ([c11b4cf](https://github.com/aeternity/superhero-wallet/commit/c11b4cf50914e539c4357cac634367cf1da7dd79))
* bullet switcher use typescript, composition api and css updates ([247e8e0](https://github.com/aeternity/superhero-wallet/commit/247e8e08368c8afca28e1dd48c124bfc2c6a9222))
* camelcase coingecko market response ([32ae31b](https://github.com/aeternity/superhero-wallet/commit/32ae31be0890e270a210fb3aa0d300134803c2ee))
* coin interface type annotations update ([9743358](https://github.com/aeternity/superhero-wallet/commit/9743358b2f20e26f3740fd1a40f099c299144f6a))
* combine warning/error info ([2d532a0](https://github.com/aeternity/superhero-wallet/commit/2d532a02509c77cbda6f59da80e4a792e7a8cd8e))
* **eslint:** remove unused settings ([adabaab](https://github.com/aeternity/superhero-wallet/commit/adabaab5b11f3d7ea903b5b130e64f7821f02f95))
* **extension:** remove claim attempt on every open page ([76e1420](https://github.com/aeternity/superhero-wallet/commit/76e1420a3053b7760ab2791830765689c12dec2e))
* extract common wording ([111dd1a](https://github.com/aeternity/superhero-wallet/commit/111dd1aa13a4bb2f7036026952e10ad578fad10e))
* **middleware:** use v2 endpoints ([74b3ef1](https://github.com/aeternity/superhero-wallet/commit/74b3ef147ca84e8c0637eedec21ee72f45bbaefe))
* migrate getPopupProps util to typescript ([fce0f4a](https://github.com/aeternity/superhero-wallet/commit/fce0f4a291c1c8d92bfd7aa8de0b2a60552eea36))
* migrate tokens component to ts and composition api ([01ad4b4](https://github.com/aeternity/superhero-wallet/commit/01ad4b42dd6bfcccdae1d9e5376f54067158537f))
* move active account getter to accounts composable ([fce3bd7](https://github.com/aeternity/superhero-wallet/commit/fce3bd7546411d34386875ac483d5950929311a4))
* move helper functions to utils ([5dff271](https://github.com/aeternity/superhero-wallet/commit/5dff2719eb835db0b42a4601abc6107b1bcadbc1))
* move isLoggedIn getter to accounts composable ([7acef24](https://github.com/aeternity/superhero-wallet/commit/7acef24e75abc5506cdc2e8192cf082816ef5211))
* names list use composition api ([a2fa21a](https://github.com/aeternity/superhero-wallet/commit/a2fa21aa1d0c391e360f1f65aadecbd13a9753e5))
* remove ability to share url with wallet ([97fd150](https://github.com/aeternity/superhero-wallet/commit/97fd1502ada9f345b439cdd6691a4160b8391d7e))
* remove payload from the process of creating the invite link ([02f0125](https://github.com/aeternity/superhero-wallet/commit/02f012500c1dca0593771b2cdcca820f99c891af))
* remove redirect chain name feature ([3df0a1d](https://github.com/aeternity/superhero-wallet/commit/3df0a1d9147cd583d880ab8cbf70c447f080bab9))
* remove router vuex syncing ([f27e54b](https://github.com/aeternity/superhero-wallet/commit/f27e54b961cc88633783899a5a13ffb9b9a43a6f))
* remove unnecessary props ([665b0f4](https://github.com/aeternity/superhero-wallet/commit/665b0f4bab38e4d6653074e0a25dc927b36ffbb7))
* remove unused action ([7823699](https://github.com/aeternity/superhero-wallet/commit/7823699c7105d8392d1d8def67b2351cf65c5616))
* remove unused images ([fb46258](https://github.com/aeternity/superhero-wallet/commit/fb46258bf54b2aeca12d494d370ff55d561fa662))
* remove unused openTipPopup ([d6e3772](https://github.com/aeternity/superhero-wallet/commit/d6e3772c522ac00384b6a2009fd78d6aeae3d40d))
* remove unused state variables ([286341a](https://github.com/aeternity/superhero-wallet/commit/286341a1d1e5f7038bcb950896d171c6717694b2))
* remove unused wording ([e3b8f58](https://github.com/aeternity/superhero-wallet/commit/e3b8f58a55a1da4c36e7cfc64eb84e6b6c73a616))
* replace default network constant name ([b72eff3](https://github.com/aeternity/superhero-wallet/commit/b72eff360507ee2601c29565b6179f39db504ee8))
* rewrite tipping contracts to use sdk 13 ([95188e8](https://github.com/aeternity/superhero-wallet/commit/95188e8a68794aafd0102e29f2752387d94c6849))
* **sdk:** move sdk13 to composables ([93fd144](https://github.com/aeternity/superhero-wallet/commit/93fd144c476e9dd91f3f8629c3e1a4939f0ab981))
* **sdk:** use sdk13 instance for spending ae coins ([dbff6b0](https://github.com/aeternity/superhero-wallet/commit/dbff6b0520745df3519dc8c518314a154aed061b))
* set up correct vue-i18n linting ([2b0912d](https://github.com/aeternity/superhero-wallet/commit/2b0912d9a6e2eca2c3673435c39d0566fbdb0509))
* status icon typescript and composition api ([6466509](https://github.com/aeternity/superhero-wallet/commit/64665090d216508eb8a10165dbb0b322d6abd914))
* use composition api to handle modals state ([8ff4619](https://github.com/aeternity/superhero-wallet/commit/8ff461982f88eec97934d5effdc365b7a0a02584))
* use one input amount component ([1f9544e](https://github.com/aeternity/superhero-wallet/commit/1f9544e5c367267bf1252ee89e539270989f97dc))
* use precompiled tipping ACIs ([0ec172c](https://github.com/aeternity/superhero-wallet/commit/0ec172c9cb17288fc0e46d969b3e978e2653b700))
* use typescript no unused vars eslint rule instead of regular one ([e833379](https://github.com/aeternity/superhero-wallet/commit/e833379f42a75852e8f17864f3fd54326cb3fcb8))


### Performance

* disable polling when wallet is not visible ([df6ff31](https://github.com/aeternity/superhero-wallet/commit/df6ff3122fb86fd54c59e18ab0089bb1f98ab0f1))
* faster balances update when changing the network ([f7b2027](https://github.com/aeternity/superhero-wallet/commit/f7b2027a116dde4228f7d9001abab9c90c939179))
* fetch transactions in parallel ([ecba1e9](https://github.com/aeternity/superhero-wallet/commit/ecba1e96164eac0df0253cf9761401ae8acb79e9))
* initialize tipping contracts only if needed ([3552f30](https://github.com/aeternity/superhero-wallet/commit/3552f300d0c1de795edf82d8048e16457f480300))
* load initial info in parallel ([4aecc5e](https://github.com/aeternity/superhero-wallet/commit/4aecc5eb200d74017d4ae161cf6b8004a820553d))
* **popup:** do not initialize sdk ([b3307df](https://github.com/aeternity/superhero-wallet/commit/b3307df14813e5dc23f43dc13a1bce41e843aeb9))
* **popup:** do not load unused info ([7be1b46](https://github.com/aeternity/superhero-wallet/commit/7be1b467a6c5f47a671ee7b69f073f47121fe6e6))
* **popup:** do not set/remove lastRouteKey ([a4053f7](https://github.com/aeternity/superhero-wallet/commit/a4053f7f2c5683a3a7dc106df267fb10dd4274a4))
* **tips-claim:** run backend actions in parallel ([1184ff4](https://github.com/aeternity/superhero-wallet/commit/1184ff4a5e9b064cf932f5454e47a1e45702ad8c))
* use one endpoint to get middleware transactions ([bec74fa](https://github.com/aeternity/superhero-wallet/commit/bec74fa01612c61d4e45665e0facc10258fee7f9))
* use pre-generated ACIs instead of source code ([5e3efe3](https://github.com/aeternity/superhero-wallet/commit/5e3efe314dd0496af1b5b3b5259f8cedf13326f2))

### [1.1.2](https://github.com/aeternity/superhero-wallet/compare/v1.1.1...v1.1.2) (2023-05-23)


### Bug Fixes

* remove buy tokens on ios devices & ios platform detector ([94dc748](https://github.com/aeternity/superhero-wallet/commit/94dc7481a3ff42e0423d82f0df98bdaab4b7a1ab))


### Maintenance

* **send-modal:** support qr code with string parameters ([108cc5b](https://github.com/aeternity/superhero-wallet/commit/108cc5b2eec155ce7ee7f2012e11695ad2c2ad3f))

### [1.1.1](https://github.com/aeternity/superhero-wallet/compare/v1.1.0...v1.1.1) (2023-04-25)


### Bug Fixes

* disable possibility of vault creation with chain name or an url ([b619cbe](https://github.com/aeternity/superhero-wallet/commit/b619cbea2a722ef0c664f36fd834c741f6ede1ab))
* handle insufficient balance issue for every action ([5e39fcd](https://github.com/aeternity/superhero-wallet/commit/5e39fcd14a478c64566f453ac4e5426ca7839c57))

## [1.1.0](https://github.com/aeternity/superhero-wallet/compare/v1.0.2...v1.1.0) (2023-04-20)


### Features

* accounts composable ([b370179](https://github.com/aeternity/superhero-wallet/commit/b370179b3487149b55cd44bcd20e4fda50a5a5ed))
* add colorful border with variable width to avatars ([f1e170a](https://github.com/aeternity/superhero-wallet/commit/f1e170a84bb1f20690b410d5cb4d20bfde28a75f))
* add multisig functionality to composables ([157a2e6](https://github.com/aeternity/superhero-wallet/commit/157a2e64f07d6dcf4f2d33766c41c7aff2c29922))
* add new error message in multisig vault create ([1ca3379](https://github.com/aeternity/superhero-wallet/commit/1ca33793fc3404dad0dad5352afd0b203658bd50))
* add ui for multisig dashboard ([8dcdaab](https://github.com/aeternity/superhero-wallet/commit/8dcdaabe5f14d0d156710ede4cb0995e2d82dd04))
* app connection composable ([3ccb516](https://github.com/aeternity/superhero-wallet/commit/3ccb516062c67bad8033940fc4c4055e05051819))
* assign proper account to a transaction party ([1f5ee54](https://github.com/aeternity/superhero-wallet/commit/1f5ee54493d7118661190a8d5d1a6c82b7d28815))
* calculate multisig creation transaction fee ([a3cba3f](https://github.com/aeternity/superhero-wallet/commit/a3cba3fa9c332c4dae2d39870630557bf8221614))
* change text-input to textarea in vault create form ([210471b](https://github.com/aeternity/superhero-wallet/commit/210471b13fe96e96006ba89907e0a098e3f03652))
* composition api in TransactionList ([034b4c9](https://github.com/aeternity/superhero-wallet/commit/034b4c928d95422fb6a208c66f67fe260d6c5de9))
* custom form select input ([fad9e09](https://github.com/aeternity/superhero-wallet/commit/fad9e09f0d74a8d2b6cf4a4b664d59b62812bf75))
* **dashboard:** add hover to network button ([a8490aa](https://github.com/aeternity/superhero-wallet/commit/a8490aa57730eee10bc4572c175e536bc720f72a))
* dialog box ([8b42bac](https://github.com/aeternity/superhero-wallet/commit/8b42bac3bd06ffe2d26b071ee48621cf96a64e77))
* display error if vault doesn't have sufficient funds ([ee038cb](https://github.com/aeternity/superhero-wallet/commit/ee038cb5531d8c97aadca4273c3cde8555891e05))
* enable card closing on dashboard ([2f5c41d](https://github.com/aeternity/superhero-wallet/commit/2f5c41d4f61da3bb0c6d4622023243134c42b6ca))
* enable preview of freshly created multisig account and tx proposal ([df412a0](https://github.com/aeternity/superhero-wallet/commit/df412a01f1180e2c9b98422a8eded42c1b0e2e65))
* expandable details item ([a00668a](https://github.com/aeternity/superhero-wallet/commit/a00668a60ba577d96cdd77af078b93f6d7f1333a))
* fetch active multisig transactions ([c3679ab](https://github.com/aeternity/superhero-wallet/commit/c3679abb1cdd022a3da607872e8d23fcc4793829))
* form select default styling ([8466da9](https://github.com/aeternity/superhero-wallet/commit/8466da90f90c3a26a6195f332473ca1740763683))
* implement multisig transaction list with pending widget ([22a4792](https://github.com/aeternity/superhero-wallet/commit/22a47925c496db509fde6a223d82d93c83884048))
* impove transactions labels ([4888bc7](https://github.com/aeternity/superhero-wallet/commit/4888bc7b605d0dbee8ad9a4b2a243a7464628d33))
* improve design of multisig details page ([a30412a](https://github.com/aeternity/superhero-wallet/commit/a30412a6ee4796209895952a17899a19018c2dcc))
* move the currencies logic from store to a composable ([d1f48ad](https://github.com/aeternity/superhero-wallet/commit/d1f48adb5f2e1f55b6b00b603b888ac42d64678e))
* multisig details ui changes ([5071dac](https://github.com/aeternity/superhero-wallet/commit/5071dac7fcb778774e32e190a4b91bd824de56e6))
* **multisig:** ability to remove signer when creating the vault ([2a85cd2](https://github.com/aeternity/superhero-wallet/commit/2a85cd21dd8d7a8789dc532d80866fd9f2239195))
* **multisig:** add warning if amount in proposal exceeds vault balance ([4cad71b](https://github.com/aeternity/superhero-wallet/commit/4cad71b4816b753d55985f471f19d61c9fbcb50c))
* **multisig:** auto select first signer as payer ([1be7ee2](https://github.com/aeternity/superhero-wallet/commit/1be7ee24a37c2ac684e98769d9a93440e19248e2))
* **multisig:** create multisig account ([ce85b45](https://github.com/aeternity/superhero-wallet/commit/ce85b45afb0b653de69a482960992435cffa4b03))
* **multisig:** create multisig vault flow ([95e16f7](https://github.com/aeternity/superhero-wallet/commit/95e16f73b562e33738d1289b9753069df5c4c1ec))
* **multisig:** create vault confirmation screen ([73fef1f](https://github.com/aeternity/superhero-wallet/commit/73fef1fcfcddbccb2c3428241d6239ac16f85e20))
* **multisig:** create vault confirmation screen ([e5e4d14](https://github.com/aeternity/superhero-wallet/commit/e5e4d14e7ca7c8241c0a0d18dc46c549b06945de))
* **multisig:** go to multisig vault details after creating it ([7680ae9](https://github.com/aeternity/superhero-wallet/commit/7680ae978b9ea21f0d568babc42760e026d2a647))
* **multisig:** proposal details screen ([36b6e16](https://github.com/aeternity/superhero-wallet/commit/36b6e16780b6e6df17a64d03835b05633d0670da))
* **multisig:** propose tx logic ([e46af6a](https://github.com/aeternity/superhero-wallet/commit/e46af6a38f5d9a5848a12721fc5b7ad019d43dae))
* **multisig:** propose tx ui ([46586bc](https://github.com/aeternity/superhero-wallet/commit/46586bcb82501532092d76f33290bf876cfe43a3))
* **multisig:** transfer receive modal ([e70ff2c](https://github.com/aeternity/superhero-wallet/commit/e70ff2cff6f1ee83d0356d6beb6fe4ce8eaadf14))
* **multisig:** use chosen account to pay for vault creation ([4a7ca1a](https://github.com/aeternity/superhero-wallet/commit/4a7ca1a09e51fe8b63f2f6184ce15e66e5ebf183))
* **multisig:** vault create first signer as account select ([16afb03](https://github.com/aeternity/superhero-wallet/commit/16afb039b2a8c3b0acf697f3377eedb88d52875a))
* **multisig:** vault create progress text update ([21123ea](https://github.com/aeternity/superhero-wallet/commit/21123ea10d8b6e5085b6f80497422e63d33e725a))
* **multisig:** vault only one signer required ([deb2bac](https://github.com/aeternity/superhero-wallet/commit/deb2bac7f9ced458687373fa285ba70d5a10812c))
* **name-item:** add BtnHelp if no pointer set ([0a0027c](https://github.com/aeternity/superhero-wallet/commit/0a0027c343be7b9657a992f1f1c7ee45327acd70))
* notFoundPage change button color ([f9d38c1](https://github.com/aeternity/superhero-wallet/commit/f9d38c1916a7997fb9a65a92b2b77f3a3849a023))
* notFoundPage change button color ([c0fe250](https://github.com/aeternity/superhero-wallet/commit/c0fe250a3c2ae3034fab914fc432c619e447f1c9))
* notification page empty message ([fecc953](https://github.com/aeternity/superhero-wallet/commit/fecc9532e5b60b79881587f8ca5cb603ec2b18a3))
* paying for mutisig tx types handler ([b508802](https://github.com/aeternity/superhero-wallet/commit/b50880207aa24237895734384581a6efe93695eb))
* prevent creating vault with account that has no balance ([fd4282b](https://github.com/aeternity/superhero-wallet/commit/fd4282b69084af99c9f32b6f6e0e829a21f38acb))
* redirect to 404 when transaction is not found ([4f41be9](https://github.com/aeternity/superhero-wallet/commit/4f41be9ebb9040810b7ed9036115a320afa93353))
* refactor accountDetails filter and navigation ([cfd8f11](https://github.com/aeternity/superhero-wallet/commit/cfd8f110fc99f39d1b98738d33c61034a57c16a9))
* refactor multisig navigation ([b0e2962](https://github.com/aeternity/superhero-wallet/commit/b0e2962b9b14eb92f2f997530bef576239daf4f4))
* refactor network components to composition api ([ec0c930](https://github.com/aeternity/superhero-wallet/commit/ec0c930f612b93c74f16eec5008d23fb6552aae2))
* replace AddressShortening component with AddressTruncated ([275df03](https://github.com/aeternity/superhero-wallet/commit/275df03feb24f96c17494a756116eac79f4d70ec))
* separate add multisig vault from add account card ([0a83f34](https://github.com/aeternity/superhero-wallet/commit/0a83f34151762c02f91144192e1c97b23aafb229))
* show latest multisig proposal status ([4ab3bc7](https://github.com/aeternity/superhero-wallet/commit/4ab3bc787eb9dff9bba27d71e01c89d463a8f485))
* show related multisig coin details ([b5dccbc](https://github.com/aeternity/superhero-wallet/commit/b5dccbc6c706b7be44298cc5d566275fac2c3214))
* support GAMetaTx transactions ([45e25b1](https://github.com/aeternity/superhero-wallet/commit/45e25b1f1dffdc2d15ac33d8308ef18c9102316d))
* transaction item and latest transaction ([58db736](https://github.com/aeternity/superhero-wallet/commit/58db7362dfceedbe97faeb156e695148689335db))
* update CommentNew page ([ea70257](https://github.com/aeternity/superhero-wallet/commit/ea70257dabf35baafe830376913a41ef1d8c9f20))
* update styling of token list item ([a7318da](https://github.com/aeternity/superhero-wallet/commit/a7318dade9dcb8d3ff7887c53a626636e5fcff7f))
* use consensus label component instead of function ([a8b1153](https://github.com/aeternity/superhero-wallet/commit/a8b11531b0251ae5cbf0da8d669902dd06e8a8fc))


### Bug Fixes

* account details tokens margins ([36fcd67](https://github.com/aeternity/superhero-wallet/commit/36fcd673e4268bfb8f0aeb15964dccb00fa15411))
* add missing multisig account address ([1de3d83](https://github.com/aeternity/superhero-wallet/commit/1de3d83f20fe72e47cc0bab0acf53cfa8546090f))
* add new comment correctly ([6917572](https://github.com/aeternity/superhero-wallet/commit/6917572c726c715b7f1d2acd93f428f9724b079f))
* add payload to a fee calculation ([6b4db00](https://github.com/aeternity/superhero-wallet/commit/6b4db001462beb2f4cbec04aefe386ed8b90c565))
* aens button sizes on ios ([beb97c5](https://github.com/aeternity/superhero-wallet/commit/beb97c5c2c9e7ba7995d6056aed06cb4a73c97d5))
* amount input number transformer ([3174df2](https://github.com/aeternity/superhero-wallet/commit/3174df22d69199f9dbad6eb75737b3865e96e618))
* apply correct border color for verified url ([1e0f64b](https://github.com/aeternity/superhero-wallet/commit/1e0f64bf2eba7bd9db77742b0e2f8ae287657099))
* avoid multiple composable polling when switching views ([9a24d93](https://github.com/aeternity/superhero-wallet/commit/9a24d93ab0f04df204a540a8664c1833d8865308))
* back button logic ([7ae784c](https://github.com/aeternity/superhero-wallet/commit/7ae784c6157c5bdb201202b8bc2d42ae17ca4fce))
* be able to claim tips ([b6e3a0f](https://github.com/aeternity/superhero-wallet/commit/b6e3a0f7c81dc4c9d9fdbcf1f308f426a24bc035))
* calculate animation speed ([cd9d6f4](https://github.com/aeternity/superhero-wallet/commit/cd9d6f44226a0ba05d8769fdbfb2d91755e94971))
* calculate max amount on transferData change ([0d20ecd](https://github.com/aeternity/superhero-wallet/commit/0d20ecdbba334aa8d770f9760e18ac522dc768b9))
* calculate name claim fee correctly ([efae9fe](https://github.com/aeternity/superhero-wallet/commit/efae9fe6b0e66d3445c875d209cca5502c4fd0de))
* calculate totalAmount correctly ([09febf5](https://github.com/aeternity/superhero-wallet/commit/09febf5613e5c4eaa2a99c9db6ca2b65f6861fca))
* calculate transaction direction correctly ([b81aeff](https://github.com/aeternity/superhero-wallet/commit/b81aeff74fe5a6ce95be890d4ce8fd24486e916a))
* change drySdk network on network change ([dfa7d88](https://github.com/aeternity/superhero-wallet/commit/dfa7d887e4778db56f2cdbefc500336d8d215907))
* changes in Truncate component animation ([e5d24e1](https://github.com/aeternity/superhero-wallet/commit/e5d24e1538ba49efddc35101395ffc9da101d4eb))
* confirm local tx ([60a2b93](https://github.com/aeternity/superhero-wallet/commit/60a2b93c2423b70388064fc1f06668684c8239be))
* **confirm-transaction-sign:** show token amount correctly ([2248bfe](https://github.com/aeternity/superhero-wallet/commit/2248bfeacee9d9a3112e41380209bb7b76d4d06f))
* correctly determine DEX transactions ([aab4af6](https://github.com/aeternity/superhero-wallet/commit/aab4af61797b4de7d60bdbe6ef2b2067c4145941))
* design discrepancies on account details ([9714879](https://github.com/aeternity/superhero-wallet/commit/971487920ff1c4beba366e5d8799b0a1d693d343))
* do not lose precision during sending ([4812c2c](https://github.com/aeternity/superhero-wallet/commit/4812c2c0690394fa19af466087c321da119b42ee))
* error handler ([f8c1ea6](https://github.com/aeternity/superhero-wallet/commit/f8c1ea6afc384d8379fe069c0844b76a2ae39f75))
* fetch all endpoint pages correctly ([5979d89](https://github.com/aeternity/superhero-wallet/commit/5979d89d069ace9402746c1e9aa3d518a2bbc0f8))
* fetch multisig proposal for syncing vault ([e409720](https://github.com/aeternity/superhero-wallet/commit/e409720064f7000a6d14d6666c12cb7ad78eb727))
* firefox & safari input validation ([b8840cc](https://github.com/aeternity/superhero-wallet/commit/b8840ccc687161fd6495e0c5d3683ba04a0cbd8e))
* fix initial amount calculation in maxAmount.ts ([4064b0d](https://github.com/aeternity/superhero-wallet/commit/4064b0d0bf6ce108d47e6f4420374af399a0afe9))
* fix multisig address in transfer review ([5610bd4](https://github.com/aeternity/superhero-wallet/commit/5610bd46054b72660430a8d7ee5e9c040a965f94))
* fixing clientWitdh issue ([62365ed](https://github.com/aeternity/superhero-wallet/commit/62365ed62ae71559604a749365b35dfe57e6dd6b))
* fixing textarea auto height ([b8bc2e9](https://github.com/aeternity/superhero-wallet/commit/b8bc2e923837a4f97aee9b7054bdd69ebb54bb7e))
* fixing truncate text animation ([de27fe9](https://github.com/aeternity/superhero-wallet/commit/de27fe9328a5d2a5992808c97c60563c6fcbb7a2))
* **fungible-tokens:** handle no tokens correctly ([ef8fb7f](https://github.com/aeternity/superhero-wallet/commit/ef8fb7ffdecda187475d340a5f300c6c2a5fe743))
* handle nonce error gracefully in multisig accounts ([1c8cc6d](https://github.com/aeternity/superhero-wallet/commit/1c8cc6dfd1126e477656b27c726170b9811544fa))
* handle pending transactions correctly ([88eae9f](https://github.com/aeternity/superhero-wallet/commit/88eae9f1358837597851f3fbb52eb46235cbb9df))
* handle unsupported tx types correctly in the popups ([abb1657](https://github.com/aeternity/superhero-wallet/commit/abb1657fcc1074c5004546498b4aed9f4fc40048))
* handle wrapper transactions correctly ([ff1a3a9](https://github.com/aeternity/superhero-wallet/commit/ff1a3a966dc60c5602fbea7e3fb919806d3dd74f))
* icon styles issues ([58efec5](https://github.com/aeternity/superhero-wallet/commit/58efec5cb76e34b5c375374f0191d68b3e796cdc))
* improve default vault selection time ([115b313](https://github.com/aeternity/superhero-wallet/commit/115b313929f8cb9bcc3fc64985e41cd6a8d97f18))
* **index:** add Platforms only in web ([5a30ff1](https://github.com/aeternity/superhero-wallet/commit/5a30ff1c54d39d41bb6f2dc0aea6cbe9e900c4e8))
* **invites:** validate amount input ([780b5cf](https://github.com/aeternity/superhero-wallet/commit/780b5cf4b55ac09b5c0ffcea488bdeed51507f61))
* latest transaction correctly showing the order ([316adcd](https://github.com/aeternity/superhero-wallet/commit/316adcdd60cbf4e963b9179f0acebc025a8dcb62))
* latest transaction showing correctly direction ([4388b8b](https://github.com/aeternity/superhero-wallet/commit/4388b8b9ee38452a9dbc62b77233c14bde136130))
* list item hover effect on mobile ([8c7b716](https://github.com/aeternity/superhero-wallet/commit/8c7b7168e878c8f6ca49653a6d4a67b57ea7ed72))
* load aeternity data correctly ([05bc302](https://github.com/aeternity/superhero-wallet/commit/05bc3021b8e4b6b24ade16ebaf8ee2dd9cf091ce))
* load transactions on scroll ([49f0ef6](https://github.com/aeternity/superhero-wallet/commit/49f0ef606f3239d60a3e36e0d3977e8dff541066))
* long names on send and receive modals ([2990a56](https://github.com/aeternity/superhero-wallet/commit/2990a56a99f1122215fb1b8746ed4ebe630de6ee))
* middleware watcher in names vuex module ([a00e040](https://github.com/aeternity/superhero-wallet/commit/a00e0402d8ef19e733ebcc76a510719e0d9a4a25))
* missing revoke button on proposal details ([50b91ba](https://github.com/aeternity/superhero-wallet/commit/50b91baa3ac4509a3eedc7b5e5a961eb7c439122))
* mobile safe area ([f5d0fa6](https://github.com/aeternity/superhero-wallet/commit/f5d0fa6678c6076c539b750151e241630b474a5e))
* multisig assets list ([4fd552f](https://github.com/aeternity/superhero-wallet/commit/4fd552f1b53e0237d45c1d94b4e1ee287e7d4122))
* multisig proposal consensus icons alignment ([c49c208](https://github.com/aeternity/superhero-wallet/commit/c49c208ea14da18c166385b723fbd63e23f264d9))
* multisig transaction details fee label ([4d73141](https://github.com/aeternity/superhero-wallet/commit/4d731412818c6bb12731f0980163319f6a3f94be))
* **multisig-details:** show correct consensus info ([b98d3af](https://github.com/aeternity/superhero-wallet/commit/b98d3af2cca04bacd7980575b224258b3c541e1b))
* **multisig-proposal:** change address to gaAccountId ([4eb2dd8](https://github.com/aeternity/superhero-wallet/commit/4eb2dd8afee588479c58de74505fba0ddc43d6a4))
* **multisig:** apply correct pending transaction logic ([fa502f1](https://github.com/aeternity/superhero-wallet/commit/fa502f1d15bb50de793587b438b7e32a3d4eafbb))
* **multisig:** be able to send a transaction ([1a0b40c](https://github.com/aeternity/superhero-wallet/commit/1a0b40c3c8bd0d7fa1dd2894ebafa989dd73eeef))
* **multisig:** handle not enough ae to propose ([78b29d3](https://github.com/aeternity/superhero-wallet/commit/78b29d3ea7e1544161dc54fd75c1deaeb9345c04))
* **multisig:** m of n signers selection ([40885ea](https://github.com/aeternity/superhero-wallet/commit/40885ea772acde319209fd209826c876a6267198))
* **multisig:** propose transaction wording fixes ([5c84a7f](https://github.com/aeternity/superhero-wallet/commit/5c84a7f2e4e2de2b88c95ade5765af191ba73a18))
* **multisig:** show correct copied text ([b64571a](https://github.com/aeternity/superhero-wallet/commit/b64571a02bfb2ab63e8b457334d0632dc05b36bf))
* **multisig:** show label for all user accounts in the vault details page ([0e1e2d3](https://github.com/aeternity/superhero-wallet/commit/0e1e2d31cc2922d0feac9a00cdf8e986b9b0d643))
* **multisig:** show only transactions related to account ([80a3bc2](https://github.com/aeternity/superhero-wallet/commit/80a3bc264e2b0978a05b4805d08f46886426ef7c))
* **multisig:** validate proposal correctly ([dafd62f](https://github.com/aeternity/superhero-wallet/commit/dafd62ffb94dafcfd86136f1f776431ac3b538d7))
* **names:** be able to autoExtend names ([6694f07](https://github.com/aeternity/superhero-wallet/commit/6694f078b8c8e47738c2356a29f61bf5a450b167))
* open modals with a preset token correctly ([466c841](https://github.com/aeternity/superhero-wallet/commit/466c841ef348570dfa537fea809e4519022cf033))
* open transfer send on query change & fix token select from link ([7cb53b0](https://github.com/aeternity/superhero-wallet/commit/7cb53b003558726308f862d4eaa3111919bc7da1))
* proper typing for ae token balance ([d432ff9](https://github.com/aeternity/superhero-wallet/commit/d432ff9180c4136f8f80db3090b95db17fcc4077))
* provide a required app prop to a confirmRawSign ([96e51d2](https://github.com/aeternity/superhero-wallet/commit/96e51d2d26ad8603309d8a5f1b797acc225139f8))
* provide missing store argument to the useSdk composable ([657bcbc](https://github.com/aeternity/superhero-wallet/commit/657bcbcadc02abc60f9d2057fcfaf45e9f928cca))
* remove additional 3 dots in transaction label ([982d34f](https://github.com/aeternity/superhero-wallet/commit/982d34f062119f39260b9567fa9e970592422a6e))
* remove excessive spacing in header ([a819c67](https://github.com/aeternity/superhero-wallet/commit/a819c67bd8f95ff093f5fe9e55997ae60a8db676))
* remove names for account wrapper views ([61042c1](https://github.com/aeternity/superhero-wallet/commit/61042c164c102d136ae2a4209fedda4cb6ec48a8))
* remove syncing multisig vault from another network ([49da939](https://github.com/aeternity/superhero-wallet/commit/49da939b54d29958a46ab87fc91119ea433b5951))
* remove terms navigation bug ([1a1b61c](https://github.com/aeternity/superhero-wallet/commit/1a1b61cb02f0c9e503c6ae233236528c6094c5c6))
* removed problem with multiple Transition children ([4b12733](https://github.com/aeternity/superhero-wallet/commit/4b12733f966d124b8ec00989b16ac365fbf81b30))
* resolve problem with filter in assets select ([1bae1b0](https://github.com/aeternity/superhero-wallet/commit/1bae1b097406b7e4682e250fb238571272633d1d))
* restore correct multisig accounts and active multisig id on network change ([c8dec64](https://github.com/aeternity/superhero-wallet/commit/c8dec64bb7918ade1d9354e6dc7eb7ff1d39a0d8))
* **retip:** allow only ae ([28ac878](https://github.com/aeternity/superhero-wallet/commit/28ac878eb50fe125b3371ba23e1631f4d2a8cbaf))
* **route:** set scroll position to 0 for every page ([f498e30](https://github.com/aeternity/superhero-wallet/commit/f498e3030f9ff7e261bdd7dac5ff87cdd2da5faf))
* scrollbars visibility in firefox ([1b44c2a](https://github.com/aeternity/superhero-wallet/commit/1b44c2a58a248dd5bbc61c7f366b70aa1bc9c67c))
* select assets list should be scrollable on safari ([1e8c565](https://github.com/aeternity/superhero-wallet/commit/1e8c5657f94bf000a358795b4c486ecc60db16f8))
* **send-modal:** show correct error on token 0 balance ([1167e2c](https://github.com/aeternity/superhero-wallet/commit/1167e2c1b203a960f1155073351cfb1ea2a120ce))
* set a proper url for a connected aepp ([2823f36](https://github.com/aeternity/superhero-wallet/commit/2823f3634e3c00631fd75328f78b19e7ddf074ac))
* set correct fallback route ([7a70546](https://github.com/aeternity/superhero-wallet/commit/7a7054618bb9b46feb53d345fe73961e6a801dc2))
* set correct labels for a spend transactions ([7829969](https://github.com/aeternity/superhero-wallet/commit/782996967716427fd33950b1e64c32da05b6f797))
* set default name only if it points to current account ([c1fb03a](https://github.com/aeternity/superhero-wallet/commit/c1fb03aeee92e05f1fe32fbc550ed897fc511a6f))
* show asset selector correctly on firefox ([547a003](https://github.com/aeternity/superhero-wallet/commit/547a003f97694832d14379e18056c499d9b7ffab))
* show correct amount for incomplete transactions ([04b7715](https://github.com/aeternity/superhero-wallet/commit/04b77150ed1f92b97a1b18170dee80cfdc0c8937))
* show correct label for vault creation transaction ([1128c10](https://github.com/aeternity/superhero-wallet/commit/1128c1029353261d800873a446a694898da7218e))
* show correct labels for spend transactions ([e157ee6](https://github.com/aeternity/superhero-wallet/commit/e157ee661051af21987230d934394fdfc2fd6eb9))
* show correct spend amount in SpendSuccess modal ([b58c34a](https://github.com/aeternity/superhero-wallet/commit/b58c34ad57a71e13eb2773825401318f4d6a5d58))
* show correct subtitle for multisig send and receive buttons ([b6167e1](https://github.com/aeternity/superhero-wallet/commit/b6167e1a1bf1d30a966c6e25ef744be2ecbbfce2))
* show proper transaction direction for transaction owner ([a21d708](https://github.com/aeternity/superhero-wallet/commit/a21d708e4ce72671aa6163974f7abcc7283fcdfb))
* show total multisig amount correctly ([54bc99a](https://github.com/aeternity/superhero-wallet/commit/54bc99a07bfa9cbd6ddb1afafb2d86902f30295f))
* show transactions only for current account ([63122ad](https://github.com/aeternity/superhero-wallet/commit/63122ad02800a7919ab488cdaef748959f47a95b))
* **spend-success:** use correct prop type ([75b52c5](https://github.com/aeternity/superhero-wallet/commit/75b52c5b27a4dc5ae7d7eea173d3786d524863a3))
* stop transactions polling onUmnounted ([e0505ca](https://github.com/aeternity/superhero-wallet/commit/e0505cace995a70f3d80ad6885bbb89c9a7479d3))
* styling of number select ([990e306](https://github.com/aeternity/superhero-wallet/commit/990e306d9283567c2382ade1f515396165dbed8a))
* swap route lines thickness ([dedefcb](https://github.com/aeternity/superhero-wallet/commit/dedefcb033dd55408ed806bc7f90a901a992b6d4))
* text shrink utility helper ([a5904d3](https://github.com/aeternity/superhero-wallet/commit/a5904d39f76dca2cd80481ef28d3b95f784466de))
* token list margins ([e5ad67e](https://github.com/aeternity/superhero-wallet/commit/e5ad67e5eec0627ae018268a2df45b14c163a8c7))
* transaction labels not loading properly ([d8efac1](https://github.com/aeternity/superhero-wallet/commit/d8efac102ce0d917ac078c2bc26f2815a3f9e6ae))
* transaction sorting ([dc75103](https://github.com/aeternity/superhero-wallet/commit/dc75103262a1361e7196eeb58923c768f27dc2a6))
* **transaction-details:** do not show empty tag ([9f97f63](https://github.com/aeternity/superhero-wallet/commit/9f97f633de78408c5bc2c95e6cc359c926ff3066))
* **transaction-details:** show error uncropped ([ade2476](https://github.com/aeternity/superhero-wallet/commit/ade2476b6a1b1a426a8094f09e1e70fe506baaf7))
* **transaction-details:** show transaction tokens correctly ([1c4df84](https://github.com/aeternity/superhero-wallet/commit/1c4df847a5c0a5a70978feed8c4597986bf742ce))
* **transaction-displaying:** show an actual avatars of participants ([f90d246](https://github.com/aeternity/superhero-wallet/commit/f90d2461025b6abb33f3e709292a3d0335b4d229))
* **transaction-item:** add missing icon ([3e2700e](https://github.com/aeternity/superhero-wallet/commit/3e2700eddbce62365f31564b61a43565f9e957b9))
* **transaction-item:** show labels correctly ([45b1d3f](https://github.com/aeternity/superhero-wallet/commit/45b1d3f865bcb981aca852576135d2cb23d8f19e))
* **transaction-tag-list:** be able to show custom tag ([5d47156](https://github.com/aeternity/superhero-wallet/commit/5d4715661d3284bb4c6111e95cf964db0753a297))
* **transactions:** apply correct filter logic for pending transactions ([64b69c5](https://github.com/aeternity/superhero-wallet/commit/64b69c53aaac7c4438468f1e46f9fedf213f9268))
* transfer send payload info modal translation ([50114ef](https://github.com/aeternity/superhero-wallet/commit/50114ef8a9ace8a28056a7ce9eacbc76ab222957))
* **transfer-receive:** set correct button styles ([7faa15e](https://github.com/aeternity/superhero-wallet/commit/7faa15e0ce6ad681b1ef6cd01ca55ba3f6f96599))
* **transfer-review:** show fiat value ([633312a](https://github.com/aeternity/superhero-wallet/commit/633312abd5804950f10576bc826718a3e950914f))
* **transfer-send:** disable next button on error ([f476889](https://github.com/aeternity/superhero-wallet/commit/f47688917f5012bbda8a707efb51c8edde20dcaf))
* **transfer-send:** handle uknown url status correctly ([26b9a9b](https://github.com/aeternity/superhero-wallet/commit/26b9a9bd91673dd4ce109a08861bb35740ee62c5))
* **transfer-send:** limit asset select to ae only ([054af8c](https://github.com/aeternity/superhero-wallet/commit/054af8c605fcd88f87698daf89dbcb6763afff01))
* truncate long names in vault creation review ([ac72800](https://github.com/aeternity/superhero-wallet/commit/ac7280032eb40ec6b872b0e886fb00f111b0ea0c))
* unnecessary fetching of latest transactions ([76c8246](https://github.com/aeternity/superhero-wallet/commit/76c8246d75f2f932f17b96ec09d1b135997a1c69))
* update latest transactions on token balance change ([a3b23a3](https://github.com/aeternity/superhero-wallet/commit/a3b23a3e29ac9f3a725e05dc210e3883ab36b6b0))
* update multisig proposal modal ([bd6340b](https://github.com/aeternity/superhero-wallet/commit/bd6340b19872fa869fd86ab0011124cae4c85da3))
* update warning color ([adb8f08](https://github.com/aeternity/superhero-wallet/commit/adb8f086407e47b79fddbcbc3e4a55f15cf115e5))
* url parser in permission manager ([b338b04](https://github.com/aeternity/superhero-wallet/commit/b338b0457fb5d51e753b741eba637c950a1d5250))
* use correct value for a minTipAmount validation ([baa642b](https://github.com/aeternity/superhero-wallet/commit/baa642b57952ee0bd50b8894411da65ec807b46a))
* use different prop for a custom title ([02ca507](https://github.com/aeternity/superhero-wallet/commit/02ca507c18041f2ff8272e35215ccdadb69633ea))
* welcome screen paddings ([e6264d3](https://github.com/aeternity/superhero-wallet/commit/e6264d30fb3dfa500cdf5166dbd5d3486811e415))
* wrong coin details route name ([f58e536](https://github.com/aeternity/superhero-wallet/commit/f58e5369ac7d9800d7306a7bf6a70946cded7ba4))


### Tests

* avoid overloading external services with requests ([aa852fa](https://github.com/aeternity/superhero-wallet/commit/aa852fa649a0a13deffb08038677492b413f8ddf))
* fix and enable withdraw test ([1ae9243](https://github.com/aeternity/superhero-wallet/commit/1ae9243ef216612dc4565735ec1b4632173bb2a0))
* **other:** enable pending transaction tests ([0186821](https://github.com/aeternity/superhero-wallet/commit/01868210c45aa9b13054381a995e2d960dc73b93))
* **other:** test the existing routes ([4e8d4ea](https://github.com/aeternity/superhero-wallet/commit/4e8d4ea5a55923686f18983470d185fc67afa4bd))


### Maintenance

* add types to categorizeContractCallTxObject util function ([4854c12](https://github.com/aeternity/superhero-wallet/commit/4854c1266fc949d18f0f08b6ab3a66d27ee40161))
* adjust label logic ([ea4b394](https://github.com/aeternity/superhero-wallet/commit/ea4b39459517e1b63d5a7857ececc1b9dc8fd590))
* buttons and table rows color unification ([e36da9c](https://github.com/aeternity/superhero-wallet/commit/e36da9c2ddedd26cf959213f8015d884b8c53a3e))
* common way of calculating readable fee from a value ([f8a281b](https://github.com/aeternity/superhero-wallet/commit/f8a281b274bf95758885f0d3486bd5e934970a63))
* convert components using balances to Composition API ([278c6cf](https://github.com/aeternity/superhero-wallet/commit/278c6cffc6ea02f772c019f7b29cd76e22b37873))
* convert name auction components to Composition API and TypeScript ([05fd6f9](https://github.com/aeternity/superhero-wallet/commit/05fd6f9cd1ab99d5a97b15bac33432f2f5f5ee18))
* exclude DEX transactions from Out ([654a362](https://github.com/aeternity/superhero-wallet/commit/654a362c90aac278292da9988bafc5c6b9fdce50))
* implement method to sign from non active account ([18cd8bf](https://github.com/aeternity/superhero-wallet/commit/18cd8bff3cb5989eabba2f9be51b488f84512b3b))
* input field message property interface ([612e91f](https://github.com/aeternity/superhero-wallet/commit/612e91f360047618f9029aa701f0dd0216f2de31))
* **middleware:** remove unnecessary workarounds ([e7e5bcc](https://github.com/aeternity/superhero-wallet/commit/e7e5bcc7b4bd7532f0e55d2e41aa7cef626fcddd))
* move formatNumber store getter to utils ([9bbf1d2](https://github.com/aeternity/superhero-wallet/commit/9bbf1d2ff6c0e4806be9037d49940ab507e6485f))
* move getTxTipUrl store getter to utils ([f55bb07](https://github.com/aeternity/superhero-wallet/commit/f55bb070087ed96598a1b85a3dd7e5e4fcfcb0a0))
* move getTxType function from the store to the utils ([ba83b7f](https://github.com/aeternity/superhero-wallet/commit/ba83b7f2adc6803bfb041dd842eaa7456a12c975))
* move isTxAex9 store getter to utils ([987fbfb](https://github.com/aeternity/superhero-wallet/commit/987fbfb000bb7264d9bdef3e8dc04a08a2caf705))
* move the middleware initiation logic from the store to a composable ([9689b07](https://github.com/aeternity/superhero-wallet/commit/9689b07cd2f8d16b507d8f8590fd480a3fa8b6a0))
* **multisig:** add polling height and verify polling results ([8159287](https://github.com/aeternity/superhero-wallet/commit/815928745e4b9a485adc5a31a15b77b7f870c8e9))
* **multisig:** adjust account filtering logic ([eb6f399](https://github.com/aeternity/superhero-wallet/commit/eb6f3992f56a02b1d5dfc35afc06d8f5dc9bf304))
* **multisig:** avoid dependency on obsolete http compiler ([f7b25ca](https://github.com/aeternity/superhero-wallet/commit/f7b25cae36b73c67227106a8dbbe21a6a4488e35))
* **multisig:** disable create multisig button till pay for transaction is ready ([884643b](https://github.com/aeternity/superhero-wallet/commit/884643b50ce6a2443c22d304eba9bfb626e36844))
* **multisig:** set expiration of proposal to a day ([2c795e9](https://github.com/aeternity/superhero-wallet/commit/2c795e948eae09c51a36c8acd6b5ffa07c4ac478))
* **multisig:** sign vault creation without switching active account ([d783345](https://github.com/aeternity/superhero-wallet/commit/d7833459576339de857f8ada43c8ac546009c78b))
* **multisig:** sort by date if other conditions are similar ([8effbc2](https://github.com/aeternity/superhero-wallet/commit/8effbc2ba4aec4c26ba00f0f24a1c9b4af2b037b))
* **multisig:** support multiple vault creation ([1723640](https://github.com/aeternity/superhero-wallet/commit/1723640b4a24cfa22b6fa6eef8db22a1c0af4c25))
* **multisig:** use signers length and remove duplicate method" ([9a72d39](https://github.com/aeternity/superhero-wallet/commit/9a72d39fe18834fd975be4bb743e7c86afd68e84))
* **name-item:** adjust wording ([6415e5a](https://github.com/aeternity/superhero-wallet/commit/6415e5a08fed05e16fe5d796d9eeb48c7f2b36c8))
* **name-item:** focus on set pointer input ([c6400bc](https://github.com/aeternity/superhero-wallet/commit/c6400bcfa5471b424ebb85f4debfa0a428f9b991))
* **name-item:** set correct expand, collapse logic ([9afee20](https://github.com/aeternity/superhero-wallet/commit/9afee2083a022b3ebe6fb7bba5ae95ac30548cba))
* **refactor:** tx function types ([8f8ac6d](https://github.com/aeternity/superhero-wallet/commit/8f8ac6d3765c759797ec19647d1839fb938da75e))
* **release:** 1.0.2 ([54531fa](https://github.com/aeternity/superhero-wallet/commit/54531faa179ba2d444df7f26943a8b4069097400))
* remove approx sign from formatted amount ([d27c198](https://github.com/aeternity/superhero-wallet/commit/d27c198db4251603aab93ecfbe8416be9a008544))
* remove duplicated font face mono 16 ([4a69023](https://github.com/aeternity/superhero-wallet/commit/4a6902350811cc9bacb13b5dabbecf3e7322911e))
* replace popups mixin with composition api and add types for transaction resolvers ([fdc4e60](https://github.com/aeternity/superhero-wallet/commit/fdc4e6066911876ca1f8ed1be3983a0b6273e5b0))
* replace RxJS with Vue Composables ([d99efe7](https://github.com/aeternity/superhero-wallet/commit/d99efe79db83875ab49b8720d7a0b2fe9ea80df9))
* show transactions sent to yourself as spent ([4e2622a](https://github.com/aeternity/superhero-wallet/commit/4e2622ae7b98d71204c06f620687f3e3d759bf83))
* unify pending transaction amount structure ([046c00f](https://github.com/aeternity/superhero-wallet/commit/046c00f6f94af41f0c3ff6213f02110c59b79ef4))
* use composition api in avatar component ([53cae4d](https://github.com/aeternity/superhero-wallet/commit/53cae4d3597d3a65f7d0666fc84dd813be8223d2))
* use default interface for composables ([ffb9a4c](https://github.com/aeternity/superhero-wallet/commit/ffb9a4c399a3a5ffd57be00c380c671440f80012))
* use one component to sign messages ([9e31f95](https://github.com/aeternity/superhero-wallet/commit/9e31f950d30e67738293e2d3d65d41c3d55b5b0f))
* use the correct name structure ([1658350](https://github.com/aeternity/superhero-wallet/commit/1658350ebbc9f8d358af836c09620dd17fde0996))
* use topHeader composable data in multisigTransactions to fetch the top block height ([3f62d8f](https://github.com/aeternity/superhero-wallet/commit/3f62d8f07a00ad1043fd2670e26755c0352ff781))
* use TypeScript in the Filters component ([0bc3888](https://github.com/aeternity/superhero-wallet/commit/0bc38881de519d822334dd8ed647719dc9754c4a))


### Performance

* do not update token blance if AE is chosen ([f863336](https://github.com/aeternity/superhero-wallet/commit/f8633362e00765872b0148717bd87752632c80e5))
* **fungible-tokens:** speed up tokens loading on middleware initialization ([59ee80b](https://github.com/aeternity/superhero-wallet/commit/59ee80b9df484dfa276087f683f80bd56ce5179f))
* improve tip withdrawn transaction fetching ([7f49a7b](https://github.com/aeternity/superhero-wallet/commit/7f49a7bcedbecd6c156498233838bb111901f24f))
* keep the latest transactions state when navigating ([4eeaed3](https://github.com/aeternity/superhero-wallet/commit/4eeaed3adcb3fb6e1e66ac3dcaed30485c767df7))
* **latest-transactions:** fetch only latest tip withdrawn transactions ([e73097a](https://github.com/aeternity/superhero-wallet/commit/e73097a89b737eacae5bb2b5180afa53456354ba))
* **multisig:** dry-run additional info only on demand ([f9e5c18](https://github.com/aeternity/superhero-wallet/commit/f9e5c1836607dcb5f05c61c7e171a6df24e1f0cc))
* **multisig:** filter out multisigs with unsupported version ([937cae0](https://github.com/aeternity/superhero-wallet/commit/937cae04b0b2b682cca56f74081e2e2ea6c42b8f))
* **multisig:** load immutable data only once ([ac03adf](https://github.com/aeternity/superhero-wallet/commit/ac03adf27f488737d79217752381335075e60099))
* **multisig:** remove unnecessary dry-run ([8844e5f](https://github.com/aeternity/superhero-wallet/commit/8844e5f4aea13ebb3fa37a4cf6b522c43e9246dc))
* **multisig:** remove unnecessary dry-runs needed to fetch transaction ([97ee217](https://github.com/aeternity/superhero-wallet/commit/97ee2172149a042083dc6b486e82a78708a0395d))
* poll multisig accounts only if necessary ([284ff51](https://github.com/aeternity/superhero-wallet/commit/284ff51e59de2688097f6264320c913445dcfed8))

### [1.0.2](https://github.com/aeternity/superhero-wallet/compare/v1.0.1...v1.0.2) (2022-12-22)


### Features

* add ability to send transactions with a payload ([200a906](https://github.com/aeternity/superhero-wallet/commit/200a9064a5fd2dcf336334e758d8daaabdd0cfff))
* change back button logic ([eaf420c](https://github.com/aeternity/superhero-wallet/commit/eaf420c31cfff0b1d7f25aa3e5525c3de699512f))
* improve token transactions & details navigation ([acc3075](https://github.com/aeternity/superhero-wallet/commit/acc3075265e50d98cff68d707d9b0ec3e97dc06c))
* improved filter tokens by contract-id ([9ce64fe](https://github.com/aeternity/superhero-wallet/commit/9ce64fed56807dff55da77cd8d7307c38b193a9e))
* notification infinite scroll ([e655662](https://github.com/aeternity/superhero-wallet/commit/e65566237b8092d0ae1ecd9182a7fb3933761953))
* redesign notifications page & move notifications to composable ([05e4ea2](https://github.com/aeternity/superhero-wallet/commit/05e4ea296bf138e444ec418cb5630e4289681f57))
* remodeled not found page ([fec08d1](https://github.com/aeternity/superhero-wallet/commit/fec08d110a6c67910b84f03cd5a7c21a3efad137))
* show active network on header ([7699eb4](https://github.com/aeternity/superhero-wallet/commit/7699eb403e0cffa8e79ec51cb6b76c9460d22581))


### Bug Fixes

* account card avatar overflow ([0ba0318](https://github.com/aeternity/superhero-wallet/commit/0ba031876294d83668246e3e16442fe5b29e53b7))
* **account-import:** be able to generate account from valid mnemonic ([272cfcb](https://github.com/aeternity/superhero-wallet/commit/272cfcb3a54fe99d0634e6f8767ce7e02c4c708a))
* adjust welcome screen styles ([16c2fca](https://github.com/aeternity/superhero-wallet/commit/16c2fcab3a035d8a51acd11e694202bc22b3363f))
* allow localhost in url check ([dcfd1d9](https://github.com/aeternity/superhero-wallet/commit/dcfd1d928d719c7a9cbcc9310c5aa8de627ba093))
* back button logic ([8eecf4c](https://github.com/aeternity/superhero-wallet/commit/8eecf4cd8770e47ebdbcc4000c0435645c663f78))
* **btn-icon:** use correct hover color and opacity ([47c6081](https://github.com/aeternity/superhero-wallet/commit/47c608163d2578c55300abe31279ecf06226ba13))
* coins & tokens router path ([a9c6d5f](https://github.com/aeternity/superhero-wallet/commit/a9c6d5f3f7393b7ed04a330ad3eca6c041e97779))
* composition api transactionToken and vuex ([b3d00c5](https://github.com/aeternity/superhero-wallet/commit/b3d00c52643faeaf325e83cef398c966ecba16a7))
* dapp permissions check [#1726](https://github.com/aeternity/superhero-wallet/issues/1726) ([6b53e74](https://github.com/aeternity/superhero-wallet/commit/6b53e743104875ca327c837d923e9bb54a2c1fe4))
* fix the overflowing name on send/receive popups ([3fd92a9](https://github.com/aeternity/superhero-wallet/commit/3fd92a936f330e2c72a00ebf45522763503b8fa4))
* **fungible-tokens:** load correct token balances info ([57716c7](https://github.com/aeternity/superhero-wallet/commit/57716c7893d903f321737bde7ccd8a27fc491a00))
* header route meta ([9f4a95e](https://github.com/aeternity/superhero-wallet/commit/9f4a95ea7128e63cf079a969fbe9844bcddff990))
* **header:** use existing computed ([36d4334](https://github.com/aeternity/superhero-wallet/commit/36d4334a4da7c0ba3f3aa4f120fd38b1f1bab1a9))
* **helper:** vue composition-api usage ([86d1141](https://github.com/aeternity/superhero-wallet/commit/86d1141cc6432b66c575f450fc0ef3a7e9bc5fc6))
* **index:** add Platforms only in web ([2c9f3c2](https://github.com/aeternity/superhero-wallet/commit/2c9f3c21f4db808b97a8c64c6894f74ec9c3b29a))
* inline button arrangement ([6f3a86e](https://github.com/aeternity/superhero-wallet/commit/6f3a86e77cf5b36cee4f90643f453d91a0ad643b))
* missing dex related transaction details ([4cd8e4d](https://github.com/aeternity/superhero-wallet/commit/4cd8e4d3c27bef8a98319610fd73a331222214f3))
* only format address ([233f56e](https://github.com/aeternity/superhero-wallet/commit/233f56e36575f26e2fd31f5cc1e6f861e40ecd39))
* open ios notifications in new tab ([01bd2bb](https://github.com/aeternity/superhero-wallet/commit/01bd2bb5b8d9cbdff7dfb77112140155945ae137))
* permission auto sign message [#1158](https://github.com/aeternity/superhero-wallet/issues/1158) ([7712a32](https://github.com/aeternity/superhero-wallet/commit/7712a320807bec6bf77708cf362c76f179cfe0cc))
* prevent names from overflowing on transaction details ([b2a4f24](https://github.com/aeternity/superhero-wallet/commit/b2a4f24d6794e424516c689775d03ddfb817df55))
* refactor TransactionList.vue ([b61b18b](https://github.com/aeternity/superhero-wallet/commit/b61b18b113c8c28dd96cebf3174c2e85b2897254))
* remove transactionTokensMixin.js ([c40c15c](https://github.com/aeternity/superhero-wallet/commit/c40c15c2e3f60240905593924824fd24d5ab85ba))
* reopen ae coin details ([6eaf0c1](https://github.com/aeternity/superhero-wallet/commit/6eaf0c19f18fdbbf32e339b188ec3ecda27aae3f))
* **routes:** apply correct header logic for Auction pages ([df6f1fc](https://github.com/aeternity/superhero-wallet/commit/df6f1fc12052eddb76cf013a334911a848bccd75))
* **route:** set scroll position to 0 for every page ([9e03ef0](https://github.com/aeternity/superhero-wallet/commit/9e03ef0ff743153c4517f36947d631d1229113a9))
* scrollable screens ([746021d](https://github.com/aeternity/superhero-wallet/commit/746021d66798c7a0c723ca796c59d240d0e0aa5e))
* show all info on claim tip transaction details ([6174ba4](https://github.com/aeternity/superhero-wallet/commit/6174ba4d7121520700ab070c6b36be609b384428))
* show correct info for pending token send transaction ([79ab508](https://github.com/aeternity/superhero-wallet/commit/79ab50898cb7ae3de0c3b66b5821dd3c6c328258))
* show long tip urls correctly ([d54f100](https://github.com/aeternity/superhero-wallet/commit/d54f100b96f4b9117cede04adecd1f1635a270f2))
* **transaction-details:** show loading state while loading a transaction ([f5f9a08](https://github.com/aeternity/superhero-wallet/commit/f5f9a084266502c124de5f2f3b8e2aa3707b373f))
* **transaction-item:** show labels token send transactions ([4f6dc52](https://github.com/aeternity/superhero-wallet/commit/4f6dc52605713ab6c5cb4b1a0e21167de880a62c))
* **transactions:** show none AE transactions correctly ([b48d69d](https://github.com/aeternity/superhero-wallet/commit/b48d69d99ec5b0c79e7053529de74c36a54a59d0))
* **transfer-receive:** set correct button styles ([b9fe262](https://github.com/aeternity/superhero-wallet/commit/b9fe262a15d065aba5759bcbc3de23c4cbfbb4b1))
* use a valid type for a tipUrl prop ([629084d](https://github.com/aeternity/superhero-wallet/commit/629084d43095e23c2d187c6ff5828d654cce3b87))
* use correct close icon ([e028f61](https://github.com/aeternity/superhero-wallet/commit/e028f618a56ec626028bd452491e463b5cace4f8))
* use modal-like footer in verify seed phrase form ([cd26602](https://github.com/aeternity/superhero-wallet/commit/cd266029ec1dfe187324bf5c1e06761a4a904410))


### Style

* apply different styling of conditions in TransactionItem ([4b70938](https://github.com/aeternity/superhero-wallet/commit/4b7093863bfeb17e377b84abb377789d232c9359))
* **modal:** remove unused selector ([f82b308](https://github.com/aeternity/superhero-wallet/commit/f82b308472d81fc37e30502d9b11dbcdb0530058))


### Tests

* add tests for isTxAex9 getter ([a32c848](https://github.com/aeternity/superhero-wallet/commit/a32c8487af8aad1369a7b89e1ae4a967ba59e7aa))
* align test names ([3a4f117](https://github.com/aeternity/superhero-wallet/commit/3a4f117790c9a36783ca0b26ed24d65309bec51c))
* fix e2e tests ([a39f3b9](https://github.com/aeternity/superhero-wallet/commit/a39f3b950b5e8a332d752744f0ced2cdc1e4675f))
* fix transaction-details spec ([b85407d](https://github.com/aeternity/superhero-wallet/commit/b85407de5596f16bd33752dcdfa3eb6816e8786f))
* fix ts-jest warnings ([c37a462](https://github.com/aeternity/superhero-wallet/commit/c37a462ec6532c9e6e03e488c533e8e16f9447ed))
* fix unit tests ([3539d8c](https://github.com/aeternity/superhero-wallet/commit/3539d8cb59b1b2c8efddebf8e28259cf4c101559))
* **import-account:** test seed phrases more than 12 words ([1a7c7ef](https://github.com/aeternity/superhero-wallet/commit/1a7c7efdee9861935de0f1703a41868023ccfff1))
* introduce error cases ([32a8d52](https://github.com/aeternity/superhero-wallet/commit/32a8d522ed464f4811b31cb858a839d4d06ba0f2))
* support typescript and composition-api ([d224269](https://github.com/aeternity/superhero-wallet/commit/d224269dc6395a5d552c91f0ff2ad1d1b3865820))


### Documentation

* add BrowserStack tooling to README.md ([84aa4e2](https://github.com/aeternity/superhero-wallet/commit/84aa4e21993718c8b96ce9d95b62c95c2bf6b070))


### Maintenance

* add types for selected utilities ([5f61e08](https://github.com/aeternity/superhero-wallet/commit/5f61e08b62c16bbf69c6d8d63a5e3705e084cd41))
* disallow unused variables ([92cd2a1](https://github.com/aeternity/superhero-wallet/commit/92cd2a1f02fb58663f7b5141a47081d69f15d189))
* migrate router to type script ([8dd0a02](https://github.com/aeternity/superhero-wallet/commit/8dd0a023d5168886e5b7030dd128d41592714f17))
* **refactor:** deeplink api & max amount mixins ([3741910](https://github.com/aeternity/superhero-wallet/commit/3741910f01dda1e7b2e285fa93019f784fd09af7))
* remove duplicated sdk vuex states ([ee024dc](https://github.com/aeternity/superhero-wallet/commit/ee024dc40cff0f9f174c865116b54810816088eb))
* remove fake modal transition from account details ([1a8e8e5](https://github.com/aeternity/superhero-wallet/commit/1a8e8e5d85b7b0aaa84e0927152d4334df559090))
* remove unused imports ([4cfd833](https://github.com/aeternity/superhero-wallet/commit/4cfd833a487a811b92dd3814d1ecdeadfc72504f))
* restructure routes ([fd9c2f0](https://github.com/aeternity/superhero-wallet/commit/fd9c2f0e0228a7bdcdd099c3179761a45aa7bdd9))
* update button color variants ([3797e53](https://github.com/aeternity/superhero-wallet/commit/3797e536e221b405dbcb03ed98a8ba34cb13ecfa))

## [1.0.1](https://github.com/aeternity/superhero-wallet/compare/v1.0.0...v1.0.1) (2022-11-15)


### Features

* add network forms ([e7028cd](https://github.com/aeternity/superhero-wallet/commit/e7028cdb3de7f8bce30922404ec58699f144d4a2))
* add send process indication ([c6ebb4f](https://github.com/aeternity/superhero-wallet/commit/c6ebb4fcfe282e6ccccee15de9bf01860d21fa47))
* add/edit permission ui updates ([4bb0867](https://github.com/aeternity/superhero-wallet/commit/4bb0867db18d9e0db82d4eed1341a0c9b91ebd59))
* added superhero logo to qr code generator ([ae29bac](https://github.com/aeternity/superhero-wallet/commit/ae29bac716159814f7ff567ba39c6542f5bdfefd))
* apply opacity to not selected accounts ([c8226d4](https://github.com/aeternity/superhero-wallet/commit/c8226d439fb5d68db15f307c5b397b1f4cc37c35))
* closable dashboard cards ([b18b0b8](https://github.com/aeternity/superhero-wallet/commit/b18b0b8bf997d10320256f3ab3c4530496e994a1))
* deeplink connection popup ui updates ([2f562fe](https://github.com/aeternity/superhero-wallet/commit/2f562feea267d6b7065e0f610caa6fae13f51807))
* remove unused confirm-tip.vue ([2eb9410](https://github.com/aeternity/superhero-wallet/commit/2eb94105fe02e9a86dc824815abe8e58fea8a2e6))
* seed phrase ui updates ([77d6fe9](https://github.com/aeternity/superhero-wallet/commit/77d6fe96696828339066a362aaed4660e923623c))
* **settings:** change network list UI ([a3be56b](https://github.com/aeternity/superhero-wallet/commit/a3be56bb792954d3eae5361cb057d820d651ea25))
* sticky account detail search bar & filters ([ff5f4e9](https://github.com/aeternity/superhero-wallet/commit/ff5f4e9cdde43cd0c0b3274d0fc0233009b4eb48))
* text blocks unification ([cce7db2](https://github.com/aeternity/superhero-wallet/commit/cce7db2630b0b24c5fe6b257bdcc28ca21e3b952))
* **token-details:** add collapsible scroll view with filters ([b928c6d](https://github.com/aeternity/superhero-wallet/commit/b928c6de3302df68ad41fe17f0ca562f156e5f4c))
* use disabled amount input for invites ([af5836b](https://github.com/aeternity/superhero-wallet/commit/af5836ba846879a5eecd35242f06c393e3a0c649))


### Bug Fixes

* adjust footer gradient position ([74a88d8](https://github.com/aeternity/superhero-wallet/commit/74a88d82586f152b34ad013ab368edd350298412))
* adjust transaction details styles ([03ee572](https://github.com/aeternity/superhero-wallet/commit/03ee572b52cce18191a4ad6aa6d34904a189ce53))
* app and modal rounded corners ([ee7f51c](https://github.com/aeternity/superhero-wallet/commit/ee7f51c153ff2dc5a50578dc0a5d95c0023ceeeb))
* app page and modal bottom inset ([f5f0bcd](https://github.com/aeternity/superhero-wallet/commit/f5f0bcd1da0c55cc9416a5a358fa2b0c14d32904))
* apply sticky rule for filters ([f960b35](https://github.com/aeternity/superhero-wallet/commit/f960b358da903df9474584b9f609d5190a66ca7a))
* **background:** change network/account correctly ([6dc23bd](https://github.com/aeternity/superhero-wallet/commit/6dc23bdb975c8883d49038363d33349165514a9f))
* bell icon and notification badge ([982cfd7](https://github.com/aeternity/superhero-wallet/commit/982cfd7434a17054ea8f96e83c8ee5069addc187))
* buy link fix ([78679a3](https://github.com/aeternity/superhero-wallet/commit/78679a3a203ce6a04e65e81ee50e9c3b855b3a25))
* buy link fix ([427b955](https://github.com/aeternity/superhero-wallet/commit/427b955f63f7c4d55b2e4a1118f963cb09e2a4dd))
* camera on extensions ([2971227](https://github.com/aeternity/superhero-wallet/commit/29712270ade8faa9c550acc85fbc9b6b548e0f1b))
* connected and sign modals margins ([93b6b55](https://github.com/aeternity/superhero-wallet/commit/93b6b55b0f621673d52ed6213cdee041d7301d0d))
* **copy text:** ability to click when disabled ([bdec040](https://github.com/aeternity/superhero-wallet/commit/bdec040abfb3812c9ec84656fdadef9aa28990ae))
* **copy text:** ability to click when disabled ([9ce6a44](https://github.com/aeternity/superhero-wallet/commit/9ce6a447cdcc6dccc1469fb0dff98e44b1d431eb))
* disable formatting in tx overview for non-hash labels ([507587c](https://github.com/aeternity/superhero-wallet/commit/507587cf14c76a13c084ab04439efc26da799a50))
* **firefox:** prevent number input from allowing letters ([082ed4b](https://github.com/aeternity/superhero-wallet/commit/082ed4bbd31cb13185f4044dd7260972d8b06454))
* fix permissions back button ([55672e7](https://github.com/aeternity/superhero-wallet/commit/55672e7930bf4d3efe51f5e8eab6578d814b5464))
* fix Transaction successfully submitted, link to explorer and fix token ([42dd46c](https://github.com/aeternity/superhero-wallet/commit/42dd46cdfed16e733836b3aa0569eec1a8c7c097))
* get ae coin from scanned qr code ([fca6ebd](https://github.com/aeternity/superhero-wallet/commit/fca6ebdcd76cfb55b699164c588fd6b654a09b1a))
* hide close dashboard cards buttons ([0ca6a96](https://github.com/aeternity/superhero-wallet/commit/0ca6a96f6555e84f048b404194e7a023b1b21df6))
* hover under search ([d593db0](https://github.com/aeternity/superhero-wallet/commit/d593db095ce881b8512eeb4fc7944a540224ba2e))
* inital active account card auto update ([b248ef2](https://github.com/aeternity/superhero-wallet/commit/b248ef2eca9019329fe128725e799536e171b202))
* limit number input to number only ([7833faa](https://github.com/aeternity/superhero-wallet/commit/7833faa3f6af54135dc8e2622cdb5143ad2fad40))
* modal footer fix ([7b5f3d0](https://github.com/aeternity/superhero-wallet/commit/7b5f3d064f6eed5be4bdc069f45483f15bf70927))
* move buttons from edge of the screen ([9c8dd0b](https://github.com/aeternity/superhero-wallet/commit/9c8dd0bffc0bab3f3e945aed7d67218060f00087))
* move loader layer above the account details tabs ([e2340c2](https://github.com/aeternity/superhero-wallet/commit/e2340c2572beb0b033fac2df1e0d5f33f43b66ad))
* name allowed characters length ([627f2ac](https://github.com/aeternity/superhero-wallet/commit/627f2acf8ea7ed8db939cbce8a0007a789975e95))
* no registered name message button alignment ([850a646](https://github.com/aeternity/superhero-wallet/commit/850a646af3ee9ceb28d07a66c4589463f7f1348f))
* **platforms:** missing import ([68c4966](https://github.com/aeternity/superhero-wallet/commit/68c49667c8a63305964b44d0c9837f3afc7e2d6e))
* prevent error when name set to default and not connected ([54b3c20](https://github.com/aeternity/superhero-wallet/commit/54b3c2045c576a2500a9ca4a360fcbe87112809e))
* qr code reader ([b1d3d5b](https://github.com/aeternity/superhero-wallet/commit/b1d3d5b786089a5b9079ec4344790167723a47e7))
* qr code sh logo size ([99d03ff](https://github.com/aeternity/superhero-wallet/commit/99d03ff8442a6338dddf45ccdba3c9809a69b6f0))
* **recieve:** dot validation on input ([42e0964](https://github.com/aeternity/superhero-wallet/commit/42e0964cf328d63ef15309f170f28fa69964847f))
* remove account import button top margin ([f9d6298](https://github.com/aeternity/superhero-wallet/commit/f9d62982f3fbc679ee3cc393a90fe518e5b377a3))
* remove app bottom empty space ([408f717](https://github.com/aeternity/superhero-wallet/commit/408f7178e56e0e850ff58ec4dccbdab0e0f082ef))
* remove unnecessary page scrolling ([92c7c6c](https://github.com/aeternity/superhero-wallet/commit/92c7c6c820ab61739b20c82104c1b5ead8607cfb))
* repair utils ([ca74d4e](https://github.com/aeternity/superhero-wallet/commit/ca74d4eaf2b61bf578a232a3b922bec2b79f71f5))
* resize qr code logo and remove flickering ([3ad0b1f](https://github.com/aeternity/superhero-wallet/commit/3ad0b1ff49a38d9bf8b151020af663201d293370))
* seed phrase screen ui ([7e0a4c4](https://github.com/aeternity/superhero-wallet/commit/7e0a4c43a7c173e3fb0cd5dbb1368aab32ff3423))
* send modal address placeholder text ([6abb581](https://github.com/aeternity/superhero-wallet/commit/6abb58135e1490c60ca47b7d533a908a9cf88722))
* show none AE related transactions correctly ([f82ca12](https://github.com/aeternity/superhero-wallet/commit/f82ca12560987c704eb0b3f2b7012ca45438a8d2))
* top bar style ([0b2dd51](https://github.com/aeternity/superhero-wallet/commit/0b2dd51dce2933df7d007b0484899848242ce82e))
* transaction list scroll load more ([25802dc](https://github.com/aeternity/superhero-wallet/commit/25802dc9c20156291404f5266247f69ac4573ec4))
* transaction should remain filters shown if filter is changed ([f25c6bd](https://github.com/aeternity/superhero-wallet/commit/f25c6bd1c1c9fcf84b4183d432a706909e5f4edd))
* **transaction-overiew:** show a proper name for transactions to sent to a name ([062f42c](https://github.com/aeternity/superhero-wallet/commit/062f42c6d2aee17f405048a413bf9aa76d43baff))
* **transactions:** fetch next transactions page correctly ([f435b3e](https://github.com/aeternity/superhero-wallet/commit/f435b3e9b214854142192f906a7c4be19d3c61e1))
* **transactions:** show pending tip transaction correctly ([52700e7](https://github.com/aeternity/superhero-wallet/commit/52700e76858b2390b9f217fc02ceea8335fed472))
* **transfer-receive:** handle none AE tokens correctly ([38e59e9](https://github.com/aeternity/superhero-wallet/commit/38e59e9b91d7639d47725a0502c2058d9669ca55))
* viewport on android ([7d0c715](https://github.com/aeternity/superhero-wallet/commit/7d0c71520190e6bfac71a597ca50eac89ee6f5c6))
* viewport on mobile browsers ([1d71307](https://github.com/aeternity/superhero-wallet/commit/1d71307f83d0b084a7cf1bebaa6cbe4d8b4d3d2d))
* when wallet running on ext cannot use composition api watch ([87ea0f8](https://github.com/aeternity/superhero-wallet/commit/87ea0f8d6136a970ecbe2f2dc554a02286b3153e))


### Maintenance

* add typescript and vue composition api ([5bf236e](https://github.com/aeternity/superhero-wallet/commit/5bf236ec5b3ba322c37ba17a106ff2249a3a5f4d))
* buttons new ui by default ([cd6eb1b](https://github.com/aeternity/superhero-wallet/commit/cd6eb1ba40c8865bc54cd38c43db653ab51de38a))
* environment variables as imports ([79750b2](https://github.com/aeternity/superhero-wallet/commit/79750b2a873a8d24259b16487d7a54654f72987d))
* inputs new ui by default ([af33bd8](https://github.com/aeternity/superhero-wallet/commit/af33bd8c7921ca07b3949335dfd5398d0eec9223))
* move vue components to popup dir ([4ac1098](https://github.com/aeternity/superhero-wallet/commit/4ac1098db25dc1449d6c7c1e44dd4ea88a4696b2))
* name tip/retip pending transaction fields consistent ([c1a28c2](https://github.com/aeternity/superhero-wallet/commit/c1a28c29a30d769e962430cd48003bafcf24229e))
* node connection statuses as constants ([619fa43](https://github.com/aeternity/superhero-wallet/commit/619fa43873ef1feec8bd937ad4f2f5c520296cc1))
* **notifications:** statuses as constants and tabs styling ([19e9908](https://github.com/aeternity/superhero-wallet/commit/19e9908edc5595548ef4420e4694e8672b648ee0))
* popup utility functions unification ([4f25c75](https://github.com/aeternity/superhero-wallet/commit/4f25c75149f7917d3205df0fb961520012fde5eb))
* remove aepp components library ([6cf0da6](https://github.com/aeternity/superhero-wallet/commit/6cf0da62a0911267e57dea6778f82fece5a5f848))
* replace copy mixin with composable ([e5dc80d](https://github.com/aeternity/superhero-wallet/commit/e5dc80ddb29f060585333ff4cf834fcbf2b34cf9))
* replace mixin balance list with composable ([dcc6f34](https://github.com/aeternity/superhero-wallet/commit/dcc6f349a76cc0d570002e9bb45dfc0991966148))
* **tabs:** unify the tabs appearance ([76c0463](https://github.com/aeternity/superhero-wallet/commit/76c0463e5cac4109db75dda6ffb7ed6639c1986a))
* update css color variable names ([9922eb5](https://github.com/aeternity/superhero-wallet/commit/9922eb5a4f5e89ef4c81c64108cc4fa9681d9e94))
* visual and performance tweaks ([b1184f3](https://github.com/aeternity/superhero-wallet/commit/b1184f362a23868de62cc8c432ff29e0e9314043))
* vue3 compatible passing content to slots ([8ca0c7e](https://github.com/aeternity/superhero-wallet/commit/8ca0c7eb12d32ab44ab9cef1325e2e5f3945e006))

## [1.0.0](https://github.com/aeternity/superhero-wallet/compare/v0.9.11...v1.0.0) (2022-09-10)


### Features

* about screen ui updates ([3b435dc](https://github.com/aeternity/superhero-wallet/commit/3b435dcb356f4655d46e8bea0c2e6f31f08ba2d9))
* account add modal ([7ccbbba](https://github.com/aeternity/superhero-wallet/commit/7ccbbba5ca72d045fef3f36890edd3de9d675ba5))
* account card swipe and arrow switching ([e081fff](https://github.com/aeternity/superhero-wallet/commit/e081fff34c57779fbf021c0b35889708a4091070))
* account details as page and page transitions ([329c261](https://github.com/aeternity/superhero-wallet/commit/329c26187d5de3393d0fa3e83cfd094bb835da57))
* account details names ([9940687](https://github.com/aeternity/superhero-wallet/commit/9940687ad30a8f16f8d4e0b1671393108402d493))
* account details popup, transaction list, tokens list ([2a69311](https://github.com/aeternity/superhero-wallet/commit/2a693116c445ad9592ff73ad6197440909b39f9c))
* **account:** implement accounts card ([2636253](https://github.com/aeternity/superhero-wallet/commit/26362537bf6adef13a8ec745e37042c587941c53))
* **accounts:** discover subaccounts on seed phrase recovery ([cabca3e](https://github.com/aeternity/superhero-wallet/commit/cabca3ecb2a71d508697220b02a4352fe3664594))
* add account card ([2a13a95](https://github.com/aeternity/superhero-wallet/commit/2a13a9585b0cf985a86e03e9f1e3576a22f76263))
* add bullets to account switcher ([0fc370a](https://github.com/aeternity/superhero-wallet/commit/0fc370ab29d6afd0be4f3593d9f740a3ad3f6791))
* add total amount of fiat for all accounts ([439914f](https://github.com/aeternity/superhero-wallet/commit/439914f17bbb104fc8ae856170e116fe66041a28))
* change link ([d575399](https://github.com/aeternity/superhero-wallet/commit/d575399e7fa6d15125daec49cc09a2bfe748abda))
* change qr code popup style ([2da49aa](https://github.com/aeternity/superhero-wallet/commit/2da49aacac1bd57a20c7e27dfb890a42ee24f9f5))
* claim tips ui screen ([e85dc05](https://github.com/aeternity/superhero-wallet/commit/e85dc05afacdbd2424b468638c20448e981e55e3))
* currency settings screen ([c73ef3c](https://github.com/aeternity/superhero-wallet/commit/c73ef3c17bf3d4385b92bd163ab547b7b2ea1413))
* disable diamond button on home page & add disabled state for send button ([530956b](https://github.com/aeternity/superhero-wallet/commit/530956b9753b8808188af183a222fee6a55be31f))
* errors log setting ui updates ([2cb6e02](https://github.com/aeternity/superhero-wallet/commit/2cb6e02896fcd46a63033eadda8678be9ccd3196))
* implement recipient helpers ([7868c85](https://github.com/aeternity/superhero-wallet/commit/7868c8588af665a7ad66302a3f18ce6315c3a951))
* invite screen ui updates ([7fccc0c](https://github.com/aeternity/superhero-wallet/commit/7fccc0cb1a80e7c878d6139b3a98d63880ffcfc0))
* language setting ui updates ([44a2ab3](https://github.com/aeternity/superhero-wallet/commit/44a2ab3e6ec432732e4420e48645ac527677597f))
* make send and receive cards dense ([58a740e](https://github.com/aeternity/superhero-wallet/commit/58a740ec796252e502d53ef4bec54ccecea7efff))
* **modal:** appear from bottom modal variant ([b550f63](https://github.com/aeternity/superhero-wallet/commit/b550f6344286fd6275e24af340aadbccd99d3a1a))
* more main screen, new app ui background ([671137a](https://github.com/aeternity/superhero-wallet/commit/671137a56c3c51d0676acf7e827d5a27218b20d5))
* notifications setting ui updates ([b4cb12d](https://github.com/aeternity/superhero-wallet/commit/b4cb12d5bb0754c7faf327e318b98237960d9e9f))
* page transitions tweaks ([5a0fdd4](https://github.com/aeternity/superhero-wallet/commit/5a0fdd482be7f7daf3d8ad1ddaf4f047dcb2f0d5))
* permission setting ui updates ([f76dfd0](https://github.com/aeternity/superhero-wallet/commit/f76dfd0c67749f53fd2fa57f85eff8d748eb839d))
* **receive-tokens:** implement asset selector popup ([cba90d3](https://github.com/aeternity/superhero-wallet/commit/cba90d3487cd195a1f3a40035cf19a2fed6334c9))
* redesign index page ([82108b3](https://github.com/aeternity/superhero-wallet/commit/82108b371eda0920a7fb41160c22c0ffd2beab89))
* redirect user after seed phrase confirmation ([7716900](https://github.com/aeternity/superhero-wallet/commit/7716900fa7aebb64ae70479c2987ff771fd300d8))
* remove ability to copy address from acc card ([c67608d](https://github.com/aeternity/superhero-wallet/commit/c67608d5640597dbdb956375dc15dc9089a743e6))
* remove excess buttons from AccountCard and from TokenList ([e4ffed2](https://github.com/aeternity/superhero-wallet/commit/e4ffed26cfa5b2c3df33e9e90e01a3f5362fbd1d))
* reset wallet screen ui updates ([4e61b5f](https://github.com/aeternity/superhero-wallet/commit/4e61b5f91629fd669698ca7400ede6b8b1f3c824))
* seed phrase screens ([2b36b96](https://github.com/aeternity/superhero-wallet/commit/2b36b96ad93aee3c37cfaf6bca3c23bd1752fa3d))
* seed phrase setting ui updates ([d9eb41d](https://github.com/aeternity/superhero-wallet/commit/d9eb41d0ca278a9a9c5575c9dccf9dad110120a2))
* setting screen ui updates ([55f20e9](https://github.com/aeternity/superhero-wallet/commit/55f20e970e6ac26174cf38720c46e5a8d23f8119))
* submit textarea on enter click ([8bfba6e](https://github.com/aeternity/superhero-wallet/commit/8bfba6ef0045b63de336ef4470b1f9112f7a653d))
* token list item ui updates ([9b66bf1](https://github.com/aeternity/superhero-wallet/commit/9b66bf1bb9def65201c5c9d882109e04923cbfae))
* transfer receive modal ([3bcdf8a](https://github.com/aeternity/superhero-wallet/commit/3bcdf8a6e664754e61cd3adcddd360c2b531e8c6))
* transfer review screens ([ee72b2f](https://github.com/aeternity/superhero-wallet/commit/ee72b2feecd658920ebe2b92fde67b91768fc507))
* transfer send modal ([fc64022](https://github.com/aeternity/superhero-wallet/commit/fc6402297d8e63421acc031b96183d58c50f87d1))
* **transfer-send-form:** add current account info ([91ae8a7](https://github.com/aeternity/superhero-wallet/commit/91ae8a76ff9bfba2fd3be502a9c0e943f793f12b))
* **transfer-send:** add Max button ([895ce39](https://github.com/aeternity/superhero-wallet/commit/895ce39d131dce7571b62848cf1c5b3d9283cfa2))
* update add account card with new color ([cf992f8](https://github.com/aeternity/superhero-wallet/commit/cf992f873152e0d57200c7d3e2b41d5715f8a784))
* updated app icon ([4aa41c4](https://github.com/aeternity/superhero-wallet/commit/4aa41c4e588b2b9b4a1523ca1734783c9df19cdb))
* wallet dashboard ([ac45000](https://github.com/aeternity/superhero-wallet/commit/ac4500019762e1d4f8a0dd6586ee3eefda022ac1))


### Bug Fixes

* account details & dashboard links ([46f99ca](https://github.com/aeternity/superhero-wallet/commit/46f99cac381239a8445da0ee6c9445623aeeb0a5))
* account info active idx, switcher arrows ([5f580e2](https://github.com/aeternity/superhero-wallet/commit/5f580e2be321e6772ee0720959a310a52bc9a00d))
* **account-switcher:** show all existing accounts ([249c85f](https://github.com/aeternity/superhero-wallet/commit/249c85f344ee244e27f499a250c4ea448f35bf4e))
* add margin before terms on mobile ([ccdd2ff](https://github.com/aeternity/superhero-wallet/commit/ccdd2ff4af59c72e8bea57fbf3777e553967cf78))
* app icon & splash ([c296772](https://github.com/aeternity/superhero-wallet/commit/c2967724f611cb1a9fe5200190975c7c451c64ce))
* **build:** remove circleci build ([8f5b024](https://github.com/aeternity/superhero-wallet/commit/8f5b0244a556138e8eb7065578d964c9f66a2b1c))
* calculate fee properly ([7416014](https://github.com/aeternity/superhero-wallet/commit/7416014c594f5c00cf2323a5d8f6246f233e2b20))
* change back button logic for auctions page ([014fea5](https://github.com/aeternity/superhero-wallet/commit/014fea5b905bde3a10d1c456130e8a78dc9898a9))
* claim tips active account index ([acd7a5b](https://github.com/aeternity/superhero-wallet/commit/acd7a5b88c103ff8c207b180724c6293f50f4491))
* **claim:** use new error message format for the input field ([75ef92c](https://github.com/aeternity/superhero-wallet/commit/75ef92c4fa661ac1c7daf8239859da49ab47f7ed))
* dashboard claim name link ([bba188c](https://github.com/aeternity/superhero-wallet/commit/bba188cf9ae5f9adddb0594f2e4471b18941ec8e))
* dashboard receive & send buttons links ([032c9fa](https://github.com/aeternity/superhero-wallet/commit/032c9faed5e79b562679864c29adff27b13e9157))
* **deeplinks:** handle transfer deeplink correctly ([bcba88e](https://github.com/aeternity/superhero-wallet/commit/bcba88ef65c48e6d7d25eb46053474fd45c94c88))
* display proper amount of tokens in account card ([92de082](https://github.com/aeternity/superhero-wallet/commit/92de0822b617ffdf1e6bbcd7504dc93012980043))
* fix asset selector styles ([bd73c86](https://github.com/aeternity/superhero-wallet/commit/bd73c8626d1761a795779837f4b66488f636a587))
* fix top padding on onboard screen ([ea52056](https://github.com/aeternity/superhero-wallet/commit/ea5205643470cc30184dd3becf399b1bd6575113))
* include safe-area for fullscreen modals ([ca3c744](https://github.com/aeternity/superhero-wallet/commit/ca3c74409938e02ece8be0080e324ed45dc93610))
* **index:** make terms an internal link ([0c5364b](https://github.com/aeternity/superhero-wallet/commit/0c5364ba6b0adbeb8f3461e2a94b7c49287d1171))
* **modal:** align footer buttons correctly ([015257f](https://github.com/aeternity/superhero-wallet/commit/015257fcbcdee8573352f9e28a0070560da96713))
* more screen width ([2bcc377](https://github.com/aeternity/superhero-wallet/commit/2bcc3773bbd59cae5302b10a912b0b0beefe56a0))
* move buttons up on mobile ([6d8fdea](https://github.com/aeternity/superhero-wallet/commit/6d8fdeaeb9c0e5d99ce33f40defe8ed22cf4342d))
* **name-item:** be able to set pointer ([a4ed73d](https://github.com/aeternity/superhero-wallet/commit/a4ed73d6252e7144b5ff8bc20e50c241b5ba3555))
* **node-connection-status:** align status correctly ([c77e989](https://github.com/aeternity/superhero-wallet/commit/c77e9892e7d2898d0cc921aafad3378e2151c4c3))
* **permissions-details:** display error correctly ([e90f028](https://github.com/aeternity/superhero-wallet/commit/e90f028de5d5de5cd0379194d2eb7c25cc599721))
* preselect token in send modal ([fc7deb6](https://github.com/aeternity/superhero-wallet/commit/fc7deb6da2be86d2deb47bf02ed705db4d49148f))
* prevent asset selector from freezing on open ([43e0915](https://github.com/aeternity/superhero-wallet/commit/43e0915129f20a66ed15793b100933b2b039fc63))
* qr camera should stop preview on stop, bg colors ([74e26ee](https://github.com/aeternity/superhero-wallet/commit/74e26ee207e961da40c27937cdb2c2729913bbda))
* qr scanner ([c572471](https://github.com/aeternity/superhero-wallet/commit/c5724716c6faa4e9a5f6152b13cfffbbb0e3d853))
* **qr-code-reader:** do not cover scanning modal ([fb33523](https://github.com/aeternity/superhero-wallet/commit/fb335232fd44402680762eb3eb7624d5bdcbeefe))
* **recipient:** make help page full screen ([d4344cc](https://github.com/aeternity/superhero-wallet/commit/d4344cc15a1d0ccdb0fb699bd0497d5688915e94))
* **retip:** fit long url in the screen ([3e17fcf](https://github.com/aeternity/superhero-wallet/commit/3e17fcf0de1b88983765859d46049e513e06440e))
* **seed-phrase-verify-settings:** show correct wording ([0e15400](https://github.com/aeternity/superhero-wallet/commit/0e15400885741492bdc38c861b47c06a91762463))
* **share:** remove line breaks ([aa703d5](https://github.com/aeternity/superhero-wallet/commit/aa703d59486b98a1c808e770d7f23234133000cf))
* status bar background color ([9f69ffa](https://github.com/aeternity/superhero-wallet/commit/9f69ffa1f284a4e3c98bb625b6d921b4f3c8778d))
* **tokens-list:** ability to open receive modal ([8dfbcb4](https://github.com/aeternity/superhero-wallet/commit/8dfbcb48445f80a187bbca57c29b4d391320cd93))
* **transactions:** show only current account transactions ([e11ffc7](https://github.com/aeternity/superhero-wallet/commit/e11ffc7b2a69a378672eb3c61a96ac66c77ce7e1))
* **transfer-receive:** align account names ([f062ae5](https://github.com/aeternity/superhero-wallet/commit/f062ae549303ae9c3b08c91303c7925b1325ae4a))
* **transfer-receive:** correct share link, make it backwards compatible ([26a5268](https://github.com/aeternity/superhero-wallet/commit/26a5268c8f3522697e62e56c4ac40c39c7efb928))
* **transfer-receive:** do not require optional field ([6c384e6](https://github.com/aeternity/superhero-wallet/commit/6c384e61d0df45aef9a4f89dd72baaf84e74bb35))


### Tests

* adjust tests ([1470b64](https://github.com/aeternity/superhero-wallet/commit/1470b6404946a16ef46839b5a4ae3640326355d4))


### Maintenance

* **account-info:** fix warning ([ccf0b95](https://github.com/aeternity/superhero-wallet/commit/ccf0b95ab2ff2196a28ee765e4681ee337cee0a9))
* add url status validation ([cf5f916](https://github.com/aeternity/superhero-wallet/commit/cf5f9164c28d83494fb0fb41973d7b595fb19127))
* bigger qr code ([89a2939](https://github.com/aeternity/superhero-wallet/commit/89a2939b2e42b7bf39fac8567b3c298ee2415228))
* change receive modal share messages ([3907073](https://github.com/aeternity/superhero-wallet/commit/3907073c503a97664b2f9543f02754903f97e525))
* combine error and warning prop in input field component ([3a0b589](https://github.com/aeternity/superhero-wallet/commit/3a0b589db44326b6c06d38fc955eda60492ffc84))
* **dashboard:** remove unnecessary Plate wrapper ([7ed769b](https://github.com/aeternity/superhero-wallet/commit/7ed769b85d31e6d320afcc7cb2322586bba4730e))
* extract aeternity constant ([5997253](https://github.com/aeternity/superhero-wallet/commit/59972537872928e45b5c8708b080cd7435764e64))
* **fungible-tokens:** remove selectedToken entity ([1126c25](https://github.com/aeternity/superhero-wallet/commit/1126c257e7799146445ea7c65b749de17ef36c27))
* **header:** change back button logic ([58e3735](https://github.com/aeternity/superhero-wallet/commit/58e3735da6f9101f431a5d0b4e13a150d2b4853c))
* **header:** hide home button when back button is shown ([6279f27](https://github.com/aeternity/superhero-wallet/commit/6279f27aeadf8ca50d08b30c292bd9b9a0f5b874))
* **name:** implement new design for buttons ([20abbc2](https://github.com/aeternity/superhero-wallet/commit/20abbc2fa7335e7ed8f74d1b943a9f4764d68ed8))
* **refactor:** clean new-ui temporary variable ([7a8735e](https://github.com/aeternity/superhero-wallet/commit/7a8735e9f473069d68108bf982e7521bd6a69995))
* remove /accounts route ([84a4b08](https://github.com/aeternity/superhero-wallet/commit/84a4b082f323a4f3f154e5ece6dc55314cb4761a))
* remove hideTabBar variable ([dad8e66](https://github.com/aeternity/superhero-wallet/commit/dad8e6641e1882f4b980fdb70f370ca3092efbd4))
* remove onboarding screens ([4d72636](https://github.com/aeternity/superhero-wallet/commit/4d726363a48c860900ed5257675059970e8da77c))
* **settings:** update report bug link ([55a68b3](https://github.com/aeternity/superhero-wallet/commit/55a68b34a212713192cbc2f345b012107fbf17f5))
* **style:** fix missing design elements in welcome screen ([9fb8c5b](https://github.com/aeternity/superhero-wallet/commit/9fb8c5b33a3f737e996e124295393ca10a88ed3e))
* **tips:** remove learn more link ([4687463](https://github.com/aeternity/superhero-wallet/commit/4687463bb85adcadb59bccbafaec5ca0cdf3bb92))
* **transfer-receive:** simplify logic ([98fc0f2](https://github.com/aeternity/superhero-wallet/commit/98fc0f20d8c4aa361b6fc51781be5601e68cdea0))

### [0.9.11](https://github.com/aeternity/superhero-wallet/compare/v0.9.9...v0.9.11) (2022-08-12)


### Features

* add bullets to account switcher ([12a2d60](https://github.com/aeternity/superhero-wallet/commit/12a2d60d37ff3848628f67553a1b053fad0e3b93))
* address shortening component ([55edeea](https://github.com/aeternity/superhero-wallet/commit/55edeead669b31e0a4b54f323a66d5b44faa7562))
* adjust transaction confirmation modals to be DEX compatible ([835e258](https://github.com/aeternity/superhero-wallet/commit/835e2581b930b33bf1d36e31ff9063af83e32fd3))
* adjust transaction details screen to new UI to be DEX compatible ([f39e1cd](https://github.com/aeternity/superhero-wallet/commit/f39e1cda7ebe06b49ea8f9c20a4a834b3863a7b1))
* show all tokens user had activity with ([15aef34](https://github.com/aeternity/superhero-wallet/commit/15aef3445a660a991eed49df2b31490e709c9563))
* store pending transactions for each node ([1b11998](https://github.com/aeternity/superhero-wallet/commit/1b1199854f7af0603385425999af9c382bf3231c))
* token details ([bb4335e](https://github.com/aeternity/superhero-wallet/commit/bb4335e8d4cef910d33686e729203c36fddc2ade))
* tooltip component ([e448f1e](https://github.com/aeternity/superhero-wallet/commit/e448f1ee6c2870bbc7ee3c2814f64994be08b038))
* transaction details swap rates ([406adc2](https://github.com/aeternity/superhero-wallet/commit/406adc2416c09ba0915cfcb5d55d0d6bc3d7fa81))
* transaction details swap route ([28b1111](https://github.com/aeternity/superhero-wallet/commit/28b111162d52ad804cae3e0d60207da5bc51ca18))
* **transaction-list:** ablity to filter pending transactions ([f7c624e](https://github.com/aeternity/superhero-wallet/commit/f7c624ec81899b850e748d6df0059a48efc8a599))
* update transaction list ([6b8b90b](https://github.com/aeternity/superhero-wallet/commit/6b8b90bede4dcc5976eb5a2be0f8506d155f9139))


### Bug Fixes

* **auction-bid:** disable bid button if no amount ([cf6036a](https://github.com/aeternity/superhero-wallet/commit/cf6036a36999a1a51e9c100c743cff9d79518ba8))
* calculate fee for the token spend properly ([35a9a55](https://github.com/aeternity/superhero-wallet/commit/35a9a552e4d2a84e1a74b6dfdd9b0b5e033d2af9))
* claiming from url ([30fd918](https://github.com/aeternity/superhero-wallet/commit/30fd9184bed34b9827360a0eafae3ca3c6bcbae0))
* **deeplink-api:** complete opening a callback url correctly ([0aceed3](https://github.com/aeternity/superhero-wallet/commit/0aceed32cafc12c50f1df339e7efa11a20997a7a))
* display currency list over filters ([b0aebd1](https://github.com/aeternity/superhero-wallet/commit/b0aebd199758033ebaabcb74ff779bc86205b5b2))
* do not reload not connected tabs ([1dcd699](https://github.com/aeternity/superhero-wallet/commit/1dcd6998f38659ae37037836f2bcd4908a99fa3f))
* do not show spend-success modal multiple time for a one transaction ([61ad864](https://github.com/aeternity/superhero-wallet/commit/61ad8644a9f59c5777c92b923d85800eefe81329))
* **fungible-tokens:** avoid showing incomplete DEX transactions ([2c17df0](https://github.com/aeternity/superhero-wallet/commit/2c17df0188af752ef2ede4ce9fbd2ed80ccd22d5))
* **invite:** claiming from invite link ([882fc1b](https://github.com/aeternity/superhero-wallet/commit/882fc1bf08642e39120acdfc40c4bfad6aca0120))
* **ledger:** propely sign transactions with ledger ([9f36fbc](https://github.com/aeternity/superhero-wallet/commit/9f36fbc7c23984b95490a8b4d027f3ab3b2f8570))
* **ledger:** use not deprecated transport ([b71e9c7](https://github.com/aeternity/superhero-wallet/commit/b71e9c74442aef158c318e681cf63ddfe75a98fc))
* load all auctions at once ([e329213](https://github.com/aeternity/superhero-wallet/commit/e329213d4af4bac11a1ed8186f609233e8b0eff5))
* load currencies after a time interval ([ab15d0d](https://github.com/aeternity/superhero-wallet/commit/ab15d0dad5241aac20153848d63ed1392f82de7b))
* **modal:** show modals over Header component ([77b7e64](https://github.com/aeternity/superhero-wallet/commit/77b7e64c7d80f78008f574c22773158574500c67))
* **mutations:** avoid potential problems with missing fields ([c462025](https://github.com/aeternity/superhero-wallet/commit/c462025f42dfb2cbac0159f966a6500ec2f4ea66))
* **mutations:** remove pending transctions on network/account change ([e63aaf4](https://github.com/aeternity/superhero-wallet/commit/e63aaf4abab2e295125c4d85ac9128d80a9b3c42))
* **name-list:** fetch owned names every 10 seconds ([c7327ea](https://github.com/aeternity/superhero-wallet/commit/c7327ea15af19b55b6c12b11d54a93b36de0b0b3))
* **name-list:** show the loader when the transactions are loading ([062a813](https://github.com/aeternity/superhero-wallet/commit/062a813c3a51c5e84e83a006ffdb5e1cb7db7c17))
* **names:** handle correctly preferred name response ([31c5874](https://github.com/aeternity/superhero-wallet/commit/31c5874e8781e5d07d808f7b1d10f18775a7a33d))
* **names:** setting a pointer ([65f671f](https://github.com/aeternity/superhero-wallet/commit/65f671fba825925033aab83f64dca56fe09bcc6e))
* **persist-state:** sync state between stores properly ([6c21387](https://github.com/aeternity/superhero-wallet/commit/6c2138791adfb5b3e02581561fdeda758f765941))
* **sdk:** enable signing with a permissions module ([886f763](https://github.com/aeternity/superhero-wallet/commit/886f76307f6f218c95a0604cd1e00c68e845c95f))
* show all transactions in proper order ([f11a700](https://github.com/aeternity/superhero-wallet/commit/f11a700c88863884c3e5b6128d0c2dad159e5389))
* show proper information for the tip pending transaction ([3feec13](https://github.com/aeternity/superhero-wallet/commit/3feec1361ece777c5daa380e348df38fd4f4acb9))
* show proper information for tranfer_payload transactions ([3085df1](https://github.com/aeternity/superhero-wallet/commit/3085df19c45feb5adf121fdfd147ead0f9da9d29))
* **sign-transaction:** do not allow to sign on a different network ([3b2acd4](https://github.com/aeternity/superhero-wallet/commit/3b2acd4405bace41357fd0152491e1e3be854329))
* **spend-success:** show the proper spend transaction symbol ([36d9aca](https://github.com/aeternity/superhero-wallet/commit/36d9acabcda144cce4287251ef8f6b02a99302b3))
* **tabs:** do not show svgs through other elements ([ee8a4fc](https://github.com/aeternity/superhero-wallet/commit/ee8a4fc42e465a49886dd4bc07240874c184498b))
* **token-details:** add a proper link to a simplex ([e8f9bad](https://github.com/aeternity/superhero-wallet/commit/e8f9badf37c7f0243066d0f6772a437bba276c8d))
* **token-list:** set a proper simplex url ([6c8f686](https://github.com/aeternity/superhero-wallet/commit/6c8f686a1c254e082323c4afa40a236716f2300f))
* **tokens:** do not read properties of null ([8fb40f1](https://github.com/aeternity/superhero-wallet/commit/8fb40f122b233febed9c555cde4970048f169a04))
* **transaction-list:** do not consider every contract with tip/retip function as tipping ([ebcceba](https://github.com/aeternity/superhero-wallet/commit/ebcceba2bfae97b31ddb92f2ba972bb3a039fd1f))
* **transaction-list:** support PayingForTx type ([5979400](https://github.com/aeternity/superhero-wallet/commit/5979400b05184ca61d33e357413719b19af675c7))
* **transaction-token-info-resolvers:** avoid reading properties of undefined ([fe0a425](https://github.com/aeternity/superhero-wallet/commit/fe0a42510793bbea4ba8c766f6a70f497c261173))
* **transaction-token-info-resolver:** show correct tokens for swapTokensForExactTokens function ([fc9ad95](https://github.com/aeternity/superhero-wallet/commit/fc9ad950d37277a07179fae249cf2b2ef32cd8da))
* **transactions:** mutate nested transactions fields reactivly ([386d782](https://github.com/aeternity/superhero-wallet/commit/386d7821e44a81aa59673a1bb16dfa084230ddfd))
* **transactions:** remove fiat from amount for tokens other than ae ([efea108](https://github.com/aeternity/superhero-wallet/commit/efea108dc5934175263c8603033d535635a59fc7))
* **transactions:** show labels for fungible tokens pending transactions ([29e5c54](https://github.com/aeternity/superhero-wallet/commit/29e5c54eb7223690fa532378c51d84f2c5e9f077))


### Style

* **swap-route:** adjust scss ([3c24f9a](https://github.com/aeternity/superhero-wallet/commit/3c24f9a7607ef35ad1a68a1df61ca060e753ad0d))


### Tests

* ignore tests failing because of 3d party problems ([25ac082](https://github.com/aeternity/superhero-wallet/commit/25ac082eda0177a92071a12252f83c98ca53030c))
* improve unit testing coverage ([2544996](https://github.com/aeternity/superhero-wallet/commit/25449962d19e0b2996cf775e57bf5568265b2ba3))
* **input-amount:** avoid deprecated methods overwriting ([52b0371](https://github.com/aeternity/superhero-wallet/commit/52b0371ea45b544031a576877b7fb054dde1aa15))
* **snapshot:** fix issue with accessing of imported function ([68d96eb](https://github.com/aeternity/superhero-wallet/commit/68d96eb2ac754627892c9d23e71ac08a5a2835dc))


### Performance

* do not fetch all backend transactions on each call ([bc7462a](https://github.com/aeternity/superhero-wallet/commit/bc7462aff55ece003c39be04c66bcda63c32a53c))
* do not have a separate request for each fungible token transaction ([3a0fdde](https://github.com/aeternity/superhero-wallet/commit/3a0fddecbfffe84dfbe308b2c11207389ac3f144))
* do not load additional name entry ([b991b4c](https://github.com/aeternity/superhero-wallet/commit/b991b4c7bd5c27809398dd66c1f818b54a42859a))
* do not make duplicate requests on initialization ([f2810c0](https://github.com/aeternity/superhero-wallet/commit/f2810c00536b31836160345673b12de717bf27af))
* do not poll account info on each AccountInfo instance ([57f3e5f](https://github.com/aeternity/superhero-wallet/commit/57f3e5f2e00cac14eb3062418030e56ba1865253))
* **fungible-tokens:** do not commit each token balance separately ([3df9809](https://github.com/aeternity/superhero-wallet/commit/3df98096942784f76c31b99d29eb4acabd83d458))
* **fungible-tokens:** do not run through not uniq token balances ([6002cfb](https://github.com/aeternity/superhero-wallet/commit/6002cfb2c7bf4eed3ae31f40de03eb5bf0881c8f))
* **fungible-tokens:** remove pointless mutation ([6707be8](https://github.com/aeternity/superhero-wallet/commit/6707be884e676ecf3cf07d8b2d6d5c3fdddf941b))
* **fungible-tokens:** remove pointless unionBy ([fff8ec2](https://github.com/aeternity/superhero-wallet/commit/fff8ec29c1ac6d36339974183d29e283aeb28f68))
* **name-item:** do not fetch owned names in each component instance ([8f48352](https://github.com/aeternity/superhero-wallet/commit/8f4835235f3c21a69a2122e983838c85e071ad37))
* **names:** fetch names in parallel ([7f5e3ea](https://github.com/aeternity/superhero-wallet/commit/7f5e3ea8c8c6142711c33b9f23926d8014c5ce56))
* **transactions:** do not load incomplete transaction every time entering details page ([4bed8f8](https://github.com/aeternity/superhero-wallet/commit/4bed8f836eb481297c6d90bcdc097d609c57d296))
* **wallet:** improve handling await events ([f29efc8](https://github.com/aeternity/superhero-wallet/commit/f29efc8daa3ed9f9a9e73d9c1267f63070db23ac))


### Maintenance

* add dex contracts for testnet and mainnet ([540db78](https://github.com/aeternity/superhero-wallet/commit/540db787dc1a48946c7ddb65a8b59494d225cd79))
* add transactionTokenInfoResolvers ([a39d1e9](https://github.com/aeternity/superhero-wallet/commit/a39d1e9f93e5225d277317217919d661921cefe6))
* adjust NameItem component ([cca7ee1](https://github.com/aeternity/superhero-wallet/commit/cca7ee1b38f3e694ab81be58b389ba20c2208b15))
* align every contract id notations ([4e85a28](https://github.com/aeternity/superhero-wallet/commit/4e85a2887a37c2d513701b91791b905ce7fff27f))
* **App:** drop useless code ([40d96ec](https://github.com/aeternity/superhero-wallet/commit/40d96ec8b5c22327f38bfc207c6b047ced8dad9a))
* **constants:** add dex related transaction types constant ([2a1f0b7](https://github.com/aeternity/superhero-wallet/commit/2a1f0b7a8666edd5556fb399f034bcb6b9787ea1))
* do not poll currencies if not logged in ([f97a76c](https://github.com/aeternity/superhero-wallet/commit/f97a76cc5b39a2143ee26dedaaf9618fba038945))
* do not show fiat value for the liquidity transactions ([05811a6](https://github.com/aeternity/superhero-wallet/commit/05811a6da4c52d4ccf6381d4eb16aba56a1641de))
* extract background sdk into plugin ([b9bb7a5](https://github.com/aeternity/superhero-wallet/commit/b9bb7a508399607837ddc6847a62e25ede3f41f4))
* **ledger:** remove unused ledger bridge ([c1ce862](https://github.com/aeternity/superhero-wallet/commit/c1ce86256591df5ed881eb26a9222780ce3c45ff))
* **name-item:** remove unused prop ([541bde6](https://github.com/aeternity/superhero-wallet/commit/541bde6c0c326963faa580c6591326ff6482d72e))
* **release:** 0.9.10 ([c481816](https://github.com/aeternity/superhero-wallet/commit/c481816371555018e3b942dc56dc385e3eb4eb2d))
* remove unused variables ([38213a9](https://github.com/aeternity/superhero-wallet/commit/38213a9f4e475b15394cda41bdabfbf2d98483c9))
* show also retip transactions when filtered by tips ([4124442](https://github.com/aeternity/superhero-wallet/commit/4124442da0ba07c3051575f3f81e17f8d49fb8b7))
* show pending transaction until middleware returns it ([438cb26](https://github.com/aeternity/superhero-wallet/commit/438cb263b880866ec2a26fda8cffa0d7fd7c50ea))
* **transaction-details:** exclude unfinished components from production ([34f6565](https://github.com/aeternity/superhero-wallet/commit/34f6565de7fef7d0746a1a3e06c891f8ce7fb381))
* **transaction-info-resolver:** adjust to provide more info ([d925cfb](https://github.com/aeternity/superhero-wallet/commit/d925cfba24c172aca2c0d47e32a27064f9754d02))
* **transactions:** add labels for a tip/retip transactions ([04c59f1](https://github.com/aeternity/superhero-wallet/commit/04c59f18422fd4cffbf402f66f7e97aa4834bd1d))
* **transactions:** change the page title ([be133ae](https://github.com/aeternity/superhero-wallet/commit/be133aebc0a49387dbd9fe8b1ef7a696bc5fd353))
* **wallet:** use sdkPlugin instead of initializing new one ([80c3f6f](https://github.com/aeternity/superhero-wallet/commit/80c3f6f49e5d90bbb44e2d36617553da7ae3c281))

### [0.9.10](https://github.com/aeternity/superhero-wallet/compare/v0.9.9...v0.9.10) (2022-07-22)


### Features

* address shortening component ([55edeea](https://github.com/aeternity/superhero-wallet/commit/55edeead669b31e0a4b54f323a66d5b44faa7562))
* show all tokens user had activity with ([15aef34](https://github.com/aeternity/superhero-wallet/commit/15aef3445a660a991eed49df2b31490e709c9563))
* store pending transactions for each node ([1b11998](https://github.com/aeternity/superhero-wallet/commit/1b1199854f7af0603385425999af9c382bf3231c))
* tooltip component ([e448f1e](https://github.com/aeternity/superhero-wallet/commit/e448f1ee6c2870bbc7ee3c2814f64994be08b038))
* transaction details swap rates ([406adc2](https://github.com/aeternity/superhero-wallet/commit/406adc2416c09ba0915cfcb5d55d0d6bc3d7fa81))
* transaction details swap route ([28b1111](https://github.com/aeternity/superhero-wallet/commit/28b111162d52ad804cae3e0d60207da5bc51ca18))
* **transaction-list:** ablity to filter pending transactions ([f7c624e](https://github.com/aeternity/superhero-wallet/commit/f7c624ec81899b850e748d6df0059a48efc8a599))


### Bug Fixes

* calculate fee for the token spend properly ([35a9a55](https://github.com/aeternity/superhero-wallet/commit/35a9a552e4d2a84e1a74b6dfdd9b0b5e033d2af9))
* claiming from url ([30fd918](https://github.com/aeternity/superhero-wallet/commit/30fd9184bed34b9827360a0eafae3ca3c6bcbae0))
* display currency list over filters ([b0aebd1](https://github.com/aeternity/superhero-wallet/commit/b0aebd199758033ebaabcb74ff779bc86205b5b2))
* do not reload not connected tabs ([1dcd699](https://github.com/aeternity/superhero-wallet/commit/1dcd6998f38659ae37037836f2bcd4908a99fa3f))
* do not show spend-success modal multiple time for a one transaction ([61ad864](https://github.com/aeternity/superhero-wallet/commit/61ad8644a9f59c5777c92b923d85800eefe81329))
* **ledger:** propely sign transactions with ledger ([9f36fbc](https://github.com/aeternity/superhero-wallet/commit/9f36fbc7c23984b95490a8b4d027f3ab3b2f8570))
* **ledger:** use not deprecated transport ([b71e9c7](https://github.com/aeternity/superhero-wallet/commit/b71e9c74442aef158c318e681cf63ddfe75a98fc))
* load all auctions at once ([e329213](https://github.com/aeternity/superhero-wallet/commit/e329213d4af4bac11a1ed8186f609233e8b0eff5))
* load currencies after a time interval ([ab15d0d](https://github.com/aeternity/superhero-wallet/commit/ab15d0dad5241aac20153848d63ed1392f82de7b))
* **modal:** show modals over Header component ([77b7e64](https://github.com/aeternity/superhero-wallet/commit/77b7e64c7d80f78008f574c22773158574500c67))
* **mutations:** avoid potential problems with missing fields ([c462025](https://github.com/aeternity/superhero-wallet/commit/c462025f42dfb2cbac0159f966a6500ec2f4ea66))
* **mutations:** remove pending transctions on network/account change ([e63aaf4](https://github.com/aeternity/superhero-wallet/commit/e63aaf4abab2e295125c4d85ac9128d80a9b3c42))
* **name-list:** fetch owned names every 10 seconds ([c7327ea](https://github.com/aeternity/superhero-wallet/commit/c7327ea15af19b55b6c12b11d54a93b36de0b0b3))
* **name-list:** show the loader when the transactions are loading ([062a813](https://github.com/aeternity/superhero-wallet/commit/062a813c3a51c5e84e83a006ffdb5e1cb7db7c17))
* **names:** handle correctly preferred name response ([31c5874](https://github.com/aeternity/superhero-wallet/commit/31c5874e8781e5d07d808f7b1d10f18775a7a33d))
* **persist-state:** sync state between stores properly ([6c21387](https://github.com/aeternity/superhero-wallet/commit/6c2138791adfb5b3e02581561fdeda758f765941))
* **sdk:** enable signing with a permissions module ([886f763](https://github.com/aeternity/superhero-wallet/commit/886f76307f6f218c95a0604cd1e00c68e845c95f))
* show all transactions in proper order ([f11a700](https://github.com/aeternity/superhero-wallet/commit/f11a700c88863884c3e5b6128d0c2dad159e5389))
* show proper information for the tip pending transaction ([3feec13](https://github.com/aeternity/superhero-wallet/commit/3feec1361ece777c5daa380e348df38fd4f4acb9))
* show proper information for tranfer_payload transactions ([4532e69](https://github.com/aeternity/superhero-wallet/commit/4532e698608012760d804f57f3728be6b6ed780f))
* **spend-success:** show the proper spend transaction symbol ([36d9aca](https://github.com/aeternity/superhero-wallet/commit/36d9acabcda144cce4287251ef8f6b02a99302b3))
* **tabs:** do not show svgs through other elements ([ba07ffc](https://github.com/aeternity/superhero-wallet/commit/ba07ffc0f9413792fa5689761867c5ce4d4105ca))
* **token-details:** add a proper link to a simplex ([e8f9bad](https://github.com/aeternity/superhero-wallet/commit/e8f9badf37c7f0243066d0f6772a437bba276c8d))
* **token-list:** set a proper simplex url ([6c8f686](https://github.com/aeternity/superhero-wallet/commit/6c8f686a1c254e082323c4afa40a236716f2300f))
* **tokens:** do not read properties of null ([8fb40f1](https://github.com/aeternity/superhero-wallet/commit/8fb40f122b233febed9c555cde4970048f169a04))


### Tests

* improve unit testing coverage ([2544996](https://github.com/aeternity/superhero-wallet/commit/25449962d19e0b2996cf775e57bf5568265b2ba3))
* **input-amount:** avoid deprecated methods overwriting ([52b0371](https://github.com/aeternity/superhero-wallet/commit/52b0371ea45b544031a576877b7fb054dde1aa15))
* **snapshot:** fix issue with accessing of imported function ([68d96eb](https://github.com/aeternity/superhero-wallet/commit/68d96eb2ac754627892c9d23e71ac08a5a2835dc))


### Maintenance

* add dex contracts for testnet and mainnet ([540db78](https://github.com/aeternity/superhero-wallet/commit/540db787dc1a48946c7ddb65a8b59494d225cd79))
* add transactionTokenInfoResolvers ([a39d1e9](https://github.com/aeternity/superhero-wallet/commit/a39d1e9f93e5225d277317217919d661921cefe6))
* align every contract id notations ([4e85a28](https://github.com/aeternity/superhero-wallet/commit/4e85a2887a37c2d513701b91791b905ce7fff27f))
* **App:** drop useless code ([40d96ec](https://github.com/aeternity/superhero-wallet/commit/40d96ec8b5c22327f38bfc207c6b047ced8dad9a))
* **constants:** add dex related transaction types constant ([2a1f0b7](https://github.com/aeternity/superhero-wallet/commit/2a1f0b7a8666edd5556fb399f034bcb6b9787ea1))
* do not poll currencies if not logged in ([f97a76c](https://github.com/aeternity/superhero-wallet/commit/f97a76cc5b39a2143ee26dedaaf9618fba038945))
* extract background sdk into plugin ([b9bb7a5](https://github.com/aeternity/superhero-wallet/commit/b9bb7a508399607837ddc6847a62e25ede3f41f4))
* **ledger:** remove unused ledger bridge ([c1ce862](https://github.com/aeternity/superhero-wallet/commit/c1ce86256591df5ed881eb26a9222780ce3c45ff))
* remove unused variables ([38213a9](https://github.com/aeternity/superhero-wallet/commit/38213a9f4e475b15394cda41bdabfbf2d98483c9))
* show also retip transactions when filtered by tips ([4124442](https://github.com/aeternity/superhero-wallet/commit/4124442da0ba07c3051575f3f81e17f8d49fb8b7))
* show pending transaction until middleware returns it ([438cb26](https://github.com/aeternity/superhero-wallet/commit/438cb263b880866ec2a26fda8cffa0d7fd7c50ea))
* **transaction-details:** exclude unfinished components from production ([34f6565](https://github.com/aeternity/superhero-wallet/commit/34f6565de7fef7d0746a1a3e06c891f8ce7fb381))
* **wallet:** use sdkPlugin instead of initializing new one ([80c3f6f](https://github.com/aeternity/superhero-wallet/commit/80c3f6f49e5d90bbb44e2d36617553da7ae3c281))


### Performance

* do not fetch all backend transactions on each call ([bc7462a](https://github.com/aeternity/superhero-wallet/commit/bc7462aff55ece003c39be04c66bcda63c32a53c))
* do not have a separate request for each fungible token transaction ([3a0fdde](https://github.com/aeternity/superhero-wallet/commit/3a0fddecbfffe84dfbe308b2c11207389ac3f144))
* do not load additional name entry ([b991b4c](https://github.com/aeternity/superhero-wallet/commit/b991b4c7bd5c27809398dd66c1f818b54a42859a))
* do not make duplicate requests on initialization ([f2810c0](https://github.com/aeternity/superhero-wallet/commit/f2810c00536b31836160345673b12de717bf27af))
* do not poll account info on each AccountInfo instance ([57f3e5f](https://github.com/aeternity/superhero-wallet/commit/57f3e5f2e00cac14eb3062418030e56ba1865253))
* **fungible-tokens:** do not commit each token balance separately ([3df9809](https://github.com/aeternity/superhero-wallet/commit/3df98096942784f76c31b99d29eb4acabd83d458))
* **fungible-tokens:** do not run through not uniq token balances ([6002cfb](https://github.com/aeternity/superhero-wallet/commit/6002cfb2c7bf4eed3ae31f40de03eb5bf0881c8f))
* **fungible-tokens:** remove pointless mutation ([742f949](https://github.com/aeternity/superhero-wallet/commit/742f9494c65ca3e66eb0343e750461aa56ed3846))
* **fungible-tokens:** remove pointless unionBy ([d5c7abb](https://github.com/aeternity/superhero-wallet/commit/d5c7abb0381d448935bffa1423f8d87aa5b947c4))
* **name-item:** do not fetch owned names in each component instance ([8f48352](https://github.com/aeternity/superhero-wallet/commit/8f4835235f3c21a69a2122e983838c85e071ad37))
* **names:** fetch names in parallel ([7f5e3ea](https://github.com/aeternity/superhero-wallet/commit/7f5e3ea8c8c6142711c33b9f23926d8014c5ce56))
* **wallet:** improve handling await events ([f29efc8](https://github.com/aeternity/superhero-wallet/commit/f29efc8daa3ed9f9a9e73d9c1267f63070db23ac))

### [0.9.9](https://github.com/aeternity/superhero-wallet/compare/v0.9.8...v0.9.9) (2022-06-10)


### Bug Fixes

* open simplex in the new tab on every platform ([5ed9c05](https://github.com/aeternity/superhero-wallet/commit/5ed9c059b6d72aa4101445360216769e26c48770))

### [0.9.8](https://github.com/aeternity/superhero-wallet/compare/v0.9.7...v0.9.8) (2022-05-29)


### Features

* enable simplex ([2bc57dc](https://github.com/aeternity/superhero-wallet/commit/2bc57dca407731ad1f52afe9c525736fb3a0ff4c))


### Bug Fixes

* **account-info:** show default account name ([797e226](https://github.com/aeternity/superhero-wallet/commit/797e22650e167ec5a8b3aacba82924728b67cf71))
* **claim:** check name fee using new sdk ([f45088d](https://github.com/aeternity/superhero-wallet/commit/f45088d806a2b8b06a4523cec2222b7166361926))
* **deeplink-api:** fix special symbols encoding in callback url ([e076235](https://github.com/aeternity/superhero-wallet/commit/e0762350d14064571a55b58dc11721ff692c53f3))
* **deeplink-api:** open all callback urls in the same tab ([a4ae911](https://github.com/aeternity/superhero-wallet/commit/a4ae911320d96bed242cf13773dcd321814c6c3c))
* **fungible-tokens:** handle errors on update tokens info ([09b1d46](https://github.com/aeternity/superhero-wallet/commit/09b1d46d59c6261920e5c1c9450df84a50c8a16b))
* **invite-item:** copy the link to the clipboard ([5d85482](https://github.com/aeternity/superhero-wallet/commit/5d85482c570d8328c40ca1dd506bcf6a6c02e528))
* **names:** get auctions list using new middleware ([78b2fd7](https://github.com/aeternity/superhero-wallet/commit/78b2fd7612991f7445003c3c86cae06be421a612))
* **names:** load owned names from both nodes ([260178e](https://github.com/aeternity/superhero-wallet/commit/260178e62bd1b79bab35423f65c8981ed2257656))
* **transactions:** add payerId for comparison in tx direction ([f90a095](https://github.com/aeternity/superhero-wallet/commit/f90a095726330050887b2f7f9e90bfd55660b377))
* **transactions:** show tipped url only in transaction with function equal to 'tip' ([438db45](https://github.com/aeternity/superhero-wallet/commit/438db45acb64416b4caece779b8cfb02d9c3c2ea))
* **unit-tests:** use sdk modules instead of inside imports ([39344e2](https://github.com/aeternity/superhero-wallet/commit/39344e2a6e906c4affe14aac9c6c2839c685c295))
* welcome screen message for mobile ([1f99246](https://github.com/aeternity/superhero-wallet/commit/1f9924681380982ebfc74dde940b28d61839394a))


### Tests

* fix snapshots test ([6e8f608](https://github.com/aeternity/superhero-wallet/commit/6e8f60811202dce53d04c8ccb75b87d9e867acff))


### Maintenance

* change `==` to `===` in ToS ([70b1588](https://github.com/aeternity/superhero-wallet/commit/70b1588c1b17a0b07e540652e647db2559488136))
* extract links to constants.js ([ebb9a73](https://github.com/aeternity/superhero-wallet/commit/ebb9a7338d72b9b9223e216f5315bf6aa1dc8955))
* remove unused/unnecessary config files ([8b84e60](https://github.com/aeternity/superhero-wallet/commit/8b84e607e8f9006ef56a6680e0a5329ac31f138c))
* update dependencies ([23669de](https://github.com/aeternity/superhero-wallet/commit/23669debc9c9dc61a1fdb85d5a6196898f883fd3))
* update fontsource/ibm-plex-sans ([497949c](https://github.com/aeternity/superhero-wallet/commit/497949ce0a15edf0f85380eca0b84eaac3ed4e48))
* update package-lock to lockfileVersion 2 ([108d4df](https://github.com/aeternity/superhero-wallet/commit/108d4df24feaf0764786111507daf5d5366a57c1))
* update SDK to 11.0.1 ([bd25325](https://github.com/aeternity/superhero-wallet/commit/bd2532543f5678221b50bacc6fcc298ab36f2849))
* update uuid ([2604f11](https://github.com/aeternity/superhero-wallet/commit/2604f115b1c98974198052f063d924164f910fe2))

### [0.9.7](https://github.com/aeternity/superhero-wallet/compare/v0.9.6...v0.9.7) (2022-03-22)


### Bug Fixes

* call deny on denied address subscription ([3dcc1db](https://github.com/aeternity/superhero-wallet/commit/3dcc1db1357bc1bdd5a889f8492572b80343f333))
* send connection close message to the aepps ([2149556](https://github.com/aeternity/superhero-wallet/commit/214955689f420c1c4797e6e21f87d4f8d3968fa2))

### [0.9.6](https://github.com/aeternity/superhero-wallet/compare/v0.9.5...v0.9.6) (2021-12-13)


### Features

* receive transaction for signing through deeplink ([f1a292a](https://github.com/aeternity/superhero-wallet/commit/f1a292a82515aeea88859ff7f8a257c23362c058))

### [0.9.5](https://github.com/aeternity/superhero-wallet/compare/v0.9.4...v0.9.5) (2021-11-23)


### Features

* save transactions in session ([707561d](https://github.com/aeternity/superhero-wallet/commit/707561d86cb7fa3aa52e2a111727eef5c7602159))
* **transaction-list:** save scroll position ([23da760](https://github.com/aeternity/superhero-wallet/commit/23da760465d21f4ddd5be004a12a585d22638e18))


### Bug Fixes

* **transaction-details:** fetch transaction if not preloaded ([bc65967](https://github.com/aeternity/superhero-wallet/commit/bc65967f5250b6777d8b3be5a1b1d78961a9b584))


### Maintenance

* **migrations:** add changeTransactionStructure migration ([af11f64](https://github.com/aeternity/superhero-wallet/commit/af11f64f65a1e961a9ed2af90f68cb334004ca38))
* **transaction-list:** remove useless setTimeout ([0e41081](https://github.com/aeternity/superhero-wallet/commit/0e4108104222c3b7b6f62358b960adb777ed9478))
* **transactions:** use next page to load additional transactions ([6a0392f](https://github.com/aeternity/superhero-wallet/commit/6a0392f463acc2c5757d50a47c7ac768f1f677e6))

### [0.9.4](https://github.com/aeternity/superhero-wallet/compare/v0.9.3...v0.9.4) (2021-11-10)


### Features

* **android-build:** build for higher target sdk version ([991efb6](https://github.com/aeternity/superhero-wallet/commit/991efb61e2b2c547412ebd034bd87a756191b3ee))
* **input-amount:** use veeValidate in all amount inputs ([fcf9ef7](https://github.com/aeternity/superhero-wallet/commit/fcf9ef7789540932ef7ce3b20a360c90fc8198b3))
* **status:** add offline status ([daadb77](https://github.com/aeternity/superhero-wallet/commit/daadb7760f9ac9954a87ceed72a8e628e9e71b19))
* **tip-calim:** add additional info ([147d901](https://github.com/aeternity/superhero-wallet/commit/147d901d10a5ad248c01b7734fdf3c8d24666214))
* **tip-send:** add additional info ([4f8a79b](https://github.com/aeternity/superhero-wallet/commit/4f8a79b9e56b22b161cb51459c5e5621841fc112))
* **transfer-send:** fill address if qr consist of it ([2378a8f](https://github.com/aeternity/superhero-wallet/commit/2378a8f50beeb8613dc19f60e738096211a948d8))


### Bug Fixes

* **account-card:** adjust card minifying ([01e45ef](https://github.com/aeternity/superhero-wallet/commit/01e45ef22308e93a20d78a4cd4bc23e43871a730))
* **account-info:** reflect the preffered name change from other deivce ([917df92](https://github.com/aeternity/superhero-wallet/commit/917df922c7c19b57c244347c6da66d5a37646e75))
* **account-info:** remove wrong button background-color ([c13c50d](https://github.com/aeternity/superhero-wallet/commit/c13c50d41d4fc4f06730e73e35b33986bb232758))
* **account-switcher:** align single card in the middle ([a914271](https://github.com/aeternity/superhero-wallet/commit/a914271b2f5e372f88868b009f2901693c40c49a))
* **intro:** adjust checkbox size ([78709bb](https://github.com/aeternity/superhero-wallet/commit/78709bb14f62939eb4df2ec7fe482519383db1d9))
* **retip:** use valid name of error property ([bb1d416](https://github.com/aeternity/superhero-wallet/commit/bb1d4167c11a73c77549dd2d241fe43bb4a8b23c))
* set empty amount in InpitAmount ([2e3b197](https://github.com/aeternity/superhero-wallet/commit/2e3b1975ef74b7a551ae6675e18a8c520ed1d16b))
* **tab-bar:** avoid env not getting add ([42a03c5](https://github.com/aeternity/superhero-wallet/commit/42a03c52df9c84057a097bfdfbe9f0efffdb32a2))
* **transaction-list:** do not send request after component being destroyed ([f63f41d](https://github.com/aeternity/superhero-wallet/commit/f63f41d15b4bdad1d6724ee6cbe9b05fff2eb09c))
* **transaction-list:** show transactions to a name ([c263e04](https://github.com/aeternity/superhero-wallet/commit/c263e04a7e2861608f6617707f4f0fc946f80403))
* **transaction-overview:** show properly if recipient is the name ([fc39320](https://github.com/aeternity/superhero-wallet/commit/fc3932068d8875fa487a157e86a10f0819c4cff7))
* **truncate:** adjust scrolling on str change ([13ec1e0](https://github.com/aeternity/superhero-wallet/commit/13ec1e02cb126999057d1474bd910662b6978e11))


### Performance

* **fungible-tokens:** avoid additional fungible tokens requests ([fcd6f71](https://github.com/aeternity/superhero-wallet/commit/fcd6f71b84a0a17a806655f64aafb3bfdac6a140))
* **icons:** compress iframe onboarding icons ([007fe50](https://github.com/aeternity/superhero-wallet/commit/007fe50a3fea0600780ef7e570f22e8ded6a26b5))


### Tests

* **input-amount:** extend test and use VeeValidate ([44be6ba](https://github.com/aeternity/superhero-wallet/commit/44be6bae24f053e1120e79364ac98adc991bd5a3))
* **withdraw:** remove duplicate part of test ([3ebf3a2](https://github.com/aeternity/superhero-wallet/commit/3ebf3a226392e26950d561fec9d0e5e82f401ff0))


### Style

* add a proper mustache style ([6b94ec6](https://github.com/aeternity/superhero-wallet/commit/6b94ec636bd2f80d85adf0baab726686a4c8a68b))
* clean up global styles ([ecc791a](https://github.com/aeternity/superhero-wallet/commit/ecc791a9193ed1c47dc2dc1f0d0b95dd3ccb65dc))
* **intro:** adjust css ([01c028e](https://github.com/aeternity/superhero-wallet/commit/01c028eacfd87e49f1f45c437b325c768cad409c))
* **security-settings:** adjust css ([8a1ae1b](https://github.com/aeternity/superhero-wallet/commit/8a1ae1b4d1e0d856e6d73d2ee29fbb7aef96018a))


### Maintenance

* **account-switcher:** align card-wrapper centered ([1c18a05](https://github.com/aeternity/superhero-wallet/commit/1c18a055ca49823d4abd7a8789d13553d6583d8c))
* **actions:** drop workaround for the duplicate transactions from mdw ([d9324d3](https://github.com/aeternity/superhero-wallet/commit/d9324d3f8ec9afcbd08810989dc02dffb29c609f))
* bump version in tests ([b34d3c1](https://github.com/aeternity/superhero-wallet/commit/b34d3c1c96d5333719fd35b52a3788b31cc768f0))
* **intro:** use esixting varibale ([954945f](https://github.com/aeternity/superhero-wallet/commit/954945fb7078fced6467680521eeb9938e984fa7))
* **invite:** remove non-existent prop ([47971e9](https://github.com/aeternity/superhero-wallet/commit/47971e92db8c6f20738a0bd3ed114a7fd31df7f6))
* **name-row:** remove unused styles ([edaa9f1](https://github.com/aeternity/superhero-wallet/commit/edaa9f15602e83e65f3cf60672aed5859b5c68f0))
* remove Tour component ([6a82a31](https://github.com/aeternity/superhero-wallet/commit/6a82a3132d31e3b763cf666a5f36e10abf612450))
* remove unused Badge component ([d6664c1](https://github.com/aeternity/superhero-wallet/commit/d6664c1fe19774bf7ed1f511b0039c1f926e8df5))
* remove unused SignAccountIdenticons component ([3ab4984](https://github.com/aeternity/superhero-wallet/commit/3ab498449656f7f8cdd020703ad9f7453fed6da4))
* **sass:** removed unused node-sass package ([00eebd4](https://github.com/aeternity/superhero-wallet/commit/00eebd441818a9eab1967d0ccedda1e956eaae86))
* **transaction-list:** show no transaction message centered ([8a1fd5f](https://github.com/aeternity/superhero-wallet/commit/8a1fd5ff7e3bd8b83ee75c49ced4da3965304072))
* utilize line-height property in rebranded pages ([55ca3af](https://github.com/aeternity/superhero-wallet/commit/55ca3af11066b139db9d00909b30ff1fedcfc884))

### [0.9.3](https://github.com/aeternity/superhero-wallet/compare/v0.9.2...v0.9.3) (2021-10-18)


### Features

* **accounts:** add ledger module ([a2f98d3](https://github.com/aeternity/superhero-wallet/commit/a2f98d3b52bf89d94ed8d3e0f225b7c858dd2acc))
* **aex9:** don't display fiat value for aex9 tokens ([11bb4d3](https://github.com/aeternity/superhero-wallet/commit/11bb4d30f42278d179f82cd214d9e52972e2a745))
* **buy:** add buy button and page ([f11881e](https://github.com/aeternity/superhero-wallet/commit/f11881e705af0d1f5041480fe860a22efe6c9749))
* **claim:** show name price before submit ([f337767](https://github.com/aeternity/superhero-wallet/commit/f3377676060c8feb7740afacea1cdeb59eb81144))
* **index:** add message on disabled JavaScript ([a8c3702](https://github.com/aeternity/superhero-wallet/commit/a8c3702f39978769c60bfb1ddbbbbb5e989a5726))
* **index:** add message on exceptions while bundle initialising ([daa8f70](https://github.com/aeternity/superhero-wallet/commit/daa8f70d3a7cb61d8ec54be7c2c70e2159fc9a25))
* **ledger:** add ledger compatibility with extension ([22147a4](https://github.com/aeternity/superhero-wallet/commit/22147a40ff25f6cf24d56e238eac7fa89b227386))
* **receive:** add share functionality to receive screen ([2490006](https://github.com/aeternity/superhero-wallet/commit/249000638fad157ceb8f6490faac153758a62f2e))
* **router:** open simplex in separate tab for extension and mobile ([6634fca](https://github.com/aeternity/superhero-wallet/commit/6634fca4c1b7fe2d3a478e085afa1aaf81c288e6))
* **send:** add share string parsing ([03be916](https://github.com/aeternity/superhero-wallet/commit/03be9163e6554ff2b22219152e476417aea2741c))
* **share-qr:** add pseudo element on copy ([fd91f66](https://github.com/aeternity/superhero-wallet/commit/fd91f6606cee5c25f7d491f6aca9e348f2025979))
* **transfer-send:** rebrand send workflow ([4f0715a](https://github.com/aeternity/superhero-wallet/commit/4f0715a344adf062b5c8f89b3ab1f76a2e07d19c))


### Bug Fixes

* **accounts:** use uniq key ([9ede492](https://github.com/aeternity/superhero-wallet/commit/9ede492ff2737af787d62a02b3aa3327bc225077))
* **account:** use decode instead of removed assertedType ([24f961e](https://github.com/aeternity/superhero-wallet/commit/24f961e33375ea8ba0e69ec1bef46f4a6b588084))
* allow builds in non git environments ([cddf6fe](https://github.com/aeternity/superhero-wallet/commit/cddf6fe8d053d6956e969700dcb29fbedaa7bcf0))
* **check-box:** start value has mixed support, using flex-start instead ([4de09fd](https://github.com/aeternity/superhero-wallet/commit/4de09fd1e4bf74a2154f476d8f370487950fe486))
* **copy-plugin:** copy web folder in dist ([187ad9e](https://github.com/aeternity/superhero-wallet/commit/187ad9ee44f088a57eec5f262e061539a69baf24))
* **transaction-details:** prevent non external redirection ([845d782](https://github.com/aeternity/superhero-wallet/commit/845d782eb47775c937c86ba4483a4a8cc5f2e00b))
* **zeit:** linting errors ([4c39430](https://github.com/aeternity/superhero-wallet/commit/4c39430d71ea05bb43e2e1831334c43dd072487b))


### Documentation

* **readme:** update README file ([bfebb7f](https://github.com/aeternity/superhero-wallet/commit/bfebb7f8f2769f78d4b391946dba51429351f4ba))


### Style

* **lint:** resolve lint issues automatically ([bf0ae50](https://github.com/aeternity/superhero-wallet/commit/bf0ae5070ee4a81ca4aa4367974ecf25878e6a5e))
* **lint:** resolve lint issues manually ([a362af6](https://github.com/aeternity/superhero-wallet/commit/a362af60afee0a981b3c02c65c9870e94ed9fe30))
* **modal:** set different border color ([99e7f6a](https://github.com/aeternity/superhero-wallet/commit/99e7f6a7c519260a2de12ffaa00631c691c91f23))


### Tests

* **account:** remove duplicate part of test ([aa2bd9e](https://github.com/aeternity/superhero-wallet/commit/aa2bd9e34fcf54e1978b49b51e8868211d307de6))
* add example unit test ([4d4d029](https://github.com/aeternity/superhero-wallet/commit/4d4d029429265d8cadb245f0705d3aee46c4c6bf))
* **import-account:** convert test from e2e to unit ([6d74918](https://github.com/aeternity/superhero-wallet/commit/6d74918b6d81aa9af39b725bd7c94a58cadb58d3))
* **input-amount:** convert test from e2e to unit ([41272ef](https://github.com/aeternity/superhero-wallet/commit/41272efdf3c835f5f9870ea7d106c47ee9531c76))
* **jest-config:** add several packages to transpile ([fb1e91b](https://github.com/aeternity/superhero-wallet/commit/fb1e91bed0ae04645a11fa07e842282ec929c44d))
* **jest-config:** map inlined components ([0bb6fde](https://github.com/aeternity/superhero-wallet/commit/0bb6fde4c328e02ebb32e5467d7e82ffaef5f5d6))
* **terms-of-service:** convert test from e2e to unit ([859018e](https://github.com/aeternity/superhero-wallet/commit/859018eda26b9f2c40ef5f3019ba2346d18a54c4))
* update test due to work with web version ([183d56a](https://github.com/aeternity/superhero-wallet/commit/183d56addcc130e1114dec9416f0708c07339941))
* use snapshots to test static pages ([7d8ed17](https://github.com/aeternity/superhero-wallet/commit/7d8ed17b85cc182bec51f8928f7d7f63b5327080))


### Maintenance

* **account-info:** do not assign value to a variable twice ([7612c5d](https://github.com/aeternity/superhero-wallet/commit/7612c5d2b3593ae0a6b691b1cf0512790988d8d0))
* **accounts:** extract hdWallet module ([68bed5c](https://github.com/aeternity/superhero-wallet/commit/68bed5ca3367c0ec58539dcbe0d09abd5e9a9483))
* **accounts:** move account plugin to module ([4ddd3c1](https://github.com/aeternity/superhero-wallet/commit/4ddd3c1f1cf10b5cf959ee5f3ddeef51a807ca69))
* **accounts:** move account related to the accounts ([df562aa](https://github.com/aeternity/superhero-wallet/commit/df562aafca6d098e484382562e1f5f8c69acdd07))
* **accounts:** rename state and mutations ([9695e68](https://github.com/aeternity/superhero-wallet/commit/9695e681b2d98cd50c94ff432ec5f7e3ae27a305))
* build using @vue/cli ([70718ad](https://github.com/aeternity/superhero-wallet/commit/70718ad70d4107fcd59c5c575fd5530811742c6d))
* **buy:** add unfinished flag to buy functionality ([29c689a](https://github.com/aeternity/superhero-wallet/commit/29c689a6df94d8884c96ef487c2be4d28e379862))
* **copy:** extract similar copy functionality to mixin ([abe6abe](https://github.com/aeternity/superhero-wallet/commit/abe6abe084b2f0e9191a74d1fc558dff6844f3a6))
* **input-field:** set autocomplete off ([08707f9](https://github.com/aeternity/superhero-wallet/commit/08707f9ff6c797f2d0f71bcdc4594da70076c94b))
* **popup:** remove unused firefox html ([69ab99c](https://github.com/aeternity/superhero-wallet/commit/69ab99c3df66da8358cfeba560461173d88e2260))
* remove unused mapped states ([d76a0da](https://github.com/aeternity/superhero-wallet/commit/d76a0da14a0e49a2b40de955ac807f94fd8ab8fc))
* run npm audit fix ([e214f7e](https://github.com/aeternity/superhero-wallet/commit/e214f7ee890e0755b2e42562510768d4e937ee2d))
* run npm update ([8245153](https://github.com/aeternity/superhero-wallet/commit/824515354ea0d82c754ea348de30328967d5b262))
* **sdk:** update sdk to 9.0.1 ([8ae8cb1](https://github.com/aeternity/superhero-wallet/commit/8ae8cb1a25343182b88d4fb2e8d9c1a33559dd15))
* **template-renderer:** extract similar root node creation ([a19091b](https://github.com/aeternity/superhero-wallet/commit/a19091b02a6b9b7e61abd1bfee5f0558780e77a9))
* **zeit:** do not show error logs on production ([27e7bac](https://github.com/aeternity/superhero-wallet/commit/27e7bac0274040c55de6400cc3764699cd49ce01))
* **zeit:** makes contract pass through from QR code ([9ae2552](https://github.com/aeternity/superhero-wallet/commit/9ae2552924e74bce8f893d12663904d19d0c1dc3))
* **zeit:** removes chain listener and tx cache ([fad2bf4](https://github.com/aeternity/superhero-wallet/commit/fad2bf44235732c57177faab176ebcc80069542d))

### [0.9.2](https://github.com/aeternity/superhero-wallet/compare/v0.9.1...v0.9.2) (2021-09-28)


### Features

* **input:** add warnings to input field ([5086efc](https://github.com/aeternity/superhero-wallet/commit/5086efc7046c667d129fd86dd64f0549fbb418ac))
* **send:** rebrand address input in send screen ([1116153](https://github.com/aeternity/superhero-wallet/commit/111615335d119d81a94446dd4921c8108059b69d))
* **validation:** add vee-validate as plugin ([c913ea4](https://github.com/aeternity/superhero-wallet/commit/c913ea4637de88541d246c3f948e7b4e39cc5d20))
* **vee-validate:** add account validation rules ([b5722d9](https://github.com/aeternity/superhero-wallet/commit/b5722d947ff39dc105d618ad85e720afc1378d2a))
* **vee-validate:** inject warning support to vee-validate ([a41a688](https://github.com/aeternity/superhero-wallet/commit/a41a688cf27725e2f6abaaeb37a7782dc8ff0460))


### Bug Fixes

* **permissions:** fix permissions input styling ([b450cb5](https://github.com/aeternity/superhero-wallet/commit/b450cb5483d4a95ee506435ccd1d7b0d2a73058e))
* **send:** add proper color to valid svg ([9f75935](https://github.com/aeternity/superhero-wallet/commit/9f75935c23de205740e83975b0b2fed7cccc3d3a))
* **send:** restore error for tokens to name sending ([0da891f](https://github.com/aeternity/superhero-wallet/commit/0da891f6a74e401bf377569b27e0c216bef13a3a))


### Maintenance

* **input:** unify input components names ([b25e1d6](https://github.com/aeternity/superhero-wallet/commit/b25e1d6dff8207f94fb0796df807679365c24d26))
* **recent-transactions:** do not hide line on transaction list overlap ([9b3be97](https://github.com/aeternity/superhero-wallet/commit/9b3be9799a0137a7ed97320d01da455153239ccf))
* **stale:** remove stale bot support ([ff5d105](https://github.com/aeternity/superhero-wallet/commit/ff5d105b4ba90a1d24bc1f0b60c924d3fd5006fa))
* **transfer-send:** replace textarea with validatable input ([800babf](https://github.com/aeternity/superhero-wallet/commit/800babf28e276ca6e54b29307422449922eb58e7))

### [0.9.1](https://github.com/aeternity/superhero-wallet/compare/v0.9.0...v0.9.1) (2021-09-16)


### Maintenance

* **paste:** disable paste functionality ([ccb78d8](https://github.com/aeternity/superhero-wallet/commit/ccb78d89a6124469b18575810dfb8a454a949b08))

## [0.9.0](https://github.com/aeternity/superhero-wallet/compare/v0.8.2...v0.9.0) (2021-09-14)


### Features

* **account-card:** rebrand account card ([8431ebc](https://github.com/aeternity/superhero-wallet/commit/8431ebc985892fd81767af5edfe676a8381a87dd))
* **account-card:** smooth card height transition ([7fa503f](https://github.com/aeternity/superhero-wallet/commit/7fa503f407606e85d3b1a406e7974b9500133205))
* **auction-card:** show auctions help modal ([06bdb41](https://github.com/aeternity/superhero-wallet/commit/06bdb41e95544588e2ea48749a0ea6b58767026d))
* **balance-info:** change the approx sing ([2414f65](https://github.com/aeternity/superhero-wallet/commit/2414f65d75232fc22180b7a2465a41793dd3d064))
* **confirm:** add ability to render locales as a template ([f9fa962](https://github.com/aeternity/superhero-wallet/commit/f9fa962ebc640845f97fc701be36f714d156ddbf))
* **cordova:** add cordova-clipboard to dependencies ([8e2c22c](https://github.com/aeternity/superhero-wallet/commit/8e2c22ca315bc8e21ead33424e9d159b798f898a))
* **mobile:** lock orientation to portrait ([1c9e974](https://github.com/aeternity/superhero-wallet/commit/1c9e97468135318c83e0bc167e3e0cd9865dda14))
* **name-item:** add NameItem component ([45d0f12](https://github.com/aeternity/superhero-wallet/commit/45d0f12f64a9a9d8f7186b502ed625826f8be0d0))
* **names:** add AuctionHistory component ([5fc424c](https://github.com/aeternity/superhero-wallet/commit/5fc424c6efb3cd4c6a7d4ec9cd275c4d9cefa697))
* **names:** update auction page to new designs ([370dda7](https://github.com/aeternity/superhero-wallet/commit/370dda70262e56193f361339f8ccaadeb9a54eff))
* **names:** update AuctionBid to new designs ([153f157](https://github.com/aeternity/superhero-wallet/commit/153f1574e67057189e1874979165efe093353f28))
* **qr-reader:** open settings when camera not allowerd on mobile ([4702265](https://github.com/aeternity/superhero-wallet/commit/4702265fab31b11dd0db82bb4e9bfe7a158c5c46))
* redirect from /tip to /tips ([00a4901](https://github.com/aeternity/superhero-wallet/commit/00a490101a38a50f5f6574d67dbec27008db5d76))
* **routes:** add tip redirection ([0a637a8](https://github.com/aeternity/superhero-wallet/commit/0a637a8bf9fa54f308aa0818102677261b69d764))
* show chain name of other users ([74f5d63](https://github.com/aeternity/superhero-wallet/commit/74f5d63a2697c563fb1da076defbb4aed2f8c400))
* **truncate:** allow truncate to be fixed ([53e8d35](https://github.com/aeternity/superhero-wallet/commit/53e8d3550128ac2a88b9d72946bebd19f47e4343))
* **truncate:** animate text scrolling ([e0e2456](https://github.com/aeternity/superhero-wallet/commit/e0e2456e0c2c8fac7d424cdaba430c961bfaec6f))
* update Loader to new designs ([a48215b](https://github.com/aeternity/superhero-wallet/commit/a48215b9927e3295452272848d578b854d17e063))
* **zeit:** add new contract address & decimal support ([dca9480](https://github.com/aeternity/superhero-wallet/commit/dca948036343a5967a3062ff6b33028cfd67c504))


### Bug Fixes

* **account-info:** use explorerUrl from activeNetwork ([988eabf](https://github.com/aeternity/superhero-wallet/commit/988eabf16ca6b3d63ceab57a1eeffa5e2e8d0604))
* **actions:** add the rest of tokens transactions if no transactions fetched ([d1a15ca](https://github.com/aeternity/superhero-wallet/commit/d1a15ca9fd83f8e544d1bd0b898d05b2af6ac32d))
* **actions:** change backend tip cache url ([818a10a](https://github.com/aeternity/superhero-wallet/commit/818a10aaeaf2c334edd8d47552f4f235559d4171))
* **auction:** avoid using z-index ([82b41b9](https://github.com/aeternity/superhero-wallet/commit/82b41b9cbfaca7b3d0fe939accec3a8de8091585))
* **constants:** use v2 schema for nameClaimTx in calculateMinFee ([e379178](https://github.com/aeternity/superhero-wallet/commit/e3791780d78adc0f0379878b2923d0f03e51ba79))
* **deeplinks:** build redirect route correctly ([50f01a2](https://github.com/aeternity/superhero-wallet/commit/50f01a2c2313415776a7e3b910aa8c3db1e708f7))
* **invites:** temporary fix for validation of node fields ([5ea4993](https://github.com/aeternity/superhero-wallet/commit/5ea4993c01d3a0465b840ca08ff45f2eaa785e5f))
* **ios:** reset webview color after qr scan ([6fb5f4a](https://github.com/aeternity/superhero-wallet/commit/6fb5f4ac16d2ac424623aaf53d1a89dbbde9fb7a))
* **migrations:** add missing new names field ([cc8dfbb](https://github.com/aeternity/superhero-wallet/commit/cc8dfbbe6eb51e4677589f9a1fb1d74aa652ec64))
* **mobile-share:** allow tip url to be passed in TipsSend ([27d84a9](https://github.com/aeternity/superhero-wallet/commit/27d84a9d20a8635c707604974cce891f78a55d05))
* **modal:** set empty span on attribute msg undefined ([197fc11](https://github.com/aeternity/superhero-wallet/commit/197fc11f8b2f4e145c58745bb06507ea0a591124))
* **name-item:** call setAutoExtend action with proper params ([afd452a](https://github.com/aeternity/superhero-wallet/commit/afd452a82c01cb6495a0c4a5c8972d8cd3400694))
* **name-item:** set Pending svg size ([e0e8960](https://github.com/aeternity/superhero-wallet/commit/e0e8960732bdf9017eb22c888399f3dbffa6460f))
* **onboarding:** fix onboarding welcome typo ([a140736](https://github.com/aeternity/superhero-wallet/commit/a1407367d8b57cb95e5fde9552e5e1bfda7b2b50))
* **overview:** avoid wrapping for chain names ([d82df49](https://github.com/aeternity/superhero-wallet/commit/d82df496a630ee4f988d150e89604f23f70c81c2))
* **pending-txs:** filter pending transactions by active account ([8fb690d](https://github.com/aeternity/superhero-wallet/commit/8fb690ddc8c19c0fd3673580762e4b6cda5270c1))
* **retip:** set svg size ([489e133](https://github.com/aeternity/superhero-wallet/commit/489e133ca42a23435e6368f79483ef2649296fc4))
* **status:** set bottom to 0 if tab bar is hidden ([4ce43d3](https://github.com/aeternity/superhero-wallet/commit/4ce43d3e1fded13ad7d32ca42d23ba095e08874f))
* **swagger:** temporary fix for wrong scheme in genSwaggerClient ([129d4c3](https://github.com/aeternity/superhero-wallet/commit/129d4c3b96e4fb76402cb35bd53767aa0d58d3a2))
* **transaction-list:** set transactions and page to initial value on accountChange ([56021c2](https://github.com/aeternity/superhero-wallet/commit/56021c2c4d9600695d4f801462a2f51972abf1f5))
* **tx-details:** handle overflowing tip url ([a515ca4](https://github.com/aeternity/superhero-wallet/commit/a515ca46f8f91cb79b24a9dc49a5b3562e095860))
* **tx-list:** prevent infinite fetch of next page ([178a8d8](https://github.com/aeternity/superhero-wallet/commit/178a8d8be7cc6aae0151ccaa343b6f76e24462ba))
* **tx-list:** remove extra space from bottom ([fbad5be](https://github.com/aeternity/superhero-wallet/commit/fbad5be565f6deef90996d143c6ea01166de1bc9))
* **tx-list:** show msg when no items found ([d3c71b4](https://github.com/aeternity/superhero-wallet/commit/d3c71b4bcc8fd01dca44bf66e94fd738910170ae))


### Style

* **checkbox:** update checkbox color ([5c9ad4a](https://github.com/aeternity/superhero-wallet/commit/5c9ad4aa111156b82a53f1f4ce8d958322cc2d1e))


### Documentation

* **readme:** correct grammar and spelling ([97380f4](https://github.com/aeternity/superhero-wallet/commit/97380f44f369f53172affecfae3b5addca38a90a))


### Maintenance

* <ul> and <ol> usage ([c7c8b02](https://github.com/aeternity/superhero-wallet/commit/c7c8b0256408b1f4ce4f9e10061f924431682c57))
* **account-info:** simplify edit mode ([c09715b](https://github.com/aeternity/superhero-wallet/commit/c09715b9aba35344a3b97ce26af4311fc71d7b64))
* **account:** remove unused mapped state ([ee4fd4c](https://github.com/aeternity/superhero-wallet/commit/ee4fd4cc420ac0a8f9a4d601ec6f54ca322698c6))
* **app-links:** add app links for all platforms to constants ([1169bdf](https://github.com/aeternity/superhero-wallet/commit/1169bdf0370398aca87ef6c7b194f8b791d68c13))
* **auctions:** update AuctionList page ([5216f23](https://github.com/aeternity/superhero-wallet/commit/5216f23ab5f07be45bbd67838bfc45a2664aab02))
* **claim:** update Claim page ([dbe5af8](https://github.com/aeternity/superhero-wallet/commit/dbe5af800d40e9401036a6a18c7d781ff9481475))
* connect AuctionOverview to store ([dd47ceb](https://github.com/aeternity/superhero-wallet/commit/dd47cebf992dda7fb6facbead3b1db857181783b))
* **constants:** avoid extra redirect to explorer ([1653e93](https://github.com/aeternity/superhero-wallet/commit/1653e93b399940b273774e7c246c2e3c68c27f5c))
* **constants:** update contract address ([ed50fa7](https://github.com/aeternity/superhero-wallet/commit/ed50fa72805e4f43493abf0b447e91d071f64613))
* **cordova:** add missing clipboard plugin config ([4ddd92d](https://github.com/aeternity/superhero-wallet/commit/4ddd92d01fef4473f9dac1699e50b22bd5e4e811))
* **css:** unify z-index ([ed7766b](https://github.com/aeternity/superhero-wallet/commit/ed7766b8ed83e08883d37ee165c00f4f283e8962))
* **dropdown:** remove unused markup ([10f848f](https://github.com/aeternity/superhero-wallet/commit/10f848f12c9171865f5475ec0c2999d1a1b26f5d))
* extract AuctionOverview from AuctionCard ([df2ce97](https://github.com/aeternity/superhero-wallet/commit/df2ce97c9804388371bc5279e769502b0c928844))
* extract HelpButton component ([cca3329](https://github.com/aeternity/superhero-wallet/commit/cca3329fc566eeb9f52c833736e5f86ef41539bb))
* **ios-link:** change ios link from testflight to app store ([693bbc0](https://github.com/aeternity/superhero-wallet/commit/693bbc079ba4377c6610141cecdbae63c8d8c136))
* **main:** hide tabbar on childern views ([1553a88](https://github.com/aeternity/superhero-wallet/commit/1553a88a98f640022542744d979516accb2c07ea))
* **main:** remove back button of main tabs ([636f55d](https://github.com/aeternity/superhero-wallet/commit/636f55dbf977c5ba1ae87a40667afc3f0f257d31))
* **modals:** drop localization with dynamic keys ([d76bc46](https://github.com/aeternity/superhero-wallet/commit/d76bc464344ede6366277ed67065a8ddb85ed6cf))
* **modals:** render help locales as templates ([c185c0d](https://github.com/aeternity/superhero-wallet/commit/c185c0dc43b9d6e929f00d0ad4028dfcf672f16b))
* **names:** drop redundant subject from getter ([3480300](https://github.com/aeternity/superhero-wallet/commit/3480300aa72c7da840f511b87e94577407fc9708))
* **names:** update naming system pages structure ([a166ae3](https://github.com/aeternity/superhero-wallet/commit/a166ae36f85729e76ab87565f2ba79cf3235e1e6))
* **network:** set default values for custom networks ([da4cf82](https://github.com/aeternity/superhero-wallet/commit/da4cf8204e30021948c045257af3281c16828d68))
* **networks:** use ActionsMenu instead of ae-dropdown ([8a88920](https://github.com/aeternity/superhero-wallet/commit/8a889205745c3810c19b56d50ab933caec5a0f0c))
* **node-status:** align node status bar in collapsed iframe view ([4e0f4c0](https://github.com/aeternity/superhero-wallet/commit/4e0f4c03cdb244de3dc3982652fb5c4a669edb5e))
* **notification:** remove unused class ([a68045d](https://github.com/aeternity/superhero-wallet/commit/a68045d89f51297b6ed37e2551278ed953fea42d))
* **phishing:** remove broken phishing check ([94e7c15](https://github.com/aeternity/superhero-wallet/commit/94e7c154cbdf3c1d3ce3dffdc2d46fd26fe1c6b1))
* rename AuctionOverview component to AuctionCard ([593ee68](https://github.com/aeternity/superhero-wallet/commit/593ee689715ab4d3c497681cbd4107a1f3ce232b))
* rename help-circle icon to question-circle-border ([8705e5f](https://github.com/aeternity/superhero-wallet/commit/8705e5f3bcababb5f3464d039e5a013b37a21eb1))
* rename tx-history icon to history ([22d2767](https://github.com/aeternity/superhero-wallet/commit/22d27672f3598e81fcf72a1b7c31d17792bdc0ed))
* rewrite Dropdown using ActionsMenu component ([8043373](https://github.com/aeternity/superhero-wallet/commit/8043373c6ea9d43a6fb051a6c456e79c80d3c874))
* run npm audit fix ([0e42149](https://github.com/aeternity/superhero-wallet/commit/0e4214928f4e1dbfb89a63140c4ec666edefe030))
* run npm update ([a5f48d1](https://github.com/aeternity/superhero-wallet/commit/a5f48d18f715139f87814c0edf7ac142d2cb9613))
* **sdk:** update sdk to 8.2.1 ([1e0db31](https://github.com/aeternity/superhero-wallet/commit/1e0db313cf854d35304cb618282f8c4679898277))
* **tabbar:** hide tabbar in collapsed iframe view ([ead9b19](https://github.com/aeternity/superhero-wallet/commit/ead9b19e86a36884fb85b518042515ec03a60258))
* update RecentTransactions component and inline into Account ([0ed9ea7](https://github.com/aeternity/superhero-wallet/commit/0ed9ea7736f9015e97fb4267a6c9c2d237e2eb63))

### [0.8.2](https://github.com/aeternity/superhero-wallet/compare/v0.8.1...v0.8.2) (2021-07-14)


### Features

* **unfinished:** enable unfinished features ([37b7bd7](https://github.com/aeternity/superhero-wallet/commit/37b7bd783c2c7d12c434bc5e484de447a9282f8f))


### Bug Fixes

* **tx-list:** show loader only when fetching ([00f6f24](https://github.com/aeternity/superhero-wallet/commit/00f6f24ac66d9b8a5ed6c185fff95ed657f18709))


### Maintenance

* **unfinished:** hide unfinished features ([c4b7536](https://github.com/aeternity/superhero-wallet/commit/c4b7536d2fe7d4dc05828f0193cdebae04bc567b))

### [0.8.1](https://github.com/aeternity/superhero-wallet/compare/v0.8.0...v0.8.1) (2021-07-09)


### Bug Fixes

* **wallet:** don't set accounts immediately ([d0e5c52](https://github.com/aeternity/superhero-wallet/commit/d0e5c5207feefdfd74fb139c5079d2bfe7b2a563))

## [0.8.0](https://github.com/aeternity/superhero-wallet/compare/v0.7.2...v0.8.0) (2021-07-09)


### Features

* **acc:** update available tokens and balances every 10 seconds ([0eb890a](https://github.com/aeternity/superhero-wallet/commit/0eb890aa6d907b9f9eb70a1e604561b2fff7e5cd))
* **account-switcher:** show switching to the aepp ([4370f39](https://github.com/aeternity/superhero-wallet/commit/4370f3904027d4c772b3089ce99efc9ca7b08d34))
* **balances:** add balances screen new ux ([31e95bf](https://github.com/aeternity/superhero-wallet/commit/31e95bfc4d37003d68c6f0175c1ed7d3c06f8886))
* **fonts:** add sans 14 bold ([f725f46](https://github.com/aeternity/superhero-wallet/commit/f725f466dbbbd0aca4471bc95cb75557720a916b))
* **ft:** updates balances after successful mine ([8e35da9](https://github.com/aeternity/superhero-wallet/commit/8e35da9f5a4647577a8c1642f95954b9b75cd73a))
* **fungible-tokens:** load tokens on network change ([f0a8e3d](https://github.com/aeternity/superhero-wallet/commit/f0a8e3d4c9ca5a28e7685edcf4e221bc075f4edc))
* **fungible-tokens:** make fungible tokens work with several accounts ([679a9a2](https://github.com/aeternity/superhero-wallet/commit/679a9a2a01b067123424a3c8ed3bcfde175e5e62))
* **modal:** add critical icon ([269d9f1](https://github.com/aeternity/superhero-wallet/commit/269d9f138577c489c11e2ed9e06939a7c1e6f678))
* **more:** add More page ([8d544e7](https://github.com/aeternity/superhero-wallet/commit/8d544e72df0f1071afe1d32157a1c76e3526bd86))
* **names:** make names work with several accounts ([856ba37](https://github.com/aeternity/superhero-wallet/commit/856ba37e5527e08cbb7244bbff720f3861fc55c6))
* **payments-send:** drop trailing zeros from amount ([df221a4](https://github.com/aeternity/superhero-wallet/commit/df221a408753925cb9153c669b33586c0d1a3584))
* **token-amount:** update fiat formatting rules ([61ec06f](https://github.com/aeternity/superhero-wallet/commit/61ec06f5e2f73e410115db954006f8ef69e5c746))
* **token-details:** add token details new ux ([d4e8859](https://github.com/aeternity/superhero-wallet/commit/d4e885944ba5fab80b1bdf4c67df6d439a1f0d3b))
* **token-list:** don't display zero balances ([db4e02b](https://github.com/aeternity/superhero-wallet/commit/db4e02b2454ea78d974ddee65243b99a0d25f38c))
* **txlist:** adds realtime incoming tx for bitcoin token ([ab99c78](https://github.com/aeternity/superhero-wallet/commit/ab99c78806291c07eff2d3ca2d6d12cbe624ddd6))
* **txlist:** removes cached tx after fetching them from mdw ([d2f89e8](https://github.com/aeternity/superhero-wallet/commit/d2f89e85ecc30f50e5437f85b3b3ed7ab7b61809))
* **zeit:** add zeit token support ([dec3d08](https://github.com/aeternity/superhero-wallet/commit/dec3d08998f81fc1aaf2737382b8c7de9c07d177))
* add AccountItem component ([aa9d323](https://github.com/aeternity/superhero-wallet/commit/aa9d323dfd22eadb7d0acefe1c5dc91aee10139b))
* add AuctionOverview component ([89c81eb](https://github.com/aeternity/superhero-wallet/commit/89c81ebef18754d3bb11cc4dbeb51911fe8920e8))
* add NamePointersHelp modal ([5e75f67](https://github.com/aeternity/superhero-wallet/commit/5e75f67d696ca760c3843a6b660979c5b2169901))
* rebrand ConfirmRawSign modal ([83ba9b3](https://github.com/aeternity/superhero-wallet/commit/83ba9b302a745e5a455aca1b9999ca11b921dbf3))
* rebrand Modal ([1db7813](https://github.com/aeternity/superhero-wallet/commit/1db78135e0ef52d63d1229c17e1c907bb45cdb2d))
* rebrand QrCodeScanner modal ([688c0d1](https://github.com/aeternity/superhero-wallet/commit/688c0d184cc8ba633f33fe0b6607ce2e7b1f7128))
* rebrand tip url status ([2a0644e](https://github.com/aeternity/superhero-wallet/commit/2a0644edd7145c699e43e72ba1a939095505c99d))
* **unfinished:** enable unfinished features ([1b08c9e](https://github.com/aeternity/superhero-wallet/commit/1b08c9e5f08efff0a0f9cf4ad97a520bda6689d5))


### Bug Fixes

* **account:** disallow account switching before sdk initialize ([08cc72c](https://github.com/aeternity/superhero-wallet/commit/08cc72c798b8eaca8d6eb5d979b136fe30fec816))
* **account-switcher:** disable horizontal scrolling ([59c358a](https://github.com/aeternity/superhero-wallet/commit/59c358a11cab7352221b010c59ebc3e08f9333b7))
* **actions:** add missing transaction type to transcation history ([0bdd836](https://github.com/aeternity/superhero-wallet/commit/0bdd8368031f3bf3e9e9b5d72a2a51c2f0d1afa8))
* **app:** disallow horizontall scrolling ([32abbd5](https://github.com/aeternity/superhero-wallet/commit/32abbd5360e481a66aa9331a8ab8fe37d07d869c))
* **auction-list:** load auctions properly ([aeae5f8](https://github.com/aeternity/superhero-wallet/commit/aeae5f87e958ccd5c06eb4a3f0fe036804ffe76d))
* **background:** fix state reducer ([39e6307](https://github.com/aeternity/superhero-wallet/commit/39e630772ad0a4b6e14007aeea79880e3c689f99))
* **claim:** fix not enough balance modal ([fad4120](https://github.com/aeternity/superhero-wallet/commit/fad4120c85ccc045f3eb803a65caae927db18e05))
* **default:** fix modals with no msg ([9d73178](https://github.com/aeternity/superhero-wallet/commit/9d73178476ef9679fe8d28e135f8a67b31137bf8))
* **dropdown:** fix dropdown align ([4a9c656](https://github.com/aeternity/superhero-wallet/commit/4a9c656a2eaf5dc1d5060000e7f7884b15deecd4))
* **dropdown-width:** make dropdown list width constant ([4cebfd9](https://github.com/aeternity/superhero-wallet/commit/4cebfd9bbe5322271c34d7c4bcd64b05be772e35))
* **fonts:** fix id overflowing ([a3beb23](https://github.com/aeternity/superhero-wallet/commit/a3beb238d3239752e95eeb3932c1b1bcd0082a3f))
* **fungible-tokens:** set correct selected Token ([fc1bac2](https://github.com/aeternity/superhero-wallet/commit/fc1bac2a21596af8b524a58d1b90558a84d20bcd))
* **fungible-tokens:** use mdw endpoint instead of backend ([5c94e37](https://github.com/aeternity/superhero-wallet/commit/5c94e37e9efb572a516562a4b8fb3f76315ac22c))
* **helper:** fix isAccountNotFoundError ([1607a2e](https://github.com/aeternity/superhero-wallet/commit/1607a2e6c9a0960b57e2d8ab146daa7bdfa99287))
* **helper:** fix isNotFoundError ([f10b77d](https://github.com/aeternity/superhero-wallet/commit/f10b77da00e7d231dc4e9a9d7e66631ba2dee7f6))
* **modal:** expand container to fit long copy ([cdc9c7c](https://github.com/aeternity/superhero-wallet/commit/cdc9c7c4a74da70802de32f1f7def18bdff4fbd2))
* **observables:** use new balance storage structure ([88350cf](https://github.com/aeternity/superhero-wallet/commit/88350cf2b5bde31b15bd136fbd262a537c7ab64b))
* **platforms:** change ios link from testflight to store ([a8debf9](https://github.com/aeternity/superhero-wallet/commit/a8debf9174af718eca4b9c26ac1ca0450ca944d9))
* **qr-code:** inline transparent style to show preview in cordova ([6b7fdf9](https://github.com/aeternity/superhero-wallet/commit/6b7fdf98e91c726624f973639f984a72efbefac2))
* **token-amount:** show fiat only for AE ([88d74cd](https://github.com/aeternity/superhero-wallet/commit/88d74cda599c4d8a36899f49b60d385527045254))
* **token-details:** fix header padding ([cc5139f](https://github.com/aeternity/superhero-wallet/commit/cc5139ffed373699305a5edfff23fa7f9ae62761))
* **tx:** move view more link to tx list component ([e0271b0](https://github.com/aeternity/superhero-wallet/commit/e0271b02f08106020b0b71eb20a3e292e9a9589e))
* **tx-list:** center spinner and messsage ([9b85be3](https://github.com/aeternity/superhero-wallet/commit/9b85be3553c6b6f337fb008f58244f3e37f8717f))
* **tx-list:** don't show spinner on refetch interval ([d3e9f1a](https://github.com/aeternity/superhero-wallet/commit/d3e9f1a63ae15e1ba21a6d8bfc1a1e7be44c2e8b))


### Performance

* **persist-state:** use mutation to sync state ([ff18073](https://github.com/aeternity/superhero-wallet/commit/ff180735f9fe2469925a7da47ab2816ad79aa151))


### Style

* **account-info:** align address center ([49b0034](https://github.com/aeternity/superhero-wallet/commit/49b00346ea5ab7dcbf6f4609b44bf053ded51733))
* **dropdown:** make dropdown wider and always on top ([00a1ad8](https://github.com/aeternity/superhero-wallet/commit/00a1ad83df52889f0fec2cc5c67a313c9e5300e1))
* **icons:** update icons for tab navigation ([31a5fe8](https://github.com/aeternity/superhero-wallet/commit/31a5fe8c81dd0f7ed9216ca3f29c4869f009b9ca))
* **search-bar:** make background darker ([fb36175](https://github.com/aeternity/superhero-wallet/commit/fb36175d8633f3c54673d6818349a3a8af79873f))
* **token-list:** change no tokens msg style ([4b2ef54](https://github.com/aeternity/superhero-wallet/commit/4b2ef54077a6137813d1a88152915ffa0cf5b415))


### Maintenance

* **actions:** set middleware to null on network switch ([5443e1a](https://github.com/aeternity/superhero-wallet/commit/5443e1a9b9fea0f24fc81faf800126ed226510f4))
* **avatar:** change mid size to new designs ([d76b980](https://github.com/aeternity/superhero-wallet/commit/d76b9808930c318f89089ecd5e86c04ebf91cb81))
* **avatar:** make address optional ([aaeeea1](https://github.com/aeternity/superhero-wallet/commit/aaeeea1beb71b1262d6bdc9e238df099ee8abf4d))
* **chain-listener:** add test contract to variables ([548d434](https://github.com/aeternity/superhero-wallet/commit/548d43401131ca6788a9987d6e8d3797b8f03490))
* **chain-listener:** reinit listener on middleware change ([420ad06](https://github.com/aeternity/superhero-wallet/commit/420ad069ab251691f3713e3cb09c77ef48adf473))
* **constants:** update to mainnet contracts ([ef1a0f3](https://github.com/aeternity/superhero-wallet/commit/ef1a0f39934b75e86cf607d225f0f3e12801fa87))
* **e2e:** add tests for confirm raw sign popup ([8003c45](https://github.com/aeternity/superhero-wallet/commit/8003c45975261323c611a240b23f5479d989be65))
* **fungible-tokens:** cover all fetchJson with catch ([875be71](https://github.com/aeternity/superhero-wallet/commit/875be71068d3a527bbf119824e7ab6908c5f76c8))
* **icons:** unify arrow icons ([7dbd5ba](https://github.com/aeternity/superhero-wallet/commit/7dbd5bacdf31fc600eb272bfac38424e117498bc))
* **invite:** disable invite links for tokens ([25d494c](https://github.com/aeternity/superhero-wallet/commit/25d494c8a16b5e3f507cf7d28fb7c79ac54eece1))
* **invite:** show error message ([67ee22d](https://github.com/aeternity/superhero-wallet/commit/67ee22dea8b3a212ec5b8eed0008b6b826cca043))
* **logger:** don't show error modal by default on production ([bd53886](https://github.com/aeternity/superhero-wallet/commit/bd538866848198e9345dbd3500bc4a989f65f3fb))
* **migrations:** add addNewFields migration ([86fa6eb](https://github.com/aeternity/superhero-wallet/commit/86fa6ebf23a70863d00cf50b330a197ba9d85e00))
* **migrations:** rename migration ([138700a](https://github.com/aeternity/superhero-wallet/commit/138700a86849bbc11d24c4b19721e7c2b2a7be23))
* **names:** adjust account default names ([7b571bb](https://github.com/aeternity/superhero-wallet/commit/7b571bb9d0c7a1a5181e9f37307589bd011b4c7d))
* **networks-test:** disable fast switching networks ([831b0df](https://github.com/aeternity/superhero-wallet/commit/831b0df768a4e39c68b9a27adc4a8c90e490c8a0))
* **observables:** set all account balances to local storage ([9487d5a](https://github.com/aeternity/superhero-wallet/commit/9487d5a1e62315a6fd4351177f3a631c74a430ab))
* **pending-token-tx:** show pending token tx immediately ([c216978](https://github.com/aeternity/superhero-wallet/commit/c21697876c9c5d8eaab196f6e7b18828e52ab834))
* **plate:** add plate splitting ([593eb2b](https://github.com/aeternity/superhero-wallet/commit/593eb2b7610cbbcb1538aa09a435d5b7cfe62f2e))
* **tab-bar:** update TabBar component ([31a99d6](https://github.com/aeternity/superhero-wallet/commit/31a99d61be17dab917521c6d8685b73340d08d4f))
* **token-amount:** add prop to not show symbol ([98479d8](https://github.com/aeternity/superhero-wallet/commit/98479d820454fac51250220ada86632ff5cf65be))
* **token-amount:** drop alt text prop ([9653ddc](https://github.com/aeternity/superhero-wallet/commit/9653ddc7d4c71b8a1aa2b8810f5cb7355a0ebc82))
* **tokens:** remove unfinished from tokens ([aec13d3](https://github.com/aeternity/superhero-wallet/commit/aec13d3c4f8efcca18b92a56f5bfef2f59be9f68))
* **transaction-list:** add filters for fungible tokens ([481a194](https://github.com/aeternity/superhero-wallet/commit/481a1945ded50e957a17b3e5e60e4ae38c9f2381))
* **transaction-list:** move spinner and styles from recent to tx list ([3251e14](https://github.com/aeternity/superhero-wallet/commit/3251e14b0f2e22a1662b8726e58b5af3b82f8fda))
* **transactions:** extract transaction list into component ([42551b6](https://github.com/aeternity/superhero-wallet/commit/42551b6c5a916c34c1ee9c7e370eeb47177b9dc6))
* **txlist:** merges both implementations ([6fc6e3c](https://github.com/aeternity/superhero-wallet/commit/6fc6e3ccbbb53d7266a17ccf1d7e5ed132f0c288))
* **unfinished:** hide unfinished features ([5c3c935](https://github.com/aeternity/superhero-wallet/commit/5c3c93542727e2fc55da6baaedac6908fa36053e))
* compose Confirm with Default modal ([3e5c7c1](https://github.com/aeternity/superhero-wallet/commit/3e5c7c11ba04f4aff7ff42af7b68b9dc5f9c931c))
* drop text from toRelativeTime filter ([75cd65c](https://github.com/aeternity/superhero-wallet/commit/75cd65c68bc0bb1711829b1beddfcdac16ef7390))
* extract StatusIcon component ([c8a6255](https://github.com/aeternity/superhero-wallet/commit/c8a62554a1d5c179b397c2d4aa28aba31a385d65))
* rename Payments page to Transfer ([ed71de6](https://github.com/aeternity/superhero-wallet/commit/ed71de67829f8515434126162bd671cd60a1c3f0))
* **wording:** extract home variable ([05c6eae](https://github.com/aeternity/superhero-wallet/commit/05c6eaed2d3fa5da4cd4dcb8d72b3fd8dfd14659))
* remove MenuCarousel component ([f2d1734](https://github.com/aeternity/superhero-wallet/commit/f2d1734b6522cc6590c2071593ab8022b5568fea))

### [0.7.2](https://github.com/aeternity/superhero-wallet/compare/v0.7.1...v0.7.2) (2021-06-11)


### Features

* show node status in full screen modals ([4cd4f90](https://github.com/aeternity/superhero-wallet/commit/4cd4f9077cc85dfaba1bcd735732aed7f04e3e67))
* **confirm-tx:** show name fee token amount ([1776fff](https://github.com/aeternity/superhero-wallet/commit/1776fff0dc0bc34f7a1b64c54cbd35c65be2d959))
* **truncate:** simplify truncate behaviour ([5ae05d3](https://github.com/aeternity/superhero-wallet/commit/5ae05d38ebb0682331cc1ede16148e1dc823504b))


### Maintenance

* use iris compatible contracts ([dc08775](https://github.com/aeternity/superhero-wallet/commit/dc087752f11c270b067a0f184217199547059b5e))
* **global:** use ButtonPlain component ([47304bf](https://github.com/aeternity/superhero-wallet/commit/47304bfa7a31fc42c3c198800e1bb62ec1b25f3a))
* **receive:** remove exchange url ([2cf8b68](https://github.com/aeternity/superhero-wallet/commit/2cf8b68bb8c3ce7df3b899857c70e37dd79aa740))
* **tokens:** move tokens path and sidebar entry to unfinished ([e8e2786](https://github.com/aeternity/superhero-wallet/commit/e8e278696ada2ac2d6ba508f45dcf8356cf32a36))

### [0.7.1](https://github.com/aeternity/superhero-wallet/compare/v0.7.0...v0.7.1) (2021-05-31)


### Features

* rebrand Connect popup ([8138d27](https://github.com/aeternity/superhero-wallet/commit/8138d272da9acf0e3d15dbdca1361344450dc380))
* rebrand MessageSign popup ([e683ebc](https://github.com/aeternity/superhero-wallet/commit/e683ebcdda3aab851fabb0be973c2522aa41c55a))
* **payments-send:** add warning when sending to same address ([a9fb93a](https://github.com/aeternity/superhero-wallet/commit/a9fb93a95e5acf84008fd7b59b9903125fd25a75))


### Bug Fixes

* **amount-input:** adjust error condition ([ace955d](https://github.com/aeternity/superhero-wallet/commit/ace955d2aea738bfadc12b9b8110358448a15b6e))
* **comment-new:** redirect to /account on successful comment send ([25efe0e](https://github.com/aeternity/superhero-wallet/commit/25efe0ed74455679a796fc76d65d61bf9e93604b))
* **comment-new:** reload info on query change ([dc76a39](https://github.com/aeternity/superhero-wallet/commit/dc76a39f3002b0ca5956f6c716837e8c8ebebc5a))
* **details:** block buttons and don't watch before sdk init ([4b65ed8](https://github.com/aeternity/superhero-wallet/commit/4b65ed8ee12c2734b75f4ac91405eb426a464405))
* **header:** disallow title text wrapping ([8c5292c](https://github.com/aeternity/superhero-wallet/commit/8c5292c0187afe3d3e717ff4a45410558bd8eddc))
* **invite:** fix handleNotEnoughFoundsError parameters ([d275f95](https://github.com/aeternity/superhero-wallet/commit/d275f95d5d0dee3954254a2400a481697a2f015a))
* **invite:** set missing invite icon size ([33c6593](https://github.com/aeternity/superhero-wallet/commit/33c6593222b9bf46755b82d6cc57b37f886d4232))
* **pending:** fix duplicate pending transactions ([4e0a688](https://github.com/aeternity/superhero-wallet/commit/4e0a68861912b0aabaa0f4ee3e0ebff9fd0d8515))
* **recent-txs:** align empty and loading states ([2e30e65](https://github.com/aeternity/superhero-wallet/commit/2e30e656f9add0673cc499763a7b60fc64cde650))
* **retip:** request tip from backend instead of contract ([296b23a](https://github.com/aeternity/superhero-wallet/commit/296b23a8384a01f832f3ef0d2d6d844c127c7c51))
* **retip:** set proper pending transaction property ([8c84775](https://github.com/aeternity/superhero-wallet/commit/8c8477515ef215d1c9cdb195d4f94b888c30595b))
* **routes:** enable props for PaymentsSend ([911233f](https://github.com/aeternity/superhero-wallet/commit/911233f2e9eb9809c8442154407ef0052f2a609f))
* **routes:** fix retip page wrong title ([e9d7881](https://github.com/aeternity/superhero-wallet/commit/e9d788122020c4decfdf5363258200f94916db74))
* **small-modal:** fix mark as read unavailable for clicking ([4ad38d8](https://github.com/aeternity/superhero-wallet/commit/4ad38d8a374e6617be5d25c5ef3715b6f2c6f270))
* **tx-pointers:** fix name pointers field error in confirm tx modal ([bbfcf33](https://github.com/aeternity/superhero-wallet/commit/bbfcf33ebee837e6103000a33bdd02c34151b6dc))
* **warnings:** fix github actions warnings ([6d55381](https://github.com/aeternity/superhero-wallet/commit/6d55381e3f4684c48deee7c45e00d49dadb0ed15))
* resolve no-alert warnings ([d1250cc](https://github.com/aeternity/superhero-wallet/commit/d1250cc0c3eb3b901311a9e5f1c717691c6262dd))
* resolve no-console warnings ([f2428f5](https://github.com/aeternity/superhero-wallet/commit/f2428f5d7f8c698907274ca8f08fccf7c29c700b))
* resolve no-lone-template warning ([2561be4](https://github.com/aeternity/superhero-wallet/commit/2561be47767319ae9444be16bd8995c91c395845))
* resolve no-template-shadow warnings ([83fd054](https://github.com/aeternity/superhero-wallet/commit/83fd0544ada0211efe11e3ba909208b98d6c6431))
* resolve no-v-html warnings ([251a995](https://github.com/aeternity/superhero-wallet/commit/251a995b453a9826895b834ef064513c989c6200))
* resolve order-in-component warnings ([04b80d8](https://github.com/aeternity/superhero-wallet/commit/04b80d827227aec6d54e84a3e6148569c52beab7))
* **tests:** fix network test after new node added ([aaf25b1](https://github.com/aeternity/superhero-wallet/commit/aaf25b10257a12026f0fdea19a9d32b32fc6ad05))


### Performance

* **icons:** optimize iframe icons ([a0810b7](https://github.com/aeternity/superhero-wallet/commit/a0810b745eee77f2244dd168d1ab7566ec4bcaf3))


### Maintenance

* **unfinished:** hide unfinished features ([3797c91](https://github.com/aeternity/superhero-wallet/commit/3797c91a94c570536bd6399b55de79a55f03ec83))
* update sdk to 8.1.0 ([0121390](https://github.com/aeternity/superhero-wallet/commit/01213909a5649bf6ad32dd09534d714ddeab5c0f))
* **account-info:** change width of name with unfinished features off ([7a0663d](https://github.com/aeternity/superhero-wallet/commit/7a0663dad7d8138c5454d2c2e845c19d8a5f7764))
* **account-info:** revert width change ([f37e0aa](https://github.com/aeternity/superhero-wallet/commit/f37e0aac398ce3467d7b47a9d0348e73b87bd5e1))
* **env:** enable unfinished features ([11aa297](https://github.com/aeternity/superhero-wallet/commit/11aa2971a2d092b7985718a1bfadd2a4b6776326))
* **icons:** rearrange icons and delete duplicates ([ac9ebe8](https://github.com/aeternity/superhero-wallet/commit/ac9ebe81f9eabe6d69f4d1b29272a132e647db12))
* **networks:** remove unnecessary v-html ([8d32d7d](https://github.com/aeternity/superhero-wallet/commit/8d32d7de37640d13ea62f2cf05ed031eca835255))
* **payments:** revert old solution to redirection after success payment ([a9412b7](https://github.com/aeternity/superhero-wallet/commit/a9412b76385cbf8ae628cdfb72bd8a2615d1121f))
* **payments-send:** disable sending tokens to a name ([2fb7c87](https://github.com/aeternity/superhero-wallet/commit/2fb7c870fab27094781b39da0f7a72b30e5ae76c))
* **wallet:** move loading tokens data to unfinished ([3c25d27](https://github.com/aeternity/superhero-wallet/commit/3c25d27a339e3c028669bc1f5c39333f5d6b04e0))
* flickity buttons hover and pressed style ([eb6bce6](https://github.com/aeternity/superhero-wallet/commit/eb6bce66cd2f696c349a579824d8809f80624255))
* remove unused global css ([4c830d3](https://github.com/aeternity/superhero-wallet/commit/4c830d3280d81b8d95d3f937b9c95c403a6a6ec2))
* **permissions:** change placeholder to more clear version ([a126ea3](https://github.com/aeternity/superhero-wallet/commit/a126ea3dc9d6213211c3c27e32778dd892947761))
* **props:** set required defaults for props ([8950fe9](https://github.com/aeternity/superhero-wallet/commit/8950fe93a2e0dcadc7306e286e6b8c18f0fe926b))
* **tests:** disable mining-related tests ([0b784b6](https://github.com/aeternity/superhero-wallet/commit/0b784b6191d60b4127a12b31c9d19db7dc62b64b))
* **token-list-item:** remove unused name prop ([541e54c](https://github.com/aeternity/superhero-wallet/commit/541e54c63648afc9bec903a1bdcb2f845e5eb43a))
* **tour:** remove useless v-for ([5fd8477](https://github.com/aeternity/superhero-wallet/commit/5fd8477b34545290251d0b32718249d8dfdf0ce0))
* update SDK to 8.0.0 ([52234b5](https://github.com/aeternity/superhero-wallet/commit/52234b51e9ae691dcbec97cc3bfed03014e89646))

## [0.7.0](https://github.com/aeternity/superhero-wallet/compare/v0.6.1...v0.7.0) (2021-04-29)


### Features

* **tabs:** add Tabs component and split payments and tips screens ([ab3cdce](https://github.com/aeternity/superhero-wallet/commit/ab3cdceaf6696fbd00909280ffb91702397be9d6))
* rebrand ConfirmTransactionSign modal ([3d8ae06](https://github.com/aeternity/superhero-wallet/commit/3d8ae06dac199dc861a749380ac6e0a538e06871))
* **amount-send:** rebrand AmountSend component into Amount ([751155d](https://github.com/aeternity/superhero-wallet/commit/751155d39cb4cd523af017e8ac62a29ae0bc231f))
* **claim:** add claim tips menu entry ([4c71b9d](https://github.com/aeternity/superhero-wallet/commit/4c71b9df66ca45c50508476e4d1c67a0e09bbfcb))
* **icons:** update rebranded icons ([3d8f2f7](https://github.com/aeternity/superhero-wallet/commit/3d8f2f7636a3bd5b46747edaaeb119185ca0cfaf))
* add Accounts page ([f80fbdf](https://github.com/aeternity/superhero-wallet/commit/f80fbdf4648b8d567b3d5e97109d9a6d71f1a24a))
* add CopyAddress component ([6f27310](https://github.com/aeternity/superhero-wallet/commit/6f273102637422bf1892035ac59fb96ca10f29e3))
* add links to an account in the middleware explorer ([20ecf8b](https://github.com/aeternity/superhero-wallet/commit/20ecf8b7472bbf6a7a2523812c0ffd2e0bba0cbf))
* add TransactionOverview component ([48d7dc6](https://github.com/aeternity/superhero-wallet/commit/48d7dc611870a4af3a78a8bdd588d9c00bd3b26a))
* show balance for each account ([4e5762e](https://github.com/aeternity/superhero-wallet/commit/4e5762e2831323390f37b09031f0653ba85cffce))
* simple account list ([6580328](https://github.com/aeternity/superhero-wallet/commit/6580328f966ac213f5c74e16dc80a5fd93a17866))
* simple account switcher ([a339f0c](https://github.com/aeternity/superhero-wallet/commit/a339f0c5d000c15f44e70c9ada52b3e8b120d31d))


### Bug Fixes

* **account-info:** fix alignment on copy and name claim ([ee10ee9](https://github.com/aeternity/superhero-wallet/commit/ee10ee91e4acd1ac93458df9b9007e9d2727278c))
* **app:** match header background color ([b2824b2](https://github.com/aeternity/superhero-wallet/commit/b2824b2fb38bf9d6c315636e4d99201def2507ab))
* **background:** add missing getters ([588edba](https://github.com/aeternity/superhero-wallet/commit/588edbae4f25ea66bffdedf3df36ca24ee2e81cc))
* **confirm-modals:** don't stretch to whole page on desktop ([1d69f7d](https://github.com/aeternity/superhero-wallet/commit/1d69f7db27a58633ef787be91ff544c37320853d))
* **copy-address:** ensure copied text is expanded ([5c5ab8f](https://github.com/aeternity/superhero-wallet/commit/5c5ab8fdf254eeb943632379436ee45517d0d01d))
* **getters:** add correct name fee to tx amount ([5204402](https://github.com/aeternity/superhero-wallet/commit/5204402605b35c3e1ace2446eafaeee1e68878fb))
* **height:** use viewport height only for ios cordova ([f7f70e2](https://github.com/aeternity/superhero-wallet/commit/f7f70e2cf09454431c392db9e3a0fb483047ba41))
* **icons:** replace icons with transparency versions ([df67290](https://github.com/aeternity/superhero-wallet/commit/df67290c6afa4f331553946969623a59f573f266))
* **invite:** show correct token ([ff527ad](https://github.com/aeternity/superhero-wallet/commit/ff527ad38ef6b412116a1dbc054cc21b81ce4cae))
* **invite-claim:** update handleNotEnoughFoundsError ([ea3aae6](https://github.com/aeternity/superhero-wallet/commit/ea3aae6f7e5e0ce53bf2614bc302ac47b7a5cc7a))
* **ios:** add safe area to confirm modals ([6eb93dc](https://github.com/aeternity/superhero-wallet/commit/6eb93dc5c8b3dda6ad94124bccd7d37e9527a765))
* **ios:** set body bg visible on overscroll ([784b4d3](https://github.com/aeternity/superhero-wallet/commit/784b4d38f939681441cf825c72556897e99aae36))
* **manu-carousel:** make draggable in all mobile browsers ([f2ff6bb](https://github.com/aeternity/superhero-wallet/commit/f2ff6bbe456f9c96fcaafbc0ef0e964fea94106d))
* **mobile/extension:** use padding-bottom if bottom elements visible ([b855eae](https://github.com/aeternity/superhero-wallet/commit/b855eaef02436fc30d6006aae793616d1e413cf8))
* **names:** switch from deprecated profile endpoint ([8a78cfb](https://github.com/aeternity/superhero-wallet/commit/8a78cfb2625c2b967aafae2267b3def30251a4b1))
* **notifications:** use first name in the list if chainNames presented ([5ee89af](https://github.com/aeternity/superhero-wallet/commit/5ee89afa12a08e94923c7f46756af21d8f9234b3))
* **qr-code-reader:** do not interact with header styles explicitly ([d1fff50](https://github.com/aeternity/superhero-wallet/commit/d1fff507d99d69c3fc22ab3d89b1f9c7d3f20496))
* **recent-txs:** slice transactions list to limit ([58e5ffa](https://github.com/aeternity/superhero-wallet/commit/58e5ffae9a1448115ee68f26e02a576f6aec9b29))
* **retip:** add missing account getter ([fd9ae31](https://github.com/aeternity/superhero-wallet/commit/fd9ae31810b428627b27faac78e1715fa28424ad))
* **status:** position NodeConnectionStatus properly ([aaa0a52](https://github.com/aeternity/superhero-wallet/commit/aaa0a526a021a2af80a3d9ded600a3dd86635fbb))
* **styles:** add proper styles for custom name input ([3ea3285](https://github.com/aeternity/superhero-wallet/commit/3ea3285c4a6d9bcd020dbf862c89918f6d9d852a))
* **tabs:** fix Header routing and tests ([38c06e0](https://github.com/aeternity/superhero-wallet/commit/38c06e07c0eedde44a68eb7dd1dc7dfdf115d650))
* **tests:** remove header check in last intro screen ([7166e1c](https://github.com/aeternity/superhero-wallet/commit/7166e1ca580a905c1acda18c4ac1aaf0bf130417))
* **transactions:** change recent transactions on switching accounts ([14ddeaa](https://github.com/aeternity/superhero-wallet/commit/14ddeaae6bc07cfd1a5e5300a3330d1947065537))
* **tx-details:** keep header on top ([817bb01](https://github.com/aeternity/superhero-wallet/commit/817bb01e55b035597c48414cff69ead9c5a762c0))
* **web-iframe-popups:** make iframe popups notRebranded ([e472666](https://github.com/aeternity/superhero-wallet/commit/e472666cfcf54737e94593ce81f4c5d6732edf01))
* rebranded welcome screen image in iframe ([273a5b4](https://github.com/aeternity/superhero-wallet/commit/273a5b4bf17513ef3d0cdea9e7893e807ddea822))


### Tests

* use should to assert node content ([96df928](https://github.com/aeternity/superhero-wallet/commit/96df9282397557b68513e16d1d12be369deb64d1))
* **account:** force click covered dropdown ([09edf7a](https://github.com/aeternity/superhero-wallet/commit/09edf7a6cf4ca576590167e08cd6c56ffe2230fa))
* **amount-input:** use function in should to have retry mechanism ([6b2be15](https://github.com/aeternity/superhero-wallet/commit/6b2be1544d3e598259ac4f34ab93e61c21b7a039))
* **networks:** double get transaction-list timeout ([e468e9a](https://github.com/aeternity/superhero-wallet/commit/e468e9af984320e3e0e1d1cbbffb509308da373e))
* **transaction-details:** make the test independent from pending ([5b77498](https://github.com/aeternity/superhero-wallet/commit/5b77498f29d698d7632e7d18c4d2aa8eded09f0f))
* **transactions:** simplify test and remove unnecessary part ([9574bc9](https://github.com/aeternity/superhero-wallet/commit/9574bc95adf97b61876e5147d6d6168dc010c236))


### Style

* fix linter errors automatically ([1d9a323](https://github.com/aeternity/superhero-wallet/commit/1d9a3235e0984a346fc150e586433aae92fb9e1b))
* **colors:** drop old colors and replace it with rebranded ones ([469bda7](https://github.com/aeternity/superhero-wallet/commit/469bda71a3aef6e3f2e24c74634191095618c3b9))
* **fonts:** use missed rebranded fonts ([31d94e8](https://github.com/aeternity/superhero-wallet/commit/31d94e8efbe5cb114fbd67cecda520f3ea747e83))


### Maintenance

* **qr-code-reader:** use defined handleUnknownError ([d645dca](https://github.com/aeternity/superhero-wallet/commit/d645dcaee7aa4a2745f8cb962e733cead4371a76))
* box button ([b3ec0bc](https://github.com/aeternity/superhero-wallet/commit/b3ec0bc710737d4048b6a35c395a1d709010425d))
* build a single extension for Firefox and Chrome ([fa52e2c](https://github.com/aeternity/superhero-wallet/commit/fa52e2c0034cb7dad70f2a144fd96d9f5faa3333))
* change testnet backend url ([878cb8d](https://github.com/aeternity/superhero-wallet/commit/878cb8db97b99365262609f704fc4d91a72555fe))
* disable extra webpack stats to clean up build log ([3128018](https://github.com/aeternity/superhero-wallet/commit/3128018b88748da9b7505b16e06439145b7fd48c))
* extract tx fee getter ([c678ca6](https://github.com/aeternity/superhero-wallet/commit/c678ca690c71c8cb5bd94eb3e666ee1b74806501))
* get account type from instance ([6c4c323](https://github.com/aeternity/superhero-wallet/commit/6c4c323a3fc487cf0dd7d012b13773e4bde3f6ce))
* remove global css for sign modals ([5ae909f](https://github.com/aeternity/superhero-wallet/commit/5ae909f9b74f5721e4a1abeef31784ad5178fa2a))
* rename updateLatestTransactions mutation to setTransactions ([fb815b7](https://github.com/aeternity/superhero-wallet/commit/fb815b75d6edb56f04cbf4bd3e5ea35136205710))
* split TransactionOverview component ([618f232](https://github.com/aeternity/superhero-wallet/commit/618f232e533845e3e18e1847bc2e1be17c95d94f))
* try electron ([5fa2ca2](https://github.com/aeternity/superhero-wallet/commit/5fa2ca29f483f19e0e6de5023f3b43c60e31e368))
* update scss-related packages to fix env inside border ([1decc7f](https://github.com/aeternity/superhero-wallet/commit/1decc7f8ea154e9fcac666ae0e8c4a4d523d11bd))
* update vue packages ([3349d6e](https://github.com/aeternity/superhero-wallet/commit/3349d6ef41b234497ecce02841c7faf853bfedb8))
* **accounts:** use Plate component ([b9d1903](https://github.com/aeternity/superhero-wallet/commit/b9d19034923de85144cb1148de3b982d48f39734))
* **build:** fix build by using ChromeExtensionReloader properly ([7848665](https://github.com/aeternity/superhero-wallet/commit/7848665f6b282904e323e4ecda6be62aed5c6ec2))
* **button:** update secondary style and drop dark ([95ba341](https://github.com/aeternity/superhero-wallet/commit/95ba34144c0b3b2cd004767f1de7007ea3e93c59))
* **eslint:** fix errors automatically ([75c519a](https://github.com/aeternity/superhero-wallet/commit/75c519abc0ee2a98132a261e321085972cc2ca74))
* **eslint:** fix errors manually ([b03bde3](https://github.com/aeternity/superhero-wallet/commit/b03bde3e4ee32196de5a95c7bdcc20ba1d7c75f4))
* **eslint:** vue recommended rule set and drop conflicting prettier ([50acaee](https://github.com/aeternity/superhero-wallet/commit/50acaeee6967bca5d06cbfce3bbbbecaeac1225a))
* **scss:** "use" instead of "import" ([4d9f253](https://github.com/aeternity/superhero-wallet/commit/4d9f253fe08a1203de5ffd70e0b1ef82556e27ce))
* **scss:** start to "use" instead of "import" ([f42a353](https://github.com/aeternity/superhero-wallet/commit/f42a353ab01ebacd61c2442f68589da6284086ee))
* **tx:** return empty tx list if getTxByAccount returns error ([9b53094](https://github.com/aeternity/superhero-wallet/commit/9b530943961e10ba208342ad94984d9eec317454))
* **webpack:** remove unnecessary firefox-specific stuff ([477bc52](https://github.com/aeternity/superhero-wallet/commit/477bc527e2033ebd1295cb38acf7af87de2e3810))

### [0.6.1](https://github.com/aeternity/superhero-wallet/compare/v0.6.0...v0.6.1) (2021-04-15)


### Features

* **claim:** add claim tips menu entry ([ba58bba](https://github.com/aeternity/superhero-wallet/commit/ba58bba9a06008b705be0dd4c0c7f3235435cfdd))
* **icons:** update rebranded icons ([dfe2f10](https://github.com/aeternity/superhero-wallet/commit/dfe2f10c34424e0ed287a32d66ad5e285db26e5f))


### Bug Fixes

* **commitlint:** run commitlint from master ([6d8f8ff](https://github.com/aeternity/superhero-wallet/commit/6d8f8ff9555d2ddf9f09e73621e861f5b30ab289))
* **height:** use viewport height only for ios cordova ([350a8ab](https://github.com/aeternity/superhero-wallet/commit/350a8ab77532f1224ac520082f9a07a729f0aaf0))
* **mobile/extension:** use padding-bottom if bottom elements visible ([d585315](https://github.com/aeternity/superhero-wallet/commit/d585315a2ca20cef5f4623539b958ecbee862390))
* **notifications:** use first name in the list if chainNames presented ([4bad5e7](https://github.com/aeternity/superhero-wallet/commit/4bad5e726a34581ae8d54f8e145315b1b2641942))
* **retip:** add missing account getter ([84b8801](https://github.com/aeternity/superhero-wallet/commit/84b88014aad06c55901bc0154d62e5aa1c14eb00))
* **status:** position NodeConnectionStatus properly ([5eb84f9](https://github.com/aeternity/superhero-wallet/commit/5eb84f9560bad9716d0a23c87413ca06768e562c))
* **tests:** remove header check in last intro screen ([35f07ac](https://github.com/aeternity/superhero-wallet/commit/35f07ac4d57d8aa4fb73e6bcd6b9fbbb7cb732dc))
* **web-iframe-popups:** make iframe popups notRebranded ([ecc4acb](https://github.com/aeternity/superhero-wallet/commit/ecc4acbac49fb46845a769bc02858bf211dcbb74))


### Maintenance

* **tx:** return empty tx list if getTxByAccount returns error ([2b22dc2](https://github.com/aeternity/superhero-wallet/commit/2b22dc25045a7cf4f78fe5f94eb22227e9a4f5d8))

## [0.6.0](https://github.com/aeternity/superhero-wallet/compare/v0.5.6...v0.6.0) (2021-04-08)


### Features

* **transaction-list:** rebrand TransactionList ([91a94dd](https://github.com/aeternity/superhero-wallet/commit/91a94dd25e4e7d5414b931ba2bf075139f0e7cf7))
* add TabBar menu ([829644e](https://github.com/aeternity/superhero-wallet/commit/829644e3f4174b77df648599ce8e90fb586b66d8))
* **mixins:** introduce basic mixins ([8063d32](https://github.com/aeternity/superhero-wallet/commit/8063d3254f9b4df837aeb3279541c049f18ad2d5))
* **web-wallet-alignment:** align desktop and mobile web version ([093e93b](https://github.com/aeternity/superhero-wallet/commit/093e93b67eee05c8cef43c147323a5f4f4aa4214))
* add CopyButton component ([2ecc529](https://github.com/aeternity/superhero-wallet/commit/2ecc5297139ab8a39d0f16613182d2630442c5fd))
* add TransactionDetails page ([7d6bdcc](https://github.com/aeternity/superhero-wallet/commit/7d6bdccd972f0c2b33056801694d8e14e065fbc8))
* allow user to report a bug if they are not logged ([4623ebb](https://github.com/aeternity/superhero-wallet/commit/4623ebbc44bfaf2fe6b67227bd3da3263bb6199d))
* include stale bot ([8a9f57b](https://github.com/aeternity/superhero-wallet/commit/8a9f57bf04f40b1d89c8290bc4f1ea3d45755515))
* **header:** implement home button ([becb20c](https://github.com/aeternity/superhero-wallet/commit/becb20c3921dfdf73f07c64b6f4054706e6f4e00))
* enable adaptive icons in Android 8 and above ([5f7b0c4](https://github.com/aeternity/superhero-wallet/commit/5f7b0c4fa3f376e27803fe9aa95942e5322806c4))
* home menu buttons carousel by new design ([2b28c49](https://github.com/aeternity/superhero-wallet/commit/2b28c49ea382f8934d92de99f0488bb5b1292f77))
* rebrand Header component ([26a54d3](https://github.com/aeternity/superhero-wallet/commit/26a54d3a3bf6cb1bdf8dd877a9e607f8047b9ece))
* rebrand RecentTransactions component ([6384750](https://github.com/aeternity/superhero-wallet/commit/638475034f58a14e6979a415d00c29b84a2c2a01))
* rebrand TransactionItem component ([7f3036b](https://github.com/aeternity/superhero-wallet/commit/7f3036bf81568a9f5f63402d74ee1dc0ebdb0e41))
* update Index page designs ([15a48dd](https://github.com/aeternity/superhero-wallet/commit/15a48dd58ff6dbd13352a442ed248a9776061818))
* update Platform component designs ([00e741f](https://github.com/aeternity/superhero-wallet/commit/00e741fe868c85e4602db883e04755e6101e163c))
* update SidebarMenu designs ([f0f3883](https://github.com/aeternity/superhero-wallet/commit/f0f3883c18dc82da494048a96a09230647d750d6))


### Bug Fixes

* **app:** make desktop border outside as per designs ([77a3fd6](https://github.com/aeternity/superhero-wallet/commit/77a3fd6fae474d8efdcf76b8f856c3893a3a50d5))
* **box-btn:** adjust hover and active bg colors ([f0abd59](https://github.com/aeternity/superhero-wallet/commit/f0abd59bb76f1fd54964f4b4269300da23d8bd42))
* **check-aens-name:** drop unused .text aens suffix ([4984780](https://github.com/aeternity/superhero-wallet/commit/49847809a04a1370f9c20494613098d0e61bd3c7))
* **ci:** don't fetch develop if running tests on develop ([8e87cd4](https://github.com/aeternity/superhero-wallet/commit/8e87cd49ab4da98ab939709c2bffbbd576589cbf))
* **claim-links:** use account getter instead of nonexistent account state ([3eb8881](https://github.com/aeternity/superhero-wallet/commit/3eb88816ccdfde4a9b7d7048834f40c3b18dbc2f))
* **commitlint:** revert run commitlint from first valid commit ([29e44a2](https://github.com/aeternity/superhero-wallet/commit/29e44a2efa1b0cea00b0cda37bc15b5f1be2c874))
* **details:** disable setPointer button if name is pending ([76ddee1](https://github.com/aeternity/superhero-wallet/commit/76ddee17a87f87bb198b469698383b36a64277b2))
* **details:** leave details page if nameEntry become unvailable ([078b1ab](https://github.com/aeternity/superhero-wallet/commit/078b1ab9fd87dd8d1b3172f4b87bebc646646289))
* **e2e:** more accurate popup opening ([4a7fab3](https://github.com/aeternity/superhero-wallet/commit/4a7fab3c2683ba5baab57c172293a345434d4caa))
* **firefox-redirect:** exclude redirect.js from popup.html ([4a9b88d](https://github.com/aeternity/superhero-wallet/commit/4a9b88d41634079150a7891f764c2380455b7fa3))
* **global:** scroll to top on route change ([2dcceca](https://github.com/aeternity/superhero-wallet/commit/2dcceca1ef84e5aea5c15e76b55b7370ea9f7935))
* **icons:** change Checkbox checked state ([229abec](https://github.com/aeternity/superhero-wallet/commit/229abec55096161289477d755a5e7329e690b149))
* **icons:** make icons proper size ([2acbcb7](https://github.com/aeternity/superhero-wallet/commit/2acbcb7d244d20437a49fcbf3f8d5a281d4095e4))
* **import-account:** show loader before expensive sync calculation ([1c06dd8](https://github.com/aeternity/superhero-wallet/commit/1c06dd84708d92d149aff2a034baf1a9c64964b7))
* **menu:** link to payments page ([bea7205](https://github.com/aeternity/superhero-wallet/commit/bea720531ca4059217f9ba77f460b38f37b09908))
* **menu:** link to tokens page ([c2c50ea](https://github.com/aeternity/superhero-wallet/commit/c2c50ea1bb42d92725c68c66a7950f415ca1d733))
* **names:** remove obsolete removed state in names ([12f172f](https://github.com/aeternity/superhero-wallet/commit/12f172f37123e6ff5f0b624ef29c45e1d5421ace))
* **networks:** make editing of networks reactive ([1b99f26](https://github.com/aeternity/superhero-wallet/commit/1b99f2696c44757cd9b56befcb2b632776668e4e))
* **not-found:** redirection to initial page if logged it ([39b7c00](https://github.com/aeternity/superhero-wallet/commit/39b7c0024abc2c40f3a810e7d2ccf5af03d535f0))
* **plate:** show only bottom border as per designs ([1a322e2](https://github.com/aeternity/superhero-wallet/commit/1a322e2d5eede8d5fe73ea7176669213b37c0586))
* **popup-header:** hide header in popups ([6302f2e](https://github.com/aeternity/superhero-wallet/commit/6302f2eb658ed9314d088220af0292245f395869))
* **recent-txs:** remove duplicated margin ([83fdc90](https://github.com/aeternity/superhero-wallet/commit/83fdc904ecdc1e4309d3d64601d4124d84d6b407))
* **side-menu:** align item text and icon ([008845d](https://github.com/aeternity/superhero-wallet/commit/008845dd4725d7b858f95d248bdadf58f3e66c41))
* **sign-tx:** disable not working amount editor ([b631580](https://github.com/aeternity/superhero-wallet/commit/b6315800acfe397407faa7aff47804ae185300d8))
* **style:** make menu button according to designs ([7baeb8c](https://github.com/aeternity/superhero-wallet/commit/7baeb8cf2e90e2759668736a28fe9f2e445bd990))
* **styles:** adjust line-height of typography fonts ([3b7c760](https://github.com/aeternity/superhero-wallet/commit/3b7c76091a3f9a8267bcf0ee81d4636585264eb9))
* **styles:** align Header items according to designs ([7b2f3f6](https://github.com/aeternity/superhero-wallet/commit/7b2f3f63260e0a2f4c6c5e4e6d7abb9023becd76))
* **styles:** change background colors ([ae0f970](https://github.com/aeternity/superhero-wallet/commit/ae0f97059854dafce4e107fab7894e53f66cec40))
* **styles:** change styles for an a ([0f1b03f](https://github.com/aeternity/superhero-wallet/commit/0f1b03f6df8b20332289a9c4a6b82b0cbda69316))
* **tab-bar:** add main min-height to extension ([abe8767](https://github.com/aeternity/superhero-wallet/commit/abe876796446317ff1d9a91b2e3a1230daea6fba))
* enable PrivacyPolicy if not authorised (available from about page) ([9ae0a09](https://github.com/aeternity/superhero-wallet/commit/9ae0a090df60be9abc51f7363663ab96c09272d7))
* **styles:** align CheckBox items properly ([f9946d9](https://github.com/aeternity/superhero-wallet/commit/f9946d9da62f8336db181f6b08603cf550aaedd2))
* set formatted mnemonic phrase ([3a95cae](https://github.com/aeternity/superhero-wallet/commit/3a95caefeb472ab80e89384f58001643075ce993))
* **tx-details:** handle fetched pending transactions ([e99754e](https://github.com/aeternity/superhero-wallet/commit/e99754ec5b4bf3c5a33c4a1e6783a497f1e11b55))
* adjust TruncateMid component ([fa9a5fd](https://github.com/aeternity/superhero-wallet/commit/fa9a5fddf4b4bbe7ead9df369fe61ed7c438f41f))
* remove unused global styles ([9898017](https://github.com/aeternity/superhero-wallet/commit/9898017c0564d9d3a12a24b243ae5f8b3e1e88d7))
* rewrite tests depending on old SidebarMenu ([b621f77](https://github.com/aeternity/superhero-wallet/commit/b621f771988457f3484306ae697c401b0768dd03))
* set spinner color as per new design ([cb57c04](https://github.com/aeternity/superhero-wallet/commit/cb57c04d6d2d66f8f9f44c7fdddf2d4336b11bc5))
* use TruncateMid only for custom titles ([8f78218](https://github.com/aeternity/superhero-wallet/commit/8f7821896690250546903bb8729a044a1635c8b6))


### Style

* **button:** restyle button according to new designs ([0cc65ca](https://github.com/aeternity/superhero-wallet/commit/0cc65cac665d7f977d89b70da28d6f283dabe981))
* **font:** add sans 12 medium ([6a4cb5a](https://github.com/aeternity/superhero-wallet/commit/6a4cb5a0c28bfe83fc9031c1e541b8ad8353c380))
* **font:** replace Roboto with IBM Plex Sans ([ec15523](https://github.com/aeternity/superhero-wallet/commit/ec1552306dd376383592f1a3d8c7da7357486c64))
* **global:** replace html background-color ([097d968](https://github.com/aeternity/superhero-wallet/commit/097d968b67d734a6c5d838204cb442b82bc105de))
* **header:** set bg color as per new designs ([4131277](https://github.com/aeternity/superhero-wallet/commit/4131277b0b6d608a6dc5afb532b5c923cad08274))
* **variables:** add new colors ([66d39fa](https://github.com/aeternity/superhero-wallet/commit/66d39fa5c1f4fbdd034caedec081ea06d4bc6679))


### Tests

* **fix:** use back button in top-up ([76c35f4](https://github.com/aeternity/superhero-wallet/commit/76c35f40fe7ce50d561e679dd7358c0ea2c47b7c))


### Maintenance

* handle clipboard copy success more accurately ([1e6f3c1](https://github.com/aeternity/superhero-wallet/commit/1e6f3c12d6dc88dea793f21f90116afafed8c2a2))
* **container-width:** rename container-width to extension-width ([12896a5](https://github.com/aeternity/superhero-wallet/commit/12896a5ecb26d69a8cb9e70b2b8441572aca61d8))
* **global-input:** remove unused global input styles ([7a954c6](https://github.com/aeternity/superhero-wallet/commit/7a954c6687aed1b5df642b95187cd70f2cfd7124))
* **icons:** remove unused icon ([2520d56](https://github.com/aeternity/superhero-wallet/commit/2520d56fa0ea318396b043e8f6a966b3e38d2820))
* **import-account:** remove unnecessary loading screen ([77a2277](https://github.com/aeternity/superhero-wallet/commit/77a2277c0eeb587303445f74783f1e254ba4eba6))
* **input:** rebrand Input component ([ea511a0](https://github.com/aeternity/superhero-wallet/commit/ea511a042dd67ae4b3820c58a7e8c35be593870d))
* **menu-carousel:** use flickity buttons and make responsive alignment ([1ffdf22](https://github.com/aeternity/superhero-wallet/commit/1ffdf225283a97b566a184a097250499c58a24ac))
* **plate:** extract common styles to Plate component ([7dcc6f5](https://github.com/aeternity/superhero-wallet/commit/7dcc6f564beeef3aa39d9088312a73047a9be58d))
* **plate:** remove negative margin ([de8e4c8](https://github.com/aeternity/superhero-wallet/commit/de8e4c8cfa7197637a88388ff946ac1a6bef4003))
* **scrollbar:** hide scrollbar completely ([874592c](https://github.com/aeternity/superhero-wallet/commit/874592cf714d0bbaeff78fb24facfcdb20624a43))
* **search-bar:** refactor TokensPreview input into SearchBar ([cae51d1](https://github.com/aeternity/superhero-wallet/commit/cae51d108fa2d2806e61c316a6aca220f9b71cee))
* background rpc sdk ([28cdf10](https://github.com/aeternity/superhero-wallet/commit/28cdf10f00df58ecc7efe7bd8593b6e9939e4ffe))
* disable vue-i18n/no-raw-text rule ([c4f8573](https://github.com/aeternity/superhero-wallet/commit/c4f8573f3f0300cf3f955a755dee39553d5d5f6d))
* e2e tests for TransactionDetails page ([d68d8f1](https://github.com/aeternity/superhero-wallet/commit/d68d8f1d66da2e500b0f4c5a07df07e89c99e9ad))
* extract explorer url getter ([b9dd53f](https://github.com/aeternity/superhero-wallet/commit/b9dd53febda9319a59be42f7df7cc81547764c9f))
* extract InfoBox component ([645a323](https://github.com/aeternity/superhero-wallet/commit/645a323620168908a2576dc635a98ebb3970a208))
* extract LinkButton component ([3c248e3](https://github.com/aeternity/superhero-wallet/commit/3c248e3706805ee5678f84efae9226106fdba395))
* extract Plate component ([958d066](https://github.com/aeternity/superhero-wallet/commit/958d066bfc5ad443d28a15890a4f1e7fc9ed2bdc))
* extract transaction getters ([0a5d109](https://github.com/aeternity/superhero-wallet/commit/0a5d109ce898f6fd6e45173a611edad521e047c0))
* keep only state in component data objects ([c567b5b](https://github.com/aeternity/superhero-wallet/commit/c567b5be90bd51cd3b08f0a6344191fdeb8bcf63))
* rebrand logo in About page ([c4f3de3](https://github.com/aeternity/superhero-wallet/commit/c4f3de3b8815e8b69faaff0dcd63daf397797b37))
* remove extra IS_EXTENSION_BACKGROUND check ([8f36e51](https://github.com/aeternity/superhero-wallet/commit/8f36e51e08001468f3368a9de8e701b1b52ecbce))
* remove openUrl ([37a9b71](https://github.com/aeternity/superhero-wallet/commit/37a9b71f045b360c2402b2bc48cdcfbf95704fd3))
* remove unnecessary cordova-plugin-inappbrowser ([1cee0ea](https://github.com/aeternity/superhero-wallet/commit/1cee0ea1f6c0d5955426208688668b6ddb24be73))
* **background-utils:** subscribe to network from store ([a134a11](https://github.com/aeternity/superhero-wallet/commit/a134a111a2716bc2fca7465559ecbe6a1d3c9388))
* **invites:** show generated-invites section if invites exist ([d8e7610](https://github.com/aeternity/superhero-wallet/commit/d8e76106b93205d147e487a63bd440d388bac74e))
* **locales:** update urlToClaim text ([c111751](https://github.com/aeternity/superhero-wallet/commit/c111751f7643f42507b2f61edd59e7da56076892))
* **popup:** get rid of popup class ([3c37f03](https://github.com/aeternity/superhero-wallet/commit/3c37f035dbaeb4f4c13278a7de46291ed1dac047))
* **popup-wallet:** subscribe to current network ([4ce4c27](https://github.com/aeternity/superhero-wallet/commit/4ce4c275bd63ebc9d5659dab5cda9769d9dfd026))
* **receive:** remove home button in favor of the back arrow ([73d85e2](https://github.com/aeternity/superhero-wallet/commit/73d85e234ac24f32af7b435deaa057ac0ee89ed1))
* **settings:** redirect back to settings after backup seed ([9ada9dd](https://github.com/aeternity/superhero-wallet/commit/9ada9dd057ac102602179eb35fdd2a7a80bf6141))
* **terms-of-service:** refactor i18n titles data binding ([ab89171](https://github.com/aeternity/superhero-wallet/commit/ab8917157671190aef6acef29181a92465d8caec))
* **tx-item:** use RouterLink component ([4925bec](https://github.com/aeternity/superhero-wallet/commit/4925bec992cac4764113082fbdaf40bb4acdb1a8))
* **webpack:** simplify path ([482ea23](https://github.com/aeternity/superhero-wallet/commit/482ea23a050c5bad08dfd6b611fddb0292856844))
* drop account state field ([9196670](https://github.com/aeternity/superhero-wallet/commit/9196670816720ff4992edad3cbc6d1b96d03f1f9))
* extract getPopupProps call ([a757a92](https://github.com/aeternity/superhero-wallet/commit/a757a9244449f3b015b22df725a49903d6568938))
* fix typo in checkAensName function name ([6c284f9](https://github.com/aeternity/superhero-wallet/commit/6c284f9b88b96ddb5807253d7534ba7e48b01b85))
* make account getter depending only on mnemonic ([7459384](https://github.com/aeternity/superhero-wallet/commit/7459384f8b1ae24a7c31b96aacbdd97b57129c18))
* make width and height more clean ([89c112b](https://github.com/aeternity/superhero-wallet/commit/89c112b6ad48dbaaef405e5f4468586de8662a43))
* prefer 'mounted' hook instead of 'created' ([3d7d118](https://github.com/aeternity/superhero-wallet/commit/3d7d118bb26078753533e026aa308ddbf3327508))
* remove unnecessary generateWallet method ([4598fd3](https://github.com/aeternity/superhero-wallet/commit/4598fd3b0522535baf8ac3d25a0f1f95b3b51918))
* remove unnecessary getAccount method ([6c23bba](https://github.com/aeternity/superhero-wallet/commit/6c23bba5a21a89f8c5f68112205d71784b4b5730))
* remove unnecessary getKeyPair method ([f06f4fd](https://github.com/aeternity/superhero-wallet/commit/f06f4fdca05c5c603244476b6960d7bb3d372523))
* remove unnecessary isLoggedIn method ([f6aa1c8](https://github.com/aeternity/superhero-wallet/commit/f6aa1c8fcce32c3203050ac95bcb517264f6b699))
* remove unnecessary mainLoading ([4219fa3](https://github.com/aeternity/superhero-wallet/commit/4219fa3ebfeab29bb426f5c7efbee49eaff36d57))
* remove unused AEX2_METHODS ([0359e48](https://github.com/aeternity/superhero-wallet/commit/0359e485efd6e2a235e690753aa3b62e71a53ca4))
* remove unused helpers functions ([e36fb8b](https://github.com/aeternity/superhero-wallet/commit/e36fb8b0d11daef4b0b78ce7cfe501869ba6f68c))
* rename InfoBox component to DetailsItem ([fae8377](https://github.com/aeternity/superhero-wallet/commit/fae8377a6a35a4e20d3b25e3f8edc4600af45ff7))
* rename misspelled type face ([d28b686](https://github.com/aeternity/superhero-wallet/commit/d28b6867a1b7d9d5cce5c9f57410f2c50e301015))
* router beforeEach hook ([7828e28](https://github.com/aeternity/superhero-wallet/commit/7828e284fbd223103a2c290946bd75f8118f313d))
* use getter instead of isLoggedIn state field ([cdc3fb9](https://github.com/aeternity/superhero-wallet/commit/cdc3fb9f3d30ee5757e6e68f6b82aaf93e2a6186))
* **background:** use getters instead of getActiveAccount ([a7cd621](https://github.com/aeternity/superhero-wallet/commit/a7cd621edbbd3229b5e76f631b96a406487e8fb7))
* **background:** use getters instead of getState ([3a5b9a7](https://github.com/aeternity/superhero-wallet/commit/3a5b9a73cf2f06bf729216f0739030b5f385098f))
* remove unused aes file ([daca8c7](https://github.com/aeternity/superhero-wallet/commit/daca8c7cf8779c8d1cdde9c37a526296116130eb))
* remove WalletController ([a5dc06e](https://github.com/aeternity/superhero-wallet/commit/a5dc06eb366e67ea41148f109046c47407977439))
* **event-bus:** use store plugin instead ([2ae38b8](https://github.com/aeternity/superhero-wallet/commit/2ae38b8f84cec84eb368816e6771854fb8628771))
* **header:** remove redundant disabled prop on logo link ([b82196f](https://github.com/aeternity/superhero-wallet/commit/b82196f6e6d1ded926219974957a881cdd2df556))
* **import-account:** simplify code ([90d67f1](https://github.com/aeternity/superhero-wallet/commit/90d67f134b65cd70f78b781e1fa7928b4ae5ddea))
* **message-sign:** remove unused name property ([9590e7d](https://github.com/aeternity/superhero-wallet/commit/9590e7d5049ec71af1a5eb73b37ecb6a5ca3c27d))
* account store plugin ([b08433b](https://github.com/aeternity/superhero-wallet/commit/b08433b15613c9adae70c291d30a7c7d267b6be5))
* option to load svg with no optimization ([b1184de](https://github.com/aeternity/superhero-wallet/commit/b1184de5efa4c14759c7cc40def8a3b6c96c3974))
* remove unused AskAccounts popup ([09130ee](https://github.com/aeternity/superhero-wallet/commit/09130ee4b42fb43dc1d7a80c04c8857a536fa249))
* rename publicKey to address ([548dbbc](https://github.com/aeternity/superhero-wallet/commit/548dbbcc5aac2aa360f8655e508e11697b188ade))
* **ft:** loadTokenBalances only for the current account ([363a71e](https://github.com/aeternity/superhero-wallet/commit/363a71e37b8157ae8ec8dc10dd588a76863a87c1))
* **notifications:** getAllNotifications only for the current account ([09fd7f3](https://github.com/aeternity/superhero-wallet/commit/09fd7f3376a9ab25c69e82b2f02a6bd189c29652))
* use a single popup to confirm transaction signing ([eb089bc](https://github.com/aeternity/superhero-wallet/commit/eb089bcfc9dd33d406ceae6c430f45ff919d1d9f))
* use account instead of activeAccountName getter ([f57cad9](https://github.com/aeternity/superhero-wallet/commit/f57cad9b173309bdb00300004d4e75caca7b3019))
* **sass:** replace deprecated node-sass with sass ([af97284](https://github.com/aeternity/superhero-wallet/commit/af97284ad2fb43ca75da03eb90963510e5f32a40))
* **sign-account-identicons:** validate transaction fields ([aaac083](https://github.com/aeternity/superhero-wallet/commit/aaac0833c6b9a2ebf1339b5581b9d7bf631ba26e))
* **styles:** adjust Platform styles ([77b3e81](https://github.com/aeternity/superhero-wallet/commit/77b3e81d77c921d1b0a23bf784e0bec429c51d5c))
* **styles:** update hover,active states of CheckBox ([7df36f1](https://github.com/aeternity/superhero-wallet/commit/7df36f1d0aa408fce4004480209ca6e0515f8f05))
* **styles:** use color variables ([14721fe](https://github.com/aeternity/superhero-wallet/commit/14721fe2b9056027c89cbd9fb4066d1cdbe3c93c))

### [0.5.6](https://github.com/aeternity/superhero-wallet/compare/v0.5.4...v0.5.6) (2021-02-23)


### Features

* fetch pending transactions ([a9a786c](https://github.com/aeternity/superhero-wallet/commit/a9a786c8b725dcb347f95641fcc22be18492c1df))
* improve truncating of a long strings ([25eb9e8](https://github.com/aeternity/superhero-wallet/commit/25eb9e8db54fb29a1c0ac0e8b6c1e2bd4a26ecd6))
* **aens:** remove minimum aens name length limit ([be85b57](https://github.com/aeternity/superhero-wallet/commit/be85b578ff0517a61db5667a701c59122bbe7916))


### Bug Fixes

* **ios:** don't import BrowserQRCodeReader on mobile ([6f7b772](https://github.com/aeternity/superhero-wallet/commit/6f7b772f9ba75bb318994480228f3b001d9a6a2e))
* hide date if transaction is pending ([b906b20](https://github.com/aeternity/superhero-wallet/commit/b906b20292f10cbff637730be721146d9edd20f2))
* show pending transactions properly ([694450f](https://github.com/aeternity/superhero-wallet/commit/694450f897a6c74b3c4299a8c87f22d4f5ee2647))
* **helper:** return undefined if no response field ([58b84ab](https://github.com/aeternity/superhero-wallet/commit/58b84ab59b938ed922235864805979e1a4c96156))

### [0.5.2](https://github.com/aeternity/superhero-wallet/compare/v0.5.1...v0.5.2) (2021-02-08)


### Features

* **changelog:**  add sections ([ff062cf](https://github.com/aeternity/superhero-wallet/commit/ff062cf7fd52c4e5155b6ce9e6d9b6df58c11a3f))
* **mobile:** tip shared url ([865302b](https://github.com/aeternity/superhero-wallet/commit/865302bc54632d4aea77208931d1d801e736e3a8))


### Maintenance

* **lint:** setup pre-commit hook ([686ee0c](https://github.com/aeternity/superhero-wallet/commit/686ee0cdd1772b31d9df961020810a5b4059abef))

### [0.5.1](https://github.com/aeternity/superhero-wallet/compare/v0.5.0...v0.5.1) (2021-01-22)


### Features

* **changelog:** build using standard-version ([505412b](https://github.com/aeternity/superhero-wallet/commit/505412b59fff07e3879835e5bef86457ab595ea7))


### Bug Fixes

* set success message as a div ([9b19b15](https://github.com/aeternity/superhero-wallet/commit/9b19b1558a955ad9a82fdf0b49e26926654a193d))
