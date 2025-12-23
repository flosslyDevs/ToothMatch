import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
let fcmInitialized = false;

export const initializeFCM = () => {
  if (fcmInitialized) {
    return;
  }

  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    // Initialize with service account credentials from environment
    // FIREBASE_SERVICE_ACCOUNT should be a JSON string or path to JSON file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (error) {
        console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", error);
        // If parsing fails, try as file path
        admin.initializeApp({
          credential: admin.credential.cert(
            process.env.FIREBASE_SERVICE_ACCOUNT
          ),
        });
      }
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Initialize with default credentials (for GCP environments)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      console.warn(
        "FCM not initialized: Missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID"
      );
      return;
    }
  }

  fcmInitialized = true;
  console.log("FCM initialized successfully");
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
 * @param {object} messageData - Message data (id, senderId, message, createdAt)
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
    senderId: String(messageData.senderId),
    senderName: String(senderName || ""),
    senderAvatar: String(senderAvatar || ""),
    message: String(messageData.message || ""),
    timestamp: new Date(messageData.createdAt).toISOString(),
  };

  return sendFCMNotification(
    fcmToken,
    {
      title: data.senderName || "New Message",
      body: data.message || "",
    },
    data
  );
};
