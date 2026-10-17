# Wellnest Clinical demo

Wellnest Clinical is an installable front-end hospital EHR workflow prototype. It includes a staff overview, synthetic patient queue, searchable patient charts, schedule, mock diagnostic orders, and session-only note and encounter actions. The PWA caches its shell for offline launch after the first visit.

Run with Vite:

```sh
npm install
npm run dev
```

For a static preview without Node.js, run `python -m http.server 5173 --bind 127.0.0.1` from the project directory and open `http://127.0.0.1:5173`.

## Android and GitHub Pages

Push this project to a GitHub repository on the `main` branch. In the repository, select **Settings → Pages → Build and deployment → GitHub Actions**. The included workflow builds and publishes the site after each push. Open the published HTTPS URL in Android Chrome and choose **Install app** or **Add to Home screen** from the browser menu.

This is a PWA, not a Google Play Store release. Play Store distribution requires a separate Android Trusted Web Activity or native wrapper, signing, store listing, and Play Console enrollment.

All patient and clinical data is fictional seed data. Changes are held in page memory and disappear on reload. Do not enter real patient information or use this prototype for care. It has no authentication, authorization, audit logging, backend persistence, clinical decision support, or privacy/compliance controls. The Firebase rules and hosting configuration are not connected to the prototype. Production EHR use requires a secure, reviewed backend, verified identities, role-based access, audit trails, backups, incident response, clinical governance, and applicable privacy/compliance review.
