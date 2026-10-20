import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Chip, EmptyState, ErrorText, Field, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { CaseStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import type { Case, Profile } from '@/lib/types';
import { Spacing } from '@/theme';

type CaseWithClient = Case & { client: Pick<Profile, 'full_name' | 'email'> | null };

export default function AdminCasesScreen() {
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');

  const { data, error, refreshing, refresh, loading } = useQuery(async () => {
    let q = supabase
      .from('cases')
      .select('*, client:profiles!cases_client_id_fkey(full_name, email)')
      .order('updated_at', { ascending: false });
    if (activeOnly) q = q.not('status', 'in', '(completed,closed)');
    return unwrap(await q.limit(500)) as CaseWithClient[];
  }, String(activeOnly));

  const term = search.trim().toLowerCase();
  const cases = (data ?? []).filter(
    (c) =>
      !term ||
      [c.title, c.reference, c.client?.full_name, c.client?.email].some((v) => v?.toLowerCase().includes(term)),
  );

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Field label="Search" placeholder="Name, reference or title" value={search} onChangeText={setSearch} autoCapitalize="none" />
      <View style={styles.filters}>
        <Chip label="Active" selected={activeOnly} onPress={() => setActiveOnly(true)} />
        <Chip label="All" selected={!activeOnly} onPress={() => setActiveOnly(false)} />
      </View>
      <ErrorText>{error}</ErrorText>
      {loading && <Loading />}
      {data && cases.length === 0 && (
        <EmptyState icon="briefcase-outline" title="No cases" message="Open a case from a client's page under Clients." />
      )}
      {cases.map((c) => (
        <ListRow
          key={c.id}
          icon="briefcase-outline"
          title={c.title}
          subtitle={`${c.reference} · ${c.client?.full_name || c.client?.email || ''}`}
          right={<Badge {...CaseStatusInfo[c.status]} />}
          onPress={() => router.push({ pathname: '/admin/case/[id]', params: { id: c.id } })}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: Spacing.sm },
});
