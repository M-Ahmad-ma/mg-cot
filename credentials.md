# Android Signing Credentials

## Upload Key (for Play Store AAB upload)

| Field | Value |
|-------|-------|
| **Keystore File** | `upload-key.jks` |
| **Keystore Location** | `android/app/upload-key.jks` |
| **Key Alias** | `upload` |
| **Store Password** | `somethingiswrong` |
| **Key Password** | `somethingiswrong` |

## Usage

### Build AAB
```bash
cd android && ./gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Build APK
```bash
cd android && ./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

## Play Store Upload

1. Generate the AAB with the command above
2. Go to **Google Play Console** → Your App → **Release** → **Production** (or testing track)
3. Upload `app-release.aab`
4. When prompted, select **"Upload key"** (not Google Play App Signing key) and use the credentials above
5. If this is the first upload, the keystore will be registered as the app's upload key

## Important

- **Keep `upload-key.jks` safe** — if lost, you cannot update the app on Play Store
- Back up the keystore file and passwords securely
- For production, consider moving passwords to `~/.gradle/gradle.properties` instead of `android/gradle.properties`

## Play Store App Icon

Upload the icon at: `playstore-icon-512.png` (512x512 RGBA PNG)
