#!/usr/bin/env bash
# Traz a main do Tymeslot original para a nossa main (merge, sem reescrever).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
[ -z "$(git status --porcelain)" ] || { echo "Árvore de trabalho com alterações; faz commit ou stash primeiro." >&2; exit 1; }
git checkout -q main
git pull -q --ff-only origin main
git fetch -q upstream main
behind=$(git rev-list --count HEAD..upstream/main)
[ "$behind" -gt 0 ] || { echo "Já está atualizado com upstream/main."; exit 0; }
echo "A integrar $behind commits de upstream/main..."
git merge --no-edit -m "Merge upstream/main ($(git rev-parse --short upstream/main))" upstream/main
echo "Patches Aitra presentes:"; git log --grep '^aitra:' --oneline
echo "Revê, corre aitra/test.sh e depois: git push origin main"
