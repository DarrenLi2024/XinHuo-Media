import type {
  ApiScriptChapter,
  ApiScriptSegment,
  EventChapter,
  EventMeta,
  EventOption,
  EventScript,
  EventSegment,
  EventStep,
  SegmentStatus,
  SegmentType,
} from '@/types/script-event';
import { DEFAULT_CHAPTERS, DEFAULT_ROLES } from '@/config/script-constants';

const SEGMENT_TYPES: SegmentType[] = [
  'speech',
  'performance',
  'video',
  'award',
  'lottery',
  'break',
  'interactive',
  'other',
];

const SEGMENT_STATUSES: SegmentStatus[] = ['pending', 'ready', 'ongoing', 'completed', 'skipped'];

export function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseTimeToMinutes(time: string): number {
  const [rawHour, rawMinute] = time.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
}

export function formatMinutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function calculateSegmentTimes(segments: EventSegment[], startTime: string): EventSegment[] {
  let cursor = parseTimeToMinutes(startTime);
  const baseStart = cursor;
  return [...segments]
    .sort((a, b) => a.order - b.order)
    .map((segment, index) => {
      const segmentStart = index === 0 && segment.startTime ? parseTimeToMinutes(segment.startTime) : cursor;
      const effectiveStart = index === 0 ? segmentStart || baseStart : cursor;
      const end = effectiveStart + Math.max(0, segment.duration);
      cursor = end;
      return {
        ...segment,
        order: index + 1,
        startTime: formatMinutesToTime(effectiveStart),
        endTime: formatMinutesToTime(end),
        isNextDay: end >= 1440 || effectiveStart >= 1440 || end < baseStart,
      };
    });
}

export function isSegmentActive(segment: EventSegment, currentTime: Date, eventDate?: string): boolean {
  if (!eventDate) return false;
  const start = new Date(`${eventDate}T${segment.startTime}:00`);
  const endDate = new Date(`${eventDate}T${segment.endTime}:00`);
  const end = segment.isNextDay ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000) : endDate;
  return currentTime >= start && currentTime <= end;
}

export function createDefaultMeta(event?: EventOption): EventMeta {
  const start = event?.start_time ? new Date(event.start_time) : null;
  const date = start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : '2026-07-01';
  const startTime = start && !Number.isNaN(start.getTime())
    ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    : '18:00';
  const now = new Date().toISOString();
  return {
    id: event?.id || 'default-event',
    name: event?.name || '2026 芯火会务演示活动',
    theme: '',
    date,
    location: event?.location || '',
    organizer: '芯火传媒',
    planner: '芯火传媒',
    startTime,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyScript(event?: EventOption): EventScript {
  const eventId = event?.id || 'default-event';
  return {
    meta: createDefaultMeta(event),
    chapters: DEFAULT_CHAPTERS.map((chapter) => ({ ...chapter, eventId })),
    segments: [],
    roles: DEFAULT_ROLES,
  };
}

export function normalizeType(type: string): SegmentType {
  return SEGMENT_TYPES.includes(type as SegmentType) ? (type as SegmentType) : 'other';
}

export function normalizeStatus(status: string): SegmentStatus {
  return SEGMENT_STATUSES.includes(status as SegmentStatus) ? (status as SegmentStatus) : 'pending';
}

export function responsibilitiesToRecord(items?: string[]): Record<string, string> {
  return (items || []).reduce<Record<string, string>>((acc, item) => {
    const [rawKey, ...rest] = item.split(':');
    const keyOrLabel = rawKey.trim();
    const value = rest.join(':').trim();
    if (!keyOrLabel) return acc;
    const role = DEFAULT_ROLES.find((candidate) => candidate.key === keyOrLabel || candidate.label === keyOrLabel);
    acc[role?.key || keyOrLabel] = value || item.trim();
    return acc;
  }, {});
}

export function responsibilitiesToList(responsibilities: Record<string, string>): string[] {
  return Object.entries(responsibilities)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => {
      const role = DEFAULT_ROLES.find((candidate) => candidate.key === key);
      return `${role?.label || key}: ${value.trim()}`;
    });
}

export function apiChaptersToEventChapters(chapters: ApiScriptChapter[], eventId: string): EventChapter[] {
  return chapters.map((chapter, index) => ({
    id: chapter.id,
    eventId,
    name: chapter.name,
    order: chapter.order || index + 1,
    color: chapter.color || DEFAULT_CHAPTERS[index % DEFAULT_CHAPTERS.length]?.color || '#64748b',
    description: chapter.description,
  }));
}

export function apiSegmentsToEventSegments(segments: ApiScriptSegment[], startTime: string): EventSegment[] {
  const mapped = segments.map<EventSegment>((segment, index) => ({
    id: segment.id,
    eventId: segment.event_id,
    chapterId: segment.chapter_id,
    order: segment.order || index + 1,
    type: normalizeType(segment.type),
    name: segment.name,
    duration: segment.duration || 0,
    speaker: segment.speaker,
    startTime: segment.start_time || startTime,
    endTime: segment.end_time || startTime,
    isNextDay: Boolean(segment.is_next_day),
    content: segment.content || '',
    responsibilities: responsibilitiesToRecord(segment.responsibilities),
    notes: segment.notes,
    steps: (segment.steps || []).map<EventStep>((step, stepIndex) => ({
      id: step.id,
      order: stepIndex + 1,
      name: step.title,
      content: step.title,
      duration: step.duration || 0,
      owner: step.owner,
      status: step.status,
    })),
    status: normalizeStatus(segment.status),
  }));
  return calculateSegmentTimes(mapped, startTime);
}

export function reorderSegments(segments: EventSegment[]): EventSegment[] {
  return segments
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((segment, index) => ({ ...segment, order: index + 1 }));
}
