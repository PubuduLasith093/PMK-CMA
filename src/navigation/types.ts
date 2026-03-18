import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Root stack parameter list (auth flow)
export type RootStackParamList = {
  Welcome: undefined;
  Registration: undefined;
  Main: undefined; // Changed from Home to Main (bottom tabs)
};

// Bottom tab parameter list (main app navigation)
export type BottomTabParamList = {
  Dashboard: undefined;
  Contacts: undefined;
  Messages: undefined;
  Settings: undefined;
  Profile: undefined;
};

// Navigation prop types for auth screens
export type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;
export type RegistrationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Registration'>;

// Navigation prop types for bottom tab screens
export type DashboardScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;

export type ContactsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Contacts'>,
  StackNavigationProp<RootStackParamList>
>;

export type MessagesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Messages'>,
  StackNavigationProp<RootStackParamList>
>;

export type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Settings'>,
  StackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

// Route prop types
export type WelcomeScreenRouteProp = RouteProp<RootStackParamList, 'Welcome'>;
export type RegistrationScreenRouteProp = RouteProp<RootStackParamList, 'Registration'>;
export type DashboardScreenRouteProp = RouteProp<BottomTabParamList, 'Dashboard'>;
export type ContactsScreenRouteProp = RouteProp<BottomTabParamList, 'Contacts'>;
export type MessagesScreenRouteProp = RouteProp<BottomTabParamList, 'Messages'>;
export type SettingsScreenRouteProp = RouteProp<BottomTabParamList, 'Settings'>;
export type ProfileScreenRouteProp = RouteProp<BottomTabParamList, 'Profile'>;
