import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, ErrorText, Field, Screen, Title } from '@/components/ui';
import { Company } from '@/config/company';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing } from '@/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(error.message);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Screen contentStyle={styles.content}>
        <View style={styles.brand}>
          <Text style={styles.logo}>{Company.name}</Text>
          <Body muted>{Company.tagline}</Body>
        </View>

        <Title>Sign in</Title>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={signIn}
        />
        <ErrorText>{error}</ErrorText>
        <Button title="Sign in" onPress={signIn} loading={busy} />

        <Link href="/forgot-password" style={styles.link}>
          Forgot your password?
        </Link>
        <Link href="/sign-up" style={styles.link}>
          New client? Create an account
        </Link>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  brand: { alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  logo: { fontSize: 30, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  link: { color: Colors.primary, fontSize: 16, fontWeight: '600', textAlign: 'center', paddingVertical: Spacing.sm },
});
