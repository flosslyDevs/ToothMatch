import admin from 'firebase-admin';
import fs from 'fs';
import UserFCMToken from '../models/auth/userFCMToken.js';
import { logger as loggerRoot } from './logger.js';

const loggerBase = loggerRoot.child('utils/fcm.js');

// Initialize Firebase Admin if not already initialized
let fcmInitialized = false;

const notificationTypes = {
  chat: 'chat',
  like: 'like',
};

export const initializeFCM = () => {
  const logger = loggerBase.child('initializeFCM');

  if (fcmInitialized) {
    logger.debug('FCM already initialized');
    return true;
  }

  logger.info('Initializing FCM');

  // Check if Firebase Admin is already initialized
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH, 'utf8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      logger.warn(
        'FCM not initialized: Missing FIREBASE_SERVICE_ACCOUNT_JSON_PATH'
      );
      return false;
    }
  }

  fcmInitialized = true;
  logger.info('FCM initialized successfully');
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
  const logger = loggerBase.child('sendFCMNotification');
  logger.debug('Sending FCM notification', { fcmToken, notification, data });
  if (!fcmInitialized) {
    logger.info('FCM not initialized, initializing...');
    initializeFCM();
  }

  if (!fcmToken) {
    logger.debug('No FCM token provided');
    throw new Error('FCM token is required');
  }

  if (!admin.apps.length) {
    logger.error('Firebase Admin not initialized');
    throw new Error('Firebase Admin not initialized');
  }

  const message = {
    token: fcmToken,
    notification: {
      title: notification.title || 'New Message',
      body: notification.body || '',
    },
    data,
    android: {
      priority: 'high',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
    },
  };

  logger.debug('FCM message', { message });

  try {
    const response = await admin.messaging().send(message);
    logger.info('Successfully sent FCM message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('Error sending FCM message:', error);

    // Handle invalid token errors
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      return { success: false, error: 'INVALID_TOKEN', message: error.message };
    }

    return { success: false, error: 'FCM_ERROR', message: error.message };
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
  const logger = loggerBase.child('sendChatNotification');
  logger.debug('Sending chat notification', {
    fcmToken,
    messageData,
    senderName,
    senderAvatar,
  });

  // Ensure all data values are strings (FCM requirement)
  const data = {
    type: notificationTypes.chat,
    messageId: String(messageData.id),
    threadId: String(messageData.threadId),
    senderId: String(messageData.senderId),
    senderName: String(senderName || ''),
    message: String(messageData.message || ''),
    timestamp: new Date(messageData.createdAt).toISOString(),
  };

  logger.debug('Chat notification data', { data });

  const res = await sendFCMNotification(
    fcmToken,
    {
      title: data.senderName || 'New Message',
      body: data.message || '',
      imageUrl: senderAvatar,
    },
    data
  );

  logger.debug('Chat notification result', { res });
  logger.info('Chat notification sent');
  return res;
};

/**
 * Sends a like notification via FCM
 * @param {string} fcmToken - The FCM token of the recipient device
 * @param {object} messageData - Message data containing likerId and likerType
 * @param {string} senderName - Name of the sender
 * @param {string} senderAvatar - Avatar of the sender
 * @returns {Promise<Object>} FCM send result
 */
export const sendLikeNotification = async (
  fcmToken,
  messageData,
  senderName,
  senderAvatar
) => {
  const logger = loggerBase.child('sendLikeNotification');
  logger.debug('Sending like notification', {
    fcmToken,
    messageData,
    senderName,
    senderAvatar,
  });

  const data = {
    type: notificationTypes.like,
    likerId: String(messageData.likerId),
    likerType: String(messageData.likerType),
  };

  logger.debug('Like notification data', { data });
  const res = await sendFCMNotification(
    fcmToken,
    {
      title: 'New Like',
      body: `${senderName} liked your profile!`,
      imageUrl: senderAvatar,
    },
    data
  );
  logger.debug('Like notification result', { res });
  logger.info('Like notification sent');
  return res;
};

/**
 * Gets the FCM Tokens for a user
 * @param {string} userId - The ID of the user
 * @returns {Promise<string[]>} The FCM tokens of the user
 */
export const getFCMTokensForUser = async (userId) => {
  const logger = loggerBase.child('getFCMTokensForUser');
  logger.info('Getting FCM tokens for user', { userId });
  try {
    const tokens = await UserFCMToken.findAll({ where: { userId } });
    logger.debug('FCM tokens found', { count: tokens.length });
    const fcmTokens = tokens.map((token) => token.fcmToken);
    logger.info('FCM tokens found', { count: fcmTokens.length });
    return fcmTokens;
  } catch (error) {
    logger.error('Error getting FCM tokens for user:', error);
    throw new Error(error.message);
  }
};
