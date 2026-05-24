// AlertHost.tsx
//
// Renders Alert.alert() popups (from crossPlatformAlert) as the
// in-app NotificationModal on web, so every alert / confirm in the
// app matches the pick-confirmation styling instead of falling back
// to the browser's dialog. Mounted once in app/_layout.tsx.

import { useEffect, useState } from 'react';
import type { AlertButton } from 'react-native';
import NotificationModal from './NotificationModal';
import { registerAlertHost } from '../app/lib/crossPlatformAlert';

interface HostState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
}

export default function AlertHost() {
  const [state, setState] = useState<HostState>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    registerAlertHost((title, message, buttons) => {
      setState({ visible: true, title, message: message ?? '', buttons });
    });
    return () => registerAlertHost(null);
  }, []);

  return (
    <NotificationModal
      visible={state.visible}
      onClose={() => setState(s => ({ ...s, visible: false }))}
      title={state.title}
      message={state.message}
      type="info"
      buttons={state.buttons}
    />
  );
}
