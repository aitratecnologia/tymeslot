#!/usr/bin/env bash
# Constrói a imagem a partir do commit atual (já enviado para o GitHub) no
# cool-builder e envia-a para registry.aitra.pt/tymeslot.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
# Host do build server; define-o no ~/.ssh/config (Host cool-builder).
BUILDER=${BUILDER:-cool-builder}
SHA=$(git rev-parse HEAD)
git fetch -q origin
git merge-base --is-ancestor "$SHA" origin/main || { echo "O commit $SHA não está em origin/main; faz push primeiro." >&2; exit 1; }
TAG="$(date +%Y%m%d)-${SHA:0:8}"
IMAGE=registry.aitra.pt/tymeslot
echo "A construir $IMAGE:$TAG ..."
# stdin: 1.ª linha = token do GitHub (lido pela shell remota), resto = script.
{ gh auth token; cat <<'REMOTE'; } | ssh "$BUILDER" 'read -r GIT_AUTH_TOKEN && export GIT_AUTH_TOKEN && bash -s -- '"$SHA $IMAGE $TAG"
set -euo pipefail
SHA=$1; IMAGE=$2; TAG=$3
docker buildx build --builder cool-builder \
  --secret id=GIT_AUTH_TOKEN,env=GIT_AUTH_TOKEN \
  -f Dockerfile.docker --target release \
  -t "$IMAGE:$TAG" -t "$IMAGE:latest" --push \
  "https://github.com/aitratecnologia/tymeslot.git#$SHA"
REMOTE
echo "Pronto: $IMAGE:$TAG"
