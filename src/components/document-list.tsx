import { Alert } from 'react-native';

import { EmptyState, ListRow } from '@/components/ui';
import { openDocument } from '@/lib/documents';
import { formatBytes } from '@/lib/labels';
import { formatDate } from '@/lib/time';
import type { DocumentRecord } from '@/lib/types';

export function DocumentList({
  documents,
  currentUserId,
  emptyMessage,
}: {
  documents: DocumentRecord[];
  currentUserId: string;
  emptyMessage?: string;
}) {
  if (documents.length === 0) {
    return <EmptyState icon="document-outline" title="No documents" message={emptyMessage} />;
  }
  return documents.map((doc) => {
    const from = doc.uploaded_by === currentUserId ? 'Uploaded by you' : doc.uploaded_by === doc.client_id ? 'From client' : 'From us';
    return (
      <ListRow
        key={doc.id}
        icon="document-text-outline"
        title={doc.name}
        subtitle={[formatDate(doc.created_at), formatBytes(doc.size_bytes), from].filter(Boolean).join(' · ')}
        onPress={() =>
          openDocument(doc).catch((e: Error) => Alert.alert('Could not open document', e.message))
        }
      />
    );
  });
}
