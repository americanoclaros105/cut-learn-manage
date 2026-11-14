import { Check, Clock, FileText, X, type LucideIcon } from 'lucide-react';
import type { AttendanceStatus } from '@/types';

export interface AttendanceStyle {
  icon: LucideIcon;
  /** One letter used in compact views. */
  short: string;
  /** Classes for the selected state (color plus icon plus text, never color alone). */
  selected: string;
  /** Classes for the text/badge variant. */
  tone: string;
}

export const attendanceStyles: Record<AttendanceStatus, AttendanceStyle> = {
  present: { icon: Check, short: 'P', selected: 'bg-green-600 text-white border-green-600', tone: 'bg-green-100 text-green-800' },
  late: { icon: Clock, short: 'T', selected: 'bg-amber-500 text-white border-amber-500', tone: 'bg-amber-100 text-amber-800' },
  absent: { icon: X, short: 'A', selected: 'bg-red-600 text-white border-red-600', tone: 'bg-red-100 text-red-800' },
  excused: { icon: FileText, short: 'E', selected: 'bg-blue-600 text-white border-blue-600', tone: 'bg-blue-100 text-blue-800' },
};

export const attendanceOrder: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];
