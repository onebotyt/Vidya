/**
 * Course File (NBA) Desktop Gate Screen
 */

import React from 'react';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function CourseFileScreen() {
  return (
    <DesktopOnlyNotice
      moduleName="Course File & NBA Compliance Dossiers"
      description="The Course File manager contains comprehensive course outlines, CO-PO mapping matrix tables, and split-screen document evaluation tools built for desktop screens."
      webPath="/faculty/course-file/"
    />
  );
}

