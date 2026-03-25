import { z } from 'zod';

export const TRAINING_TYPES = ['regenerative', 'intervals', 'long', 'walk'] as const;
export const CARDIO_ZONES = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

export function parseDurationToMinutes(input: string): number {
  const value = input.trim();
  if (!value) return Number.NaN;

  const parts = value.split(':');
  if (parts.length < 1 || parts.length > 3) return Number.NaN;
  if (parts.some((part) => !/^\d+$/.test(part))) return Number.NaN;

  if (parts.length === 1) {
    return Number(parts[0]);
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    if (seconds >= 60) return Number.NaN;
    return minutes + seconds / 60;
  }

  const [hours, minutes, seconds] = parts.map(Number);
  if (minutes >= 60 || seconds >= 60) return Number.NaN;
  return hours * 60 + minutes + seconds / 60;
}

const baseCardioSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'cardio.errors.invalidDate'),
  trainingType: z.enum(TRAINING_TYPES).nullable(),
  zone: z.enum(CARDIO_ZONES).nullable(),
  // accepts "35", "35:30", "1:05:00"
  duration: z
    .string()
    .min(1, 'cardio.errors.minOne')
    .refine((value) => Number.isFinite(parseDurationToMinutes(value)), 'cardio.errors.invalidDuration')
    .refine((value) => parseDurationToMinutes(value) >= 1, 'cardio.errors.minOne')
    .refine((value) => parseDurationToMinutes(value) <= 1440, 'cardio.errors.tooHigh'),
  /** Entered in user's display unit; converted to km before saving */
  distance: z
    .number()
    .min(0, 'cardio.errors.minZero')
    .max(9999, 'cardio.errors.tooHigh'),
  avgPace: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/, 'cardio.errors.invalidPace'),
  avgHr: z
    .number()
    .int()
    .min(30, 'cardio.errors.minThirty')
    .max(250, 'cardio.errors.tooHigh')
    .nullable(),
  notes: z.string().max(500, 'cardio.errors.notesTooLong'),
});

export const cardioSchema = baseCardioSchema.refine(
  (data) => data.trainingType !== null || data.zone !== null,
  { message: 'cardio.errors.selectOne', path: ['trainingType'] },
);

export type CardioSchemaValues = z.infer<typeof baseCardioSchema>;
export interface CardioFormValues extends Omit<CardioSchemaValues, 'duration'> {
  durationMinutes: number;
}
