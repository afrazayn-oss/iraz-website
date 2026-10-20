import { StyleSheet, Text, View } from 'react-native';

import { Body, Caption } from '@/components/ui';
import { CaseStatusInfo } from '@/lib/labels';
import { formatDateTime } from '@/lib/time';
import type { CaseUpdate } from '@/lib/types';
import { Colors, Spacing } from '@/theme';

/** Status history, newest first. */
export function CaseTimeline({ updates }: { updates: CaseUpdate[] }) {
  if (updates.length === 0) return <Body muted>No updates yet.</Body>;
  return (
    <View>
      {updates.map((u, i) => {
        const info = CaseStatusInfo[u.status];
        return (
          <View key={u.id} style={styles.item}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: info.color }]} />
              {i < updates.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.content}>
              <Text style={[styles.status, { color: info.color }]}>{info.label}</Text>
              <Caption>{formatDateTime(u.created_at)}</Caption>
              {u.note ? <Body>{u.note}</Body> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: Spacing.md },
  rail: { alignItems: 'center', width: 14 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  line: { flex: 1, width: 2, backgroundColor: Colors.border, marginVertical: 2 },
  content: { flex: 1, paddingBottom: Spacing.md, gap: 2 },
  status: { fontSize: 16, fontWeight: '600' },
});
