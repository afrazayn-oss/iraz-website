import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';

import { DocumentList } from '@/components/document-list';
import { Badge, Body, Button, Caption, Card, ErrorText, Heading, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { pickAndUploadDocument } from '@/lib/documents';
import { BookingStatusInfo, CaseStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDate, formatDateTime } from '@/lib/time';
import type { Booking, Case, DocumentRecord, Profile } from '@/lib/types';
import { useProfile } from '@/providers/auth';

export default function AdminClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useProfile();
  const [uploading, setUploading] = useState(false);

  const { data, error, refreshing, refresh, reload, loading } = useQuery(async () => {
    const [p, cases, bookings, docs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('cases').select('*').eq('client_id', id).order('updated_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('client_id', id).order('scheduled_at', { ascending: false }).limit(10),
      supabase.from('documents').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);
    return {
      profile: unwrap(p) as Profile,
      cases: unwrap(cases) as Case[],
      bookings: unwrap(bookings) as Booking[],
      documents: unwrap(docs) as DocumentRecord[],
    };
  }, id);

  async function upload() {
    setUploading(true);
    try {
      const doc = await pickAndUploadDocument({ clientId: id, uploadedBy: me.id });
      if (doc) reload();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <Loading />;
  if (!data) return <Screen><ErrorText>{error}</ErrorText></Screen>;
  const { profile } = data;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen options={{ title: profile.full_name || 'Client' }} />
      <Card>
        <Heading>{profile.full_name || 'No name given'}</Heading>
        <Body onPress={() => Linking.openURL(`mailto:${profile.email}`)}>{profile.email}</Body>
        {profile.phone ? <Body onPress={() => Linking.openURL(`tel:${profile.phone}`)}>{profile.phone}</Body> : null}
        <Caption>Client since {formatDate(profile.created_at)}</Caption>
      </Card>

      <Heading>Cases</Heading>
      <Button
        title="Open a new case"
        icon="add"
        onPress={() => router.push({ pathname: '/admin/new-case', params: { clientId: id } })}
      />
      {data.cases.length === 0 && <Body muted>No cases yet.</Body>}
      {data.cases.map((c) => (
        <ListRow
          key={c.id}
          icon="briefcase-outline"
          title={c.title}
          subtitle={c.reference}
          right={<Badge {...CaseStatusInfo[c.status]} />}
          onPress={() => router.push({ pathname: '/admin/case/[id]', params: { id: c.id } })}
        />
      ))}

      <Heading>Recent bookings</Heading>
      {data.bookings.length === 0 && <Body muted>No bookings yet.</Body>}
      {data.bookings.map((b) => (
        <ListRow
          key={b.id}
          icon="calendar-outline"
          title={b.service}
          subtitle={formatDateTime(b.scheduled_at)}
          right={<Badge {...BookingStatusInfo[b.status]} />}
        />
      ))}

      <Heading>Documents</Heading>
      <Button title="Share a document" icon="cloud-upload-outline" variant="secondary" onPress={upload} loading={uploading} />
      <DocumentList documents={data.documents} currentUserId={me.id} />
    </Screen>
  );
}
