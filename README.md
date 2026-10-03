# Modern Finds Guide

A React product-discovery guide with an editorial design and a Supabase owner studio. The existing five product descriptions, image URLs, affiliate links, Pinterest domain verification, and legacy category URLs are retained. No prices or invented reviews are displayed.

## Run locally

Node 22.12+ is required.

```sh
npm ci
npm start
```

Open http://127.0.0.1:5173/modern-finds-guide/. Without backend configuration the public site uses the existing five recommendations; owner management explains the setup steps. With configuration, Supabase is the source of truth, including empty collections and drafts. Failed backend requests do not fall back to stale products.

```sh
npm test
npm run build
npm run preview
```

For browser checks run `npx playwright install chromium`, then `npm run test:browser`. The tests start isolated public and mock-backend previews. Database policy tests execute the real migration in an embedded PostgreSQL instance.

See [SETUP.md](SETUP.md) for backend setup and deployment. Admin: `/modern-finds-guide/admin` on GitHub Pages, or `/admin` on root hosting. Product edits are stored in the database and require no source edits or redeployments.

## Implementation

- React 18, React Router, Vite, pinned Supabase JS client.
- Public search, category filters, sorting, product details, featured products, affiliate disclosure.
- Email/password owner authentication; allowlisted user IDs enforced by database row policies. No frontend passwords or privileged keys.
- Add/edit/delete, tags, image URLs, notes, publish/draft, featured and numeric sort order. Lower order values appear first; ties sort alphabetically.
- All fields are rendered as plain text. HTTPS URL checks, affiliate link attributes, failure states, deletion confirmation, and unsaved-edit guards.
- Image upload is intentionally not required: owner supplies an authorized HTTPS image URL.

The old Pinterest tracking snippet was removed because it contained placeholder email data and reported outbound clicks as purchases. Domain verification remains.
