import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge, Body, Button, Caption, Card, EmptyState, ErrorText, Heading, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { EnquiryStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/time';
import type { Enquiry } from '@/lib/types';
import { Colors, Radius, Spacing } from '@/theme';

export default function EnquiriesScreen() {
  const { data, error, refreshing, refresh, loading } = useQuery(async () =>
    unwrap(await supabase.from('enquiries').select('*').order('created_at', { ascending: false })) as Enquiry[],
  );

  if (loading) return <Loading />;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Button title="New enquiry" icon="create-outline" onPress={() => router.push('/new-enquiry')} />
      <ErrorText>{error}</ErrorText>
      {data?.length === 0 && (
        <EmptyState icon="chatbubbles-outline" title="No enquiries" message="Ask us anything and we'll reply here." />
      )}
      {data?.map((e) => (
        <Card key={e.id}>
          <Heading>{e.subject}</Heading>
          <Caption>{formatDateTime(e.created_at)}</Caption>
          <Body>{e.message}</Body>
          <Badge {...EnquiryStatusInfo[e.status]} />
          {e.reply ? (
            <View style={styles.reply}>
              <Caption>Our reply{e.replied_at ? ` · ${formatDateTime(e.replied_at)}` : ''}</Caption>
              <Body>{e.reply}</Body>
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  reply: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
});
