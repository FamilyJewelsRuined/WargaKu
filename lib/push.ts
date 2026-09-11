import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: unknown) {
    // Subscription sudah tidak valid (expired/unsubscribed)
    if (
      error instanceof Error &&
      "statusCode" in error &&
      (error as { statusCode: number }).statusCode === 410
    ) {
      return { success: false, expired: true };
    }
    console.error("Push notification error:", error);
    return { success: false, error };
  }
}

export async function broadcastPushNotification(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string; id: string }>,
  payload: PushPayload
) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  const expired = results
    .map((r, i) => ({ result: r, sub: subscriptions[i] }))
    .filter(
      ({ result }) =>
        result.status === "fulfilled" && result.value.expired
    )
    .map(({ sub }) => sub.id);

  return {
    total: subscriptions.length,
    expired,
  };
}
