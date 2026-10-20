import { Stack } from 'expo-router';

import { Colors } from '@/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="client/[id]" options={{ title: 'Client' }} />
      <Stack.Screen name="case/[id]" options={{ title: 'Case' }} />
      <Stack.Screen name="new-case" options={{ title: 'New case', presentation: 'modal' }} />
      <Stack.Screen name="enquiry/[id]" options={{ title: 'Enquiry' }} />
    </Stack>
  );
}
