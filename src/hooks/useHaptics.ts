/**
 * Haptics Hook - Tactile feedback for payment actions
 * 
 * Uses Capacitor Haptics on native, falls back to vibration API on web.
 */

import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotificationType = 'success' | 'warning' | 'error';

export function useHaptics() {
  const isNative = Capacitor.isNativePlatform();

  // Impact haptic - for button presses, selections
  const impact = useCallback(async (style: ImpactStyle = 'medium') => {
    if (isNative) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        
        const styleMap = {
          light: ImpactStyle.Light,
          medium: ImpactStyle.Medium,
          heavy: ImpactStyle.Heavy,
        };
        
        await Haptics.impact({ style: styleMap[style] });
      } catch (error) {
        console.error('Haptics impact failed:', error);
      }
    } else {
      // Web fallback - use vibration API if available
      if ('vibrate' in navigator) {
        const durationMap = { light: 10, medium: 25, heavy: 50 };
        navigator.vibrate(durationMap[style]);
      }
    }
  }, [isNative]);

  // Notification haptic - for success/warning/error feedback
  const notification = useCallback(async (type: NotificationType = 'success') => {
    if (isNative) {
      try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        
        const typeMap = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        };
        
        await Haptics.notification({ type: typeMap[type] });
      } catch (error) {
        console.error('Haptics notification failed:', error);
      }
    } else {
      // Web fallback
      if ('vibrate' in navigator) {
        const patternMap = {
          success: [50, 50, 50],
          warning: [100, 50, 100],
          error: [100, 100, 100, 100, 100],
        };
        navigator.vibrate(patternMap[type]);
      }
    }
  }, [isNative]);

  // Selection haptic - light tap for selections
  const selection = useCallback(async () => {
    if (isNative) {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
      } catch (error) {
        console.error('Haptics selection failed:', error);
      }
    } else {
      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    }
  }, [isNative]);

  // Vibrate - raw vibration (e.g., for payment confirmation)
  const vibrate = useCallback(async (duration: number = 100) => {
    if (isNative) {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.vibrate({ duration });
      } catch (error) {
        console.error('Haptics vibrate failed:', error);
      }
    } else {
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
      }
    }
  }, [isNative]);

  return {
    impact,
    notification,
    selection,
    vibrate,
    // Convenience methods
    success: () => notification('success'),
    warning: () => notification('warning'),
    error: () => notification('error'),
    tap: () => impact('light'),
    confirm: () => impact('heavy'),
  };
}
