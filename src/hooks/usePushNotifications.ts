/**
 * Push Notifications Hook - Capacitor Push Notifications
 * 
 * Handles registration, token management, and notification handling.
 * Used to alert users of incoming payments/requests.
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

interface PushNotificationState {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  error: string | null;
}

interface NotificationPayload {
  type: 'payment_request' | 'payment_received' | 'payment_sent' | 'reminder';
  intentId?: string;
  amount?: number;
  fromName?: string;
  toName?: string;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: Capacitor.isNativePlatform(),
    isRegistered: false,
    token: null,
    error: null,
  });

  // Handle incoming notifications
  const handleNotificationReceived = useCallback((notification: PushNotificationSchema) => {
    console.log('Push notification received:', notification);
    
    // Parse notification data
    const data = notification.data as NotificationPayload | undefined;
    
    // Here you could show an in-app notification, update state, etc.
    if (data?.type === 'payment_request') {
      // Could navigate to the request or show a toast
      console.log('Payment request notification:', data);
    }
  }, []);

  // Handle notification tap
  const handleNotificationAction = useCallback((action: ActionPerformed) => {
    console.log('Push notification action:', action);
    
    const data = action.notification.data as NotificationPayload | undefined;
    
    // Navigate based on notification type
    if (data?.intentId) {
      // Navigate to the relevant screen
      window.location.href = `/resolve/${data.intentId}`;
    }
  }, []);

  // Register for push notifications
  const register = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, error: 'Push notifications require native platform' }));
      return false;
    }

    try {
      // Request permission
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive !== 'granted') {
        setState(prev => ({ ...prev, error: 'Push notification permission denied' }));
        return false;
      }

      // Register with APNs/FCM
      await PushNotifications.register();

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register for push notifications';
      setState(prev => ({ ...prev, error: message }));
      return false;
    }
  }, []);

  // Save token to database
  const saveTokenToDatabase = useCallback(async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store push token in user settings or a dedicated table
      // For now, we'll log it - you'd want to save this for server-side push
      console.log('Push token for user:', user.id, token);
      
      // In production, you'd save this:
      // await supabase.from('push_tokens').upsert({ user_id: user.id, token, platform: Capacitor.getPlatform() });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }, []);

  // Set up listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Registration success
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success:', token.value);
      setState(prev => ({
        ...prev,
        isRegistered: true,
        token: token.value,
      }));
      saveTokenToDatabase(token.value);
    });

    // Registration error
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      setState(prev => ({
        ...prev,
        error: error.error,
      }));
    });

    // Foreground notification
    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      handleNotificationReceived
    );

    // Notification tap
    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      handleNotificationAction
    );

    // Cleanup
    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      notificationListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [handleNotificationReceived, handleNotificationAction, saveTokenToDatabase]);

  // Check current permission status
  const checkPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return 'denied';
    
    const status = await PushNotifications.checkPermissions();
    return status.receive;
  }, []);

  return {
    ...state,
    register,
    checkPermissions,
  };
}
