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
#   4. EXPO_PUBLIC_* are exported in this shell AND end up inlined in the
#      exported bundle (the 2026-09-22 → 09-28 crash was a bundle published
#      without them). Export runs with --clear so a stale Metro cache can't
#      hide a missing value; publish with `eas update --clear-cache` too.
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
if CI=1 npx expo export -p ios --clear --output-dir "$out" >/dev/null 2>&1; then
  echo "  ✓ export ok ($(du -sh "$out"/_expo/static/js/ios/*.hbc | cut -f1) hbc)"
else
  echo "  ✗ expo export -p ios failed"
  fail=1
fi

# 2026-09-22 → 09-28 incident: every iPhone crashed on launch for a week
# because the OTA bundle had `undefined` inlined for the Supabase URL/key
# (Babel inlines EXPO_PUBLIC_* from the shell at transform time, and the
# Metro transform cache re-uses that result for unchanged files, so one
# export from a shell without the exports poisons later publishes too —
# hence --clear above and --clear-cache on `eas update`). lib/supabase.ts
# now falls back to the public values, so this check uses the VAPID key,
# which has no fallback in code: it is only in the bundle if the env was
# really inlined. Uses grep -a, not `strings` (macOS strings gave a false
# FAIL on 2026-09-30).
echo "▸ 4/4 EXPO_PUBLIC_ env inlined into the bundle"
hbc=$(ls "$out"/_expo/static/js/ios/*.hbc 2>/dev/null | head -1)
if [ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ] || [ -z "${EXPO_PUBLIC_VAPID_PUBLIC_KEY:-}" ]; then
  echo "  ✗ EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY / _VAPID_PUBLIC_KEY are not all exported in this shell (values: eas.json production.env)"
  fail=1
elif [ -z "$hbc" ]; then
  echo "  ✗ no iOS .hbc found in the export"
  fail=1
elif ! LC_ALL=C grep -a -q -F -e "$EXPO_PUBLIC_VAPID_PUBLIC_KEY" "$hbc"; then
  echo "  ✗ exported bundle does not contain EXPO_PUBLIC_VAPID_PUBLIC_KEY — env was not inlined (stale Metro cache?)"
  fail=1
elif ! LC_ALL=C grep -a -q -F -e 'oyedfzsqqqdfrmhbcbwb.supabase.co' "$hbc"; then
  echo "  ✗ exported bundle does not contain the Supabase URL"
  fail=1
else
  echo "  ✓ env inlined (VAPID key + Supabase URL present in the exported bundle)"
fi
rm -rf "$out"

if [ "$fail" -ne 0 ]; then
  echo; echo "PREFLIGHT FAILED — do not run eas update. Ship an App Store build instead."; exit 1
fi
echo; echo "PREFLIGHT PASSED — safe to publish this bundle to the current store binary."
