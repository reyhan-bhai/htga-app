"use client";
import { PushNotificationsContext } from "@/components/notifications/PushNotificationsProvider";
import { useCurrentUser } from "@/utils/useCurrentUser";
import {
  Alert,
  Box,
  Button,
  Slide,
  SlideProps,
  Snackbar,
  Typography,
} from "@mui/material";
import CircularProgress, {
  CircularProgressProps,
} from "@mui/material/CircularProgress";
import { getToken } from "firebase/messaging";
import { useContext, useState } from "react";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number }
) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: "text.secondary", fontSize: "12px" }}
        >{`${Math.round(props.value)}`}</Typography>
      </Box>
    </Box>
  );
}

export const SubscribeButton: React.FC = () => {
  const { messaging, isSupported, needsPWAInstall } = useContext(
    PushNotificationsContext
  );
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleClose = () => {
    setOpen(false);
    setAlertType("success");
  };

  const handleTokenSubmit = async () => {
    try {
      // Check iOS and PWA mode
      if (needsPWAInstall) {
        alert(
          "⚠️ iOS Requirement:\n\n" +
            "1. Tap Share button  at bottom\n" +
            "2. Scroll and tap 'Add to Home Screen'\n" +
            "3. Open app from Home Screen\n" +
            "4. Then subscribe to notifications"
        );
        throw new Error("Please install app first on iOS");
      }

      // Check if push notifications are supported
      if (!isSupported) {
        alert("Push notifications are not supported on this browser.");
        throw new Error("Push notifications not supported");
      }

      if (messaging) {
        setIsLoading(true);
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission !== "granted"
        ) {
          setProgress(10);
          const result = await Notification.requestPermission();
          setProgress(20);
          if (result !== "granted")
            throw new Error("Notifications are not allowed.");
        }

        if (!("serviceWorker" in navigator)) {
          console.error("Service Workers unavailable");
        }

        let registration = await navigator.serviceWorker.getRegistration("/");
        setProgress(40);
        if (!registration) {
          const swUrl =
            process.env.NODE_ENV === "production"
              ? "/sw.js"
              : "/firebase-messaging-sw.js";
          registration = await navigator.serviceWorker.register(swUrl, {
            scope: "/",
          });
        }
        setProgress(60);

        await navigator.serviceWorker.ready;
        setProgress(80);
        const firebaseToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        setProgress(100);

        // Simpan token ke database
        await fetch("/api/admin/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: firebaseToken }),
        });

        if (user) user.data.firebaseToken = firebaseToken;
        setOpen(true);
        setIsLoading(false);
        setProgress(0);
      } else {
        throw new Error("Push notifications not supported on this browser");
      }
    } catch (err: any) {
      console.log(err.message);
      alert(err.message);
      setAlertType("error");
      setOpen(true);
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Button
        variant={"contained"}
        onClick={handleTokenSubmit}
        className="flex items-center gap-2"
      >
        {isLoading && (
          <CircularProgressWithLabel
            size={20}
            color="secondary"
            value={progress}
          />
        )}
        Subscribe to Notifications
      </Button>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        TransitionComponent={function SlideTransition(props: SlideProps) {
          return <Slide {...props} direction="up" />;
        }}
      >
        <Alert onClose={handleClose} severity={alertType} variant="filled">
          {alertType === "success"
            ? "Operation successful!"
            : "Operation failed!"}
        </Alert>
      </Snackbar>
    </>
  );
};
