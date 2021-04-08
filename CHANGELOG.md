# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
