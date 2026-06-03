import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@theme/ThemeContext';
import type { RootStackParamList, TabParamList } from './navigationTypes';

// Screens
import { SplashScreen } from '@screens/SplashScreen';
import { LoginScreen } from '@screens/LoginScreen';
import { HomeScreen } from '@screens/HomeScreen';
import { AttendanceDashboard } from '@screens/AttendanceDashboard';
import { AttendanceLogScreen } from '@screens/AttendanceLogScreen';
import { SyncScreen } from '@screens/SyncScreen';
import { RegisterFaceScreen } from '@screens/RegisterFaceScreen';
import { AuthenticateScreen } from '@screens/AuthenticateScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── Bottom Tab Navigator ───────────────────────────────────────

function MainTabs() {
  const { colors, typography } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary.navy,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.background.card,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceDashboard}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-check" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Log"
        component={AttendanceLogScreen}
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Icon name="format-list-bulleted" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          tabBarLabel: 'Sync',
          tabBarIcon: ({ color, size }) => (
            <Icon name="sync" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ───────────────────────────────────────

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ animation: 'fade_from_bottom' }}
      />
      <Stack.Screen
        name="RegisterFace"
        component={RegisterFaceScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Authenticate"
        component={AuthenticateScreen}
        options={{
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
}
