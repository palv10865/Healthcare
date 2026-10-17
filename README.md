# Wellnest Clinical demo

Wellnest Clinical is an installable front-end hospital EHR workflow prototype. It includes a staff overview, synthetic patient queue, searchable patient charts, schedule, mock diagnostic orders, and session-only note and encounter actions. The PWA caches its shell for offline launch after the first visit.

Run with Vite:

```sh
npm install
npm run dev
```

For a static preview without Node.js, run `python -m http.server 5173 --bind 127.0.0.1` from the project directory and open `http://127.0.0.1:5173`.

## Android and GitHub Pages

The web app is published at [https://palv10865.github.io/Healthcare/](https://palv10865.github.io/Healthcare/). On Android, open it in Chrome and choose **Install app** or **Add to Home screen** from the browser menu.

The Capacitor project is in `android/`. Each push to `main` builds a debug APK in GitHub Actions and uploads it as the `wellnest-clinical-debug-apk` artifact. Download it from the workflow run under the repository's **Actions** tab. The debug APK is for testing/sideloading, not Google Play release; Play distribution needs a release signing key, store listing, and Play Console enrollment.

For local Android development, install Node.js 22, Java 21, Android SDK 36, then run `npm ci` and `npm run android:sync`. Open the project with `npm run android:open`, or build the debug APK with `cd android && ./gradlew assembleDebug` (Windows: `cd android; .\gradlew.bat assembleDebug`).

All patient and clinical data is fictional seed data. Notes and encounter actions are held in page memory and disappear when the app reloads. Do not enter real patient information or use this prototype for care. It has no authentication, authorization, audit logging, backend persistence, clinical decision support, or privacy/compliance controls. The Firebase rules and hosting configuration are not connected to the prototype. Production EHR use requires a secure, reviewed backend, verified identities, role-based access, audit trails, backups, incident response, clinical governance, and applicable privacy/compliance review.
