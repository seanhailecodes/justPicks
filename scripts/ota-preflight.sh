#!/usr/bin/env bash
# ota-preflight.sh — run before `eas update`. Refuses to publish a JS bundle
# that could crash the App Store binary.
#
# Why this exists: on 2026-09-19 an OTA statically imported expo-updates,
# which the store build (compiled from an older commit) did not contain.
# The import threw at startup and the app froze on the splash for every
# iOS user until a rollback. An OTA can only change JavaScript — any new
# native dependency needs a new App Store build, not an update.
#
# Checks:
#   1. package.json dependencies vs the commit the store binary was built
#      from: any ADDED package that ships native code → FAIL.
#   2. The iOS bundle compiles.
#   3. Static `import ... from 'expo-updates'` anywhere in app code → FAIL
#      (it must stay behind the lazy loader in lib/appUpdates.ts).
#   4. EXPO_PUBLIC_SUPABASE_* are exported in this shell AND end up inlined
#      in the exported bundle (the 2026-09-22 → 09-28 crash was a bundle
#      published without them).
#
# Usage:  scripts/ota-preflight.sh [store-build-commit]
#   Default store commit is read from scripts/store-build.txt.
set -euo pipefail
cd "$(dirname "$0")/.."

STORE_COMMIT="${1:-$(cat scripts/store-build.txt 2>/dev/null | head -1)}"
if [ -z "$STORE_COMMIT" ]; then
  echo "✗ No store build commit. Put it in scripts/store-build.txt (see `eas build:list`)." >&2
  exit 1
fi
if ! git cat-file -e "${STORE_COMMIT}^{commit}" 2>/dev/null; then
  echo "✗ Store build commit $STORE_COMMIT not found locally (git fetch --unshallow?)." >&2
  exit 1
fi

fail=0

echo "▸ 1/4 native dependency drift vs store build $STORE_COMMIT"
added=$(git diff "$STORE_COMMIT" HEAD -- package.json \
  | grep -E '^\+\s+"' | sed -E 's/^\+\s+"([^"]+)".*/\1/' || true)
for pkg in $added; do
  # A package ships native code if it has ios/ or android/ dirs or an expo-module config.
  if [ -d "node_modules/$pkg/ios" ] || [ -d "node_modules/$pkg/android" ] || [ -f "node_modules/$pkg/expo-module.config.json" ]; then
    # Allow-list: packages loaded lazily behind a guard (documented in lib/appUpdates.ts).
    if [ "$pkg" = "expo-updates" ]; then
      echo "  ~ $pkg added since store build, but loaded lazily behind a guard — OK"
    else
      echo "  ✗ $pkg was added since the store build and contains native code — an OTA cannot ship this"
      fail=1
    fi
  fi
done
[ -z "$added" ] && echo "  ✓ no dependencies added since store build"

echo "▸ 2/4 static expo-updates imports"
if grep -rnE "from ['\"]expo-updates['\"]|require\(['\"]expo-updates['\"]\)" app components services hooks --include='*.ts' --include='*.tsx' 2>/dev/null; then
  echo "  ✗ expo-updates must only be loaded through lib/appUpdates.ts (guarded require)"
  fail=1
else
  echo "  ✓ only lib/appUpdates.ts touches expo-updates"
fi

echo "▸ 3/4 iOS bundle compiles"
out=$(mktemp -d)
if CI=1 npx expo export -p ios --output-dir "$out" >/dev/null 2>&1; then
  echo "  ✓ export ok ($(du -sh "$out"/_expo/static/js/ios/*.hbc | cut -f1) hbc)"
else
  echo "  ✗ expo export -p ios failed"
  fail=1
fi

# 2026-09-22 → 09-28 incident: the OTAs were published from a shell without
# the EXPO_PUBLIC_ exports, so the bundle inlined `undefined` for the Supabase
# URL/key, createClient() threw at startup and every iPhone crashed on launch
# for a week. lib/supabase.ts now falls back to the public values, but a
# bundle that lacks them still means the publishing shell is wrong.
echo "▸ 4/4 EXPO_PUBLIC_ env inlined into the bundle"
if [ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "  ✗ EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY are not exported in this shell (see eas.json production.env)"
  fail=1
elif ! strings -n 8 "$out"/_expo/static/js/ios/*.hbc 2>/dev/null | grep -q 'oyedfzsqqqdfrmhbcbwb.supabase.co'; then
  echo "  ✗ exported bundle does not contain the Supabase URL — env was not inlined"
  fail=1
else
  echo "  ✓ Supabase URL present in the exported bundle"
fi
rm -rf "$out"

if [ "$fail" -ne 0 ]; then
  echo; echo "PREFLIGHT FAILED — do not run eas update. Ship an App Store build instead."; exit 1
fi
echo; echo "PREFLIGHT PASSED — safe to publish this bundle to the current store binary."
