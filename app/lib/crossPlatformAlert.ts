// crossPlatformAlert.ts
//
// React Native's Alert is a no-op on react-native-web, so alert /
// confirm dialogs never appear in the web build. This shim keeps the
// exact Alert.alert(title, message, buttons?, options?) signature.
//
//  - On native: delegates straight to React Native's Alert.
//  - On web: routes to the in-app NotificationModal via the bridge
//    below, so every popup matches the rest of the app. If the host
//    isn't mounted yet, it falls back to the browser dialog.
//
// Usage: import { Alert } from '<path>/crossPlatformAlert' (instead
// of from 'react-native'); call sites stay unchanged.

import { Alert as RNAlert, Platform } from 'react-native';
import type { AlertButton, AlertOptions } from 'react-native';

// ---- Bridge to the in-app modal --------------------------------
// <AlertHost> (mounted in app/_layout.tsx) registers a handler here.
export type AlertHostHandler = (
  title: string,
  message: string | undefined,
  buttons: AlertButton[] | undefined,
) => void;

let _alertHost: AlertHostHandler | null = null;

export function registerAlertHost(handler: AlertHostHandler | null) {
  _alertHost = handler;
}

// ---- Browser-dialog fallback (only if the host isn't mounted) ---
function webFallback(title: string, message?: string, buttons?: AlertButton[]) {
  const body = message ? `${title}\n\n${message}` : title;
  const g = globalThis as any;

  if (!buttons || buttons.length <= 1) {
    g.alert?.(body);
    buttons?.[0]?.onPress?.();
    return;
  }
  const cancelBtn =
    buttons.find(
      b =>
        b.style === 'cancel' ||
        /^(cancel|dismiss|no|not now)$/i.test((b.text ?? '').trim()),
    ) ?? buttons[0];
  const confirmBtn =
    [...buttons].reverse().find(b => b !== cancelBtn) ??
    buttons[buttons.length - 1];
  if (g.confirm?.(body)) confirmBtn?.onPress?.();
  else cancelBtn?.onPress?.();
}

export const Alert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    if (Platform.OS !== 'web') {
      RNAlert.alert(title, message, buttons, options);
      return;
    }
    if (_alertHost) {
      _alertHost(title, message, buttons);
    } else {
      webFallback(title, message, buttons);
    }
  },
};
