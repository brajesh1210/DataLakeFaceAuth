import {useCallback, useEffect, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import {Camera} from 'react-native-vision-camera';

export type CameraPermissionStatus =
  | 'granted'
  | 'denied'
  | 'not-determined'
  | 'restricted';

interface UseCameraPermissionResult {
  status: CameraPermissionStatus;
  requestPermission: () => Promise<void>;
  openSettings: () => Promise<void>;
  isGranted: boolean;
}

/**
 * Hook to manage camera permissions for Vision Camera.
 * Handles initial check, requesting, and redirecting to settings.
 */
export function useCameraPermission(): UseCameraPermissionResult {
  const [status, setStatus] =
    useState<CameraPermissionStatus>('not-determined');

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = useCallback(async () => {
    const currentStatus = Camera.getCameraPermissionStatus();
    setStatus(currentStatus as CameraPermissionStatus);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Camera.requestCameraPermission();
    setStatus(result as CameraPermissionStatus);

    if (result === 'denied') {
      Alert.alert(
        'Camera Permission Required',
        'NHAI DataLake needs camera access for face authentication. Please enable camera access in your device settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => openSettings()},
        ],
      );
    }
  }, []);

  const openSettings = useCallback(async () => {
    if (Platform.OS === 'android') {
      await Linking.openSettings();
    }
  }, []);

  return {
    status,
    requestPermission,
    openSettings,
    isGranted: status === 'granted',
  };
}
