#!/usr/bin/env bash
# Corre a suite de testes no cool-builder, num contentor Elixir + Postgres.
# Uso: aitra/test.sh [args do mix test]   (ex.: aitra/test.sh test/tymeslot/integrations)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
# Host do build server; define-o no ~/.ssh/config (Host cool-builder).
BUILDER=${BUILDER:-cool-builder}
ELIXIR_IMAGE=$(sed -n 's/^FROM \(hexpm\/elixir:[^ ]*\) AS build$/\1/p' Dockerfile.docker)
RUN=tymeslot-test-$$
# Envia a árvore de trabalho (ficheiros seguidos e novos, sem os ignorados).
git ls-files -z -co --exclude-standard | COPYFILE_DISABLE=1 tar --null -T - -cf - | ssh "$BUILDER" "mkdir -p /tmp/$RUN && tar -x -C /tmp/$RUN"
ssh "$BUILDER" bash -s -- "$RUN" "$ELIXIR_IMAGE" "$@" <<'REMOTE'
set -euo pipefail
RUN=$1; IMG=$2; shift 2
cleanup() { docker rm -f "$RUN-pg" >/dev/null 2>&1 || true; rm -rf "/tmp/$RUN"; }
trap cleanup EXIT
# config/test.exs liga a localhost: o contentor de teste partilha a rede do Postgres.
docker run -d --name "$RUN-pg" -e POSTGRES_PASSWORD=postgres postgres:17 >/dev/null
until docker exec "$RUN-pg" pg_isready -q -U postgres; do sleep 1; done
docker run --rm --network "container:$RUN-pg" -v "/tmp/$RUN:/app" -w /app \
  -v tymeslot-test-deps:/app/deps -v tymeslot-test-build:/app/_build \
  -e MIX_ENV=test \
  "$IMG" sh -c 'export DEBIAN_FRONTEND=noninteractive; apt-get update -qq >/dev/null && apt-get install -y -qq git build-essential >/dev/null 2>&1 && mix local.hex --force >/dev/null && mix local.rebar --force >/dev/null && mix deps.get >/dev/null && mix test "$@"' _ "$@"
REMOTE
