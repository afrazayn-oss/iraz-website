import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Badge, Body, Button, Caption, Card, Chip, EmptyState, ErrorText, Heading, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { BookingStatusInfo, meetingModeLabel } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/time';
import type { Booking, BookingStatus, Profile } from '@/lib/types';
import { Spacing } from '@/theme';

type BookingWithClient = Booking & { client: Pick<Profile, 'id' | 'full_name' | 'email' | 'phone'> | null };

const Filters = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Needs confirming' },
  { id: 'past', label: 'Past' },
] as const;

export default function AdminBookingsScreen() {
  const [filter, setFilter] = useState<(typeof Filters)[number]['id']>('upcoming');

  const { data, error, refreshing, refresh, reload, loading } = useQuery(async () => {
    const now = new Date().toISOString();
    let q = supabase.from('bookings').select('*, client:profiles!bookings_client_id_fkey(id, full_name, email, phone)');
    if (filter === 'past') q = q.lt('scheduled_at', now).order('scheduled_at', { ascending: false });
    else {
      q = q.gte('scheduled_at', now).order('scheduled_at');
      q = filter === 'pending' ? q.eq('status', 'pending') : q.in('status', ['pending', 'confirmed']);
    }
    return unwrap(await q.limit(200)) as BookingWithClient[];
  }, filter);

  async function setStatus(b: BookingWithClient, status: BookingStatus) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', b.id);
    if (error) Alert.alert('Could not update booking', error.message);
    reload();
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.filters}>
        {Filters.map((f) => (
          <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      {loading && <Loading />}
      {data?.length === 0 && <EmptyState icon="calendar-outline" title="No bookings" />}
      {data?.map((b) => (
        <Card key={b.id} onPress={b.client ? () => router.push({ pathname: '/admin/client/[id]', params: { id: b.client!.id } }) : undefined}>
          <Heading>{b.client?.full_name || b.client?.email || 'Unknown client'}</Heading>
          <Body>
            {b.service} · {meetingModeLabel(b.mode)}
          </Body>
          <Body>{formatDateTime(b.scheduled_at)}</Body>
          {b.client?.phone ? <Caption>{b.client.phone}</Caption> : null}
          {b.notes ? <Body muted>{b.notes}</Body> : null}
          <Badge {...BookingStatusInfo[b.status]} />
          {filter !== 'past' && (
            <View style={styles.actions}>
              {b.status === 'pending' && <Button title="Confirm" onPress={() => setStatus(b, 'confirmed')} />}
              <Button title="Cancel" variant="danger" onPress={() => setStatus(b, 'cancelled')} />
            </View>
          )}
          {filter === 'past' && b.status === 'confirmed' && (
            <Button title="Mark completed" variant="secondary" onPress={() => setStatus(b, 'completed')} />
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actions: { gap: Spacing.sm },
});
