# Nuxt Minimal Starter

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
