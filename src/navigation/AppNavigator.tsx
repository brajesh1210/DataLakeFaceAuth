import React, {useEffect, useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './navigationTypes';

// Screens
import {SplashScreen} from '@screens/SplashScreen';
import {LoginScreen} from '@screens/LoginScreen';
import {AdminPortalScreen} from '@screens/admin/AdminPortalScreen';
import {EmployeePortalScreen} from '@screens/employee/EmployeePortalScreen';
import {AuthenticateScreen} from '@screens/AuthenticateScreen';
import {RegisterFaceScreen} from '@screens/RegisterFaceScreen';
import {ApplyLeaveScreen} from '@screens/employee/ApplyLeaveScreen';
import {MyProfileScreen} from '@screens/employee/MyProfileScreen';
import {AboutScreen} from '@screens/AboutScreen';

import {useAppStore} from '@store/useAppStore';
import {ServiceInitializer} from '@services/ServiceInitializer';
import {storage} from '@services/StorageService';
import {LoadingSplash} from '@components/LoadingSplash';

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Root Stack Navigator ───────────────────────────────────────

export function AppNavigator() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Splash');

  useEffect(() => {
    const init = async () => {
      try {
        // STEP 1: Wait for ALL services to initialize
        const result = await ServiceInitializer.initializeAll();

        if (!result.database) {
          console.error('[AppNavigator] DB init failed, going to splash');
          setIsInitialized(true);
          return;
        }

        // STEP 2: NOW safe to check session
        const userStr = storage.getString('currentUser');
        const role = storage.getString('userRole');

        if (userStr && role) {
          try {
            const user = JSON.parse(userStr);
            useAppStore.getState().login(user);

            // Set appropriate initial route
            if (role === 'admin') {
              setInitialRoute('AdminPortal');
            } else {
              setInitialRoute('EmployeePortal');
            }
          } catch (parseErr) {
            console.warn('[AppNavigator] Session parse failed, clearing');
            storage.delete('currentUser');
            storage.delete('userRole');
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('[AppNavigator] Init failed:', err);
        setIsInitialized(true); // Still show app, just go to splash
      }
    };

    init();
  }, []);

  if (!isInitialized) {
    return <LoadingSplash />;
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{headerShown: false, animation: 'fade'}}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AdminPortal" component={AdminPortalScreen} />
      <Stack.Screen name="EmployeePortal" component={EmployeePortalScreen} />
      <Stack.Screen
        name="RegisterFace"
        component={RegisterFaceScreen}
        options={{animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="Authenticate"
        component={AuthenticateScreen}
        options={{
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="ApplyLeave"
        component={ApplyLeaveScreen}
        options={{animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{animation: 'slide_from_right'}}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{animation: 'slide_from_bottom'}}
      />
    </Stack.Navigator>
  );
}
