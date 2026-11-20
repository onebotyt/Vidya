/**
 * Assessment Process (NBA) Desktop Gate Screen
 */

import React from 'react';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function AssessmentProcessScreen() {
  return (
    <DesktopOnlyNotice
      moduleName="Assessment Process & Outcomes (NBA)"
      description="The Assessment Process module performs complex statistical calculations, attainment thresholds, and multi-test score weighting best suited for PC monitors."
      webPath="/faculty/assessment-process/"
    />
  );
}

