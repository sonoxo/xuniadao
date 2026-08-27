#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="${GLASS_ONION_WORKSPACE:-$ROOT/.glass-onion/modules}"
mkdir -p "$WORKSPACE"

sync_repo() {
  local name="$1"
  local url="$2"
  local branch="$3"
  local path="$WORKSPACE/$name"

  if [ -d "$path/.git" ]; then
    git -C "$path" fetch --prune origin "$branch"
    git -C "$path" checkout "$branch"
    git -C "$path" pull --ff-only origin "$branch"
  else
    git clone --depth 1 --branch "$branch" "$url" "$path"
  fi
}

echo "GLASS ONION // XUNIA ECOSYSTEM SYNC"
sync_repo "zyra" "https://github.com/sonoxo/zyra.git" "main"
sync_repo "sonoxo" "https://github.com/sonoxo/gpt-doug-llm.git" "main"
sync_repo "almighty-sonoxo" "https://github.com/sonoxo/AlmightySonoxo.git" "main"

VA3LM="$WORKSPACE/sonoxo/va3lm"
if [ ! -d "$VA3LM" ]; then
  echo "VA3LM HOLD // expected $VA3LM" >&2
  exit 1
fi

cat <<EOF
GLASS ONION READY
XUNIA ROOT: $ROOT
ZYRA: $WORKSPACE/zyra
SONOXO: $WORKSPACE/sonoxo
ALMIGHTY SONOXO: $WORKSPACE/almighty-sonoxo
VA3LM: $VA3LM
VA3LM COMMAND PORT: 8088
EOF
