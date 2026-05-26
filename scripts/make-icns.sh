#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# make-icns.sh
# Converts assets/icon.svg → assets/icon.icns for electron-builder.
#
# Requirements: macOS only — uses qlmanage, sips, and iconutil (all built-in).
# If qlmanage fails (some system configs block it), install librsvg via Homebrew
# and re-run: the script falls back to rsvg-convert automatically.
#
# Usage:
#   npm run make-icns
#   # or directly:
#   bash scripts/make-icns.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
SVG="$ROOT/assets/icon.svg"
TMP="$ROOT/.iconbuild"
ICONSET="$TMP/icon.iconset"
OUT="$ROOT/assets/icon.icns"

if [ ! -f "$SVG" ]; then
  echo "✗  assets/icon.svg not found. Run from repo root or check file path." >&2
  exit 1
fi

echo "→ Rendering SVG to 1024×1024 PNG …"
mkdir -p "$TMP"

PNG=""

# Try qlmanage first (zero-dependency, built into macOS)
qlmanage -t -s 1024 -o "$TMP" "$SVG" > /dev/null 2>&1 || true
if [ -f "$TMP/icon.svg.png" ]; then
  PNG="$TMP/icon.svg.png"
fi

# Fall back to rsvg-convert (brew install librsvg)
if [ -z "$PNG" ] && command -v rsvg-convert &>/dev/null; then
  echo "  (qlmanage produced no output — using rsvg-convert)"
  rsvg-convert -w 1024 -h 1024 "$SVG" -o "$TMP/icon.png"
  PNG="$TMP/icon.png"
fi

if [ -z "$PNG" ]; then
  echo "✗  Could not render SVG to PNG." >&2
  echo "   Install librsvg:  brew install librsvg" >&2
  exit 1
fi

echo "→ Building iconset …"
mkdir -p "$ICONSET"

sips -z 16   16   "$PNG" --out "$ICONSET/icon_16x16.png"      > /dev/null
sips -z 32   32   "$PNG" --out "$ICONSET/icon_16x16@2x.png"   > /dev/null
sips -z 32   32   "$PNG" --out "$ICONSET/icon_32x32.png"       > /dev/null
sips -z 64   64   "$PNG" --out "$ICONSET/icon_32x32@2x.png"   > /dev/null
sips -z 128  128  "$PNG" --out "$ICONSET/icon_128x128.png"     > /dev/null
sips -z 256  256  "$PNG" --out "$ICONSET/icon_128x128@2x.png"  > /dev/null
sips -z 256  256  "$PNG" --out "$ICONSET/icon_256x256.png"     > /dev/null
sips -z 512  512  "$PNG" --out "$ICONSET/icon_256x256@2x.png"  > /dev/null
sips -z 512  512  "$PNG" --out "$ICONSET/icon_512x512.png"     > /dev/null
sips -z 1024 1024 "$PNG" --out "$ICONSET/icon_512x512@2x.png"  > /dev/null

echo "→ Converting iconset to .icns …"
iconutil -c icns "$ICONSET" --out "$OUT"

rm -rf "$TMP"
echo "✓  Created $OUT"
