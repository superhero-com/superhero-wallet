# Native splash geometry tests

Run on macOS with Xcode and an installed iOS simulator:

```sh
npm run test:ios:splash
npm run test:ios:splash -- --destination 'platform=iOS Simulator,name=iPhone 16,OS=latest'
```

The runner copies the installed splash-screen package into a temporary directory and adds these tests to its Swift Package test target, so they compile the installed, patched source. `node_modules` and the Xcode project stay untouched. Result bundles are written to `artifacts/ios-splash-*.xcresult`.

The tests attach the real `SplashScreen` view to a `WKWebView` in a `UIWindow` and check its window coordinates after status-bar offsets, window resizes and a late window attachment. They register the plugin's frame and bounds observers themselves, because its own setup loads the app's launch storyboard.

`npm run test:ios:splash -- --baseline` reverses the patch in the temporary copy and runs the status-bar offset test, which must then fail on its geometry assertions.
