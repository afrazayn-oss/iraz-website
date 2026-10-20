import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { CaseTimeline } from '@/components/case-timeline';
import { DocumentList } from '@/components/document-list';
import { Badge, Body, Button, Caption, Card, ErrorText, Heading, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { pickAndUploadDocument } from '@/lib/documents';
import { CaseStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/time';
import type { Case, CaseUpdate, DocumentRecord } from '@/lib/types';
import { useProfile } from '@/providers/auth';

export default function ClientCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useProfile();
  const [uploading, setUploading] = useState(false);

  const { data, error, refreshing, refresh, reload, loading } = useQuery(async () => {
    const [c, updates, docs] = await Promise.all([
      supabase.from('cases').select('*').eq('id', id).single(),
      supabase.from('case_updates').select('*').eq('case_id', id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('case_id', id).order('created_at', { ascending: false }),
    ]);
    return {
      case: unwrap(c) as Case,
      updates: unwrap(updates) as CaseUpdate[],
      documents: unwrap(docs) as DocumentRecord[],
    };
  }, id);

  async function upload() {
    setUploading(true);
    try {
      const doc = await pickAndUploadDocument({ clientId: profile.id, uploadedBy: profile.id, caseId: id });
      if (doc) reload();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <Loading />;
  if (!data) return <Screen><ErrorText>{error}</ErrorText></Screen>;

  const info = CaseStatusInfo[data.case.status];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: data.case.reference }} />
      <Card>
        <Heading>{data.case.title}</Heading>
        {data.case.service ? <Body muted>{data.case.service}</Body> : null}
        <Badge {...info} />
        <Caption>Opened {formatDate(data.case.created_at)}</Caption>
      </Card>
      {data.case.status === 'awaiting_client' && (
        <Card>
          <Body>We need something from you to move this case forward. Check the latest update below.</Body>
        </Card>
      )}

      <Heading>Progress</Heading>
      <Card>
        <CaseTimeline updates={data.updates} />
      </Card>

      <Heading>Documents</Heading>
      <Button title="Upload a document" icon="cloud-upload-outline" variant="secondary" onPress={upload} loading={uploading} />
      <DocumentList documents={data.documents} currentUserId={profile.id} />
    </Screen>
  );
}
