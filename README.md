# Nuxt Minimal Starter

## Image processing

Nuxt Image uses IPX to serve optimized images through `/_ipx/`. The `ipx>sharp`
pnpm override pins its native image processor to the working Sharp 0.34.5 version
already used by this project. This avoids IPX's older Sharp 0.32 dependency failing
with a missing native binary and returning HTTP 500 for images across the site.
Keep optional dependencies enabled when installing Sharp ([installation guidance](https://sharp.pixelplumbing.com/install/)).
After dependency changes, restart the development server. Run `pnpm test:images`
to verify the actual Nuxt Image → IPX → Sharp pipeline against local image files.

## Work modality (development workflow)

Follow this workflow when working on the project:

1. **Create a branch** (use your name, e.g. `yourname-dev` or `yourname-dev`)
   ```bash
   git fetch origin
   git checkout -b yourname-dev origin/dev
   ```
   Or in the IDE: create a new branch from `dev`/`develop`, named e.g. `yourname-dev`.

2. **Pull latest from dev/develop**
   ```bash
   git checkout dev   # or develop, depending on your default branch
   git pull origin dev
   git checkout yourname-dev
   git merge dev
   ```
   Or in the IDE: Fetch origin → switch to `dev` → Pull → switch back to your branch → Merge `dev` into your branch.

3. **Work on your branch**  
   Make your changes and commit as usual.

4. **Before pushing: resolve all conflicts**  
   If you merged `dev` into your branch, fix any merge conflicts and commit. Only push when there are no unresolved conflicts.

5. **Push to your remote branch**
   ```bash
   git push -u origin yourname-dev
   ```

6. **Create a pull request**  
   In GitHub/GitLab: open a **Pull Request** from `yourname-dev` into **Development** (or `dev`/`develop`).

---

**NB** Update your branch with latest `dev`/`develop` regularly so you stay in sync and avoid large conflicts later.

---

# Project overview

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

**Node.js:** This project requires **Node.js 20.19+ or 22.12+** (see `engines` in `package.json`). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the project root to switch to the version in `.nvmrc`.

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

The portal calls its backend through the same-origin Nuxt route `/api/backend/v1/**`.
Set `VITE_API_BASE_URL` in `.env` to the absolute upstream API URL (including its
`/api/v1` or `/v1` prefix), then restart Nuxt. Keep this value pointed at the remote
API, not `/api/backend/v1`, to avoid a proxy loop. Existing server features call the
upstream directly, and existing media URLs keep using the upstream asset base.

For example, `/api/backend/v1/public-subjects?educationLevel=lower+secondary`
is forwarded to `${VITE_API_BASE_URL}/public-subjects?educationLevel=lower+secondary`.
The proxy forwards bearer authentication, request bodies, query strings, and
upstream status codes. Portal cookies stay private; state-changing requests obtain
a matching CSRF token and cookie directly from the backend. It checks browser
origins locally and omits `Origin` and `Referer` when contacting the upstream.

The proxy requires the Nuxt server (`dev` or a server deployment); a static-only
deployment cannot serve this route. Set `NUXT_BACKEND_API_BASE_URL` in the server
environment to override the upstream at runtime. Production does not automatically
load `.env`; configure environment variables when starting the server.

Run `pnpm build && pnpm test:backend-proxy && pnpm test:backend-proxy:integration`
to verify the production proxy against a local mock API, including authentication,
uploads, errors, and origin checks.

For the ADT book catalogue, API key setup, read grants, and sample previews, see
[ADT integration](docs/adt-integration.md).

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
