/**
 * Company details shown throughout the app.
 *
 * PLACEHOLDER CONTENT: replace everything marked TODO with the real details
 * from the Eras Consultancy website before submitting to the App Store.
 */

export const Company = {
  name: 'Eras Consultancy',
  tagline: 'Expert guidance, every step of the way', // TODO: real tagline
  about:
    // TODO: real "About us" text
    'Eras Consultancy provides professional, personal advice. Book a consultation, ' +
    'share your documents securely and follow the progress of your case, all in one place.',
  website: 'https://iraz.co.uk',
  email: 'info@example.com', // TODO
  phone: '+44 0000 000000', // TODO
  address: 'Office address, City, Postcode, United Kingdom', // TODO
  officeHours: 'Monday to Friday, 9:00 to 17:00', // TODO
  privacyPolicyUrl: 'https://iraz.co.uk/privacy', // TODO: must exist before App Store submission
} as const;

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

// TODO: replace with the real services from the website.
export const Services: Service[] = [
  {
    id: 'initial-consultation',
    name: 'Initial Consultation',
    description: 'A first conversation to understand your situation and the options available to you.',
    durationMinutes: 60,
  },
  {
    id: 'application-support',
    name: 'Application Support',
    description: 'Help preparing, checking and submitting your application and supporting documents.',
    durationMinutes: 60,
  },
  {
    id: 'document-review',
    name: 'Document Review',
    description: 'A detailed review of your documents with clear recommendations.',
    durationMinutes: 60,
  },
  {
    id: 'follow-up',
    name: 'Follow-up Meeting',
    description: 'A follow-up session for existing clients to discuss progress on an open case.',
    durationMinutes: 60,
  },
];

/** When consultations can be booked. All times are UK time (Europe/London). */
export const Availability = {
  timeZone: 'Europe/London',
  weekdays: [1, 2, 3, 4, 5], // Monday–Friday (0 = Sunday)
  startHour: 9,
  endHour: 17, // last slot starts one slot before this
  slotMinutes: 60,
  daysAhead: 21,
  minNoticeHours: 24,
} as const;

export const MeetingModes = [
  { id: 'video', label: 'Video call' },
  { id: 'phone', label: 'Phone call' },
  { id: 'in_person', label: 'In person' },
] as const;
