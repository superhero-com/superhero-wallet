# Contributing to Superhero Wallet

See the [development guide](docs/development.md) to run the wallet, choose tests for your changes, or work on a blockchain adapter.

## Pull requests

1. Start a `feature/` branch from `develop`, for example `feature/show-token-balance`. Rebase on `develop` if you need to resolve conflicts.
2. Write every commit message in conventional-commit form with a lower-case subject, such as `fix: show the active account balance`. CI runs commitlint on each commit of a PR (`npm run lint:commit` locally). Open a pull request to `develop` and get at least one review before merging.
3. When a change affects a public wallet interface, update its compatibility entry and example. Record the wallet version, SDK version, network and platform you verified. The [GitHub Actions tests](.github/workflows/test.yml) cover individual browser and protocol paths.

For a production hotfix, branch from `master` and merge the reviewed change into both `master` and `develop`.

The [GitHub wiki](https://github.com/superhero-com/superhero-wallet/wiki) has its own repository. After merging a change to a [wiki page](docs/wiki), copy the Markdown into the wiki page of the same name. Keep examples in the versioned guides so the wiki can link to them.

## Releases and upgrades

1. Branch `release/vX.Y.Z` from `develop`. Update and stage the native version and build numbers for the stores. Then run `npm run release -- --commit-all --skip.tag`, adding `--release-as X.Y.Z` to pick the version. standard-version bumps `package.json` and its lockfile, generates `CHANGELOG.md` from the conventional commits, and commits everything as `chore(release): X.Y.Z`. Review the changelog before opening the release PR. Android uses `versionName` and `versionCode` in [Gradle](android/app/build.gradle). iOS uses `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in the [Xcode project](ios/App/App.xcodeproj/project.pbxproj).
2. Review the stage build and relevant tests. For changes to stored wallet data, upgrade a disposable wallet created with the previous release on the same origin or extension ID. Unlock it, compare the derived and imported account addresses, then close and reopen it. On web and extension, the new IndexedDB vault becomes authoritative and removes legacy copies after migration. A rollback build must be able to read the migrated vault. A build that only reads the legacy keys can show an empty wallet. Test that downgrade path before distributing a rollback, or ship a compatible fix. Mobile has separate secure-storage migrations. [Browser vault implementation](src/lib/WalletVault.ts) · [Mobile migration tests](tests/unit/migrations)
3. Merge the reviewed release PR into `master`. Tag the release PR's merge commit on `master` as `vX.Y.Z` and push the tag. Merge `master` back into `develop` through a PR, as #3790 did, so the tag is reachable from `develop`. standard-version starts the next changelog from the last reachable tag.

The [build and deploy workflow](.github/workflows/main.yml) publishes the following artifacts and sites.

| GitHub event | Result |
| --- | --- |
| Push to a branch or tag, except a Dependabot push | Publishes a stage site per ref with build artifacts, including the Android debug APK. Same-repository PRs receive a preview link. |
| Push to `master` | Deploys the production web wallet to `wallet.superhero.com` through GitHub Pages. |
| Push a tag | Creates the GitHub release and uploads the extension ZIP, web ZIP and source ZIP with review provenance. |

To build the release archives locally, use a fresh checkout of the tag with the intended provider settings. Run `npm ci`, then `npm run build:web`, `npm run build:extension` and `npm run build-zip` in that order. The [packaging script](scripts/build-zip.js) places the ZIPs in `dist-zip/` and can rebuild Firefox with reviewer settings after zipping the production extensions. Use the extension ZIP for the final browser check.

Store distribution is a separate signing step. For Android, open the synced project in Android Studio and generate a signed App Bundle with the release key. For iOS, select the App target's signing team, check the associated domain `applinks:wallet.superhero.com` and camera/photo usage descriptions, then archive the release in Xcode and distribute it through Organizer to TestFlight or the App Store. [Mobile build commands](docs/development.md#run-a-target)
