import { useState } from 'react';
import { Alert } from 'react-native';

import { DocumentList } from '@/components/document-list';
import { Button, Caption, ErrorText, Loading, Screen } from '@/components/ui';
import { unwrap, useQuery } from '@/hooks/use-query';
import { pickAndUploadDocument } from '@/lib/documents';
import { supabase } from '@/lib/supabase';
import type { DocumentRecord } from '@/lib/types';
import { useProfile } from '@/providers/auth';

export default function DocumentsScreen() {
  const profile = useProfile();
  const [uploading, setUploading] = useState(false);
  const { data, error, refreshing, refresh, reload, loading } = useQuery(async () =>
    unwrap(await supabase.from('documents').select('*').order('created_at', { ascending: false })) as DocumentRecord[],
  );

  async function upload() {
    setUploading(true);
    try {
      const doc = await pickAndUploadDocument({ clientId: profile.id, uploadedBy: profile.id });
      if (doc) reload();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Button title="Upload a document" icon="cloud-upload-outline" onPress={upload} loading={uploading} />
      <Caption>Your documents are stored securely and only shared with our team. Up to 25 MB per file.</Caption>
      <ErrorText>{error}</ErrorText>
      {data && (
        <DocumentList
          documents={data}
          currentUserId={profile.id}
          emptyMessage="Documents you upload, and documents we share with you, appear here."
        />
      )}
    </Screen>
  );
}
