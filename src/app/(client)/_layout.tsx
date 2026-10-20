import { Stack } from 'expo-router';

import { Colors } from '@/theme';

export default function ClientLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="book" options={{ title: 'Book a consultation', presentation: 'modal' }} />
      <Stack.Screen name="new-enquiry" options={{ title: 'New enquiry', presentation: 'modal' }} />
      <Stack.Screen name="case/[id]" options={{ title: 'Case' }} />
    </Stack>
  );
}
