#!/usr/bin/env bash
set -euo pipefail

revision=$1
expected_base=$2
health_url=$3
requested_pm2_app=${4:-}
project_root=/var/www/OPSchool
repo="$project_root/opschool-web-portal-build"
bundle="$repo/.deploy/incoming/$revision.bundle"
pm2_app=${requested_pm2_app:-portal}

if [[ ! "$revision" =~ ^[a-f0-9]{40}$ || ! "$expected_base" =~ ^[a-f0-9]{40}$ || ! "$health_url" =~ ^http://127\.0\.0\.1:[0-9]+/ ]]; then
  echo 'Invalid deployment arguments' >&2
  exit 1
fi
if [[ ! "$pm2_app" =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo 'Invalid PM2 application name' >&2
  exit 1
fi
command -v pnpm >/dev/null
command -v pm2 >/dev/null
port=${health_url#http://127.0.0.1:}
port=${port%%/*}
PM2_APP="$pm2_app" PM2_REPO="$repo" PM2_PORT="$port" node -e '
  const app = JSON.parse(require("node:fs").readFileSync(0, "utf8"))
    .find((entry) => entry.name === process.env.PM2_APP);
  const env = app?.pm2_env;
  if (!env || env.pm_cwd !== process.env.PM2_REPO ||
      env.pm_exec_path !== `${process.env.PM2_REPO}/.output/server/index.mjs` ||
      String(env.NITRO_PORT) !== process.env.PM2_PORT) {
    console.error("Existing PM2 portal does not match the deployment checkout and port");
    process.exit(1);
  }
' < <(pm2 jlist)

git_in_repo() { git -c safe.directory="$repo" -C "$repo" "$@"; }
if [[ $(git_in_repo branch --show-current) != develop ]]; then
  echo 'Server checkout must remain on develop' >&2
  exit 1
fi
if ! git_in_repo diff --quiet || ! git_in_repo diff --cached --quiet; then
  echo 'Server checkout has tracked changes; refusing deployment' >&2
  exit 1
fi
if [[ $(git_in_repo rev-parse HEAD) != "$expected_base" ]]; then
  echo 'Server checkout moved since the deployment began' >&2
  exit 1
fi

if [[ "$revision" != "$expected_base" ]]; then
  test -f "$bundle"
  git_in_repo bundle verify "$bundle"
  git_in_repo fetch "$bundle" HEAD:refs/remotes/origin/develop
  if [[ $(git_in_repo rev-parse FETCH_HEAD) != "$revision" ]]; then
    echo 'Transferred bundle does not contain the requested revision' >&2
    exit 1
  fi
  git_in_repo merge --ff-only "$revision"
  rm -f "$bundle"
fi

cd "$repo"
backup=$(mktemp -d "$repo/.deploy/rollback.XXXXXX")
had_output=false
restart_attempted=false
image_headers=
if [[ -d .output ]]; then
  cp -a .output "$backup/output"
  had_output=true
fi
rollback() {
  status=$?
  trap - EXIT
  if (( status != 0 )); then
    echo 'Portal deployment failed; restoring previous build' >&2
    if [[ "$had_output" == true ]]; then
      if [[ -d .output ]]; then
        mv .output "$backup/failed-output"
      fi
      mv "$backup/output" .output
      if [[ "$restart_attempted" == true ]]; then
        pm2 restart "$pm2_app" || true
      fi
    fi
  fi
  if [[ -n "$image_headers" ]]; then rm -f "$image_headers"; fi
  rm -rf "$backup"
  exit "$status"
}
trap rollback EXIT

CI=true pnpm install --frozen-lockfile
pnpm test:images

# Bare-metal dev needs a few source adjustments that Docker's own ephemeral build
# context used to apply (basePath under /portal/, direct backend URL instead of a
# Docker service name, etc.) - see deployment/docker/patch-source.cjs. Apply them,
# build, then revert so the checkout is clean again for the next deploy's tracked-
# changes check. The build output (.output) and .env are both gitignored, so the
# revert below never touches them.
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi
node /var/www/OPSchool/deployment/docker/patch-source.cjs portal
pnpm build
git -c safe.directory="$repo" -C "$repo" checkout -- .

restart_attempted=true
pm2 restart "$pm2_app"

for attempt in {1..30}; do
  if curl --fail --silent --max-time 3 --output /dev/null "$health_url"; then
    break
  fi
  sleep 2
done

curl --fail --silent --max-time 5 --output /dev/null "$health_url"
image_url="${health_url%/}/_ipx/w_120,f_webp/logo/logo_tie.jpg"
image_headers=$(mktemp "$repo/.deploy/image-headers.XXXXXX")
curl --fail --silent --show-error --max-time 15 --dump-header "$image_headers" --output /dev/null "$image_url"
if ! grep -qi '^content-type: image/webp' "$image_headers"; then
  echo "Image optimization returned an unexpected content type: $image_url" >&2
  exit 1
fi
pm2 save
echo "Deployed portal revision $revision; IPX image optimization returned WebP"
