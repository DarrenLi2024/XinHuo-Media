export type SegmentStatus = 'pending' | 'ready' | 'ongoing' | 'completed' | 'skipped';

export type SegmentType =
  | 'speech'
  | 'performance'
  | 'video'
  | 'award'
  | 'lottery'
  | 'break'
  | 'interactive'
  | 'other';

export interface EventMeta {
  id: string;
  name: string;
  theme?: string;
  logo?: string;
  date: string;
  location: string;
  organizer: string;
  planner?: string;
  startTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  key: string;
  label: string;
  color?: string;
  isDefault?: boolean;
}

export interface EventStep {
  id: string;
  order: number;
  name: string;
  content: string;
  duration: number;
  notes?: string;
  owner?: string;
  status?: 'pending' | 'done';
}

export interface EventSegment {
  id: string;
  eventId: string;
  chapterId?: string;
  order: number;
  type: SegmentType;
  name: string;
  duration: number;
  speaker?: string;
  startTime: string;
  endTime: string;
  isNextDay: boolean;
  content: string;
  responsibilities: Record<string, string>;
  notes?: string;
  steps: EventStep[];
  status: SegmentStatus;
}

export interface EventChapter {
  id: string;
  eventId: string;
  name: string;
  color: string;
  order: number;
  description?: string;
}

export interface EventScript {
  meta: EventMeta;
  chapters: EventChapter[];
  segments: EventSegment[];
  roles: Role[];
}

export type ExportSkin = 'qianli' | 'qingming' | 'golden' | 'qinghua';

export interface SkinConfig {
  name: string;
  description: string;
  background: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  panelColor: string;
}

export interface ExportTemplateConfig {
  logo?: string;
  eventName: string;
  eventTheme?: string;
  organizer?: string;
  footerLine1?: string;
  footerLine2?: string;
  skin: ExportSkin;
  selectedChapters: string[];
  selectedSegments: string[];
  hiddenFields: Array<'responsibilities' | 'notes' | 'duration' | 'status'>;
  showSteps: boolean;
}

export interface ApiScriptChapter {
  id: string;
  event_id: string;
  order: number;
  name: string;
  description?: string;
  color?: string;
}

export interface ApiScriptStep {
  id: string;
  title: string;
  owner?: string;
  duration?: number;
  status: 'pending' | 'done';
}

export interface ApiScriptSegment {
  id: string;
  event_id: string;
  chapter_id?: string;
  order: number;
  type: SegmentType | string;
  name: string;
  duration: number;
  speaker?: string;
  content?: string;
  notes?: string;
  start_time?: string;
  end_time?: string;
  is_next_day?: boolean;
  responsibilities?: string[];
  steps?: ApiScriptStep[];
  status: SegmentStatus | string;
}

export interface EventOption {
  id: string;
  name: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
}
