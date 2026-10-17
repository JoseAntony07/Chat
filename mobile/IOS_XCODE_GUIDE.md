# iOS Simulator and Xcode Guide

This guide covers local iOS setup for Convo Mobile, including the Expo CLI and Xcode workflows. The app is an Expo/React Native development build; it is not launched through Expo Go. Both workflows use the same generated iOS project, the same simulator, and the same Django backend.

For Android Studio and Android Emulator setup, see [ANDROID_STUDIO_GUIDE.md](ANDROID_STUDIO_GUIDE.md).

For installing on a real iPhone or Android phone, see [PHYSICAL_DEVICE_README.md](PHYSICAL_DEVICE_README.md).

## 1. Requirements

- A Mac with Xcode installed. Open Xcode once and accept its license and setup prompts.
- An iOS Simulator runtime and device. In Xcode, open **Xcode → Settings → Components** (called **Platforms** in some versions) and install an iOS runtime. This project has been run on **iPhone 18 Pro / iOS 27**.
- Node.js **24**, selected by `mobile/.nvmrc`. nvm is optional; use any Node version manager or install Node 24 directly.
- npm, which is installed with Node.
- CocoaPods and CMake. With Homebrew:

  ```bash
  brew install cocoapods cmake
  ```

  CMake is needed by the native React Native dependency build on this machine.
- The Django backend dependencies. See the repository [README](../README.md).

Check the selected Xcode command-line tools and available simulators:

```bash
xcode-select -p
xcodebuild -version
xcrun simctl list devices available
```

If more than one Xcode version is installed, select the one you intend to use in **Xcode → Settings → Locations → Command Line Tools**. You can also select it from Terminal (adjust the path if Xcode is installed elsewhere):

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

The command-line selection should point to the same Xcode version you open in the GUI. In the current setup, Xcode 27.1 uses Swift 6.4.

## 2. Install JavaScript dependencies and configure the backend URL

Run these commands from the repository root:

```bash
cd mobile
nvm install       # only if nvm is installed; reads .nvmrc (Node 24)
nvm use          # only if nvm is installed
node --version
npm install
cp .env.example .env
```

Edit `mobile/.env` for the device you are using. The iOS Simulator can reach a backend running on the same Mac through loopback:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000/api
EXPO_PUBLIC_WS_URL=ws://127.0.0.1:8000
```

For a physical phone, use the Mac's Wi-Fi IP address instead of `127.0.0.1`. The phone and Mac must be on the same network, and Django must allow the phone's host and WebSocket origin. For hosted services, use HTTPS and WSS URLs. These `EXPO_PUBLIC_` values are public client configuration; do not put secrets in them.

## 3. Start Django and Metro

The app needs Django for login, conversations, and messages. Start the backend using the instructions in the root README. For the iOS Simulator, Django can listen on `127.0.0.1:8000`.

In a separate terminal, start the Expo development server from `mobile/`:

```bash
cd mobile
npx expo start --dev-client
```

Keep this terminal running while using the app. Metro serves the JavaScript bundle and Fast Refresh updates React Native code. Starting the app from Xcode does not start Metro or Django for you.

If you change `mobile/.env`, stop Metro and restart it so the client configuration reloads:

```bash
npx expo start --dev-client --clear
```

## 4. Run and build with the Expo command

From `mobile/`, build, install, and launch the app on the named simulator:

```bash
npx expo run:ios --device "iPhone 18 Pro"
```

If the simulator name is different, list available devices with `xcrun simctl list devices available`, then substitute its name. You can also boot a simulator first and let Expo prompt you for a target:

```bash
npx expo run:ios --device
```

The first native build can take several minutes. Expo generates the iOS project if it is missing, builds it with Xcode, installs the app, opens the simulator, and starts or reuses Metro. Later, use the same command after native changes or when you want Expo to handle the build and install steps. Normal JavaScript edits are delivered by Metro and usually do not require a native rebuild.

## 5. Build and run through Xcode

The Xcode workspace is generated from `app.json`. Create/regenerate it first if it does not exist (see section 7). Then:

1. From `mobile/`, open the **workspace**, not the `.xcodeproj`:

   ```bash
   open ios/Convo.xcworkspace
   ```

2. In Xcode's toolbar, select the **Convo** scheme and the **iPhone 18 Pro** simulator.
3. Press **⌘B** to build, or **⌘R** to build and launch in the simulator.
4. Keep the Metro and Django terminals running. Xcode builds the native app, but it does not start either service.

Xcode uses the same generated native project as `npx expo run:ios`. Use Xcode when you want to inspect native build logs, select build settings, or build/run from the IDE. Use Expo CLI when you want one command to generate as needed, build, install, and open the app.

## 6. Xcode and command-line cleanup

### Clean the current Xcode build

In Xcode, hold **Option** while opening the **Product** menu, then select **Clean Build Folder**. The shortcut is **Option + Shift + Command + K**. Build again with **⌘B** or **⌘R**.

To remove this app's cached Xcode build products from Terminal instead:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/Convo-*
```

