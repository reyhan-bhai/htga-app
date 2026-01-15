import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Container,
  Typography,
  Snackbar,
  Alert,
  SlideProps,
  Slide,
} from "@mui/material";
import { useState } from "react";

export default function NotificationForm() {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [resultMessage, setResultMessage] = useState("");

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      notificationTitle: "",
      url: "",
      notificationBody: "",
    },
  });

  const onSubmit = async (data: any) => {
    try {
  const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok)
        throw new Error(result.error || "Failed to send notification.");

      setResultMessage(
        `Sent to ${result.successCount}/${result.totalSubscribers} subscribers`
      );
      setAlertType("success");
      setOpen(true);
      reset(); // Reset form setelah berhasil
    } catch (err: any) {
      console.log(err.message);
      setResultMessage(err.message);
      setAlertType("error");
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setAlertType("success");
    setResultMessage("");
  };

  return (
    <>
      <Container maxWidth="sm">
        <Typography variant="h4" gutterBottom>
          Send Notification to All Subscribers
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="notificationTitle"
            control={control}
            rules={{ required: "Notification title is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notification Title"
                fullWidth
                margin="normal"
                error={!!errors.notificationTitle}
                helperText={errors.notificationTitle?.message as string}
              />
            )}
          />

          <Controller
            name="url"
            control={control}
            rules={{
              pattern: {
                value: /^(https?:\/\/)?([\w\d.-]+)\.([a-z]{2,})(\/.*)?$/i,
                message: "Enter a valid URL",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="URL (Optional)"
                fullWidth
                margin="normal"
                error={!!errors.url}
                helperText={errors.url?.message as string}
              />
            )}
          />

          <Controller
            name="notificationBody"
            control={control}
            rules={{ required: "Notification body is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Notification Body"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                error={!!errors.notificationBody}
                helperText={errors.notificationBody?.message as string}
              />
            )}
          />

          <Button type="submit" variant="contained" color="primary" fullWidth>
            Send to All Subscribers
          </Button>
        </form>
      </Container>
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
          {resultMessage ||
            (alertType === "success"
              ? "Notification sent successfully!"
              : "Failed to send notification!")}
        </Alert>
      </Snackbar>
    </>
  );
}
