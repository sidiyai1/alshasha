# الشاشة

Arabic newspaper site for **الشاشة**. The public site is RTL. Editors sign in at `/admin/login`. The project is built to stay on the Firebase **Spark** (no-cost) plan: Firebase Authentication and Cloud Firestore only, with classic Firebase Hosting for the static build.

Images and PDF files are **not** stored in Firestore, and direct uploads are **not** implemented. Until a signing service exists outside this frontend, editors paste `https://` links.

## What you can run before Firebase

With an empty `.env.local`, the public site shows local demo articles, archive covers, and a sample PDF. A banner states that nothing is saved to Firebase. Admin login stays closed until Firebase is configured. Demo stories are marked **محتوى تجريبي** and are not reports of real events.

## Requirements

- Node.js 22 or newer
- A Firebase project kept on the Spark plan
- A browser

## Installation

```bash
npm install
npm run demo-assets
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5171` or `http://localhost:5173`.

`npm run demo-assets` rewrites the illustrative SVG covers and the sample PDF in `public/demo`. It does not touch `public/logo.jpg`.

## Firebase setup (Spark only)

1. Create a project in the [Firebase console](https://console.firebase.google.com/).
2. Stay on the **Spark** plan. Do not upgrade to Blaze, and do not enable billing.
3. Do **not** enable Cloud Storage, Cloud Functions, App Hosting, Cloud Run, or any other paid Google Cloud product.
4. In **Build → Authentication → Sign-in method**, enable **Email/Password** only.
5. In **Build → Firestore Database**, create a database. Choosing production mode is fine because the rules in this repo deny public writes.
6. In **Project settings → Your apps**, add a Web app and copy the config.
7. Copy `.env.example` to `.env.local` and fill only the `VITE_FIREBASE_*` values. Those values are public by design. Do not put private keys, Cloudinary API secrets, or upload presets in this file.
8. Copy `.firebaserc.example` to `.firebaserc` and set your project id.
9. From this folder, after `npm install -g firebase-tools` (or `npx firebase-tools`) and `firebase login`:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Deploy rules **before** importing content. This command does not deploy Cloud Functions or Storage, and it does not change the billing plan. Do not run a broader deploy until you intend to publish the site.

The web app never imports `firebase/storage`. `VITE_FIREBASE_STORAGE_BUCKET` exists only so a pasted console snippet still initializes. It is unused.

## Secure admin provisioning

There is no registration page, and the app never calls `createUser`.

1. Firebase console → **Authentication → Users → Add user**. Choose an email and a long password. Copy the user **UID**.
2. Firestore → start a collection named `admins`.
3. Set the **document ID** to that UID. Suggested fields:
   - `email` (string)
   - `displayName` (string)
   - `role` (string) `admin`
   - `createdAt` (timestamp)
4. Security rules reject every client create, update, and delete on `admins`. The console write is what creates the first admin. Later admins are added the same way. An existing admin still cannot grant access from the website.
5. Open `/admin/login` and sign in. The app reads `admins/{uid}`. If the document is missing, it signs the user out and shows that the account is not an administrator.

There is no screen in the site that writes to `admins`. A signed-in user cannot grant themselves access. Settings and media records (article image URLs, edition cover URLs, and PDF URLs) are admin writes only, and the rules reject any other field on those documents.

The Firebase web API key can still be used by someone to call the Auth sign-up endpoint directly. That creates a login with **no** write access, because authorization is the `admins` document, not the Auth user list. Blocking new Auth users with a Cloud Function would require the Blaze plan, so this project does not do that. Review **Authentication → Users** occasionally and delete accounts you did not create.

## Media hosting

Editors can paste a cover URL, a PDF URL, and an article image URL, or upload a file. The public archive at `/archive` shows covers newest first, filters by year and month, and searches by issue number or a numeric date such as `2026-10-20`. Opening a cover goes to `/archive/:id`, where PDF.js reads the file in the page. If the host blocks embedding, the page keeps an external open link and a download link. PDF bytes are requested only on that page.

Accepted values:

- `https://…` links, including a Cloudinary delivery URL
- a same-site path such as `/demo/issue-sample.pdf` for the bundled sample

Rejected values include `http://`, `javascript:`, `data:`, and paths that contain `..`. Firestore stores the URL and, after an upload, the Cloudinary public ID. PDF bytes and base64 files are never written to a document. Deleting an archive record removes that Firestore document and leaves the external file where it is.

An administrator upload asks the Cloudflare signer for a one-time signature, then sends the file from the browser to Cloudinary. The signer URL is `https://elchacha-cloudinary-signer.it96sidiya.workers.dev`. Image and cover uploads use the signed preset `alshasha_images` and Cloudinary’s image endpoint. PDF uploads use the signed preset `alshasha_archive`. The browser does not contain the Cloudinary API secret and does not calculate the signature. Unsigned uploads are not used. Only a signed-in administrator can reach the file picker, and the signer is expected to reject every other caller.

This has not been proven with an authenticated upload. The signer currently allows browser calls only from `https://elchacha.org`, so a local preview cannot complete one. Saving a Cloudinary public ID also needs the updated Firestore rules published with the site. Do not put an API secret or an unsigned preset in the frontend.

The sample PDF at `public/demo/issue-sample.pdf` is a two-page technical file, not a newspaper. In-page reading of an external PDF also needs that host to send CORS headers. Without them, use the external link.

## Demo content

On the dashboard, **استيراد المحتوى التجريبي** writes the local sample categories, articles, editions, and homepage settings. It overwrites only the fixed demo document ids. It does not delete stories you created with other ids. Imported stories keep `isDemo: true` and show the demo label.

Run this only after rules are deployed and you are signed in as an admin.

## Data model

| Collection | Who can read | Who can write |
| --- | --- | --- |
| `articles` | Public reads `published` only. Admins read drafts. | Admins |
| `editions` | Public reads `published` only. Admins read drafts. | Admins. Fields are issue number, title, date, description, cover URL, PDF URL, optional Cloudinary public IDs, and status. |
| `categories` | Public | Admins. Document id is the Latin slug. |
| `admins` | A user may read only their own document. Listing is denied. | Nobody from the client |
| `settings/site` | Public | Admins. The document cannot store roles. |
| `slugs` | Admins | Admins, to keep article slugs unique |
| `messages` | Admins | Anyone can create a validated message. Nobody can edit one. |

Public lists are paginated (`limit` plus a cursor). Archive search does not download the collection: an issue number is an equality filter, and a year, month, or day is a `publishedAt` range. The homepage uses small limits. Dashboard totals use count aggregation instead of downloading every document. Search stores normalized keywords on the article and queries one `array-contains` token, then applies any extra words in the browser on that page. This matches Firestore’s query limits and avoids reading the whole collection.

Rich text is sanitized in the editor save path and again before it is shown. Allowed markup is paragraphs, headings, lists, quotes, emphasis, and `https` links.

## Testing

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm test` covers Arabic keyword normalization, HTML sanitizing, URL checks, archive filters, and the Firestore rule text that denies public edition writes. `npm run build` is the production bundle used by Hosting.

To execute those rules against the Firestore emulator, install a JDK and run:

```bash
npm run test:rules
```

That command refuses unauthenticated and non-admin creates, updates, and deletes for editions, articles, and site settings. It also refuses a client write to `admins`, including a write by the admin account itself. It does not deploy anything and does not change billing.

To see the same boundary in the browser after the first admin exists:

1. In Authentication, add a second email user and do **not** create `admins/{that-uid}`.
2. Open `/admin/login` and sign in with that second account. The site signs it out. It never reaches the article or archive forms.
3. Keep `npm run test:rules` in the check before a release. That is the proof that a signed-in non-admin cannot create, change, or delete articles, PDF edition records, or settings.

## Deployment

Build first, then deploy **only** hosting plus the Firestore rules and indexes you already published:

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules,firestore:indexes
```

Do this when you are ready to publish. It does not activate billing. If the CLI offers to upgrade the project, stop.

After deploy, the site is a static SPA. Hosting rewrites unknown paths to `index.html` so article links work on refresh.

## Logo

`public/logo.jpg` is the official mark. The header and footer show that file as-is. Do not recolor, crop, or redraw it.

## Project scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local site |
| `npm run test` | Unit tests |
| `npm run test:rules` | Edition rules on the local Firestore emulator |
| `npm run lint` | Oxlint |
| `npm run build` | Typecheck and production bundle in `dist` |
| `npm run preview` | Serve `dist` locally |
| `npm run demo-assets` | Regenerate demo SVG covers and the sample PDF |
