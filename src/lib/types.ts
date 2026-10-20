export type Role = 'client' | 'admin';

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
};

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type MeetingMode = 'in_person' | 'video' | 'phone';

export type Booking = {
  id: string;
  client_id: string;
  service: string;
  scheduled_at: string;
  mode: MeetingMode;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};

export type CaseStatus = 'open' | 'in_progress' | 'awaiting_client' | 'submitted' | 'completed' | 'closed';

export type Case = {
  id: string;
  client_id: string;
  reference: string;
  title: string;
  service: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
};

export type CaseUpdate = {
  id: string;
  case_id: string;
  status: CaseStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  client_id: string;
  case_id: string | null;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export type EnquiryStatus = 'new' | 'replied' | 'closed';

export type Enquiry = {
  id: string;
  client_id: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
};
