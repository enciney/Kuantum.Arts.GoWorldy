import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminTopicsScreen } from "../screens/admin/AdminTopicsScreen";
import { AdminUsersScreen } from "../screens/admin/AdminUsersScreen";
import { AdminPremiumScreen } from "../screens/admin/AdminPremiumScreen";
import { AdminSettingsScreen } from "../screens/admin/AdminSettingsScreen";

export type AdminTopicsTab = "pending" | "editRequests" | "deletionRequests";

export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminTopics: { initialTab?: AdminTopicsTab } | undefined;
  AdminUsers: undefined;
  AdminPremium: undefined;
  AdminSettings: undefined;
};

const AdminStack = createNativeStackNavigator<AdminStackParamList>();

export function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminTopics" component={AdminTopicsScreen} />
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <AdminStack.Screen name="AdminPremium" component={AdminPremiumScreen} />
      <AdminStack.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </AdminStack.Navigator>
  );
}
