#!/usr/bin/env bash
# Corre localmente o mesmo scan do Semgrep que o workflow .github/workflows/semgrep.yml.
# Uso: aitra/semgrep.sh [args extra do semgrep]   (ex.: aitra/semgrep.sh --severity ERROR)
# Precisa do semgrep instalado (brew install semgrep ou pipx install semgrep).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
exec semgrep scan \
  --config p/default \
  --config p/elixir \
  --config p/javascript \
  --config p/dockerfile \
  --config p/github-actions \
  --config p/secrets \
  --metrics=off \
  "$@"
