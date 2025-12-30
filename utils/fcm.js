import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase Admin if not already initialized
let fcmInitialized = false;

export const initializeFCM = () => {
  if (fcmInitialized) {
    return true;
  }

  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH, "utf8")
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn(
        "FCM not initialized: Missing FIREBASE_SERVICE_ACCOUNT_JSON_PATH"
      );
      return false;
    }
  }

  fcmInitialized = true;
  console.log("FCM initialized successfully");
  return true;
};

/**
 * Send a push notification via FCM
 * @param {string} fcmToken - The FCM token of the recipient device
 * @param {Object} notification - Notification payload
 * @param {Map<string, string>} data - Data payload (optional)
 * @returns {Promise<{success: boolean, messageId: string | null, error: string | null}>} FCM send result
 */
export const sendFCMNotification = async (
  fcmToken,
  notification,
  data = {}
) => {
  if (!fcmInitialized) {
    initializeFCM();
  }

  if (!fcmToken) {
    throw new Error("FCM token is required");
  }

  if (!admin.apps.length) {
    throw new Error("Firebase Admin not initialized");
  }

  const message = {
    token: fcmToken,
    notification: {
      title: notification.title || "New Message",
      body: notification.body || "",
    },
    data,
    android: {
      priority: "high",
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent FCM message:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("Error sending FCM message:", error);

    // Handle invalid token errors
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      return { success: false, error: "INVALID_TOKEN", message: error.message };
    }

    return { success: false, error: "FCM_ERROR", message: error.message };
  }
};

/**
 * Send a chat message notification via FCM
 * @param {string} fcmToken - The FCM token of the recipient device
 * @param {object} messageData - Message data
 * @param {string} senderName - Name of the sender
 * @param {string} senderAvatar - Avatar of the sender
 * @returns {Promise<Object>} FCM send result
 */
export const sendChatNotification = async (
  fcmToken,
  messageData,
  senderName,
  senderAvatar
) => {
  // Ensure all data values are strings (FCM requirement)
  const data = {
    type: "chat",
    messageId: String(messageData.id),
    threadId: String(messageData.threadId),
    senderId: String(messageData.senderId),
    senderName: String(senderName || ""),
    message: String(messageData.message || ""),
    timestamp: new Date(messageData.createdAt).toISOString(),
  };

  return sendFCMNotification(
    fcmToken,
    {
      title: data.senderName || "New Message",
      body: data.message || "",
      imageUrl: senderAvatar,
    },
    data
  );
};
