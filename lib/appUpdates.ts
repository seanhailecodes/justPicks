// Over-the-air (EAS Update) helpers.
//
// expo-updates' default behaviour is: check on launch, download in the
// background, apply on the NEXT cold start. In practice that means users
// have to fully quit the app twice before they see a fix, and there is no
// way to tell which bundle is running. This module:
//
//   1. applyUpdateOnLaunch(): if a newer update is available for this
//      runtime/channel, download it and reload immediately so the fix is
//      live on the first launch after publish (about a second of splash).
//   2. describeBuild(): a short "v1.3.0 · 01a09823" string for the Profile
//      footer so we can verify what a device is actually running.
//
// IMPORTANT — why the module is loaded lazily:
// `import * as Updates from 'expo-updates'` calls requireNativeModule() at
// import time. The current App Store binary (build 7) was compiled from a
// commit that did NOT include expo-updates, so that native module is absent
// there and a static import throws before the first screen renders — the
// app dies on the splash. (This shipped once, 2026-09-19, and took the app
// down for every iOS user until the update was rolled back.) Loading the
// module inside a try/catch, only when needed, keeps the JS bundle usable
// on binaries with or without the native side.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type UpdatesModule = typeof import('expo-updates');

const isNative = Platform.OS !== 'web';

let cached: UpdatesModule | null | undefined; // undefined = not tried yet

/**
 * The expo-updates JS module, or null when the running binary doesn't
 * contain the native module (or we're on web / in development).
 */
function loadUpdates(): UpdatesModule | null {
  if (cached !== undefined) return cached;
  if (!isNative || __DEV__) {
    cached = null;
    return cached;
  }
  try {
    // require() rather than import so the native lookup happens here, guarded.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-updates') as UpdatesModule;
    // Touching isEnabled forces the native bridge; if the module is missing
    // this is where it throws.
    void mod.isEnabled;
    cached = mod;
  } catch (err) {
    console.warn('[updates] expo-updates unavailable in this binary:', (err as Error)?.message ?? err);
    cached = null;
  }
  return cached;
}

/** True when OTA updates can run at all (native release build with expo-updates on). */
export function updatesEnabled(): boolean {
  const Updates = loadUpdates();
  return Updates?.isEnabled === true;
}

let applied = false;

/**
 * Check → fetch → reload, once per process. Safe to call from the root
 * layout; resolves quickly when there is nothing to do and never throws.
 */
export async function applyUpdateOnLaunch(): Promise<void> {
  if (applied) return;
  applied = true;
  const Updates = loadUpdates();
  if (!Updates || Updates.isEnabled !== true) return;
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;
    const fetched = await Updates.fetchUpdateAsync();
    if (fetched.isNew) {
      await Updates.reloadAsync();
    }
  } catch (err) {
    // Offline, throttled, or the manifest failed — the default
    // check-on-launch path still runs, so just log and move on.
    console.warn('[updates] apply-on-launch skipped:', (err as Error)?.message ?? err);
  }
}

/**
 * e.g. "v1.3.0 · 01a09823" (OTA), "v1.3.0 · embedded" (store bundle), or
 * "v1.3.0 · no-updates" when the binary has no expo-updates module.
 */
export function describeBuild(): string {
  const version =
    Constants.expoConfig?.version ??
    (Constants as any).manifest2?.extra?.expoClient?.version ??
    'dev';
  if (!isNative) return `v${version} · web`;
  const Updates = loadUpdates();
  if (!Updates) return `v${version} · no-updates`;
  try {
    const id = Updates.updateId ? Updates.updateId.slice(0, 8) : null;
    const source = Updates.isEmbeddedLaunch || !id ? 'embedded' : id;
    return `v${version} · ${source}`;
  } catch {
    return `v${version} · unknown`;
  }
}
