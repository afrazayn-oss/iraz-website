import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Body, Button, ErrorText, Field, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/providers/auth';

export default function NewEnquiryScreen() {
  const profile = useProfile();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setError(null);
    if (!subject.trim() || !message.trim()) {
      setError('Please add a subject and a message.');
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from('enquiries')
      .insert({ client_id: profile.id, subject: subject.trim(), message: message.trim() });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    Alert.alert('Enquiry sent', "Thanks. We'll reply as soon as we can, and you'll see it under Enquiries.");
    router.back();
  }

  return (
    <Screen>
      <Body muted>Send a question to our team. We aim to reply within one working day.</Body>
      <Field label="Subject" value={subject} onChangeText={setSubject} maxLength={120} />
      <Field label="Message" value={message} onChangeText={setMessage} multiline maxLength={4000} />
      <ErrorText>{error}</ErrorText>
      <Button title="Send enquiry" onPress={send} loading={busy} />
    </Screen>
  );
}
