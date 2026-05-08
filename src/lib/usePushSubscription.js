"use client";

import { useState, useEffect, useCallback } from "react";
import api from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);

    if (Notification.permission === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setLoading(true);
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Ask permission
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;

      // Get VAPID public key
      const keyData = await fetch(`${API_URL}/api/public/vapid_public_key`).then(
        (r) => r.json()
      );
      const vapidPublicKey = keyData.vapid_public_key;

      // Create push subscription
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subJson = sub.toJSON();
      await api.post("/api/v1/push_subscriptions", {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        browser: navigator.userAgent.slice(0, 100),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("[Push] Subscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete("/api/v1/push_subscriptions", {
          data: { endpoint: sub.endpoint },
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("[Push] Unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
