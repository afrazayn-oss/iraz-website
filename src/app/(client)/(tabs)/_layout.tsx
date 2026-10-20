import { Tabs } from 'expo-router';

import { tabIcon, tabScreenOptions } from '@/components/tab-bar';
import { Company } from '@/config/company';

export default function ClientTabs() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: Company.name, tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon('calendar-outline') }} />
      <Tabs.Screen name="cases" options={{ title: 'My cases', tabBarIcon: tabIcon('briefcase-outline') }} />
      <Tabs.Screen name="documents" options={{ title: 'Documents', tabBarIcon: tabIcon('document-text-outline') }} />
      <Tabs.Screen name="enquiries" options={{ title: 'Enquiries', tabBarIcon: tabIcon('chatbubbles-outline') }} />
    </Tabs>
  );
}
