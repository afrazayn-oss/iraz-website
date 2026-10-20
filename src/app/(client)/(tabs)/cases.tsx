import { router } from 'expo-router';

import { Badge, EmptyState, ErrorText, ListRow, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { CaseStatusInfo } from '@/lib/labels';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/time';
import type { Case } from '@/lib/types';

export default function CasesScreen() {
  const { data, error, refreshing, refresh, loading } = useQuery(async () =>
    unwrap(await supabase.from('cases').select('*').order('updated_at', { ascending: false })) as Case[],
  );

  if (loading) return <Loading />;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <ErrorText>{error}</ErrorText>
      {data?.length === 0 && (
        <EmptyState
          icon="briefcase-outline"
          title="No cases yet"
          message="Once we open a case for you, you can follow its progress here."
        />
      )}
      {data?.map((c) => (
        <ListRow
          key={c.id}
          icon="briefcase-outline"
          title={c.title}
          subtitle={`Ref ${c.reference} · Updated ${formatDate(c.updated_at)}`}
          right={<Badge {...CaseStatusInfo[c.status]} />}
          onPress={() => router.push({ pathname: '/case/[id]', params: { id: c.id } })}
        />
      ))}
    </Screen>
  );
}
