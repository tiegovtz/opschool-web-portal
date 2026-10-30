#!/usr/bin/env bash
set -euo pipefail

revision=$1
expected_base=$2
health_url=$3
project_root=/var/www/OPSchool
repo="$project_root/opschool-web-portal"
compose_file="$project_root/deployment/compose.yml"
bundle="$repo/.deploy/incoming/$revision.bundle"

if [[ ! "$revision" =~ ^[a-f0-9]{40}$ || ! "$expected_base" =~ ^[a-f0-9]{40}$ || ! "$health_url" =~ ^http://127\.0\.0\.1:[0-9]+/ ]]; then
  echo 'Invalid deployment arguments' >&2
  exit 1
fi
test -f "$compose_file"

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

compose=(docker compose --project-directory "$project_root" -f "$compose_file")
old_image=$(docker inspect -f '{{.Image}}' opschool-dev-portal-1 2>/dev/null || true)
switched=false
rollback() {
  echo 'Portal deployment failed; restoring previous image' >&2
  if [[ "$switched" == true && -n "$old_image" ]]; then
    docker image tag "$old_image" opschool-dev-portal:latest
    "${compose[@]}" up -d --no-build --no-deps --force-recreate portal
  fi
}

if ! "${compose[@]}" build portal; then
  rollback
  exit 1
fi
switched=true
if ! "${compose[@]}" up -d --no-build --no-deps portal; then
  rollback
  exit 1
fi

for attempt in {1..30}; do
  if curl --fail --silent --max-time 3 --output /dev/null "$health_url"; then
    echo "Deployed portal revision $revision"
    exit 0
  fi
  sleep 2
done

rollback
exit 1
