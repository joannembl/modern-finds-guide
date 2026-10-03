# Modern Finds Guide content studio

## Implemented

Open Owner Studio → Automation / Content Queue. Reuse an existing product or import a verified title, description, category and affiliate URL. Full Amazon links deduplicate by ASIN; short links deduplicate only by their exact host/path. The existing seed contains two different products with the same short link: review and correct these manually. Nothing scrapes Amazon.

Generate Content Pack builds conservative editable website copy, SEO drafts, suggested collection placements, Pinterest copy and Instagram copy. Key features are left empty until verified. Batch creates one pack per product; collection generation creates a same-category Must-Haves pack with carousel slides. One pack per lead product prevents duplicate jobs, including concurrent submissions. The transaction rolls back completely on failure. Revisit existing packs rather than overwriting owner edits.

Media Library provides four typography templates with category palettes for Home, Car, Pets, Tech and Maker/3D Printing. Pinterest: 1000×1500; Instagram feed: 1080×1350; Story/Reel cover: 1080×1920. Download exact-size PNGs or editable SVGs. No specific product appearance is invented. This release generates branded typography, not AI lifestyle photography. Owned/permitted product photography and an image-generation provider are further integration work.

Save and approve website copy, then explicitly publish the product. Review/approve assets in Media Library, then approve each social post. Plan dates in the list/calendar card view. Schedule is a persistent manual planning queue, not an automatic external publisher. Export JSON and images, copy social text, and confirm a real manually published HTTPS post URL. Edits reset approval. Published product affiliate URLs remain unchanged.

## Apply and verify

1. Apply `supabase/migrations/20261003042236_content_automation.sql` after the product catalog migration in the existing project's SQL Editor, or using your authenticated migration deployment process. This was tested with embedded PostgreSQL and applied to the connected Modern Finds Guide project (`etytugdibeqqykxejhsm`). Do not apply it a second time there.
2. Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Set `VITE_SITE_URL` to the final public site URL **including any path prefix**, with no trailing slash. Rebuild. Do not export social drafts with localhost destinations.
3. Sign in with an allowlisted owner. Generate a pack, reload, verify persistence, edit copy, approve, publish, approve media and social, then plan/export. Verify anonymous and non-owner accounts cannot read any studio table. Run the Supabase security advisor.
4. Deploy the built frontend using the existing hosting process. No public redesign changes are required.

## Live publishing boundary and remaining setup

`server/publishing.js` defines reviewed payload validation, Pinterest request mapping, Instagram caption/media mapping and an injectable publishing connector. It rejects unapproved content, future scheduled posts, unhosted assets and unconfirmed provider success. It does not contain an OAuth server, installed platform adapters, scheduler worker or hosted-media uploader. Credentials alone do not enable live posting yet.

To enable live publishing:

1. Obtain Pinterest application access, OAuth scopes and a board ID. Follow the official create-pin API documentation: https://developers.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/.
2. Configure an eligible Instagram professional account and Meta application permissions using the official publishing documentation: https://developers.facebook.com/documentation/instagram-platform/content-publishing. Select the login flow before implementing its token exchange.
3. Implement server-only OAuth/token refresh and `connectors.Pinterest.publish(reviewed)` / `connectors.Instagram.publish(reviewed)` against the approved account flow. Store tokens as server environment secrets (suggested names: `PINTEREST_ACCESS_TOKEN`, `PINTEREST_BOARD_ID`, `META_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`, `META_GRAPH_VERSION`). Never use `VITE_` for tokens.
4. Upload approved PNG/JPEG creatives to authorized HTTPS media hosting; populate adapter asset `public_url`. Instagram cover PNGs are covers, not generated Reel videos.
5. Deploy an authenticated server worker that reads due approved posts with owner authorization, claims each in a durable publishing-attempt table, invokes the adapter, and records the real provider ID/permalink. Reconcile ambiguous failures before retries to prevent double posting. Recheck approval and media immediately before dispatch. Add platform sandbox/account tests before enabling the worker.
6. Amazon discovery remains manual. Add an approved Amazon product-data provider only after confirming eligibility and current terms. Preserve source identity, affiliate links, verified facts and image usage restrictions. API-derived price/rating data requires its own compliance/refresh design; none is generated here.
7. Optional AI copy/lifestyle generation requires a server provider, environment secret and validated response schema. Pass only verified product facts; generated context art must be labeled and must not pretend to depict the exact product. The present generator is deliberately deterministic and needs no AI credentials.

## Verification

`npm run build`, `npm test`, and `npm run test:browser`. Browser tests use mocked Supabase, not live publishing. Database tests exercise actual PostgreSQL constraints, transactions, owner access, approval ordering and edit invalidation.

Live security advisor: all studio tables have RLS and no anonymous grants. The existing Auth configuration reports leaked-password protection disabled; enable it if supported by your plan: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
