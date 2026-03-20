import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useMatchesStore from '../store/matchesStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const token = useAuthStore((state) => state.token);
  const receiveMessage = useMatchesStore((state) => state.receiveMessage);

  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'cuartoya-mobile',
      });
      const pushToken = tokenData.data;
      setExpoPushToken(pushToken);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E8442A',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('matches', {
          name: 'Matches',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E8442A',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Mensajes',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E8442A',
          sound: 'default',
        });
      }

      return pushToken;
    } catch (err) {
      console.warn('Error getting push token:', err);
      return null;
    }
  }, []);

  const registerTokenWithBackend = useCallback(async (pushToken) => {
    if (!pushToken || !token) return;
    try {
      await authAPI.registerPushToken(pushToken);
    } catch (err) {
      console.warn('Error registering push token with backend:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const setup = async () => {
      const pushToken = await registerForPushNotifications();
      if (mounted && pushToken) {
        await registerTokenWithBackend(pushToken);
      }
    };

    setup();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (receivedNotification) => {
        if (!mounted) return;
        setNotification(receivedNotification);

        const data = receivedNotification.request.content.data;
        if (data?.type === 'new_message' && data.matchId && data.message) {
          receiveMessage(data.matchId, data.message);
        }
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!mounted) return;
        const data = response.notification.request.content.data;

        if (data?.type === 'new_match' && data.matchId) {
          // Navigation would be handled by the navigation ref
          console.log('Navigate to match:', data.matchId);
        } else if (data?.type === 'new_message' && data.matchId) {
          console.log('Navigate to chat:', data.matchId);
        }
      }
    );

    return () => {
      mounted = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [token, registerForPushNotifications, registerTokenWithBackend, receiveMessage]);

  const scheduleLocalNotification = useCallback(async (title, body, data = {}) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null,
      });
    } catch (err) {
      console.warn('Error scheduling notification:', err);
    }
  }, []);

  const getBadgeCount = useCallback(async () => {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }, []);

  const setBadgeCount = useCallback(async (count) => {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (err) {
      console.warn('Error setting badge count:', err);
    }
  }, []);

  return {
    expoPushToken,
    notification,
    registerForPushNotifications,
    scheduleLocalNotification,
    getBadgeCount,
    setBadgeCount,
  };
}
