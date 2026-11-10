import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF3D8C',
        tabBarInactiveTintColor: '#6B6866',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#171310',
          borderTopWidth: 2,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='home-outline' size={size} color={String(color ?? '#171310')} />
          ),
        }}
      />
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='wallet-outline' size={size} color={String(color ?? '#171310')} />
          ),
        }}
      />
      <Tabs.Screen
        name='my-tickets'
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='ticket-outline' size={size} color={String(color ?? '#171310')} />
          ),
        }}
      />
      <Tabs.Screen
        name='account'
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='person-outline' size={size} color={String(color ?? '#171310')} />
          ),
        }}
      />
    </Tabs>
  );
}
