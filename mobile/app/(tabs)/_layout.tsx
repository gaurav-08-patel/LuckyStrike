import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../components/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name='wallet'
        options={{
          title: 'Wallet',
        }}
      />
      <Tabs.Screen
        name='my-tickets'
        options={{
          title: 'Tickets',
        }}
      />
      <Tabs.Screen
        name='account'
        options={{
          title: 'Account',
        }}
      />
    </Tabs>
  );
}
