"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function PushNotificationInit() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    const initPush = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await registration.pushManager.getSubscription();
        if (existing) return; // Already subscribed

        const vapidRes = await fetch("/api/push/vapid-public");
        const { publicKey } = await vapidRes.json();

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
      } catch (error) {
        console.error("Push init error:", error);
      }
    };

    initPush();
  }, [session]);

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
