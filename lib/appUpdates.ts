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
// Everything is guarded: no-ops on web, in development, or when
// expo-updates is disabled — and never throws into the UI.
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

const isNative = Platform.OS !== 'web';

/** True when OTA updates can run at all (native release build with expo-updates on). */
export function updatesEnabled(): boolean {
  return isNative && !__DEV__ && Updates.isEnabled === true;
}

let applied = false;

/**
 * Check → fetch → reload, once per process. Safe to call from the root
 * layout; resolves quickly when there is nothing to do.
 */
export async function applyUpdateOnLaunch(): Promise<void> {
  if (applied || !updatesEnabled()) return;
  applied = true;
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

/** e.g. "v1.3.0 · 01a09823" (OTA) or "v1.3.0 · embedded" (store bundle). */
export function describeBuild(): string {
  const version =
    Constants.expoConfig?.version ??
    (Constants as any).manifest2?.extra?.expoClient?.version ??
    'dev';
  if (!isNative) return `v${version} · web`;
  const id = Updates.updateId ? Updates.updateId.slice(0, 8) : null;
  const source = Updates.isEmbeddedLaunch || !id ? 'embedded' : id;
  return `v${version} · ${source}`;
}
