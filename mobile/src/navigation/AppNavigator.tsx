import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "../screens/auth/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../screens/auth/ResetPasswordScreen";
import { HomeScreen } from "../screens/main/HomeScreen";
import { ForumScreen } from "../screens/main/ForumScreen";
import { GuideScreen } from "../screens/main/GuideScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import { MyTopicsScreen } from "../screens/main/MyTopicsScreen";
import { MyCommentsScreen } from "../screens/main/MyCommentsScreen";
import { NotificationsScreen } from "../screens/main/NotificationsScreen";
import { PremiumScreen } from "../screens/main/PremiumScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Notifications: undefined;
  Premium: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  MyTopics: undefined;
  MyComments: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Guide: undefined;
  Forum: { openTopicId?: string; openTopicTitle?: string } | undefined;
  Profile: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function LoginWrapper({ navigation }: NativeStackScreenProps<AuthStackParamList, "Login">) {
  return (
    <LoginScreen
      onNavigateRegister={() => navigation.navigate("Register")}
      onNavigateForgot={() => navigation.navigate("ForgotPassword")}
    />
  );
}

function RegisterWrapper({ navigation }: NativeStackScreenProps<AuthStackParamList, "Register">) {
  return <RegisterScreen onNavigateLogin={() => navigation.goBack()} />;
}

function ForgotWrapper({ navigation }: NativeStackScreenProps<AuthStackParamList, "ForgotPassword">) {
  return (
    <ForgotPasswordScreen
      onNavigateLogin={() => navigation.goBack()}
      onNavigateReset={() => navigation.navigate("ResetPassword")}
    />
  );
}

function ResetWrapper({ navigation }: NativeStackScreenProps<AuthStackParamList, "ResetPassword">) {
  return (
    <ResetPasswordScreen
      onNavigateLogin={() => navigation.popToTop()}
    />
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ presentation: "modal" }}
      />
      <HomeStack.Screen
        name="Premium"
        component={PremiumScreen}
        options={{ presentation: "modal" }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="MyTopics" component={MyTopicsScreen} />
      <ProfileStack.Screen name="MyComments" component={MyCommentsScreen} />
    </ProfileStack.Navigator>
  );
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: "home", inactive: "home-outline" },
  Guide: { active: "map", inactive: "map-outline" },
  Forum: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 52 + insets.bottom;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.neutral,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: tabBarHeight,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeStackNavigator} options={{ title: "Ana Sayfa" }} />
      <MainTab.Screen name="Guide" component={GuideScreen} options={{ title: "Rehberim" }} />
      <MainTab.Screen name="Forum" component={ForumScreen} options={{ title: "Forum" }} />
      <MainTab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: "Profil" }} />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginWrapper} />
      <AuthStack.Screen name="Register" component={RegisterWrapper} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotWrapper} />
      <AuthStack.Screen name="ResetPassword" component={ResetWrapper} />
    </AuthStack.Navigator>
  );
}

const linking = {
  prefixes: ["goworldy://"],
  config: {
    screens: {
      Home: "home",
      Guide: {
        path: "guide/:countryId",
        parse: { countryId: (id: string) => id },
      },
      Forum: {
        path: "forum/topic/:openTopicId",
        parse: { openTopicId: (id: string) => id },
      },
      Profile: "profile",
    },
  },
};

export function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {user ? <MainTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
});
