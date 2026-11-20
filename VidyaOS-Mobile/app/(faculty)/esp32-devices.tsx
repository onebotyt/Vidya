/**
 * ESP32 Hardware & Biometric Devices Desktop Gate Screen
 */

import React from 'react';
import { DesktopOnlyNotice } from '../../components/DesktopOnlyNotice';

export default function Esp32DevicesScreen() {
  return (
    <DesktopOnlyNotice
      moduleName="ESP32 IoT & Biometric Hardware Manager"
      description="Biometric AS608 hardware pairing, COM port baud rates, OLED display testing, and hardware sync settings require a desktop workstation."
      webPath="/faculty/devices/"
    />
  );
}

