import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Heading } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/auth';
import { Colors, Spacing } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      {isSupabaseConfigured ? <RootNavigator /> : <SetupNotice />}
    </AuthProvider>
  );
}

function RootNavigator() {
  const { session, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  if (session && !profile) {
    return (
      <Message
        title="We couldn't load your account"
        body="Please check your connection and sign in again.">
        <Button title="Sign out" onPress={signOut} />
      </Message>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <Stack
      screenOptions={{
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: Colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: Colors.background },
      }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ title: 'Create account' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Reset password' }} />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !isAdmin}>
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!session && isAdmin}>
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="account" options={{ title: 'Account' }} />
      </Stack.Protected>
    </Stack>
  );
}

function SetupNotice() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <Message
      title="App not configured yet"
      body="Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in a .env.local file, then restart the dev server. See README.md for the full setup."
    />
  );
}

function Message({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <View style={styles.message}>
      <Heading>{title}</Heading>
      <Body muted>{body}</Body>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
});
