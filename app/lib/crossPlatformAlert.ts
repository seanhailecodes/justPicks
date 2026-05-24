// crossPlatformAlert.ts
//
// React Native's Alert is a no-op on react-native-web, so alert /
// confirm dialogs never appear in the web build. This shim keeps the
// exact Alert.alert(title, message, buttons?, options?) signature but
// falls back to the browser's native dialogs on web. Every existing
// `Alert.alert(...)` call site keeps working unchanged.
//
// Usage: replace `import { Alert } from 'react-native'`
//        with    `import { Alert } from '<path>/crossPlatformAlert'`.

import { Alert as RNAlert, Platform } from 'react-native';
import type { AlertButton, AlertOptions } from 'react-native';

function webAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const body = message ? `${title}\n\n${message}` : title;
  const g = globalThis as any;

  // Zero or one button -> simple acknowledgement dialog.
  if (!buttons || buttons.length === 0) {
    g.alert?.(body);
    return;
  }
  if (buttons.length === 1) {
    g.alert?.(body);
    buttons[0]?.onPress?.();
    return;
  }

  // Two or more buttons -> binary confirm dialog. Identify the
  // cancel / dismiss button by style or label; the last remaining
  // button is treated as the primary (confirm) action.
  const isCancel = (b: AlertButton) =>
    b.style === 'cancel' ||
    /^(cancel|dismiss|no|not now)$/i.test((b.text ?? '').trim());
  const cancelBtn = buttons.find(isCancel) ?? buttons[0];
  const confirmBtn =
    [...buttons].reverse().find(b => b !== cancelBtn) ?? buttons[buttons.length - 1];

  if (g.confirm?.(body)) {
    confirmBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}

export const Alert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    if (Platform.OS === 'web') {
      webAlert(title, message, buttons);
    } else {
      RNAlert.alert(title, message, buttons, options);
    }
  },
};
