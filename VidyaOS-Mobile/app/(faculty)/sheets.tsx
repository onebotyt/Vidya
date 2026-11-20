/**
 * Sheets Desktop Gate Screen
 */

import React from 'react';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function SheetsScreen() {
  return (
    <DesktopOnlyNotice
      moduleName="Gradebook & Institutional Spreadsheets"
      description="The VidyaOS Sheets editor contains extensive multi-column ledgers, calculation formulas, and Excel export tools designed for large desktop monitors."
      webPath="/faculty/sheets/"
    />
  );
}

