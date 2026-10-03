# Setup and deployment

## 1. Connect a dedicated Supabase project

The connected projects at implementation time belonged to other apps; neither was modified.

1. Create a Supabase project for Modern Finds Guide.
2. In its SQL Editor run `supabase/migrations/20261003030814_product_catalog.sql`. It creates products, an owner allowlist, grants, row policies, indexes, and an automatic update timestamp.
3. Optionally run `supabase/seed.sql` to import the existing five recommendations. This is idempotent by slug. **Review the links first:** the drawer organizer and under-sink organizer currently share `https://amzn.to/46h83R9`. Existing image URLs also need permission/program-terms review. The seed preserves the original data rather than guessing replacements.
4. In Authentication disable public signups and anonymous sign-ins. Create the owner email/password account. Save its UUID.
5. Run this in SQL Editor, substituting the real UUID:

```sql
insert into public.admin_users(user_id) values ('OWNER_USER_UUID');
```

Only allowlisted accounts can manage products. A signed-in visitor cannot grant themselves owner access. Removing the allowlist row immediately removes database write access.

6. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the project's Connect/API settings. These are public browser configuration. Never use a secret or service-role key. Never set an admin password as a frontend environment variable.
7. Rebuild or restart. Open `/modern-finds-guide/admin` and log in. For password recovery, manage the owner account in the Supabase dashboard; this release has no public registration or password-reset UI.

## 2. Verify the backend before launch

Database tests execute this migration in embedded PostgreSQL and verify visitor, non-owner, owner, and revoked-owner permissions. UI tests use an isolated mocked API. These checks do not substitute for verifying the configured live Supabase project. With the real project:

- Anonymous visitor sees published rows and cannot insert, update, or delete.
- A signed-in, non-allowlisted user sees only published rows and cannot write or read drafts.
- Owner sees drafts and can create, edit, delete, feature, publish/unpublish, and change sort order.
- Create a draft with a unique slug; check that public browsing hides it. Publish it, verify its detail page, edit it, reorder it, then delete it and verify removal.
- Check duplicate slug errors, malformed links, image failures, and backend errors.
- Run Supabase Security Advisors and review warnings.

## 3. Deploy to GitHub Pages

1. Commit this branch and merge it through a pull request into the repository's `main` branch.
2. In repository Settings → Pages, select **GitHub Actions** as the source.
3. In Settings → Secrets and variables → Actions → Variables add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. The included Pages workflow tests and builds `dist`, then deploys after a main-branch push. The default base is `/modern-finds-guide/` and `public/404.html` restores direct product and admin routes.
5. Check the homepage, `/modern-finds-guide/admin`, and a product URL opened directly in a new tab.

To use Netlify, Vercel, or another root/custom-domain host: set `VITE_BASE_PATH=/` at build time, set the two Supabase variables, use `npm run build`, publish `dist`, and configure a fallback to `index.html` for all app routes. The included GitHub Pages 404 redirect is specifically for repository-path Pages hosting.

## Product management

Use **Add a find** or **Edit** in the owner studio. Products default to drafts. Add title, slug, category, description, authorized image URL, Amazon affiliate URL, optional notes/button text/tags. Check Published when ready and Featured for the homepage shortlist (first three featured products by guide order). Set a lower whole-number sort order to move a product earlier. Saves update the database immediately; visitors see changes on their next page load. Delete requires confirmation.
