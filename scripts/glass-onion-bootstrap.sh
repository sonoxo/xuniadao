#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$PWD/glass-onion-workspace}"
mkdir -p "$ROOT"

clone_or_update() {
  local repo="$1"
  local dir="$2"
  if [ -d "$dir/.git" ]; then
    git -C "$dir" pull --ff-only
  else
    git clone --depth=1 "$repo" "$dir"
  fi
}

clone_or_update "https://github.com/sonoxo/xuniadao.git" "$ROOT/xunia"
clone_or_update "https://github.com/sonoxo/zyra.git" "$ROOT/zyra"
clone_or_update "https://github.com/sonoxo/gpt-doug-llm.git" "$ROOT/sonoxo"
clone_or_update "https://github.com/sonoxo/AlmightySonoxo.git" "$ROOT/almighty-sonoxo"

VA3LM="$ROOT/sonoxo/va3lm"
if [ ! -d "$VA3LM" ]; then
  echo "VA3LM was not found at $VA3LM" >&2
  exit 1
fi

cat <<EOF
GLASS ONION WORKSPACE READY
XUNIA:           $ROOT/xunia
ZYRA:            $ROOT/zyra
SONOXO:          $ROOT/sonoxo
ALMIGHTY SONOXO: $ROOT/almighty-sonoxo
VA3LM:           $VA3LM
VA3LM PORT:      8088
EOF
