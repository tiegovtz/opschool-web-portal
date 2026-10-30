# Development CI/CD

The workflow in `.github/workflows/development.yml` checks pull requests into `develop`. A push to `develop` runs the same checks, then deploys that commit to the existing development server checkout at `/var/www/OPSchool/opschool-web-portal` and rebuilds only the Docker Compose `portal` service. The server's Compose file and Dockerfile stay unchanged. Docker documents rebuilding and recreating one service with `docker compose build portal` followed by `docker compose up --no-deps -d portal` ([source](https://docs.docker.com/compose/how-tos/production/)).

The server checkout is owned by `root:sudo`, and the `saidi` account cannot use its root-owned GitHub deploy key. The workflow therefore transfers the commit as a Git bundle over SSH. The server fetches it from that local bundle and fast-forwards its clean `develop` checkout. This needs no GitHub access from the server. If the checkout has tracked changes, has moved since the transfer began, or cannot fast-forward, the deploy stops before building. If the new portal fails the HTTP check, the script restores the previous Docker image; the checkout remains at the new commit for inspection.

## One-time GitHub setup

Create an Actions environment called `development`, restricted to branch `develop`. Add:

| Name | Type | Value |
| --- | --- | --- |
| `DEPLOY_HOST` | Variable | SSH hostname or IP of `opschooltestsvr` reachable from GitHub Actions |
| `DEPLOY_USER` | Variable | `saidi` |
| `DEPLOY_HEALTH_URL` | Variable | `http://127.0.0.1:3000/portal/` (confirmed HTTP 200 on the server) |
| `DEPLOY_SSH_KEY` | Secret | Private key for GitHub Actions to SSH as `saidi` |
| `DEPLOY_KNOWN_HOSTS` | Secret | Verified SSH host-key entry matching `DEPLOY_HOST` |

Install the public half of `DEPLOY_SSH_KEY` in `/home/saidi/.ssh/authorized_keys`. Use a key dedicated to this workflow. `DEPLOY_KNOWN_HOSTS` is the server's public SSH host key, for example the entry derived from `/etc/ssh/ssh_host_ed25519_key.pub`; it is different from the login key. The workflow uses strict host-key checking.

The `saidi` account needs write access to the checkout and its `.git` directory, plus Docker Compose access. The observed server groups were `sudo` and `docker`, and the project directory was writable. Test Git writes separately before the first deployment. The workflow stages a bundle in the ignored `.deploy` directory, then uses the existing Compose configuration, portal Dockerfile, build patch, runtime environment file, and volumes.
