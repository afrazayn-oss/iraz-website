import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Body, Button, Caption, Chip, ErrorText, Field, Heading, Screen } from '@/components/ui';
import { MeetingModes, Services } from '@/config/company';
import { supabase } from '@/lib/supabase';
import { formatDateTime, formatTime, upcomingSlots } from '@/lib/time';
import type { MeetingMode } from '@/lib/types';
import { useProfile } from '@/providers/auth';
import { Spacing } from '@/theme';

export default function BookScreen() {
  const profile = useProfile();
  const days = useMemo(() => upcomingSlots(), []);
  const [service, setService] = useState(Services[0]?.name ?? '');
  const [dayKey, setDayKey] = useState(days[0]?.key);
  const [slot, setSlot] = useState<Date | null>(null);
  const [mode, setMode] = useState<MeetingMode>('video');
  const [notes, setNotes] = useState('');
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (days.length === 0) return;
    const from = days[0].slots[0];
    const lastDay = days[days.length - 1].slots;
    const to = new Date(lastDay[lastDay.length - 1].getTime() + 1);
    supabase
      .rpc('booked_slots', { from_ts: from.toISOString(), to_ts: to.toISOString() })
      .then(({ data }) => {
        setTaken(new Set(((data as string[] | null) ?? []).map((t) => new Date(t).getTime())));
      });
  }, [days]);

  const day = days.find((d) => d.key === dayKey);

  async function book() {
    setError(null);
    if (!slot) {
      setError('Choose a time for your consultation.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('bookings').insert({
      client_id: profile.id,
      service,
      scheduled_at: slot.toISOString(),
      mode,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) {
      // 23505 = unique violation: someone else took the slot first.
      setError(error.code === '23505' ? 'Sorry, that time has just been booked. Please choose another.' : error.message);
      if (error.code === '23505') setTaken((prev) => new Set(prev).add(slot.getTime()));
      setSlot(null);
      return;
    }
    Alert.alert(
      'Request sent',
      `We've received your request for ${formatDateTime(slot)} (UK time). We'll confirm it shortly.`,
    );
    router.back();
  }

  return (
    <Screen>
      <Heading>Service</Heading>
      <View style={styles.wrap}>
        {Services.map((s) => (
          <Chip key={s.id} label={s.name} selected={service === s.name} onPress={() => setService(s.name)} />
        ))}
      </View>

      <Heading>Day</Heading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {days.map((d) => (
          <Chip
            key={d.key}
            label={d.label}
            selected={d.key === dayKey}
            onPress={() => {
              setDayKey(d.key);
              setSlot(null);
            }}
          />
        ))}
      </ScrollView>

      <Heading>Time</Heading>
      <Caption>All times are UK time.</Caption>
      <View style={styles.wrap}>
        {day?.slots
          .filter((s) => !taken.has(s.getTime()))
          .map((s) => (
            <Chip
              key={s.toISOString()}
              label={formatTime(s)}
              selected={slot?.getTime() === s.getTime()}
              onPress={() => setSlot(s)}
            />
          ))}
      </View>
      {day && day.slots.every((s) => taken.has(s.getTime())) && <Body muted>No times left on this day.</Body>}

      <Heading>How would you like to meet?</Heading>
      <View style={styles.wrap}>
        {MeetingModes.map((m) => (
          <Chip key={m.id} label={m.label} selected={mode === m.id} onPress={() => setMode(m.id)} />
        ))}
      </View>

      <Field
        label="Anything we should know? (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={1000}
      />
      <ErrorText>{error}</ErrorText>
      <Button title="Request booking" onPress={book} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  row: { gap: Spacing.sm },
});
