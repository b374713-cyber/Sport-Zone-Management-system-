import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      undefined;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    console.log("registerForPushNotificationsAsync error:", e);
    return null;
  }
}

export async function savePushTokenToBackend(customerId: number, apiBase: string) {
  const token = await registerForPushNotificationsAsync();
  if (!token) return null;

  const res = await fetch(`${apiBase}/api/gym/push-token/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: customerId,
      expo_push_token: token,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.log("save token failed:", res.status, txt);
    return null;
  }

  console.log("✅ Saved push token:", token);
  return token;
}
