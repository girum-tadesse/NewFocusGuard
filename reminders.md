# Project Reminders

## Firebase & Google Sign-In

*   **SHA-1 Fingerprints:** Remember to add SHA-1 fingerprints to the Firebase console for your Android app (Project Settings > Your apps > Android app > Add fingerprint):
    *   The debug keystore SHA-1 is needed for development and testing Google Sign-In.
    *   If you have a release keystore or different build variants (e.g., staging, production), you'll need to add their respective SHA-1 fingerprints as well when you're ready to build for those environments.
*   **Web Client ID:** The Web Client ID for Google Sign-In is configured in `src/firebase/config.js` and is obtained from the Google Cloud Console (APIs & Services > Credentials > OAuth 2.0 Client IDs > Type: Web application).
*   **`google-services.json` (Android):** Ensure this file is up-to-date in your project root, especially after making changes to Firebase project settings (like package name or adding SHA-1 fingerprints, though re-downloading is mainly for package name changes or initial setup).
*   **`GoogleService-Info.plist` (iOS):** If targeting iOS, ensure `GoogleService-Info.plist` is correctly placed and configured. For Google Sign-In on iOS, you may also need to configure URL schemes using the `REVERSED_CLIENT_ID` from this plist file in your Xcode project's URL Types (often handled by Expo plugin if plist is present).

## General Build & Development

*   **Clean Native Builds:** After significant native configuration changes (e.g., adding plugins, updating `google-services.json`/`GoogleService-Info.plist`, `app.json` native settings), it's often necessary to delete the `android` and/or `ios` directories and run `npx expo run:android` or `npx expo run:ios` to ensure changes are correctly applied.
*   **Package Names & Bundle Identifiers:** Ensure `android.package` and `ios.bundleIdentifier` in `app.json` match exactly with the package name / bundle ID registered in your Firebase project settings (and reflected in `google-services.json` / `GoogleService-Info.plist`).

## Future Refactoring / Todos

*   **`@react-native-firebase` Modular API:** The app has been refactored to use the modular API for Firebase. Continue to use this pattern for any new Firebase interactions.
*   **UI Improvements:** Onboarding UI, auth screens, and other application screens can be polished further based on `requirements copy.md`.
*   **Error Handling:** Enhance user-facing error messages and logging for easier debugging.
*   **Linter Warnings:** Address any remaining linter warnings (e.g., `AuthContext.d.ts` missing default export if it persists and is deemed necessary to fix). 