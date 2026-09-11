# ADT book catalogue — first draft

## Routes

- `/primary?section=adt`: Primary and Pre-primary ADT content within the primary hub.
- `/secondary?section=adt`: Ordinary Secondary and Advanced Secondary ADT content within the secondary hub.
- `/:educationLevel/adt/:bookId`: dedicated reader page, opened from the cover-preview modal.
- The catalogue and cover-preview modal are public. Reading requires an OpSchool login; guests are sent to `/auth` with the reader URL preserved for return after sign-in. The server refuses to issue a signed Store reader URL when the access-token cookie is absent.
- `/primary` and `/secondary` have Subjects, Interactive content, and ADT tabs above the shared filters. Changing hubs preserves the ADT selection and scopes its catalogue to the destination hub.
- There is no ADT top-navigation or landing-page shortcut. Legacy `/primary/adt` and `/secondary/adt` URLs redirect to the corresponding hub's ADT tab and remove obsolete sample-mode parameters.
- Catalogue configuration errors, fetch errors, empty collections, and no-match results share the dashed, centered `AdtStatePanel` presentation. The reader uses it for missing books, configuration/fetch errors, and unavailable reading. Catalogue loading continues to use shimmering skeleton cards.

## Configure the connection

Set these in the portal's local `.env` (never commit the key), then restart `pnpm dev`:

```dotenv
NUXT_ADT_STORE_BASE_URL=https://your-adt-store.example
NUXT_ADT_STORE_API_KEY=your-issued-key
```

Use the ADT Store origin without `/api/v1`. These are private Nuxt runtime-config values, not `runtimeConfig.public`. No API key is sent to the browser. Configure the production runtime with the same environment variables. Use HTTPS for the deployed integration.

The local `.env` contains blank ADT entries ready to fill. Use a different port for ADT Store if both projects run locally; the portal already uses port 3000. Nuxt loads `.env` for `pnpm dev`; when running the production server, set these variables in the hosting environment (the built server does not load `.env` automatically).

After setting both values and restarting the portal, open `/primary?section=adt` or `/secondary?section=adt` to fetch real books. Sample mode is removed: even legacy `preview=1` requests use the live Store. Both the Store origin and a URL ending in `/api/v1` are accepted.

The integration key needs these **read** grants, each separately:

- `/api/v1/books`
- `/api/v1/books/:id` (also used to check eligibility before serving covers)
- `/api/v1/books/:id/cover`
- `/api/v1/books/:id/reader`
- `/api/v1/data/levels`
- `/api/v1/data/classes`
- `/api/v1/data/subjects`
- `/api/v1/data/languages`
- `/api/v1/data/curricula`

## Contract and hierarchy

Nuxt `GET /api/adt/catalogue?educationLevel=primary|secondary` fetches the ADT catalogue with `?include=coverPreview` and the classification collections. Only `status: Ready` and `approvalStatusValue: final_approved` records are exposed. Store now accepts built website ZIPs and no longer returns `format` or `formatValue`; the portal does not require or filter on those removed fields. Staff workflow fields, filesystem/package details and upstream cover URLs are not returned.

ADT Store's current collection API has no upstream pagination/search. The portal fetches one catalogue snapshot per page load, filters locally, and displays 12 results per page. This avoids new upstream requests on every keystroke. For a large catalogue, add upstream filtering/pagination before scaling. Responses use `private, no-store`; no persistent book cache is introduced.

Classification relationships, not display strings, drive filters:

1. The current hub scopes the catalogue. The shared `InputsSelection` controls use ADT classification IDs in ADT mode; OpSchool continues using its own API options and names.
2. Class limits subjects by `subject.classIds` within the tab-scoped catalogue.
3. Switching tabs resets filters; changing class clears subject.
4. The same education-level, class, subject, and search controls are used across the hub tabs. ADT's former language/curriculum filter controls have been removed.
5. Books match selected IDs using membership in their many-to-many arrays. Search matches title, ISBN, English and Kiswahili classification labels and language, case-insensitively.
6. Classification names come only from the Store's `/api/v1/data/levels`, `/classes`, `/subjects`, `/languages` and `/curricula` endpoints (under the same `/api/v1/data` prefix), passed through `/api/adt/catalogue`. In Kiswahili mode, filter options, selected labels, cards and preview metadata use the endpoint's nonblank `swName`; if absent, they use the endpoint's `name`. English mode always uses `name`. There is no local translation dictionary or generated class-name fallback. Search uses these same endpoint names. Switching language changes labels without clearing selected IDs or changing the book-language filter. Interface copy such as button labels, tooltips and pagination remains localized in the portal; it is not catalogue metadata.

