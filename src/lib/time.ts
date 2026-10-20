import { Availability } from '@/config/company';

const TZ = Availability.timeZone;
const DAY_MS = 24 * 60 * 60 * 1000;

type DateParts = { year: number; month: number; day: number; hour: number; minute: number };

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** Calendar date and time of `ts` in UK time. Month is 0-based like Date. */
function ukParts(ts: number): DateParts {
  const parts = partsFormatter.formatToParts(new Date(ts));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month') - 1, day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

/** Offset of UK time from UTC at `ts`, in ms (0 in winter, 1h in summer). */
function ukOffset(ts: number): number {
  const p = ukParts(ts);
  const asUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
  return asUtc - Math.floor(ts / 60000) * 60000;
}

/** The instant at which UK clocks show the given date and time. */
export function ukTimeToDate(year: number, month: number, day: number, hour: number, minute = 0): Date {
  const guess = Date.UTC(year, month, day, hour, minute);
  const first = guess - ukOffset(guess);
  return new Date(guess - ukOffset(first));
}

export type DaySlots = { key: string; label: string; slots: Date[] };

/** Bookable consultation slots for the coming weeks, grouped by UK calendar day. */
export function upcomingSlots(now = new Date()): DaySlots[] {
  const earliest = now.getTime() + Availability.minNoticeHours * 60 * 60 * 1000;
  const days: DaySlots[] = [];

  for (let i = 0; i <= Availability.daysAhead; i++) {
    const { year, month, day } = ukParts(now.getTime() + i * DAY_MS);
    const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
    if (!(Availability.weekdays as readonly number[]).includes(weekday)) continue;

    const slots: Date[] = [];
    for (
      let minutes = Availability.startHour * 60;
      minutes + Availability.slotMinutes <= Availability.endHour * 60;
      minutes += Availability.slotMinutes
    ) {
      const slot = ukTimeToDate(year, month, day, Math.floor(minutes / 60), minutes % 60);
      if (slot.getTime() >= earliest) slots.push(slot);
    }
    if (slots.length === 0) continue;

    days.push({
      key: `${year}-${month + 1}-${day}`,
      label: formatDay(slots[0]),
      slots,
    });
  }
  return days;
}

export function formatDay(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDay(date)}, ${formatTime(date)}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-GB', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
