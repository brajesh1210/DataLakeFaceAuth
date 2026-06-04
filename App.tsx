import React, {useEffect, useRef} from 'react';
import {ToastAndroid, Platform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {ThemeProvider} from '@theme/ThemeContext';
import {AppNavigator} from '@navigation/AppNavigator';
import {ErrorBoundary} from '@components/ErrorBoundary';
import {useNetworkStatus} from '@hooks/useNetworkStatus';
import {SyncService} from '@services/SyncService';

function App(): React.JSX.Element {
  const networkStatus = useNetworkStatus();
  const prevAWSReachable = useRef(false);

  useEffect(() => {
    const handleAutoSync = async () => {
      // Just became AWS reachable
      if (networkStatus.isAWSReachable && !prevAWSReachable.current) {
        const pending = await SyncService.getPendingCount();
        
        if (pending > 0) {
          // Show toast
          if (Platform.OS === 'android') {
            ToastAndroid.show(
              `AWS Connected - Syncing ${pending} records...`, 
              ToastAndroid.LONG
            );
          }
          
          // Trigger sync
          const result = await SyncService.syncNow();
          
          if (result.success && Platform.OS === 'android') {
            ToastAndroid.show(
              `✓ Synced ${result.syncedCount} records to AWS`, 
              ToastAndroid.SHORT
            );
          }
        } else {
          if (Platform.OS === 'android') {
            ToastAndroid.show('AWS Connected ✓', ToastAndroid.SHORT);
          }
        }
      }
      
      prevAWSReachable.current = networkStatus.isAWSReachable;
    };
    
    handleAutoSync();
  }, [networkStatus.isAWSReachable]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
