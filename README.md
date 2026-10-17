# Wellnest Clinical demo

Wellnest Clinical is an installable front-end hospital EHR workflow prototype. It includes a staff overview, synthetic patient queue, searchable patient charts, schedule, mock diagnostic orders, session-only note and encounter actions, an original botanical theme, and a multilingual assistant panel (English, Spanish, French, Hindi, and Arabic).

The assistant uses localized scripted responses in the demo. A real AI service is not connected. To connect one, set `VITE_CLINICAL_ASSISTANT_ENDPOINT` to a same-origin, authenticated backend endpoint implementing the contract in [ARCHITECTURE.md](ARCHITECTURE.md). Never put model API keys in the browser or send real patient data to an unreviewed model service.

Run with Vite:

```sh
npm install
npm run dev
```

For a static preview without Node.js, run `python -m http.server 5173 --bind 127.0.0.1` from the project directory and open `http://127.0.0.1:5173`.

## Android and GitHub Pages

The web app is published at [https://palv10865.github.io/Healthcare/](https://palv10865.github.io/Healthcare/). On Android, open it in Chrome and choose **Install app** or **Add to Home screen** from the browser menu.

The Capacitor project is in `android/`. Download the current debug APK from the [Wellnest Clinical v1.1.0 release](https://github.com/palv10865/Healthcare/releases/tag/v1.1.0). Each push to `main` also builds a debug APK in GitHub Actions and uploads it as the `wellnest-clinical-debug-apk` artifact. The debug APK is for testing/sideloading, not Google Play release; Play distribution needs a release signing key, store listing, and Play Console enrollment.

For local Android development, install Node.js 22, Java 21, Android SDK 36, then run `npm ci` and `npm run android:sync`. Open the project with `npm run android:open`, or build the debug APK with `cd android && ./gradlew assembleDebug` (Windows: `cd android; .\gradlew.bat assembleDebug`).

The botanical theme can be switched from the top bar and is remembered on this device. Chat messages remain in memory for the current page session only.

All patient and clinical data is fictional seed data. Notes and encounter actions are held in page memory and disappear when the app reloads. Do not enter real patient information or use this prototype for care. It has no authentication, authorization, audit logging, backend persistence, clinical decision support, or privacy/compliance controls. The Firebase rules and hosting configuration are not connected to the prototype. Production EHR use requires a secure, reviewed backend, verified identities, role-based access, audit trails, backups, incident response, clinical governance, and applicable privacy/compliance review.
