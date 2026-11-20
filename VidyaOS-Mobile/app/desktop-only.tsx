/**
 * Generic Modal Screen for Desktop-Only Gate
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DesktopOnlyNotice } from '../components/DesktopOnlyNotice';

export default function DesktopOnlyScreen() {
  const params = useLocalSearchParams<{ module?: string; webPath?: string; desc?: string }>();

  return (
    <DesktopOnlyNotice
      moduleName={params.module || 'Institutional Desktop Module'}
      description={params.desc}
      webPath={params.webPath || '/faculty/sheets/'}
    />
  );
}

