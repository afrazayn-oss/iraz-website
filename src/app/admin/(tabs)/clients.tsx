import { router } from 'expo-router';
import { useState } from 'react';

import { EmptyState, ErrorText, Field, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

export default function AdminClientsScreen() {
  const [search, setSearch] = useState('');
  const { data, error, refreshing, refresh, loading } = useQuery(async () =>
    unwrap(
      await supabase.from('profiles').select('*').eq('role', 'client').order('full_name').limit(1000),
    ) as Profile[],
  );

  const term = search.trim().toLowerCase();
  const clients = (data ?? []).filter(
    (p) => !term || [p.full_name, p.email, p.phone].some((v) => v?.toLowerCase().includes(term)),
  );

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Field label="Search" placeholder="Name, email or phone" value={search} onChangeText={setSearch} autoCapitalize="none" />
      <ErrorText>{error}</ErrorText>
      {loading && <Loading />}
      {data && clients.length === 0 && (
        <EmptyState icon="people-outline" title="No clients" message="Clients appear here once they create an account in the app." />
      )}
      {clients.map((p) => (
        <ListRow
          key={p.id}
          icon="person-outline"
          title={p.full_name || p.email}
          subtitle={p.full_name ? p.email : undefined}
          onPress={() => router.push({ pathname: '/admin/client/[id]', params: { id: p.id } })}
        />
      ))}
    </Screen>
  );
}
