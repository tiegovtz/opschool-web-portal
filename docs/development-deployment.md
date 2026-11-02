# Development CI/CD

The workflow in `.github/workflows/development.yml` checks pull requests into `develop`. A push to `develop` runs the same checks, then deploys that commit to the checkout used by the development PM2 process. On the server it installs locked pnpm dependencies, checks the Nuxt Image pipeline, builds Nuxt, and restarts the existing PM2 process. The workflow and deployment script must target the checkout from which PM2 runs `.output/server/index.mjs`.

After restart, deployment checks the configured health URL and requests `/_ipx/w_120,f_webp/logo/logo_tie.jpg` from the Nitro port. It requires a successful response with `Content-Type: image/webp`. A failed build or check restores the previous `.output` and restarts the prior PM2 process. The checkout stays at the new commit so the next deployment can proceed.


## One-time GitHub setup

Use the existing Actions environment called `development`, restricted to branch `develop`. Add these entries to that environment:

| Name | Type | Value |
| --- | --- | --- |
| `DEPLOY_HOST` | Variable | SSH hostname or IP reachable from GitHub Actions |
| `DEPLOY_USER` | Variable | SSH account that can manage the existing PM2 process and write to the deployment checkout |
| `DEPLOY_HEALTH_URL` | Variable | Local URL that returns HTTP 200 when the portal is ready, such as `http://127.0.0.1:3000/portal/` |
| `DEPLOY_PM2_APP` | Variable (optional) | Existing PM2 app name; defaults to `portal` |
| `DEPLOY_SSH_KEY` | Secret | Private key for GitHub Actions to SSH as `DEPLOY_USER` |
| `DEPLOY_KNOWN_HOSTS` | Secret | Verified SSH host-key entry matching `DEPLOY_HOST` |

Install the public half of `DEPLOY_SSH_KEY` in the deployment account's `authorized_keys`. Use a key dedicated to this workflow. `DEPLOY_KNOWN_HOSTS` is the server's public SSH host key; it is different from the login key. The workflow uses strict host-key checking.

## Server prerequisites and observation

Install Node.js 22.12+ (or 20.19+), pnpm, and PM2 for the deployment account. The checkout used by PM2 must be on `develop` with no tracked changes. Run deployment as the account that owns the existing PM2 process; a separate account's PM2 daemon cannot restart it. The deployment script verifies the process name, working directory, script path, and port before changing the checkout. It preserves PM2's existing launch configuration and environment. PM2 does not need an ecosystem file to run a directly started script.

For backend card images, set `NUXT_PUBLIC_IMAGE_FETCH_ORIGIN` to an HTTP(S) origin that the PM2 host can reach if it cannot fetch the public uploads address directly. Do not use the former Docker-only `http://gateway` hostname. This value must be present during the Nuxt build so IPX permits that image host.

To observe optimization on the server:

```bash
pm2 status
pm2 logs portal --lines 100
curl -sS -D - -o /dev/null 'http://127.0.0.1:3000/_ipx/w_120,f_webp/logo/logo_tie.jpg'
```

Use the configured PM2 name and port if they differ. A successful image response has HTTP 200 and `Content-Type: image/webp`. PM2's [process list and logs](https://pm2.keymetrics.io/docs/usage/commands/) show the running Nitro process and optimizer errors.
