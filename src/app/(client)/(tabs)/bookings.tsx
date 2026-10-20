import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { Badge, Body, Button, Caption, Card, EmptyState, ErrorText, Heading, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { BookingStatusInfo, meetingModeLabel } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/time';
import type { Booking } from '@/lib/types';

export default function BookingsScreen() {
  const { data, error, refreshing, refresh, reload, loading } = useQuery(async () => {
    const all = unwrap(
      await supabase.from('bookings').select('*').order('scheduled_at', { ascending: false }),
    ) as Booking[];
    const now = Date.now();
    const isUpcoming = (b: Booking) =>
      new Date(b.scheduled_at).getTime() >= now && (b.status === 'pending' || b.status === 'confirmed');
    return { all, upcoming: all.filter(isUpcoming).reverse(), past: all.filter((b) => !isUpcoming(b)) };
  });

  function cancel(booking: Booking) {
    Alert.alert('Cancel consultation?', formatDateTime(booking.scheduled_at), [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel consultation',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id);
          if (error) Alert.alert('Could not cancel', error.message);
          reload();
        },
      },
    ]);
  }

  if (loading) return <Loading />;

  const upcoming = data?.upcoming ?? [];
  const past = data?.past ?? [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Button title="Book a consultation" icon="add" onPress={() => router.push('/book')} />
      <ErrorText>{error}</ErrorText>

      {data?.all.length === 0 && (
        <EmptyState icon="calendar-outline" title="No consultations yet" message="Book a consultation and it will appear here." />
      )}

      {upcoming.length > 0 && <Heading>Upcoming</Heading>}
      {upcoming.map((b) => (
        <BookingCard key={b.id} booking={b} onCancel={() => cancel(b)} />
      ))}

      {past.length > 0 && <Heading>Past and cancelled</Heading>}
      {past.map((b) => (
        <BookingCard key={b.id} booking={b} />
      ))}
    </Screen>
  );
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) {
  return (
    <Card>
      <Heading>{booking.service}</Heading>
      <Body>{formatDateTime(booking.scheduled_at)} (UK time)</Body>
      <Caption>{meetingModeLabel(booking.mode)}</Caption>
      {booking.notes ? <Body muted>{booking.notes}</Body> : null}
      <View>
        <Badge {...BookingStatusInfo[booking.status]} />
      </View>
      {onCancel && <Button title="Cancel" variant="danger" onPress={onCancel} />}
    </Card>
  );
}
