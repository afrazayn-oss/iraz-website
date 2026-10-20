import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, ErrorText, Field, Heading, Screen } from '@/components/ui';
import { Services } from '@/config/company';
import { supabase } from '@/lib/supabase';
import type { Case } from '@/lib/types';
import { useProfile } from '@/providers/auth';
import { Spacing } from '@/theme';

function newReference(): string {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ERA-${date}-${suffix}`;
}

export default function NewCaseScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const me = useProfile();
  const [title, setTitle] = useState('');
  const [service, setService] = useState(Services[0]?.name ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setError(null);
    if (!title.trim()) {
      setError('Give the case a title.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from('cases')
      .insert({ client_id: clientId, title: title.trim(), service, reference: newReference() })
      .select()
      .single();
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const created = data as Case;
    await supabase.from('case_updates').insert({
      case_id: created.id,
      status: 'open',
      note: note.trim() || 'Case opened.',
      created_by: me.id,
    });
    setBusy(false);
    router.replace({ pathname: '/admin/case/[id]', params: { id: created.id } });
  }

  return (
    <Screen>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Visa application 2026" />
      <Heading>Service</Heading>
      <View style={styles.wrap}>
        {Services.map((s) => (
          <Chip key={s.id} label={s.name} selected={service === s.name} onPress={() => setService(s.name)} />
        ))}
      </View>
      <Field label="First update for the client (optional)" value={note} onChangeText={setNote} multiline />
      <ErrorText>{error}</ErrorText>
      <Button title="Open case" onPress={create} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
