import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  AdminPortal: undefined;
  EmployeePortal: undefined;
  Authenticate: {testMode?: boolean} | undefined;
  RegisterFace: { prefillName?: string; prefillEmpId?: string; prefillRole?: string } | undefined;
  ApplyLeave: undefined;
  MyProfile: undefined;
  About: undefined;
};

export type TabParamList = {
  Home: undefined;
  Attendance: undefined;
  Log: undefined;
  Sync: undefined;
};

// Screen prop types for each stack screen
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// Screen prop types for each tab screen (composed with parent stack)
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
