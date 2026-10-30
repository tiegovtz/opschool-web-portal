# Development CI/CD

The workflow in `.github/workflows/development.yml` checks pull requests into `develop`. A push to `develop` runs the same checks, then deploys that commit to the existing development server checkout at `/var/www/OPSchool/opschool-web-portal` and rebuilds only the Docker Compose `portal` service. The server's Compose file and Dockerfile stay unchanged. Docker documents rebuilding and recreating one service with `docker compose build portal` followed by `docker compose up --no-deps -d portal` ([source](https://docs.docker.com/compose/how-tos/production/)).


## One-time GitHub setup

Use the existing Actions environment called `development`, restricted to branch `develop`. Add these entries to that environment:

| Name | Type | Value |
| --- | --- | --- |
| `DEPLOY_HOST` | Variable | SSH hostname or IP of `opschooltestsvr` reachable from GitHub Actions |
| `DEPLOY_USER` | Variable | `$USER` |
| `DEPLOY_HEALTH_URL` | Variable | `http://127.0.0.1:3000/portal/` (confirmed HTTP 200 on the server) |
| `DEPLOY_SSH_KEY` | Secret | Private key for GitHub Actions to SSH as `$USER` |
| `DEPLOY_KNOWN_HOSTS` | Secret | Verified SSH host-key entry matching `DEPLOY_HOST` |

Install the public half of `DEPLOY_SSH_KEY` in `/home/$USER/.ssh/authorized_keys`. Use a key dedicated to this workflow. `DEPLOY_KNOWN_HOSTS` is the server's public SSH host key, for example the entry derived from `/etc/ssh/ssh_host_ed25519_key.pub`; it is different from the login key. The workflow uses strict host-key checking.
