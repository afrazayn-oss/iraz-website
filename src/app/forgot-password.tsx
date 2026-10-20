import { useState } from 'react';

import { Body, Button, ErrorText, Field, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    setError(null);
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <Screen>
        <Body>If an account exists for {email.trim()}, we’ve emailed a link to reset your password.</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Body muted>Enter the email you signed up with and we’ll send you a reset link.</Body>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Send reset link" onPress={send} loading={busy} />
    </Screen>
  );
}
