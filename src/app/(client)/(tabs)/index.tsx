import { router } from 'expo-router';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Button, Caption, Card, Heading, ListRow, Screen } from '@/components/ui';
import { Company, Services } from '@/config/company';
import { unwrap, useQuery } from '@/hooks/use-query';
import { BookingStatusInfo, CaseStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/time';
import type { Booking, Case } from '@/lib/types';
import { useProfile } from '@/providers/auth';
import { Colors, Radius, Spacing } from '@/theme';

export default function HomeScreen() {
  const profile = useProfile();
  const { data, refreshing, refresh } = useQuery(async () => {
    const [bookings, cases] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(1),
      supabase
        .from('cases')
        .select('*')
        .not('status', 'in', '(completed,closed)')
        .order('updated_at', { ascending: false })
        .limit(3),
    ]);
    return { nextBooking: unwrap(bookings)[0] as Booking | undefined, cases: unwrap(cases) as Case[] };
  });

  const firstName = profile.full_name.split(' ')[0];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{firstName ? `Hello, ${firstName}` : 'Welcome'}</Text>
        <Text style={styles.heroBody}>{Company.tagline}</Text>
        <Button title="Book a consultation" variant="secondary" icon="calendar" onPress={() => router.push('/book')} />
      </View>

      {data?.nextBooking && (
        <Card onPress={() => router.push('/bookings')}>
          <Caption>Your next consultation</Caption>
          <Heading>{data.nextBooking.service}</Heading>
          <Body>{formatDateTime(data.nextBooking.scheduled_at)} (UK time)</Body>
          <Badge {...BookingStatusInfo[data.nextBooking.status]} />
        </Card>
      )}

      {data && data.cases.length > 0 && (
        <View style={styles.section}>
          <Heading>Active cases</Heading>
          {data.cases.map((c) => (
            <ListRow
              key={c.id}
              icon="briefcase-outline"
              title={c.title}
              subtitle={`Ref ${c.reference}`}
              right={<Badge {...CaseStatusInfo[c.status]} />}
              onPress={() => router.push({ pathname: '/case/[id]', params: { id: c.id } })}
            />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Heading>Our services</Heading>
        {Services.map((s) => (
          <Card key={s.id}>
            <Text style={styles.serviceName}>{s.name}</Text>
            <Body muted>{s.description}</Body>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <Heading>Get in touch</Heading>
        <ListRow icon="call-outline" title={Company.phone} onPress={() => Linking.openURL(`tel:${Company.phone.replace(/\s/g, '')}`)} />
        <ListRow icon="mail-outline" title={Company.email} onPress={() => Linking.openURL(`mailto:${Company.email}`)} />
        <ListRow icon="location-outline" title={Company.address} subtitle={Company.officeHours} />
        <Button title="Send us an enquiry" variant="secondary" icon="chatbubble-ellipses-outline" onPress={() => router.push('/new-enquiry')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroTitle: { color: Colors.primaryText, fontSize: 26, fontWeight: '700' },
  heroBody: { color: Colors.primaryText, opacity: 0.85, fontSize: 16 },
  section: { gap: Spacing.sm },
  serviceName: { fontSize: 16, fontWeight: '600', color: Colors.text },
});
