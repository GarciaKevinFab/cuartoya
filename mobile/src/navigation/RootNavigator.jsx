import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import PremiumScreen from '../screens/PremiumScreen';
import useAuthStore from '../store/authStore';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { token, isLoading, loadToken } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadToken();
      setInitializing(false);
    };
    init();
  }, [loadToken]);

  if (initializing || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#E8442A" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Detalle',
              headerTintColor: '#E8442A',
              headerStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: true,
              headerTitle: 'Chat',
              headerTintColor: '#E8442A',
              headerStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="MyListings"
            component={MyListingsScreen}
            options={{
              headerShown: true,
              headerTitle: 'Mis Publicaciones',
              headerTintColor: '#E8442A',
              headerStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
          <Stack.Screen
            name="Premium"
            component={PremiumScreen}
            options={{
              headerShown: true,
              headerTitle: 'Planes Premium',
              headerTintColor: '#E8442A',
              headerStyle: { backgroundColor: '#FFFFFF' },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
