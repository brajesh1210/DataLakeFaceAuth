import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '@store/useAppStore';

export interface NetworkStatus {
  isOnline: boolean;
  isAWSReachable: boolean;
  connectionType: string;
  lastChecked: number;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: false,
    isAWSReachable: false,
    connectionType: 'unknown',
    lastChecked: Date.now(),
  });
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isNowOnline = state.isConnected ?? false;
      
      setStatus(prev => {
        const wasOffline = !prev.isOnline;
        
        // If transitioning from offline to online, check AWS
        if (wasOffline && isNowOnline) {
          checkAWSConnection();
        }
        
        return {
          ...prev,
          isOnline: isNowOnline,
          connectionType: state.type,
          lastChecked: Date.now(),
          isAWSReachable: isNowOnline ? prev.isAWSReachable : false,
        };
      });
      
      useAppStore.getState().setNetworkStatus(isNowOnline);
    });
    
    // Initial check
    checkAWSConnection();
    
    return () => unsubscribe();
  }, []);
  
  const checkAWSConnection = async (): Promise<boolean> => {
    try {
      // Mock AWS health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const reachable = response.ok;
      setStatus(prev => ({ 
        ...prev, 
        isAWSReachable: reachable,
        lastChecked: Date.now(),
      }));
      
      return reachable;
    } catch {
      setStatus(prev => ({ 
        ...prev, 
        isAWSReachable: false,
        lastChecked: Date.now(),
      }));
      return false;
    }
  };
  
  return { ...status, checkAWSConnection };
};
