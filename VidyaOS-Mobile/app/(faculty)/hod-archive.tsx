/**
 * HOD Academic Archive Desktop Gate Screen
 */

import React from 'react';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function HodArchiveScreen() {
  return (
    <DesktopOnlyNotice
      moduleName="HOD Academic Archive & Multi-Year Batches"
      description="Historical cohort promotions, multi-year archived rosters, and semester-wide retention logs are configured on desktop screens."
      webPath="/faculty/archive/"
    />
  );
}

