import { Colors } from '@/theme';
import { MeetingModes } from '@/config/company';
import type { BookingStatus, CaseStatus, EnquiryStatus, MeetingMode } from '@/lib/types';

type Tone = { label: string; color: string };

export const BookingStatusInfo: Record<BookingStatus, Tone> = {
  pending: { label: 'Awaiting confirmation', color: Colors.warning },
  confirmed: { label: 'Confirmed', color: Colors.success },
  cancelled: { label: 'Cancelled', color: Colors.textMuted },
  completed: { label: 'Completed', color: Colors.info },
};

export const CaseStatusInfo: Record<CaseStatus, Tone> = {
  open: { label: 'Open', color: Colors.info },
  in_progress: { label: 'In progress', color: Colors.info },
  awaiting_client: { label: 'Action needed', color: Colors.warning },
  submitted: { label: 'Submitted', color: Colors.primary },
  completed: { label: 'Completed', color: Colors.success },
  closed: { label: 'Closed', color: Colors.textMuted },
};

export const CaseStatusOrder: CaseStatus[] = [
  'open',
  'in_progress',
  'awaiting_client',
  'submitted',
  'completed',
  'closed',
];

export const EnquiryStatusInfo: Record<EnquiryStatus, Tone> = {
  new: { label: 'Sent', color: Colors.warning },
  replied: { label: 'Replied', color: Colors.success },
  closed: { label: 'Closed', color: Colors.textMuted },
};

export function meetingModeLabel(mode: MeetingMode): string {
  return MeetingModes.find((m) => m.id === mode)?.label ?? mode;
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
