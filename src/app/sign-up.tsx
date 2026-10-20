import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Body, Button, ErrorText, Field, Screen } from '@/components/ui';
import { Company } from '@/config/company';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/theme';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setError(null);
    if (!fullName.trim() || !email.trim()) {
      setError('Enter your name and email.');
      return;
    }
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() || null } },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else if (!data.session) {
      // Email confirmation is switched on in Supabase.
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <Screen>
        <Body>
          We’ve sent a confirmation link to {email.trim()}. Open it on this device, then come back and sign
          in.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Body muted>Create an account to book consultations, share documents and track your case.</Body>
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" />
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
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Create account" onPress={signUp} loading={busy} />
      <Text style={styles.terms}>
        By creating an account you agree to our{' '}
        <Text style={styles.link} onPress={() => WebBrowser.openBrowserAsync(Company.privacyPolicyUrl)}>
          privacy policy
        </Text>
        .
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  terms: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  link: { color: Colors.primary, fontWeight: '600' },
});
