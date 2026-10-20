import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { CaseTimeline } from '@/components/case-timeline';
import { DocumentList } from '@/components/document-list';
import { Badge, Body, Button, Card, Chip, ErrorText, Field, Heading, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { pickAndUploadDocument } from '@/lib/documents';
import { CaseStatusInfo, CaseStatusOrder } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { Case, CaseStatus, CaseUpdate, DocumentRecord, Profile } from '@/lib/types';
import { useProfile } from '@/providers/auth';
import { Spacing } from '@/theme';

type CaseWithClient = Case & { client: Pick<Profile, 'id' | 'full_name' | 'email'> | null };

export default function AdminCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useProfile();
  const [status, setStatus] = useState<CaseStatus | null>(null);
  const [note, setNote] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const { data, error, refreshing, refresh, reload, loading } = useQuery(async () => {
    const [c, updates, docs] = await Promise.all([
      supabase.from('cases').select('*, client:profiles!cases_client_id_fkey(id, full_name, email)').eq('id', id).single(),
      supabase.from('case_updates').select('*').eq('case_id', id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('case_id', id).order('created_at', { ascending: false }),
    ]);
    return {
      case: unwrap(c) as CaseWithClient,
      updates: unwrap(updates) as CaseUpdate[],
      documents: unwrap(docs) as DocumentRecord[],
    };
  }, id);

  async function postUpdate() {
    if (!data) return;
    const nextStatus = status ?? data.case.status;
    setPostError(null);
    if (nextStatus === data.case.status && !note.trim()) {
      setPostError('Change the status or write a note for the client.');
      return;
    }
    setPosting(true);
    const { error } = await supabase
      .from('case_updates')
      .insert({ case_id: id, status: nextStatus, note: note.trim() || null, created_by: me.id });
    setPosting(false);
    if (error) {
      setPostError(error.message);
      return;
    }
    setNote('');
    setStatus(null);
    reload();
  }

  async function upload() {
    if (!data) return;
    setUploading(true);
    try {
      const doc = await pickAndUploadDocument({ clientId: data.case.client_id, uploadedBy: me.id, caseId: id });
      if (doc) reload();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <Loading />;
  if (!data) return <Screen><ErrorText>{error}</ErrorText></Screen>;

  const c = data.case;
  const selected = status ?? c.status;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: c.reference }} />
      <Card>
        <Heading>{c.title}</Heading>
        {c.service ? <Body muted>{c.service}</Body> : null}
        <Badge {...CaseStatusInfo[c.status]} />
      </Card>
      {c.client && (
        <ListRow
          icon="person-outline"
          title={c.client.full_name || c.client.email}
          subtitle="View client"
          onPress={() => router.push({ pathname: '/admin/client/[id]', params: { id: c.client!.id } })}
        />
      )}

      <Heading>Post an update</Heading>
      <Card>
        <View style={styles.wrap}>
          {CaseStatusOrder.map((s) => (
            <Chip key={s} label={CaseStatusInfo[s].label} selected={selected === s} onPress={() => setStatus(s)} />
          ))}
        </View>
        <Field label="Note for the client" value={note} onChangeText={setNote} multiline />
        <ErrorText>{postError}</ErrorText>
        <Button title="Post update" onPress={postUpdate} loading={posting} />
      </Card>

      <Heading>History</Heading>
      <Card>
        <CaseTimeline updates={data.updates} />
      </Card>

      <Heading>Documents</Heading>
      <Button title="Share a document" icon="cloud-upload-outline" variant="secondary" onPress={upload} loading={uploading} />
      <DocumentList documents={data.documents} currentUserId={me.id} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
