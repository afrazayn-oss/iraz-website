import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Badge, Body, Button, Caption, Card, ErrorText, Field, Heading, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { EnquiryStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/time';
import type { Enquiry, EnquiryStatus, Profile } from '@/lib/types';

type EnquiryWithClient = Enquiry & { client: Pick<Profile, 'id' | 'full_name' | 'email'> | null };

export default function AdminEnquiryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, error, loading } = useQuery(
    async () =>
      unwrap(
        await supabase
          .from('enquiries')
          .select('*, client:profiles!enquiries_client_id_fkey(id, full_name, email)')
          .eq('id', id)
          .single(),
      ) as EnquiryWithClient,
    id,
  );

  async function save(status: EnquiryStatus) {
    if (!data) return;
    const text = (reply ?? data.reply ?? '').trim();
    setSaveError(null);
    if (status === 'replied' && !text) {
      setSaveError('Write a reply first.');
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from('enquiries')
      .update(
        status === 'replied'
          ? { status, reply: text, replied_at: new Date().toISOString() }
          : { status },
      )
      .eq('id', id);
    setBusy(false);
    if (error) setSaveError(error.message);
    else router.back();
  }

  if (loading) return <Loading />;
  if (!data) return <Screen><ErrorText>{error}</ErrorText></Screen>;

  return (
    <Screen>
      <Card>
        <Heading>{data.subject}</Heading>
        <Caption>{formatDateTime(data.created_at)}</Caption>
        <Body>{data.message}</Body>
        <Badge {...EnquiryStatusInfo[data.status]} />
      </Card>
      {data.client && (
        <ListRow
          icon="person-outline"
          title={data.client.full_name || data.client.email}
          subtitle={data.client.email}
          onPress={() => router.push({ pathname: '/admin/client/[id]', params: { id: data.client!.id } })}
        />
      )}
      <Field
        label="Reply"
        value={reply ?? data.reply ?? ''}
        onChangeText={setReply}
        multiline
        placeholder="The client will see this in the app"
      />
      <ErrorText>{saveError}</ErrorText>
      <Button title={data.reply ? 'Update reply' : 'Send reply'} onPress={() => save('replied')} loading={busy} />
      {data.status !== 'closed' && <Button title="Close without reply" variant="secondary" onPress={() => save('closed')} />}
      {data.status === 'closed' && <Button title="Reopen" variant="secondary" onPress={() => save('new')} />}
    </Screen>
  );
}
