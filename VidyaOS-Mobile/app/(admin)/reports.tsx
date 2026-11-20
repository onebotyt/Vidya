/**
 * Admin Institutional Reports Screen (Desktop Gate)
 * Heavy report generation, CSV/Excel ledger exports, and NBA dossiers.
 */

import React from 'react';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function AdminReportsScreen() {
  return (
    <DesktopOnlyNotice
      moduleName="Institutional Analytics & Ledger Exports"
      description="The VidyaOS Reporting Engine generates comprehensive institutional dossiers, full-cohort multi-column Excel exports, and NBA statistical tables designed for desktop processing."
      webPath="/admin/reports/"
    />
  );
}

