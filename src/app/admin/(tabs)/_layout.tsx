import { Tabs } from 'expo-router';

import { tabIcon, tabScreenOptions } from '@/components/tab-bar';

export default function AdminTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-outline') }} />
      <Tabs.Screen name="cases" options={{ title: 'Cases', tabBarIcon: tabIcon('briefcase-outline') }} />
      <Tabs.Screen name="enquiries" options={{ title: 'Enquiries', tabBarIcon: tabIcon('chatbubbles-outline') }} />
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: tabIcon('people-outline') }} />
    </Tabs>
  );
}
