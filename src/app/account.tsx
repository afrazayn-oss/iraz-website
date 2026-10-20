import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Body, Button, Caption, Card, ErrorText, Field, Heading, Screen } from '@/components/ui';
import { Company } from '@/config/company';
import { DOCUMENTS_BUCKET, supabase } from '@/lib/supabase';
import { useAuth, useProfile } from '@/providers/auth';

export default function AccountScreen() {
  const profile = useProfile();
  const { refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      await refreshProfile();
      Alert.alert('Saved', 'Your details have been updated.');
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, bookings, enquiries and uploaded documents. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: deleteAccount },
      ],
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .list(profile.id, { limit: 1000 });
      if (listError) throw listError;
      if (files.length > 0) {
        const { error } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .remove(files.map((f) => `${profile.id}/${f.name}`));
        if (error) throw error;
      }
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      setDeleting(false);
      Alert.alert('Could not delete account', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Screen>
      <Card>
        <Caption>Signed in as</Caption>
        <Body>{profile.email}</Body>
        {profile.role === 'admin' && <Caption>Staff account</Caption>}
      </Card>

      <Heading>Your details</Heading>
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <ErrorText>{error}</ErrorText>
      <Button title="Save changes" onPress={save} loading={saving} />

      <Heading>About</Heading>
      <Button title="Privacy policy" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(Company.privacyPolicyUrl)} />
      <Button title={`Visit ${Company.website.replace(/^https?:\/\//, '')}`} variant="secondary" onPress={() => WebBrowser.openBrowserAsync(Company.website)} />

      <Heading>Account</Heading>
      <Button title="Sign out" variant="secondary" icon="log-out-outline" onPress={signOut} />
      <Button title="Delete my account" variant="danger" onPress={confirmDelete} loading={deleting} />
    </Screen>
  );
}