This removes generated build cache only. The next iOS build takes longer while Xcode recompiles.

### Reinstall CocoaPods

If Xcode reports missing pods or a Podfile lock mismatch, from the repository root run:

```bash
cd mobile/ios
pod install
```

### Regenerate the iOS project from Expo config

Use this after changing native dependencies or native Expo configuration, or when the generated iOS project is broken:

```bash
cd mobile
npx expo prebuild --clean --platform ios
cd ios
pod install
cd ..
```

`prebuild --clean` deletes and recreates the generated `ios/` directory. Do not keep manual edits inside that generated directory; configure native behavior through `app.json` or an Expo config plugin. Reopen `ios/Convo.xcworkspace` after regeneration.

## 7. Xcode 27.1 / Swift 6.4 build notes for this project

This project currently configures `expo-build-properties` in `app.json` with:

- `ios.enableSceneSupport: true`
- `ios.usePrecompiledModules: false`

The second setting builds Expo modules from source. It avoids importing precompiled Expo frameworks built with a different Swift compiler than the installed Xcode. Keep the Xcode command-line tools and Xcode GUI on the same Xcode version.

If the build reports `cannot find type '__ObjC::expo' in scope` from `ExpoModulesJSI.swiftinterface`, the ExpoModulesJSI simulator cache may be stale. From `mobile/`, remove its generated build stamp and rebuild:

```bash
rm -f node_modules/expo-modules-jsi/apple/Products/ExpoModulesJSI.xcframework/ios-arm64_x86_64-simulator/.build-hash
npx expo run:ios --device "iPhone 18 Pro"
```

If the nested ExpoModulesJSI build then fails with `resource fork, Finder information, or similar detritus not allowed`, the local workaround used for this Mac is to disable code signing for that intermediate framework build. This edit is inside `node_modules`, is not committed, and is overwritten by reinstalling npm dependencies. Run this once from `mobile/` to reapply it:

```bash
python3 - <<'PY'
from pathlib import Path

script = Path("node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh")
contents = script.read_text()
needle = "    CLANG_COVERAGE_MAPPING=NO \\\n"
replacement = needle + "    CODE_SIGNING_ALLOWED=NO \\\n"

if "    CODE_SIGNING_ALLOWED=NO \\\n" in contents:
    print("Workaround is already present")
elif needle in contents:
    script.write_text(contents.replace(needle, replacement, 1))
    print("Applied local ExpoModulesJSI workaround")
else:
    raise SystemExit("Expected build script line not found; inspect the Expo package version before changing it")
PY
```

Then build again:

```bash
npx expo run:ios --device "iPhone 18 Pro"
```

The app target itself is still built and signed by Xcode for the simulator. Only the generated ExpoModulesJSI intermediate framework has code signing disabled.

## 8. Quick command reference

Run all commands from `mobile/` unless a command says otherwise:

```bash
npx expo start --dev-client                 # Start Metro
npx expo run:ios --device "iPhone 18 Pro"  # Build/install/open in iOS Simulator
npx expo prebuild --clean --platform ios    # Regenerate generated iOS project
npx expo lint                               # Lint
npx tsc --noEmit                            # Type-check
npx expo-doctor                             # Diagnose Expo setup
```

More on the Expo development build and native build workflow: [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) and [Expo SDK 57 build properties](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/).



Q) so both xcode build run with(npx expo start --dev-client ). and expo(npx expo run:ios --device "iPhone 18 Pro" ) run in device hub both uses expo? give me short content for both ways ?

Both workflows use Expo, Xcode, and the same iOS simulator. The difference is which tool starts the native build.

**Xcode:** Start Metro with `npx expo start --dev-client`, then press **⌘R** in Xcode. Metro provides the JavaScript; Xcode builds and launches the iOS app.

**Expo CLI:** Run `npx expo run:ios --device "iPhone 18 Pro"`. Expo builds, installs, and launches the app, and starts or reuses Metro.

Keep Django running for login and messaging in either workflow.

-----------------------------------------------------------

My understanding,

1. Run in Xcode

npx expo start --dev-client

In xcode open `ios/Convo.xcworkspace` and build and run


2. Run by expo 

npx expo run:ios --device "iPhone 18 Pro"

Keep the Expo terminal running for JavaScript updates and the Django backend running for login and messages. If the Simulator window doesn’t appear, open Simulator from Xcode’s Xcode → Open Developer Tool → Simulator menu (Device Hub); the app should already be installed.



Android:
--------
**Xcode builds and runs iOS apps only.** For Android, use **Android Studio** or the Expo command `npx expo run:android`. Both use the same React Native code; they build it with Android’s tools.
