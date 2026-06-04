import React from 'react';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Root Stack Navigator ───────────────────────────────────────

export function AppNavigator() {
  const {isAuthenticated, userRole} = useAppStore();

  let initialRouteName: keyof RootStackParamList = 'Splash';
  if (isAuthenticated) {
    initialRouteName = userRole === 'admin' ? 'AdminPortal' : 'EmployeePortal';
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown: false, animation: 'fade'}}>
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
