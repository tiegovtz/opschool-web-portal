# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

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

## ChatKit Setup (Madam Ana Page)

The "Madam Ana" page includes OpenAI ChatKit integration. To use it, you need to set up the following environment variables:

1. **OPENAI_API_KEY** - Your OpenAI API key (must be from the same org & project as your Agent Builder workflow)
2. **NUXT_PUBLIC_CHATKIT_WORKFLOW_ID** - Your ChatKit workflow ID (starts with `wf_...`)

You can get your workflow ID from the [Agent Builder](https://platform.openai.com/agent-builder) interface after publishing your workflow, and your API key from the [OpenAI API Keys](https://platform.openai.com/api-keys) page.

Add these to your `.env` file:
```
OPENAI_API_KEY=your_api_key_here
NUXT_PUBLIC_CHATKIT_WORKFLOW_ID=wf_your_workflow_id_here
```

Optional:
- **CHATKIT_API_BASE** - Custom base URL for ChatKit API (defaults to `https://api.openai.com`)

Once configured, visit `/madam-ana` to use the ChatKit assistant.

For more information, see the [ChatKit documentation](https://platform.openai.com/docs/guides/chatkit).
