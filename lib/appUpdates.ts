// Over-the-air (EAS Update) helpers.
//
// Native expo-updates behaviour on the current store build (v1.3.0 build 7)
// is: check on launch, download in the background, apply on the NEXT cold
// start — so every update takes two full launches to appear. This module
// tries to collapse that to one launch, and makes the running bundle
// visible in the Profile footer so we can verify what a device is on.
//
// IMPORTANT — why the module is loaded lazily and everything is guarded:
// On 2026-09-19 a bundle that imported expo-updates statically froze the
// app at startup for every iOS user; the same code with a guarded require()
// runs fine. Native OTA delivery has worked on this binary throughout (the
// phone was observed running post-build code), so the native module is
// present — but evaluating the JS module at bundle-init is not safe here.
// We therefore:
//   - require() it only inside try/catch, on first use;
//   - record the error (if any) so describeBuild() can surface it;
//   - never reload more than once per target update, and never within
//     60 s of a previous reload (stored via AsyncStorage) — a reload loop
//     would look exactly like a frozen splash screen.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import storage from './storage';

type UpdatesModule = typeof import('expo-updates');

const isNative = Platform.OS !== 'web';

const RELOAD_GUARD_KEY = 'justpicks.updates.lastReload'; // JSON: { id, at }
const RELOAD_COOLDOWN_MS = 60_000;

let cached: UpdatesModule | null | undefined; // undefined = not tried yet
let loadError: string | null = null;

/**
 * The expo-updates JS module, or null when it can't be used in the running
 * binary (or we're on web / in development). Never throws.
 */
function loadUpdates(): UpdatesModule | null {
  if (cached !== undefined) return cached;
  if (!isNative || __DEV__) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-updates') as UpdatesModule;
    // Touch the native-backed constants; if the bridge is unhappy this is
    // where it throws, and we want that inside the try.
    void mod.isEnabled;
    void mod.updateId;
    cached = mod;
  } catch (err) {
    loadError = (err as Error)?.message ?? String(err);
    console.warn('[updates] expo-updates unavailable in this binary:', loadError);
    cached = null;
  }
  return cached;
}

/** The reason expo-updates couldn't be loaded, if it couldn't. */
export function updatesLoadError(): string | null {
  loadUpdates();
  return loadError;
}

/** True when OTA updates can run at all (native release build with expo-updates on). */
export function updatesEnabled(): boolean {
  const Updates = loadUpdates();
  return Updates?.isEnabled === true;
}

async function readReloadGuard(): Promise<{ id: string; at: number } | null> {
  try {
    const raw = await storage.getItem(RELOAD_GUARD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeReloadGuard(id: string): Promise<void> {
  try {
    await storage.setItem(RELOAD_GUARD_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    /* best effort */
  }
}

let applied = false;

/**
 * Check → fetch → reload, once per process, so a published update is live
 * on the first launch after publish instead of the second. Safe to call from
 * the root layout; resolves quickly when there is nothing to do; never throws.
 *
 * Loop protection: we remember the update id we last reloaded into. If the
 * server offers that same id again, or we reloaded less than 60 s ago, we
 * leave it to native's next-launch behaviour instead of reloading.
 */
export async function applyUpdateOnLaunch(): Promise<void> {
  if (applied) return;
  applied = true;
  const Updates = loadUpdates();
  if (!Updates || Updates.isEnabled !== true) return;
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return;

    const targetId: string | undefined = (check as any).manifest?.id;
    const guard = await readReloadGuard();
    if (guard) {
      if (targetId && guard.id === targetId) {
        console.warn('[updates] already reloaded for', targetId, '— leaving to next launch');
        return;
      }
      if (Date.now() - guard.at < RELOAD_COOLDOWN_MS) {
        console.warn('[updates] reloaded', Math.round((Date.now() - guard.at) / 1000), 's ago — leaving to next launch');
        return;
      }
    }

    // fetchUpdateAsync returns isNew=false when native already downloaded the
    // update in the background — it is still pending, so we reload either way.
    await Updates.fetchUpdateAsync();
    await writeReloadGuard(targetId ?? 'unknown');
    await Updates.reloadAsync();
  } catch (err) {
    // Offline, throttled, or the manifest failed — native's own
    // check-on-launch path still runs, so just log and move on.
    console.warn('[updates] apply-on-launch skipped:', (err as Error)?.message ?? err);
  }
}

/**
 * Footer label for Profile:
 *   "v1.3.0 · 01a0bbfe"      — OTA update id (first 8)
 *   "v1.3.0 · embedded"      — running the bundle shipped in the store build
 *   "v1.3.0 · no-updates"    — expo-updates JS couldn't load (see describeBuildDetail)
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

/** Second footer line: the load error when there is one, else null. */
export function describeBuildDetail(): string | null {
  const err = updatesLoadError();
  return err ? err.slice(0, 120) : null;
}