Unknown education-level names are excluded, not defaulted to secondary. If managed levels are renamed outside the supported aliases, update `shared/adt/catalogue.ts` deliberately. The hub's shared custom dropdowns provide searchable, non-native options. Class/subject dependencies remain enforced. The page follows the portal's English/Kiswahili language preference.

`GET /api/adt/books/:id/cover` rechecks publication eligibility, reconstructs a trusted upstream URL, and proxies raster images. It accepts `variant=thumbnail` and the Store's `v` version token. Catalogue metadata exposes a local, versioned preview URL and validated raster `blurDataUrl`, width and height. Cards and the modal immediately display the embedded blur, then load the bounded 480 × 640 WebP thumbnail with asynchronous decoding and a fade-in (respecting reduced motion). Covers retain their aspect ratio. Cards lazy-load; the modal loads eagerly. Missing/invalid previews use the original cover, a failed thumbnail retries the original, and failed/missing originals use `/logo/logo_tie.webp`.

Successful cover responses use `private, no-cache` so browsers can retain bytes but must revalidate before reuse. The proxy forwards `If-None-Match` and returns the upstream `ETag` and empty `304` responses. Every revalidation still checks publication eligibility and authenticates the cover request; errors remain `private, no-store`. The actual response `Content-Type` is used because Store can return the original while thumbnail generation is pending. Upstream redirects are refused and upstream error details are not serialized to the browser. Image URLs and embedded previews never contain the API key.

Cards have a primary-color **Preview book** button. The modal displays the cover and a **Read book** link. Its styled modal dialog traps focus using the browser modal dialog primitive, closes on Escape, restores focus and locks background scrolling. `GET /api/adt/books/:id?educationLevel=primary|secondary` backs the dedicated reader page and rechecks publication status and category on direct navigation. The reader's back link returns to the live ADT tab.

## Preview without credentials

Sample data is used only by automated tests, never by application endpoints. Unconfigured pages show a connection-pending state; failed live requests show retry, not fake books. Ready books must also have final approval before learners can see them.

## Reading integration

The portal requests `GET /api/v1/books/:id/reader?embedOrigin=<portal-origin>` server-side after checking publication eligibility and hub membership. Enable the separate **Book reader / read** grant on the integration key in ADT Store. Its response contains a short-lived content URL and `expiresAt`, never the API key. The full-width reader iframe runs with `sandbox="allow-scripts"` and `referrerpolicy="no-referrer"`; expired sessions offer Reload book. Progress persistence is not guaranteed when reloading the publication.

Deploy the reader API changes in ADT Store too. Its existing `CONTENT_PREVIEW_ORIGIN` must be a browser-reachable content origin served by ADT Store (HTTPS in production). The signed URL is bound to a book and embedding origin, with a maximum one-hour lifetime (or the shorter configured preview TTL). Every asset request rechecks final approval. Staff preview tokens remain separate. Revoking the API key prevents new links; previously issued links live until expiry unless the book is unpublished. No extra portal environment variables are required. The reverse proxy must preserve the portal's public host/protocol so the signed `frame-ancestors` origin matches the page.

## Verification

The test scripts use Node's built-in TypeScript stripping and require Node.js 22.12+ (the app itself retains its existing engine range).

```bash
pnpm test:adt
pnpm build
pnpm test:adt:api
pnpm dev
```

The API integration tests launch an isolated production server and a mock ADT Store with a dummy key. They do not contact real ADT services. A real approved catalogue and key are still needed for live acceptance testing.
