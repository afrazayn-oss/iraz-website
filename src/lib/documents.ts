import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';

import { DOCUMENTS_BUCKET, supabase } from '@/lib/supabase';
import type { DocumentRecord } from '@/lib/types';

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Lets the user pick a file and uploads it to the client's private folder.
 * Returns null if the user cancelled the picker.
 */
export async function pickAndUploadDocument(opts: {
  clientId: string;
  uploadedBy: string;
  caseId?: string | null;
}): Promise<DocumentRecord | null> {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  if (asset.size != null && asset.size > MAX_BYTES) {
    throw new Error('Files must be 25 MB or smaller.');
  }

  const body = await new File(asset.uri).arrayBuffer();
  const safeName = asset.name.replace(/[^\w.\- ]+/g, '_');
  const path = `${opts.clientId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, body, {
    contentType: asset.mimeType ?? 'application/octet-stream',
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      client_id: opts.clientId,
      case_id: opts.caseId ?? null,
      name: asset.name,
      storage_path: path,
      mime_type: asset.mimeType ?? null,
      size_bytes: asset.size ?? body.byteLength,
      uploaded_by: opts.uploadedBy,
    })
    .select()
    .single();
  if (error) {
    // Don't leave an orphaned file behind if the record couldn't be saved.
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    throw error;
  }
  return data as DocumentRecord;
}

/** Opens a document using a short-lived signed link. */
export async function openDocument(doc: DocumentRecord): Promise<void> {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.storage_path, 60 * 5);
  if (error) throw error;
  await WebBrowser.openBrowserAsync(data.signedUrl);
}
