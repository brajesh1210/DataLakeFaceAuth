import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { ThemeProvider } from '@theme/ThemeContext';
import { AppNavigator } from '@navigation/AppNavigator';
import { useAppStore } from '@store/useAppStore';

function App(): React.JSX.Element {
  // Global NetInfo listener — single source of truth for network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      useAppStore.getState().setNetworkStatus(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
