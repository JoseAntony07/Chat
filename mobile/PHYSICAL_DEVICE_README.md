# Run Convo on Physical Phones

This guide covers running the React Native app on a real iPhone or Android phone. Both use the same Expo app and Django backend. The iPhone 16 Pro Max and Android phone must be able to reach your Mac over USB for installation and over Wi-Fi for Metro and the local backend.

For simulator/emulator setup, see the [iOS/Xcode guide](IOS_XCODE_GUIDE.md) and [Android Studio guide](ANDROID_STUDIO_GUIDE.md).

## 1. Prepare the project and phone network

Use Node.js 24 and install the mobile dependencies if this is a fresh checkout:

```bash
cd mobile
npm install
```

Find your Mac's Wi-Fi IP address:

```bash
ipconfig getifaddr en0
```

If that prints nothing, find the Wi-Fi IP under **System Settings → Wi-Fi → Details → TCP/IP**. The iPhone and Android phone must be on the same Wi-Fi as the Mac. Avoid guest Wi-Fi or networks that block devices from talking to each other.

Edit `mobile/.env`, replacing `192.168.1.25` below with your Mac's actual Wi-Fi IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:8000/api
EXPO_PUBLIC_WS_URL=ws://192.168.1.25:8000
```

Both physical phones use the Mac's Wi-Fi IP. `127.0.0.1` only refers to the device itself, so it cannot be used by a phone to reach the backend on the Mac. `EXPO_PUBLIC_` values are included in the client; do not put credentials or secrets there.

## 2. Start the backend and Metro

Start Django from the repository's `backend/` folder, bound to all network interfaces:

```bash
cd backend
source .venv/bin/activate
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

In `backend/.env`, include your Mac's IP in `ALLOWED_HOSTS`. If the WebSocket handshake is rejected, also allow the backend origin through `WEBSOCKET_EXTRA_ALLOWED_ORIGINS`. For example, if the Mac IP is `192.168.1.25`:

```env
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.25
WEBSOCKET_EXTRA_ALLOWED_ORIGINS=http://192.168.1.25:8000
```

Preserve any other values already present in `backend/.env`. The backend reads this file when it starts, so restart Daphne after changing it. Check the [root README](../README.md) for backend migrations, Redis, and other setup.

Start Metro in a separate terminal from `mobile/`:

```bash
cd mobile
npx expo start --dev-client
```

Keep Django and Metro running while using the app. After editing `mobile/.env`, restart Metro and clear its cache:

```bash
npx expo start --dev-client --clear
```

## 3. iPhone 16 Pro Max

### Prepare the iPhone and Xcode

1. Connect the iPhone to the Mac with a data-capable USB cable, unlock it, and tap **Trust This Computer** if asked.
2. Turn on **Settings → Privacy & Security → Developer Mode** on the iPhone. Confirm the restart and enable Developer Mode after the phone restarts.
3. In Xcode, sign in to an Apple account under **Xcode → Settings → Apple Accounts**.
4. Open the project workspace from `mobile/`:

   ```bash
   open ios/Convo.xcworkspace
   ```

5. In Xcode, select the **Convo** scheme and your connected **iPhone 16 Pro Max** as the run destination. Under the app target's **Signing & Capabilities**, enable **Automatically manage signing** and select your Team if Xcode asks.

Apple requires Developer Mode for locally installed development apps and supports automatic signing to register the connected device and create its development profile. See Apple's [Developer Mode](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device) and [run on a physical device](https://developer.apple.com/documentation/xcode/running-your-app-on-simulated-or-physical-devices) guides.

### Build and launch

From `mobile/`, let Expo build and install the app on the connected iPhone:

```bash
npx expo run:ios --device
```

Choose **iPhone 16 Pro Max** if prompted. Or, in Xcode, select the same phone and press **⌘R**. The first physical-device build may ask you to trust the developer certificate on the phone; follow the on-screen prompts. Use Expo's [development build instructions](https://docs.expo.dev/develop/development-builds/introduction/) for the `--device` workflow.

## 4. Android phone

### Prepare Android and connect it to the Mac

1. Enable **Developer options** on the Android phone. The usual method is to tap **Build number** seven times in **Settings → About phone**; the exact menu can vary by manufacturer.
2. In **Developer options**, enable **USB debugging**.
3. Connect the phone to the Mac with USB, unlock it, and accept the phone's **Allow USB debugging?** prompt.
4. Confirm that the Mac sees the device:

   ```bash
   adb devices
   ```

   If the device says `unauthorized`, unlock the phone and accept the prompt. Android's official [hardware device guide](https://developer.android.com/studio/run/device) covers USB debugging and authorization.

### Build and launch

From `mobile/`, build and install the app on the connected Android phone:

```bash
npx expo run:android --device
```

If more than one device appears, Expo prompts you to choose one. You can also open the generated `mobile/android` project in Android Studio, select the connected phone, and press **Run ▶**. If the `android/` folder is not present yet, generate it first from `mobile/`:

```bash
npx expo prebuild --platform android
```

Android Studio builds the native app, but it does not start Django or Metro. Keep both running in their terminals.

## 5. After the first install

For normal React Native JavaScript/TypeScript changes, leave Metro running and use Fast Refresh. You usually do not need another native build. Rebuild after changing native dependencies or Expo native configuration:

```bash
cd mobile
npx expo run:ios --device       # iPhone
npx expo run:android --device   # Android phone
```

If you change `app.json` or a native dependency, regenerate the native project first, then rebuild:

```bash
npx expo prebuild --clean --platform ios
npx expo run:ios --device
```

For Android, use `--platform android` and `npx expo run:android`. A clean prebuild recreates the generated native folder, so do not store manual edits inside `ios/` or `android/`.

```bash
npx expo prebuild --clean --platform android
npx expo run:android --device
```

## Troubleshooting

- **Phone not listed by Xcode or Expo:** unlock it, reconnect the cable, accept the trust prompt, and check Xcode's device destination list. For iOS, confirm Developer Mode is enabled.
- **iOS signing error:** sign in to Xcode, enable automatic signing for the Convo app target, and choose your Team.
- **Android shows `unauthorized`:** unlock the phone and accept USB debugging authorization. Then check `adb devices` again.
- **Phone cannot reach Django:** verify both devices are on the same Wi-Fi, the URLs use the Mac's current IP, Daphne is bound to `0.0.0.0`, and macOS Firewall permits the development services.
- **WebSocket rejected:** check the Daphne log and `WEBSOCKET_EXTRA_ALLOWED_ORIGINS` in `backend/.env`.
- **Changed `.env` but app still uses old URL:** restart Metro with `npx expo start --dev-client --clear` and reload the app.
