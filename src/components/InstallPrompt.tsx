"use client";

import { useState, useEffect } from "react";
import { Alert, Button, Box } from "@mui/material";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && !isPWA) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <Alert severity="info" onClose={() => setShowPrompt(false)}>
      <Box>
        <strong>📱 Install App for Push Notifications</strong>
        <ol style={{ marginTop: 8, marginLeft: 20 }}>
          <li>Tap Share button (⬆️) below</li>
          <li>Scroll and tap "Add to Home Screen"</li>
          <li>Tap "Add"</li>
          <li>Open app from Home Screen</li>
        </ol>
      </Box>
    </Alert>
  );
}
