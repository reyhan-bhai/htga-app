"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
  Chip,
} from "@nextui-org/react";
import { MdSend, MdNotifications } from "react-icons/md";
import Swal from "sweetalert2";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // Fetch subscriber count on mount
  useState(() => {
    fetchSubscriberCount();
  });

  async function fetchSubscriberCount() {
    try {
      const response = await fetch("/api/tokens");
      if (response.ok) {
        const data = await response.json();
        setSubscriberCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching subscriber count:", error);
    }
  }

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Title and Body are required",
        confirmButtonColor: "#A67C37",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Send Notification?",
      html: `
        <div style="text-align: left;">
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Body:</strong> ${body}</p>
          <p><strong>Recipients:</strong> ${subscriberCount || 0} subscribers</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Send Now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#A67C37",
      cancelButtonColor: "#6c757d",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationTitle: title,
          notificationBody: body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      await Swal.fire({
        icon: "success",
        title: "Notification Sent!",
        html: `
          <div style="text-align: left;">
            <p>✅ Successfully sent: <strong>${data.successCount}</strong></p>
            <p>❌ Failed: <strong>${data.failureCount}</strong></p>
            <p>📱 Total subscribers: <strong>${data.totalSubscribers}</strong></p>
          </div>
        `,
        confirmButtonColor: "#A67C37",
      });

      // Reset form
      setTitle("");
      setBody("");
      fetchSubscriberCount();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to send notification",
        confirmButtonColor: "#A67C37",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-black flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold uppercase">Push Notifications</h2>
        <Chip
          startContent={<MdNotifications size={18} />}
          variant="flat"
          color="primary"
          size="lg"
        >
          {subscriberCount !== null
            ? `${subscriberCount} Subscribers`
            : "Loading..."}
        </Chip>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="flex gap-3 bg-[#A67C37] text-white">
          <MdSend size={24} />
          <div className="flex flex-col">
            <p className="text-lg font-bold">Send Notification</p>
            <p className="text-sm text-gray-200">
              Send push notification to all subscribed evaluators
            </p>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <Input
            label="Notification Title"
            placeholder="Enter notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="bordered"
            required
            classNames={{
              input: "text-black",
              label: "text-gray-700",
            }}
          />

          <Textarea
            label="Notification Body"
            placeholder="Enter notification message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            variant="bordered"
            minRows={4}
            required
            classNames={{
              input: "text-black",
              label: "text-gray-700",
            }}
          />

          <Button
            color="primary"
            size="lg"
            className="bg-[#A67C37] text-white font-semibold"
            startContent={<MdSend size={20} />}
            onPress={handleSendNotification}
            isLoading={loading}
            isDisabled={loading || !title.trim() || !body.trim()}
          >
            {loading ? "Sending..." : "Send Notification"}
          </Button>

          <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
            <p className="font-semibold mb-2">ℹ️ Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Notifications will be sent to all evaluators who allowed
                notifications
              </li>
              <li>Users must enable notifications when logging in</li>
              <li>
                Failed deliveries are automatically removed from subscriber list
              </li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
