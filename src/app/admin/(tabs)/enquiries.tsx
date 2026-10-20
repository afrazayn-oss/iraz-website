import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Chip, EmptyState, ErrorText, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { EnquiryStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/time';
import type { Enquiry, Profile } from '@/lib/types';
import { Spacing } from '@/theme';

type EnquiryWithClient = Enquiry & { client: Pick<Profile, 'full_name' | 'email'> | null };

export default function AdminEnquiriesScreen() {
  const [newOnly, setNewOnly] = useState(true);
  const { data, error, refreshing, refresh, loading } = useQuery(async () => {
    let q = supabase
      .from('enquiries')
      .select('*, client:profiles!enquiries_client_id_fkey(full_name, email)')
      .order('created_at', { ascending: false });
    if (newOnly) q = q.eq('status', 'new');
    return unwrap(await q.limit(200)) as EnquiryWithClient[];
  }, String(newOnly));

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.filters}>
        <Chip label="Awaiting reply" selected={newOnly} onPress={() => setNewOnly(true)} />
        <Chip label="All" selected={!newOnly} onPress={() => setNewOnly(false)} />
      </View>
      <ErrorText>{error}</ErrorText>
      {loading && <Loading />}
      {data?.length === 0 && <EmptyState icon="chatbubbles-outline" title="Nothing waiting" />}
      {data?.map((e) => (
        <ListRow
          key={e.id}
          icon="chatbubble-outline"
          title={e.subject}
          subtitle={`${e.client?.full_name || e.client?.email || ''} · ${formatDateTime(e.created_at)}`}
          right={<Badge {...EnquiryStatusInfo[e.status]} />}
          onPress={() => router.push({ pathname: '/admin/enquiry/[id]', params: { id: e.id } })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: Spacing.sm },
});
